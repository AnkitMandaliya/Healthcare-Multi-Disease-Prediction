from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from backend.extensions import mongo, bcrypt, mail
import json
import pyotp
import os
import re
import logging
import traceback
import requests
from datetime import datetime, timedelta, timezone
import threading

auth_bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)

def mask_identifier(value):
    if not value:
        return "missing"
    value = str(value).strip()
    if "@" in value:
        name, domain = value.split("@", 1)
        return f"{name[:2]}***@{domain}"
    digits = re.sub(r"\D", "", value)
    if len(digits) >= 4:
        return f"***{digits[-4:]}"
    return "***"

def client_context():
    forwarded_for = request.headers.get("X-Forwarded-For", "")
    ip_address = forwarded_for.split(",")[0].strip() or request.remote_addr or "unknown"
    return {
        "ip": ip_address,
        "path": request.path,
        "method": request.method,
        "user_agent": request.headers.get("User-Agent", "unknown")[:180]
    }

def log_auth_event(event, level="info", **fields):
    safe_fields = {key: value for key, value in fields.items() if value is not None}
    message = f"[AUTH] event={event} context={client_context()} fields={safe_fields}"
    getattr(logger, level, logger.info)(message)

def send_email_async(subject, recipient, html_body, purpose):
    masked_recipient = mask_identifier(recipient)
    log_auth_event("email_queued", purpose=purpose, recipient=masked_recipient)

    def send_action():
        try:
            script_url = os.environ.get("GMAIL_APP_SCRIPT_URL")
            secret_token = os.environ.get("GMAIL_APP_SCRIPT_TOKEN", "healthai_secure_token_2026")
            if not script_url:
                logger.error(f"[AUTH] event=email_failed purpose={purpose} recipient={masked_recipient} error=Missing GMAIL_APP_SCRIPT_URL environment variable")
                return False

            payload = {
                "secret_token": secret_token,
                "recipient": recipient,
                "subject": subject,
                "html_body": html_body
            }

            response = requests.post(
                script_url,
                json=payload,
                timeout=15
            )

            if response.status_code == 200:
                res_data = response.json()
                if res_data.get("status") == "success":
                    logger.info(f"[AUTH] event=email_sent purpose={purpose} recipient={masked_recipient} via=google_apps_script")
                    return True
                else:
                    logger.error(f"[AUTH] event=email_failed purpose={purpose} recipient={masked_recipient} error={res_data.get('message')}")
                    return False
            else:
                logger.error(f"[AUTH] event=email_failed purpose={purpose} recipient={masked_recipient} error=HTTP_{response.status_code}")
                return False
        except Exception as e:
            logger.error(f"[AUTH] event=email_failed purpose={purpose} recipient={masked_recipient} error={str(e)}")
            return False

    # Check if running on Vercel (serverless environment where background threads are terminated early)
    if os.environ.get("VERCEL") == "1" or os.environ.get("VERCEL"):
        logger.info(f"[AUTH] event=email_sync_send purpose={purpose} reason=vercel_environment")
        send_action()
    else:
        threading.Thread(target=send_action, daemon=True).start()

