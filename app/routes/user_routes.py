from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import mongo
from bson.objectid import ObjectId
import datetime
import os
import re
import pyotp
import bcrypt
import logging
from flask_mail import Message
from twilio.rest import Client
from werkzeug.utils import secure_filename
import cloudinary
import cloudinary.uploader

user_bp = Blueprint('user', __name__)

@user_bp.route("/api/user/profile", methods=["GET"])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = mongo.db.users.find_one({"_id": ObjectId(user_id)}, {"password": 0})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    user["_id"] = str(user["_id"])
    
    # Administrative Identity Sync (Ensures no 'Registry Pending' for System Node)
    if user.get("role") == "admin":
        if not user.get("specialization"): user["specialization"] = "Clinical AI Architect"
        if not user.get("department"): user["department"] = "Systems Management Unit"
        if not user.get("medical_degree"): user["medical_degree"] = "Ph.D. Neural Intelligence"
        if not user.get("experience"): user["experience"] = "12+ Years"
        if not user.get("location"): user["location"] = "Central Intelligence Hub"

    return jsonify(user), 200

@user_bp.route("/api/user/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    data = request.json
    
    update_data = {}
    if "name" in data: update_data["name"] = data["name"]
    if "bio" in data: update_data["bio"] = data["bio"]
    if "avatar" in data: update_data["avatar"] = data["avatar"]
    if "phone" in data: update_data["phone"] = data["phone"]
    if "location" in data: update_data["location"] = data["location"]
    if "specialization" in data: update_data["specialization"] = data["specialization"]
    if "experience" in data: update_data["experience"] = data["experience"]
    if "department" in data: update_data["department"] = data["department"]
    if "medical_degree" in data: update_data["medical_degree"] = data["medical_degree"]
    if "email" in data: update_data["email"] = data["email"].lower().strip()
    
    # Direct Password Update with encryption (Multi-factor flow removed)
    if "password" in data and data["password"]:
        import bcrypt
        hashed = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt(12))
        update_data["password"] = hashed.decode('utf-8')
        
    if not update_data:
        return jsonify({"error": "No data to update"}), 400
        
    mongo.db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    
    return jsonify({"message": "Clinical registry synchronized successfully", "status": "success"}), 200

@user_bp.route("/api/user/upload-avatar", methods=["POST"])
@jwt_required()
def upload_avatar():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if file:
        try:
            cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
            api_key = os.environ.get('CLOUDINARY_API_KEY')
            api_secret = os.environ.get('CLOUDINARY_API_SECRET')
            
            if cloud_name and api_key and api_secret:
                # Primary: Cloudinary Cloud Storage
                cloudinary.config(cloud_name=cloud_name, api_key=api_key, api_secret=api_secret)
                upload_result = cloudinary.uploader.upload(file, folder="healthai_avatars")
                avatar_url = upload_result.get("secure_url")
            else:
                # Secondary: Local Storage Fallback
                from werkzeug.utils import secure_filename
                import uuid
                filename = secure_filename(file.filename)
                unique_name = f"avatar_{uuid.uuid4().hex}_{filename}"
                root_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                upload_folder = os.path.join(root_path, 'static', 'uploads')
                os.makedirs(upload_folder, exist_ok=True)
                file_path = os.path.join(upload_folder, unique_name)
                file.save(file_path)
                avatar_url = f"/api/uploads/{unique_name}"
            
            # Update user immediately
            mongo.db.users.update_one({"_id": ObjectId(get_jwt_identity())}, {"$set": {"avatar": avatar_url}})
            return jsonify({"url": avatar_url, "status": "success"}), 200
        except Exception as e:
            print(f"[STORAGE-ERROR] {str(e)}")
            return jsonify({"error": f"Node storage failure: {str(e)}"}), 500

@user_bp.route("/api/user/records", methods=["GET"])
@jwt_required()
def get_records():
    user_id = get_jwt_identity()
    user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    email = user.get("email")
    records = list(mongo.db.records.find({"email": email}).sort("timestamp", -1))
    
    for r in records:
        r["_id"] = str(r["_id"])
        
    return jsonify(records), 200
