from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import mongo
from bson.objectid import ObjectId
import datetime
import os
from werkzeug.utils import secure_filename
import cloudinary
import cloudinary.uploader
import os

user_bp = Blueprint('user', __name__)

@user_bp.route("/api/user/profile", methods=["GET"])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = mongo.db.users.find_one({"_id": ObjectId(user_id)}, {"password": 0})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    user["_id"] = str(user["_id"])
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
    
    if not update_data:
        return jsonify({"error": "No data to update"}), 400
        
    mongo.db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    
    return jsonify({"message": "Profile updated successfully", "status": "success"}), 200

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
            # Configure Cloudinary
            cloudinary.config(
                cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME'),
                api_key = os.environ.get('CLOUDINARY_API_KEY'),
                api_secret = os.environ.get('CLOUDINARY_API_SECRET')
            )
            
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(file, folder="healthai_avatars")
            avatar_url = upload_result.get("secure_url")
            
            # Update user immediately
            mongo.db.users.update_one({"_id": ObjectId(get_jwt_identity())}, {"$set": {"avatar": avatar_url}})
            
            return jsonify({"url": avatar_url, "status": "success"}), 200
        except Exception as e:
            print(f"[CLOUDINARY-ERROR] {str(e)}")
            return jsonify({"error": "Cloudinary upload failed. Check your API credentials in the .env file."}), 500

@user_bp.route("/api/user/records", methods=["GET"])
@jwt_required()
def get_records():
    user_id = get_jwt_identity()
    user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    email = user.get("email")
    records = list(mongo.db.predictions.find({"user_email": email}).sort("timestamp", -1))
    
    for r in records:
        r["_id"] = str(r["_id"])
        
    return jsonify(records), 200