def otp_email_message(otp):
    return f"""
<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#0b0f19;font-family:'Outfit','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f1f5f9;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0b0f19;padding:40px 10px;">
      <tr>
        <td align="center">
          <!-- Main Card -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:540px;background:rgba(17, 24, 39, 0.95);border:1px solid rgba(255, 255, 255, 0.08);border-radius:24px;box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4);overflow:hidden;">
            <!-- Header Banner with Gradient -->
            <tr>
              <td style="background: linear-gradient(135deg, #1e40af 0%, #0369a1 50%, #0e7490 100%); padding: 35px 40px; text-align: left;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align: middle; width: 48px;">
                      <!-- Styled AI Pulse icon container -->
                      <div style="background: rgba(255, 255, 255, 0.2); border-radius: 12px; width: 42px; height: 42px; text-align: center; line-height: 42px;">
                        <span style="font-size: 22px; color: #ffffff; line-height: 42px;">⚡</span>
                      </div>
                    </td>
                    <td style="vertical-align: middle; padding-left: 15px;">
                      <span style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #38bdf8; text-transform: uppercase; display: block; margin-bottom: 2px;">SECURE PROTOCOL</span>
                      <h1 style="margin:0; font-size:24px; font-weight:900; color:#ffffff; letter-spacing:-0.5px; text-transform:uppercase;">HealthAI Node</h1>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Content Area -->
            <tr>
              <td style="padding:40px 40px 30px;">
                <p style="margin:0 0 10px; font-size:12px; font-weight: 700; color:#38bdf8; text-transform: uppercase; letter-spacing: 1.5px;">Verification Challenge</p>
                <h2 style="margin:0 0 20px; font-size:22px; font-weight:800; color:#ffffff; letter-spacing: -0.5px;">Authorize login sequence</h2>
                <p style="margin:0 0 30px; font-size:15px; line-height:1.6; color:#94a3b8; font-weight:500;">
                  A new connection request is attempting to bind to your HealthAI clinical node. Use the high-fidelity security token below to authorize access:
                </p>
                
                <!-- Styled OTP container -->
                <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 20px; padding: 30px 20px; text-align: center; margin-bottom: 30px;">
                  <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 12px;">ONE-TIME SECURITY KEY</span>
                  <div style="font-size:42px; line-height:1; letter-spacing:8px; font-weight:900; color:#38bdf8; text-shadow: 0 0 20px rgba(56, 189, 248, 0.2); font-family: 'Courier New', Courier, monospace;">{otp}</div>
                </div>

                <div style="background: rgba(234, 179, 8, 0.05); border-left: 3px solid #eab308; border-radius: 4px 12px 12px 4px; padding: 15px 20px; margin-bottom: 30px;">
                  <p style="margin:0; font-size:13px; line-height:1.5; color:#fef08a; font-weight: 600;">
                    ⚠️ This authentication code will expire in <strong>10 minutes</strong>.
                  </p>
                </div>

                <p style="margin:0; font-size:13px; line-height:1.6; color:#64748b; font-weight:500; text-align: center;">
                  If you did not initiate this authentication request, please immediately re-secure your passkey.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:20px 40px; background: rgba(0, 0, 0, 0.2); border-top: 1px solid rgba(255, 255, 255, 0.04); text-align: center;">
                <p style="margin:0 0 6px; font-size:11px; color:#475569; font-weight:600; text-transform:uppercase; letter-spacing:1px;">
                  HealthAI Diagnostic Network
                </p>
                <p style="margin:0; font-size:10px; color:#334155; font-weight:500;">
                  This is an automated transmission. Replies are unrouted.
                </p>
              </td>
            </tr>
          </table>
          <p style="max-width:540px; margin:20px auto 0; font-size:11px; color:#475569; line-height:1.5; text-align:center; font-weight: 500; padding: 0 20px;">
            Securely encrypted using AES-256 standards. Node location logs and diagnostic traces are logged on each challenge.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
"""


