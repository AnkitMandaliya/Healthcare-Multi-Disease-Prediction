from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
import pandas as pd
import os
from backend.extensions import mongo
from backend.controllers import model_manager, prediction_ctrl

predict_bp = Blueprint('predict', __name__)

@predict_bp.route("/predict_<disease>", methods=["POST"])
@jwt_required(optional=True)
def predict_endpoint(disease):
    from bson.objectid import ObjectId
    current_user_id = get_jwt_identity()
    # Handle optional user authentication
    email = "Anonymous Guest"
    if current_user_id:
        try:
            user = mongo.db.users.find_one({"_id": ObjectId(current_user_id)})
            if user: email = user.get("email", "anonymous")
        except:
            pass
            
    try:
        return prediction_ctrl.predict(disease, request.json, email, mongo)
    except Exception as e:
        return jsonify({"error": f"Invalid input or prediction failed: {str(e)}", "status": "error"}), 400

@predict_bp.route("/api/gemini/advice", methods=["POST"])
@jwt_required()
def advice_endpoint():
    data = request.json
    return prediction_ctrl.generate_ai_advice(data, mongo)

@predict_bp.route("/api/stats/<disease>", methods=["GET"])
@jwt_required()
def stats_endpoint(disease):
    from backend.extensions import mongo
    user_email = get_jwt_identity() # This is the user _id from create_access_token
    # But wait, my create_access_token uses identity=str(user["_id"])
    # I need to fetch the user email if I want to filter by email.
    from bson.objectid import ObjectId
    user = mongo.db.users.find_one({"_id": ObjectId(user_email)})
    email = user.get("email") if user else None
    
    return prediction_ctrl.get_dashboard_stats(disease, mongo, user_email=email)

@predict_bp.route("/api/notifications", methods=["GET"])
@jwt_required()
def notifications_endpoint():
    from flask_jwt_extended import get_jwt
    from backend.extensions import mongo
    
    role = get_jwt().get("role")
    
    if role == "admin":
        notifs = list(mongo.db.notifications.find().sort("timestamp", -1).limit(20))
    else:
        notifs = list(mongo.db.notifications.find({"patient": "Broadcast"}).sort("timestamp", -1).limit(20))
    
    for n in notifs:
        n["_id"] = str(n["_id"])
        if "timestamp" in n:
             # Basic time extraction from ISO string (2025-01-01T12:00:00.000)
             n["time"] = n["timestamp"].split("T")[1][:5] if "T" in n["timestamp"] else "Just now"
        else:
             n["time"] = "Active"
    return jsonify(notifs)
