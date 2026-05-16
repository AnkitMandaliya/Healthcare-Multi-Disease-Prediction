from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_mail import Message
from backend.extensions import mongo, bcrypt, mail
import json
import pyotp
import os
import re
import logging
import traceback
from twilio.rest import Client
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

def send_email_async(message, purpose, recipient):
    app = current_app._get_current_object()
    masked_recipient = mask_identifier(recipient)
    log_auth_event("email_queued", purpose=purpose, recipient=masked_recipient)

    def worker():
        with app.app_context():
            try:
                mail.send(message)
                logger.info(f"[AUTH] event=email_sent purpose={purpose} recipient={masked_recipient}")
            except Exception as e:
                logger.error(f"[AUTH] event=email_failed purpose={purpose} recipient={masked_recipient} error={str(e)}")

    threading.Thread(target=worker, daemon=True).start()

def otp_email_message(subject, recipient, otp):
    plain_body = (
        f"Your HealthAI verification code is {otp}.\n\n"
        "This code expires in 10 minutes.\n\n"
        "If you did not request this code, you can ignore this email.\n\n"
        "HealthAI"
    )
    html_body = f"""
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f6f8fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f8fb;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #e5eaf2;border-radius:8px;">
            <tr>
              <td style="padding:28px 28px 12px;">
                <p style="margin:0 0 8px;font-size:14px;color:#64748b;">HealthAI account verification</p>
                <h1 style="margin:0;font-size:22px;line-height:1.35;color:#0f172a;">Your verification code</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 28px 4px;">
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">Use this code to continue signing in to your HealthAI account.</p>
                <div style="font-size:32px;line-height:1;letter-spacing:6px;font-weight:700;color:#0f172a;background:#f1f5f9;border:1px solid #dbe3ee;border-radius:8px;padding:18px;text-align:center;">{otp}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 28px;">
                <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#475569;">This code expires in 10 minutes.</p>
                <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">If you did not request this code, you can safely ignore this email.</p>
              </td>
            </tr>
          </table>
          <p style="max-width:520px;margin:14px auto 0;font-size:12px;line-height:1.5;color:#94a3b8;">HealthAI sends verification codes only when requested from the app.</p>
        </td>
      </tr>
    </table>
  </body>
</html>
"""
    return Message(
        subject=subject,
        recipients=[recipient],
        body=plain_body,
        html=html_body,
        extra_headers={
            "X-Auto-Response-Suppress": "All",
            "X-Entity-Ref-ID": f"healthai-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
        }
    )

def send_sms_otp(phone, otp, purpose):
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
    twilio_phone = os.environ.get('TWILIO_PHONE_NUMBER')
    if not account_sid or not auth_token or not twilio_phone:
        return False, "Missing Twilio environment config"

    try:
        client = Client(account_sid, auth_token)
        client.messages.create(
            body=f"Your HealthAI verification code is {otp}. It expires in 10 minutes.",
            from_=twilio_phone,
            to=phone
        )
        log_auth_event("otp_sms_sent", recipient=mask_identifier(phone), purpose=purpose)
        return True, None
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

        # Ensure unique identifiers in registry
        query_parts = []
        if email: query_parts.append({"email": email})
        if phone: query_parts.append({"phone": phone})
        
        if mongo.db.users.find_one({"$or": query_parts}):
            log_auth_event("register_duplicate_identifier", "warning", identifier=mask_identifier(email or phone), role=role)
            return jsonify({"error": "Clinical identifier (Email or Phone) already active in registry"}), 400
            
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

        # Search by email or phone
        user = mongo.db.users.find_one({"$or": [{"email": identifier.lower()}, {"phone": identifier}]})
        
        password_valid = False
        if user:
            try:
                password_valid = bcrypt.check_password_hash(user["password"], password)
            except Exception as pe:
                logger.error(f"[LOGIN-PASSWORD-ERROR] {str(pe)}")
                password_valid = False
                
        if user and password_valid:
            # Production-Grade OTP Verification Flow
            skip_otp = os.environ.get("SKIP_OTP_USER") == user["email"]
            if skip_otp: 
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
                log_auth_event("login_success_skip_otp", identifier=mask_identifier(identifier), role=user.get("role"))
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
            # Step 2: Trigger OTP protocol for Login (2FA) - Respect the identifier used for delivery
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
            
        log_auth_event("login_failed_bad_credentials", "warning", identifier=mask_identifier(identifier), user_found=bool(user))
        return jsonify({"error": "Secure credentials mismatch or account not found"}), 401
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
            return jsonify({"error": "Node identity lost"}), 404
            
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

@auth_bp.route("/api/available-roles", methods=["GET"])
def available_roles():
    from backend.extensions import mongo
    # Fetch roles dynamically so new roles appear in the registration dropdown
    roles_cursor = mongo.db.roles.find({"name": {"$ne": "admin"}}, {"_id": 0, "name": 1, "permissions": 1})
    roles = list(roles_cursor)
    if not roles:
        # Fallback if DB is empty
        roles = [{"name": "clinician", "permissions": ["view", "predict"]}, {"name": "patient", "permissions": ["view" , "predict"]}]
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
            if user.get("email"):
                msg = otp_email_message("Your HealthAI verification code", user["email"], otp)
                send_email_async(msg, "login_otp_sms_fallback", user["email"])
                return True, f"SMS unavailable, email node: {user['email'][:3]}***@{user['email'].split('@')[-1]}", otp
            return False, f"SMS delivery failed: {sms_error}", None

        # Priority 2: Preferred Email Channel (SMTP)
        if is_email_used and user.get("email"):
            msg = otp_email_message("Your HealthAI verification code", user["email"], otp)
            send_email_async(msg, "login_otp", user["email"])
            return True, f"Email node: {user['email'][:3]}***@{user['email'].split('@')[-1]}", otp

        # Final Fallback: Send to whatever primary communication vector the node has
        if user.get("email"):
            msg = otp_email_message("Your HealthAI verification code", user["email"], otp)
            send_email_async(msg, "login_otp_fallback", user["email"])
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
                msg = otp_email_message("Reset your HealthAI password", email, otp)
                send_email_async(msg, "forgot_password", email)
                dispatch_success = True
            except Exception as e:
                dispatch_error = str(e)
                logger.exception(f"[AUTH] event=forgot_password_email_error error={str(e)}")
                
        # SMS Channel (Priority fallback)
        elif phone:
            sms_sent, sms_error = send_sms_otp(phone, otp, "forgot_password")
            if sms_sent:
                dispatch_success = True
            elif canonical_email:
                dispatch_error = sms_error
                msg = otp_email_message("Reset your HealthAI password", canonical_email, otp)
                send_email_async(msg, "forgot_password_sms_fallback", canonical_email)
                dispatch_success = True
                log_auth_event("forgot_password_sms_fallback_email", identifier=mask_identifier(phone), email=mask_identifier(canonical_email), sms_error=sms_error)
            else:
                dispatch_error = sms_error
                
        if not dispatch_success:
            log_auth_event("forgot_password_dispatch_failed", "warning", identifier=mask_identifier(email or phone), error=dispatch_error)
            return jsonify({"error": f"Failed to dispatch recovery token: {dispatch_error}"}), 500

        log_auth_event("forgot_password_otp_queued", identifier=mask_identifier(email or phone))
        return jsonify({
            "status": "success",
            "message": "OTP sent successfully to your identifier",
            "email": canonical_email
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
            return jsonify({"error": "Node relocation failed or identifier invalid"}), 404

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
            return jsonify({"error": "Node relocation failed or identifier invalid"}), 404

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