def send_sms_otp(phone, otp, purpose):
    api_key = os.environ.get('FAST2SMS_API_KEY')
    if not api_key:
        return False, "Missing Fast2SMS environment config"

    try:
        # Fast2SMS OTP Route API
        # Documentation: https://www.fast2sms.com/help/sms-api
        url = "https://www.fast2sms.com/dev/bulkV2"
        
        # Clean phone number: Remove all non-digits and strip +91 if present
        clean_phone = re.sub(r"\D", "", phone)
        if clean_phone.startswith("91") and len(clean_phone) == 12:
            clean_phone = clean_phone[2:] # Remove 91 prefix for 10-digit Indian numbers
        
        payload = {
            "route": "q",
            "message": f"Your HealthAI verification code is {otp}. It expires in 10 minutes.",
            "language": "english",
            "flash": 0,
            "numbers": clean_phone
        }
        
        headers = {
            "authorization": api_key,
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        response = requests.post(url, data=payload, headers=headers)
        res_data = response.json()
        
        if res_data.get("return"):
            log_auth_event("otp_sms_sent", recipient=mask_identifier(phone), purpose=purpose)
            return True, None
        else:
            error_msg = res_data.get("message", "Fast2SMS unknown failure")
            log_auth_event("otp_sms_failed", "warning", recipient=mask_identifier(phone), purpose=purpose, error=error_msg)
            return False, error_msg
            
    except Exception as e:
        error = str(e)
        log_auth_event("otp_sms_failed", "warning", recipient=mask_identifier(phone), purpose=purpose, error=error)
        return False, error

@auth_bp.route("/api/register", methods=["POST"])
def register():
    try:
        data = request.json
        log_auth_event("register_attempt")
        name = data.get("name")
        email = data.get("email", "").lower().strip()
        phone = data.get("phone", "").replace(" ", "").strip()
        password = data.get("password")
        role = data.get("role", "clinician")
        
        # Requirement change: Either email or phone is required
        if not name or not password or (not email and not phone):
            return jsonify({"error": "Full authentication credentials required (Name, Email or Phone, and Password)"}), 400
            
        if len(password) < 6:
            return jsonify({"error": "Encryption passkey must be at least 6 characters"}), 400

        # Ensure unique email/phone combination in registry
        query = {}
        if email: query["email"] = email
        if phone: query["phone"] = phone
        
        if query and mongo.db.users.find_one(query):
            log_auth_event("register_duplicate_identifier", "warning", identifier=mask_identifier(email or phone), role=role)
            return jsonify({"error": "This exact Email and Phone combination is already active in the registry"}), 400
            
        hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
        mongo.db.users.insert_one({
            "name": name,
            "email": email,
            "phone": phone,
            "password": hashed_pw,
            "role": role,
            "avatar": f"https://i.pravatar.cc/150?u={email or phone}"
        })
        
        # Notify Admin
        mongo.db.notifications.insert_one({
            "title": "New Node Registered",
            "message": f"Clinical node '{name}' ({role}) has joined the network.",
            "type": "info",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        log_auth_event("register_success", identifier=mask_identifier(email or phone), role=role)
        return jsonify({"message": "Node Registration Successful", "status": "success"}), 201
    except Exception as e:
        logger.exception(f"[AUTH] event=register_error error={str(e)}")
        return jsonify({"error": "Registration protocol failure", "details": str(e)}), 500

@auth_bp.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request: No JSON data provided"}), 400
            
        identifier = data.get("email", "").strip() # This can be email or phone
        password = data.get("password")
        log_auth_event("login_attempt", identifier=mask_identifier(identifier))
        
        if not identifier or not password:
            return jsonify({"error": "Clinical credentials missing"}), 400

        # Email format validation
        if "@" in identifier and not re.match(r"[^@]+@[^@]+\.[^@]+", identifier):
            return jsonify({"error": "Invalid email"}), 400
            
        # Mobile number format validation (Detects if input is numeric)
        clean_id = identifier.replace(" ", "").replace("+", "").replace("-", "")
        if clean_id.isdigit():
            if not re.match(r"^\+?[1-9]\d{9,14}$", identifier.replace(" ", "")):
                return jsonify({"error": "Invalid mobile number"}), 400

        # Search by email or phone
        user = mongo.db.users.find_one({"$or": [{"email": identifier.lower()}, {"phone": identifier}]})

        if not user:
            log_auth_event("login_failed_user_not_found", "warning", identifier=mask_identifier(identifier))
            return jsonify({"error": "Account not found"}), 404

        password_valid = False
        try:
            password_valid = bcrypt.check_password_hash(user["password"], password)
        except Exception as pe:
            logger.error(f"[LOGIN-PASSWORD-ERROR] {str(pe)}")
            password_valid = False
                
        if not password_valid:
            log_auth_event("login_failed_bad_password", "warning", identifier=mask_identifier(identifier))
            return jsonify({"error": "Invalid credentials"}), 401

        # Firebase Phone 2FA: If user has a registered phone, use Firebase Phone Auth
        user_phone = user.get("phone", "").strip()
        if user_phone:
            log_auth_event("login_firebase_2fa_triggered", identifier=mask_identifier(identifier), phone=mask_identifier(user_phone))
            return jsonify({
                "otp_required": True,
                "phone_2fa": user_phone,  # E.164 phone for Firebase Phone Auth
                "uid": str(user["_id"]),
                "sent_to": f"Firebase Phone: ***{user_phone[-4:]}",
                "message": "Firebase Phone 2FA: OTP will be sent to your mobile"
            }), 200

        # Fallback: Legacy OTP dispatch (email-based) for users without phone
        success, msg, otp_context = dispatch_otp(user, preferred_channel=identifier)
        if not success:
            log_auth_event("login_otp_dispatch_failed", "warning", identifier=mask_identifier(identifier), error=msg)
            return jsonify({"error": msg}), 500
        log_auth_event("login_otp_required", identifier=mask_identifier(identifier), channel=msg)
        return jsonify({
            "otp_required": True,
            "uid": str(user["_id"]),
            "sent_to": msg, # Obfuscated destination info
            "message": "Security token dispatched to your registered identifier"
        }), 200
    except Exception as e:
        logger.exception(f"[AUTH] event=login_error error={str(e)}")
        return jsonify({
            "error": "Internal security node failure",
            "details": str(e) if os.environ.get("DEBUG_MODE") == "True" else "Check server logs"
        }), 500

@auth_bp.route("/api/login-verify", methods=["POST"])
def login_verify():
    try:
        data = request.json
        uid = data.get("uid")
        otp = str(data.get("otp", "")).strip()
        log_auth_event("login_verify_attempt", uid=uid)
        
        if not uid or not otp:
            return jsonify({"error": "Verification parameters missing"}), 400
            
        from bson.objectid import ObjectId
        user = mongo.db.users.find_one({"_id": ObjectId(uid)})
        if not user:
            log_auth_event("login_verify_user_missing", "warning", uid=uid)
            return jsonify({"error": "User session not found"}), 404
            
        # Standard OTP check - Synchronized to UID anchor
        otp_record = mongo.db.otps.find_one({"uid": str(user["_id"])})
        if not otp_record or str(otp_record["otp"]) != otp:
            log_auth_event("login_verify_invalid_otp", "warning", uid=uid)
            return jsonify({"error": "Invalid security token"}), 401
        
        # Expiry check
        now = datetime.now(timezone.utc)
        expiry = otp_record["expiry"]
        if expiry.tzinfo is None: expiry = expiry.replace(tzinfo=timezone.utc)
        
        if now > expiry:
            log_auth_event("login_verify_expired_otp", "warning", uid=uid)
            return jsonify({"error": "Security token expired"}), 401
            
        # Clear OTP after success
        mongo.db.otps.delete_one({"uid": str(user["_id"])})
        
        # Issue JWT
        role_data = mongo.db.roles.find_one({"name": user["role"]})
        permissions = role_data.get("permissions", []) if role_data else []
        
        access_token = create_access_token(
            identity=str(user["_id"]),
            additional_claims={
                "role": user["role"],
                "name": user["name"],
                "permissions": permissions
            }
        )
        
        log_auth_event("login_verify_success", uid=uid, role=user.get("role"))
        return jsonify({
            "access_token": access_token,
            "user": {
                "email": user["email"],
                "name": user["name"],
                "role": user["role"],
                "permissions": permissions,
                "avatar": user.get("avatar", f"https://i.pravatar.cc/150?u={user['email'].lower() if user['email'] else user['name']}")
            }
        }), 200
    except Exception as e:
        logger.exception(f"[AUTH] event=login_verify_error error={str(e)}")
        return jsonify({"error": "Verification protocol failure", "details": str(e)}), 500

@auth_bp.route("/api/login-verify-firebase", methods=["POST"])
def login_verify_firebase():
    """Verify Firebase Phone Auth ID token for 2FA login.
    
    The frontend sends the Firebase ID token obtained after successful 
    phone OTP verification. We verify it server-side using Google's 
    public keys, then issue our own JWT.
    """
    try:
        data = request.json
        uid = data.get("uid")
        firebase_id_token = data.get("firebase_id_token")
        phone = data.get("phone")
        log_auth_event("login_verify_firebase_attempt", uid=uid)
        
        if not uid or not firebase_id_token:
            return jsonify({"error": "Firebase verification parameters missing"}), 400
        
        # Verify the Firebase ID token using Google's public keys
        firebase_verified = verify_firebase_id_token(firebase_id_token)
        if not firebase_verified:
            log_auth_event("login_verify_firebase_invalid_token", "warning", uid=uid)
            return jsonify({"error": "Firebase token verification failed"}), 401
        
        # Ensure the phone number in the token matches the user's phone
        from bson.objectid import ObjectId
        user = mongo.db.users.find_one({"_id": ObjectId(uid)})
        if not user:
            log_auth_event("login_verify_firebase_user_missing", "warning", uid=uid)
            return jsonify({"error": "User session not found"}), 404
        
        # Verify phone number matches (Firebase token phone vs user's registered phone)
        token_phone = firebase_verified.get("phone_number", "")
        user_phone = user.get("phone", "")
        
        # Normalize phones for comparison (strip +, spaces, etc.)
        normalize = lambda p: re.sub(r"\D", "", p) if p else ""
        if normalize(token_phone) != normalize(user_phone):
            log_auth_event("login_verify_firebase_phone_mismatch", "warning", uid=uid, 
                          token_phone=mask_identifier(token_phone), user_phone=mask_identifier(user_phone))
            return jsonify({"error": "Phone number mismatch. Security violation detected."}), 401
        
        # Issue JWT (same as legacy flow)
        role_data = mongo.db.roles.find_one({"name": user["role"]})
        permissions = role_data.get("permissions", []) if role_data else []
        
        access_token = create_access_token(
            identity=str(user["_id"]),
            additional_claims={
                "role": user["role"],
                "name": user["name"],
                "permissions": permissions
            }
        )
        
        log_auth_event("login_verify_firebase_success", uid=uid, role=user.get("role"))
        return jsonify({
            "access_token": access_token,
            "user": {
                "email": user["email"],
                "name": user["name"],
                "role": user["role"],
                "permissions": permissions,
                "avatar": user.get("avatar", f"https://i.pravatar.cc/150?u={user['email'].lower() if user['email'] else user['name']}")
            }
        }), 200
    except Exception as e:
        logger.exception(f"[AUTH] event=login_verify_firebase_error error={str(e)}")
        return jsonify({"error": "Firebase verification protocol failure", "details": str(e)}), 500


def verify_firebase_id_token(id_token):
    """Verify a Firebase ID token using Google's public keys.
    
    This verifies the JWT signature, expiry, audience, and issuer
    without requiring the Firebase Admin SDK.
    """
    import jwt as pyjwt
    from cryptography.x509 import load_pem_x509_certificate
    from cryptography.hazmat.backends import default_backend
    
    FIREBASE_PROJECT_ID = "healthai-80476"
    GOOGLE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
    
    try:
        # Fetch Google's public keys
        certs_response = requests.get(GOOGLE_CERTS_URL, timeout=10)
        certs = certs_response.json()
        
        # Decode the token header to find the key ID
        unverified_header = pyjwt.get_unverified_header(id_token)
        kid = unverified_header.get("kid")
        
        if kid not in certs:
            logger.warning(f"[Firebase] Unknown key ID: {kid}")
            return None
        
        # Get the public key from the certificate
        cert_pem = certs[kid].encode("utf-8")
        cert = load_pem_x509_certificate(cert_pem, default_backend())
        public_key = cert.public_key()
        
        # Verify and decode the token
        decoded = pyjwt.decode(
            id_token,
            public_key,
            algorithms=["RS256"],
            audience=FIREBASE_PROJECT_ID,
            issuer=f"https://securetoken.google.com/{FIREBASE_PROJECT_ID}"
        )
        
        # Additional checks
        if not decoded.get("sub"):
            logger.warning("[Firebase] Token missing 'sub' claim")
            return None
            
        return decoded
        
    except pyjwt.ExpiredSignatureError:
        logger.warning("[Firebase] Token expired")
        return None
    except pyjwt.InvalidTokenError as e:
        logger.warning(f"[Firebase] Invalid token: {str(e)}")
        return None
    except Exception as e:
        logger.exception(f"[Firebase] Token verification error: {str(e)}")
        return None

@auth_bp.route("/api/available-roles", methods=["GET"])
def available_roles():
    from backend.extensions import mongo
    # Fetch roles dynamically so new roles appear in the registration dropdown
    roles_cursor = mongo.db.roles.find({"name": {"$ne": "admin"}}, {"_id": 0, "name": 1, "permissions": 1})
    roles = list(roles_cursor)
    return jsonify({"roles": roles}), 200


def dispatch_otp(user, preferred_channel=None):
    from backend.extensions import mongo
    now = datetime.now(timezone.utc)
    
    try:
        # Generate OTP
        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret, interval=600)
        otp = totp.now()
        expiry = now + timedelta(minutes=10)
        
        # Store in DB (Linked to the unique account ID)
        mongo.db.otps.update_one(
            {"uid": str(user["_id"])},
            {"$set": {
                "otp": otp, 
                "otp_secret": secret, 
                "expiry": expiry,
                "last_requested": now,
                "attempt_count": 0,
                "verified": False,
                "verified_at": None
            }},
            upsert=True
        )

        if os.environ.get("LOG_OTP_CODES") == "True":
            logger.warning(f"[AUTH] event=otp_generated_debug target={mask_identifier(user.get('email') or user.get('phone'))} otp={otp}")
        else:
            logger.info(f"[AUTH] event=otp_generated target={mask_identifier(user.get('email') or user.get('phone'))}")
        # Determine target: detect if preferred_channel is a mobile identifier (contains 10+ digits)
        clean_pref = preferred_channel.replace(" ", "").replace("+", "") if preferred_channel else ""
        is_phone_used = preferred_channel and clean_pref.isdigit() and len(clean_pref) >= 10
        is_email_used = preferred_channel and "@" in preferred_channel
        
        # Priority 1: Preferred Phone Channel (SMS)
        if is_phone_used and user.get("phone"):
            sms_sent, sms_error = send_sms_otp(user["phone"], otp, "login_otp")
            if sms_sent:
                return True, f"SMS node: ***{user['phone'][-4:]}", otp
            return False, f"SMS node failure: {sms_error}", None

        # Priority 2: Preferred Email Channel
        if is_email_used and user.get("email"):
            html_body = otp_email_message(otp)
            send_email_async("Your HealthAI verification code", user["email"], html_body, "login_otp")
            return True, f"Email node: {user['email'][:3]}***@{user['email'].split('@')[-1]}", otp

        # Final Fallback: Send to whatever primary communication vector the node has
        if user.get("email"):
            html_body = otp_email_message(otp)
            send_email_async("Your HealthAI verification code", user["email"], html_body, "login_otp_fallback")
            return True, f"Email node: {user['email'][:3]}***@{user['email'].split('@')[-1]}", otp
        elif user.get("phone"):
            # SMS logic again (Fallback)
            sms_sent, sms_error = send_sms_otp(user["phone"], otp, "login_otp_fallback")
            if sms_sent:
                return True, f"SMS node: ***{user['phone'][-4:]}", otp
            return False, f"SMS delivery failed: {sms_error}", None

        log_auth_event("otp_no_delivery_channel", "warning", user_id=str(user.get("_id")))
        return False, "No valid communication vector found", None
    except Exception as e:
        err_msg = f"Neural transmission failure: {str(e)}"
        logger.exception(f"[AUTH] event=otp_dispatch_error error={err_msg}")
        return False, err_msg, None

def validate_input(email, phone):
    if email and not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return False, "Invalid email format"
    if phone and not re.match(r"^\+?[1-9]\d{1,14}$", phone):
        return False, "Invalid phone format"
    return True, ""

@auth_bp.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    try:
        from backend.extensions import mongo
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request: No JSON data provided"}), 400
            
        email = data.get("email")
        phone = data.get("phone")
        
        # Normalize inputs
        if email: email = email.lower().strip()
        if phone: phone = phone.replace(" ", "")
        log_auth_event("forgot_password_attempt", identifier=mask_identifier(email or phone))
            
        if not email and not phone:
            return jsonify({"error": "Recovery identifier required"}), 400
            
        # Validate format
        is_valid, msg = validate_input(email, phone)
        if not is_valid:
            return jsonify({"error": msg}), 400
            
        # Check if user exists - returns error if not found as requested
        user_query = {"email": email} if email else {"phone": phone}
        user = mongo.db.users.find_one(user_query)
        
        if not user:
            log_auth_event("forgot_password_user_missing", "warning", identifier=mask_identifier(email or phone))
            return jsonify({"error": "No account found with this identifier"}), 404
            
        # Support check_only for client-side Firebase Phone Auth verification
        check_only = data.get("check_only", False)
        if check_only:
            log_auth_event("forgot_password_check_only_success", identifier=mask_identifier(email or phone))
            return jsonify({
                "status": "success",
                "message": "Clinical identity validated. Proceeding to Firebase token dispatch.",
                "destination": mask_identifier(email or phone)
            }), 200
            
        canonical_email = user.get("email", "").lower()
        now = datetime.now(timezone.utc)
        
        # Rate Limiting (1 OTP per 60s)
        existing_otp = mongo.db.otps.find_one({"uid": str(user["_id"])})
        if existing_otp and existing_otp.get("last_requested"):
            last_req = existing_otp["last_requested"]
            if last_req.tzinfo is None:
                last_req = last_req.replace(tzinfo=timezone.utc)
            if (now - last_req).total_seconds() < 60:
                log_auth_event("forgot_password_rate_limited", "warning", identifier=mask_identifier(email or phone))
                return jsonify({"error": "Please wait 60 seconds before requesting a new OTP."}), 429
                
        # Generate OTP (using unique dynamic secret per request instead of static email hash)
        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret, interval=600)
        otp = totp.now()
        expiry = now + timedelta(minutes=10)
        
        # Store in DB (Linked to the unique account ID)
        mongo.db.otps.update_one(
            {"uid": str(user["_id"])},
            {"$set": {
                "otp": otp, 
                "otp_secret": secret, 
                "expiry": expiry,
                "last_requested": now,
                "attempt_count": 0,
                "verified": False,
                "verified_at": None
            }},
            upsert=True
        )
        
        dispatch_success = False
        dispatch_error = "No valid communication vector found"
        
        # Email Channel
        if email:
            try:
                html_body = otp_email_message(otp)
                send_email_async("Reset your HealthAI password", email, html_body, "forgot_password")
                dispatch_success = True
            except Exception as e:
                dispatch_error = str(e)
                logger.exception(f"[AUTH] event=forgot_password_email_error error={str(e)}")
                
        # SMS Channel (Priority fallback)
        elif phone:
            sms_sent, sms_error = send_sms_otp(phone, otp, "forgot_password")
            if sms_sent:
                dispatch_success = True
            else:
                dispatch_error = f"Mobile dispatch node failure: {sms_error}"
                log_auth_event("forgot_password_sms_failed", "warning", identifier=mask_identifier(phone), error=sms_error)
                
        if not dispatch_success:
            log_auth_event("forgot_password_dispatch_failed", "warning", identifier=mask_identifier(email or phone), error=dispatch_error)
            return jsonify({"error": f"Failed to dispatch recovery token: {dispatch_error}"}), 500

        log_auth_event("forgot_password_otp_queued", identifier=mask_identifier(email or phone))
        return jsonify({
            "status": "success",
            "message": "OTP sent successfully to your identifier",
            "destination": mask_identifier(email or phone)
        }), 200
    except Exception as e:
        logger.exception(f"[AUTH] event=forgot_password_error error={str(e)}")
        return jsonify({"error": "Internal recovery protocol failure", "details": str(e)}), 500

@auth_bp.route("/api/verify-otp", methods=["POST"])
def verify_otp():
    try:
        data = request.json
        identifier = data.get("email") # Could be email or phone from UI
        if identifier:
            identifier = identifier.replace(" ", "").lower().strip()
        otp_input = str(data.get("otp", "")).strip()
        log_auth_event("reset_verify_attempt", identifier=mask_identifier(identifier))
        
        if not identifier or not otp_input:
            return jsonify({"error": "Verification data missing"}), 400
        
        # Lookup by identifier (Email or Phone)
        user = mongo.db.users.find_one({"$or": [{"email": identifier.lower()}, {"phone": identifier}]})
        
        if not user:
            log_auth_event("reset_verify_user_missing", "warning", identifier=mask_identifier(identifier))
            return jsonify({"error": "No clinical identifier matched"}), 404
            
        otp_record = mongo.db.otps.find_one({"uid": str(user["_id"])})
        
        if not otp_record:
            log_auth_event("reset_verify_no_active_otp", "warning", identifier=mask_identifier(identifier))
            return jsonify({"error": "No active recovery protocol found"}), 404
            
        if str(otp_record["otp"]) != otp_input:
            log_auth_event("reset_verify_invalid_otp", "warning", identifier=mask_identifier(identifier))
            return jsonify({"error": "Invalid verification identifier"}), 401
        
        expiry = otp_record["expiry"]
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
            
        if datetime.now(timezone.utc) > expiry:
            log_auth_event("reset_verify_expired_otp", "warning", identifier=mask_identifier(identifier))
            return jsonify({"error": "OTP has expired. Re-initialize protocol."}), 401

        mongo.db.otps.update_one(
            {"uid": str(user["_id"])},
            {"$set": {
                "verified": True,
                "verified_at": datetime.now(timezone.utc)
            }}
        )
        # OTP is valid!
        log_auth_event("reset_verify_success", identifier=mask_identifier(identifier))
        return jsonify({"message": "Node identity verified. Proceed to passkey re-initialization.", "status": "success"}), 200
    except Exception as e:
        logger.exception(f"[AUTH] event=reset_verify_error error={str(e)}")
        return jsonify({"error": "Verification node failure", "details": str(e)}), 500

@auth_bp.route("/api/verify-otp-firebase", methods=["POST"])
def verify_otp_firebase():
    try:
        from backend.extensions import mongo
        data = request.json
        firebase_id_token = data.get("firebase_id_token")
        phone = data.get("phone", "").replace(" ", "")
        
        log_auth_event("reset_verify_firebase_attempt", identifier=mask_identifier(phone))
        
        if not firebase_id_token or not phone:
            return jsonify({"error": "Verification data missing"}), 400
            
        # Verify the Firebase ID token using Google's public keys
        firebase_verified = verify_firebase_id_token(firebase_id_token)
        if not firebase_verified:
            log_auth_event("reset_verify_firebase_invalid_token", "warning", identifier=mask_identifier(phone))
            return jsonify({"error": "Firebase token verification failed"}), 401
            
        # Ensure the phone number in the token matches the user's phone
        token_phone = firebase_verified.get("phone_number", "")
        
        # Normalize phones for comparison
        normalize = lambda p: re.sub(r"\D", "", p) if p else ""
        if normalize(token_phone) != normalize(phone):
            log_auth_event("reset_verify_firebase_phone_mismatch", "warning", 
                           token_phone=mask_identifier(token_phone), phone=mask_identifier(phone))
            return jsonify({"error": "Phone number mismatch. Security violation detected."}), 401
            
        # Find user
        user = mongo.db.users.find_one({"phone": phone})
        if not user:
            log_auth_event("reset_verify_firebase_user_missing", "warning", identifier=mask_identifier(phone))
            return jsonify({"error": "No clinical identifier matched"}), 404
            
        # Success! Create/Update verified OTP session
        expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
        mongo.db.otps.update_one(
            {"uid": str(user["_id"])},
            {"$set": {
                "otp": "FIREBASE_BYPASS",
                "otp_secret": "FIREBASE_BYPASS",
                "expiry": expiry,
                "last_requested": datetime.now(timezone.utc),
                "attempt_count": 0,
                "verified": True,
                "verified_at": datetime.now(timezone.utc)
            }},
            upsert=True
        )
        
        log_auth_event("reset_verify_firebase_success", identifier=mask_identifier(phone))
        return jsonify({"message": "Node identity verified via Firebase. Proceed to passkey re-initialization.", "status": "success"}), 200
    except Exception as e:
        logger.exception(f"[AUTH] event=reset_verify_firebase_error error={str(e)}")
        return jsonify({"error": "Verification node failure", "details": str(e)}), 500

@auth_bp.route("/api/reset-password", methods=["POST"])
def reset_password():
    try:
        data = request.json
        email = data.get("email")
        if email:
            email = email.replace(" ", "").lower().strip()
        new_password = data.get("password")
        log_auth_event("reset_password_attempt", identifier=mask_identifier(email))
        
        if not email or not new_password:
            return jsonify({"error": "Re-initialization data missing"}), 400
            
        if len(new_password) < 6:
            return jsonify({"error": "New passkey must meet complexity requirements (6+ chars)"}), 400

        user = mongo.db.users.find_one({"$or": [{"email": email.lower()}, {"phone": email}]})
        if not user:
            log_auth_event("reset_password_user_missing", "warning", identifier=mask_identifier(email))
            return jsonify({"error": "Invalid user identifier"}), 404

        otp_record = mongo.db.otps.find_one({"uid": str(user["_id"]), "verified": True})
        if not otp_record:
            log_auth_event("reset_password_unverified_otp", "warning", identifier=mask_identifier(email))
            return jsonify({"error": "Verify OTP before resetting password"}), 401

        expiry = otp_record.get("expiry")
        if not expiry:
            log_auth_event("reset_password_missing_otp_expiry", "warning", identifier=mask_identifier(email))
            return jsonify({"error": "Recovery session expired. Request a new OTP."}), 401
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expiry:
            mongo.db.otps.delete_one({"uid": str(user["_id"])})
            log_auth_event("reset_password_expired_verified_otp", "warning", identifier=mask_identifier(email))
            return jsonify({"error": "Recovery session expired. Request a new OTP."}), 401

        hashed_pw = bcrypt.generate_password_hash(new_password).decode('utf-8')
        # Update by either email or phone
        res = mongo.db.users.update_one(
            {"$or": [{"email": email.lower()}, {"phone": email}]}, 
            {"$set": {"password": hashed_pw}}
        )
        
        if res.modified_count == 0:
            log_auth_event("reset_password_user_missing_or_unchanged", "warning", identifier=mask_identifier(email))
            return jsonify({"error": "Invalid user identifier"}), 404

        mongo.db.otps.delete_one({"uid": str(user["_id"])})
        log_auth_event("reset_password_success", identifier=mask_identifier(email))
        return jsonify({"message": "Protocol re-secured successfully"}), 200
    except Exception as e:
        logger.exception(f"[AUTH] event=reset_password_error error={str(e)}")
        return jsonify({"error": "Passkey reset failure", "details": str(e)}), 500

@auth_bp.route("/api/auth/verify", methods=["GET"])
@jwt_required()
def verify():
    current_user_id = get_jwt_identity()
    user = mongo.db.users.find_one({"_id": current_user_id}, {"password": 0})
    if not user:
        return jsonify({"error": "Session node invalid"}), 404
        
    user["_id"] = str(user["_id"])
    return jsonify(user), 200
