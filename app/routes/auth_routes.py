from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_mail import Message
from app.extensions import mongo, bcrypt, mail
import json
import pyotp
import os
from twilio.rest import Client
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

@auth_bp.route("/api/register", methods=["POST"])
def register():
    data = request.json
    name = data.get("name")
    email = data.get("email", "").lower().strip()
    phone = data.get("phone", "").replace(" ", "").strip()
    password = data.get("password")
    role = data.get("role", "clinician")
    
    if not name or not email or not password:
        return jsonify({"error": "Full authentication credentials required (Name, Email, Password)"}), 400
        
    if len(password) < 6:
        return jsonify({"error": "Encryption passkey must be at least 6 characters"}), 400

    # Ensure unique identifiers in registry
    if mongo.db.users.find_one({"$or": [{"email": email}, {"phone": phone} if phone else {"email": "NON_EXISTENT_PLACEHOLDER"}]}):
        return jsonify({"error": "Identifier (Email or Phone) already active in registry"}), 400
        
    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
    mongo.db.users.insert_one({
        "name": name,
        "email": email,
        "phone": phone,
        "password": hashed_pw,
        "role": role,
        "avatar": f"https://i.pravatar.cc/150?u={email}"
    })
    
    return jsonify({"message": "Node Registration Successful", "status": "success"}), 201

@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email", "").lower().strip()
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"error": "Credentials missing"}), 400

    user = mongo.db.users.find_one({"email": email})
    
    password_valid = False
    if user:
        try:
            password_valid = bcrypt.check_password_hash(user["password"], password)
        except ValueError:
            # Handle invalid salts from manual DB edits or malformed hashes
            password_valid = False
            
    if user and password_valid:
        # Fetch permissions based on role
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
        
        return jsonify({
            "access_token": access_token,
            "user": {
                "email": user["email"],
                "name": user["name"],
                "role": user["role"],
                "permissions": permissions,
                "avatar": user.get("avatar", f"https://i.pravatar.cc/150?u={email.lower()}")
            }
        }), 200
        
    return jsonify({"error": "Secure credentials mismatch or account not found"}), 401

@auth_bp.route("/api/available-roles", methods=["GET"])
def available_roles():
    from app.extensions import mongo
    # Fetch roles dynamically so new roles appear in the registration dropdown
    roles_cursor = mongo.db.roles.find({"name": {"$ne": "admin"}}, {"_id": 0, "name": 1, "permissions": 1})
    roles = list(roles_cursor)
    if not roles:
        # Fallback if DB is empty
        roles = [{"name": "clinician", "permissions": ["view", "predict"]}, {"name": "patient", "permissions": ["view" , "predict"]}]
    return jsonify({"roles": roles}), 200

import re
import logging
import pyotp
import os
from datetime import datetime, timedelta, timezone
from flask_mail import Message
from twilio.rest import Client

logger = logging.getLogger(__name__)

def validate_input(email, phone):
    if email and not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return False, "Invalid email format"
    if phone and not re.match(r"^\+?[1-9]\d{1,14}$", phone):
        return False, "Invalid phone format"
    return True, ""

@auth_bp.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    from app.extensions import mongo
    data = request.json
    email = data.get("email")
    phone = data.get("phone")
    
    # Normalize inputs
    if email: email = email.lower().strip()
    if phone: phone = phone.replace(" ", "")
        
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
        return jsonify({"error": "No account found with this identifier"}), 404
        
    canonical_email = user["email"].lower()
    now = datetime.now(timezone.utc)
    
    # Rate Limiting (1 OTP per 60s)
    existing_otp = mongo.db.otps.find_one({"email": canonical_email})
    if existing_otp and existing_otp.get("last_requested"):
        last_req = existing_otp["last_requested"]
        if last_req.tzinfo is None:
            last_req = last_req.replace(tzinfo=timezone.utc)
        if (now - last_req).total_seconds() < 60:
            return jsonify({"error": "Please wait 60 seconds before requesting a new OTP."}), 429
            
    # Generate OTP (using unique dynamic secret per request instead of static email hash)
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret, interval=600)
    otp = totp.now()
    expiry = now + timedelta(minutes=10)
    
    # Store in DB (maintaining compatibility with existing verify_otp layout)
    mongo.db.otps.update_one(
        {"email": canonical_email},
        {"$set": {
            "otp": otp, 
            "otp_secret": secret, 
            "expiry": expiry,
            "last_requested": now,
            "attempt_count": 0
        }},
        upsert=True
    )
    
    dispatch_success = False
    
    # Email Channel
    if email:
        try:
            from app.extensions import mail
            msg = Message(
                subject="HealthAI: Security Recovery Token",
                recipients=[email],
                body=f"SECURITY ALERT: Recovery protocol authorized.\n\nYour OTP is: {otp}\n\nExpires in 10 mins."
            )
            mail.send(msg)
            dispatch_success = True
        except Exception as e:
            logger.error(f"[MAIL-ERROR] {str(e)}")
            
    # SMS Channel (Priority fallback)
    elif phone:
        try:
            account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
            auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
            twilio_phone = os.environ.get('TWILIO_PHONE_NUMBER')
            if account_sid and auth_token and twilio_phone:
                client = Client(account_sid, auth_token)
                client.messages.create(
                    body=f"HealthAI OTP: {otp}. Valid for 10 min. Do not share.",
                    from_=twilio_phone,
                    to=phone
                )
                dispatch_success = True
            else:
                logger.error("[SMS-ERROR] Missing Twilio environment config")
        except Exception as e:
            logger.error(f"[SMS-ERROR] {str(e)}")
            
    if not dispatch_success:
        return jsonify({"error": "Failed to dispatch recovery token. Try again later."}), 500
        
    return jsonify({
        "status": "success",
        "message": "OTP sent successfully to your identifier",
        "email": canonical_email
    }), 200

@auth_bp.route("/api/verify-otp", methods=["POST"])
def verify_otp():
    data = request.json
    identifier = data.get("email") # Could be email or phone from UI
    if identifier:
        identifier = identifier.replace(" ", "").lower().strip()
    otp_input = str(data.get("otp", "")).strip()
    
    if not identifier or not otp_input:
        return jsonify({"error": "Verification data missing"}), 400
    
    logger.info(f"[VERIFY] Attempting verification for {identifier}")
        
    # Lookup by identifier (Email or Phone)
    user = mongo.db.users.find_one({"$or": [{"email": identifier.lower()}, {"phone": identifier}]})
    
    if not user:
        return jsonify({"error": "No clinical identifier matched"}), 404
        
    otp_record = mongo.db.otps.find_one({"email": user["email"].lower()})
    
    if not otp_record:
        return jsonify({"error": "No active recovery protocol found"}), 404
        
    if otp_record["otp"] != otp_input:
        logger.warning(f"[VERIFY] OTP mismatch for {identifier}. Record: {otp_record['otp']}, Input: {otp_input}")
        return jsonify({"error": "Invalid verification identifier"}), 401
    
    expiry = otp_record["expiry"]
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
        
    if datetime.now(timezone.utc) > expiry:
        logger.warning(f"[VERIFY] OTP expired for {identifier}")
        return jsonify({"error": "OTP has expired. Re-initialize protocol."}), 401
        
    # OTP is valid!
    return jsonify({"message": "Node identity verified. Proceed to passkey re-initialization.", "status": "success"}), 200

@auth_bp.route("/api/reset-password", methods=["POST"])
def reset_password():
    data = request.json
    print(f"[DEBUG-RESET] Data received: {data}")
    email = data.get("email")
    if email:
        email = email.replace(" ", "")
    new_password = data.get("password")
    
    if not email or not new_password:
        return jsonify({"error": "Re-initialization data missing"}), 400
        
    if len(new_password) < 6:
        return jsonify({"error": "New passkey must meet complexity requirements (6+ chars)"}), 400

    hashed_pw = bcrypt.generate_password_hash(new_password).decode('utf-8')
    # Update by either email or phone
    res = mongo.db.users.update_one(
        {"$or": [{"email": email.lower()}, {"phone": email}]}, 
        {"$set": {"password": hashed_pw}}
    )
    
    if res.modified_count == 0:
        return jsonify({"error": "Node relocation failed or identifier invalid"}), 404
        
    return jsonify({"message": "Protocol re-secured successfully"}), 200

@auth_bp.route("/api/auth/verify", methods=["GET"])
@jwt_required()
def verify():
    current_user_id = get_jwt_identity()
    user = mongo.db.users.find_one({"_id": current_user_id}, {"password": 0})
    if not user:
        return jsonify({"error": "Session node invalid"}), 404
        
    user["_id"] = str(user["_id"])
    return jsonify(user), 200
