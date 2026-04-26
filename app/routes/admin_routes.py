from flask import Blueprint, jsonify, request
from app.utils.decorators import admin_required
from app.extensions import mongo
import pandas as pd

admin_bp = Blueprint('admin', __name__)

@admin_bp.route("/api/admin/dashboard", methods=["GET"])
@admin_required()
def dashboard():
    total_users = mongo.db.users.count_documents({})
    total_predictions = mongo.db.records.count_documents({})
    recent_predictions = list(mongo.db.records.find().sort("timestamp", -1).limit(10))
    for p in recent_predictions: p["_id"] = str(p["_id"])
    
    # Calculate disease spread
    spread = list(mongo.db.records.aggregate([
        {"$group": {"_id": "$disease", "count": {"$sum": 1}}}
    ]))
    
    risked_cases = mongo.db.records.count_documents({"risk_level": {"$in": ["High", "Medium"]}})
    return jsonify({
        "stats": {
            "total_users": total_users,
            "total_predictions": total_predictions,
            "risked_cases": risked_cases,
            "active_nodes": 3
        },
        "recent": recent_predictions,
        "spread": spread
    })

@admin_bp.route("/api/admin/users", methods=["GET"])
@admin_required()
def users():
    query = {}
    search = request.args.get("search", "")
    role = request.args.get("role", "all").lower()
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    if role != "all":
        query["role"] = role
    
    users_list = list(mongo.db.users.find(query, {"password": 0}))
    for u in users_list: u["_id"] = str(u["_id"])
    return jsonify(users_list)
    
@admin_bp.route("/api/admin/users/<user_id>", methods=["PUT"])
@admin_required()
def update_user(user_id):
    from bson.objectid import ObjectId
    data = request.json
    
    update_data = {}
    if "role" in data: update_data["role"] = data["role"]
    if "name" in data: update_data["name"] = data["name"]
    
    if not update_data:
        return jsonify({"error": "No update parameters provided"}), 400
        
    res = mongo.db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    
    if res.matched_count == 0:
        return jsonify({"error": "User node not found"}), 404
        
    return jsonify({"message": f"User node {user_id} updated successfully", "status": "success"})

@admin_bp.route("/api/admin/users/<user_id>", methods=["DELETE"])
@admin_required()
def delete_user(user_id):
    from bson.objectid import ObjectId
    mongo.db.users.delete_one({"_id": ObjectId(user_id)})
    return jsonify({"message": "Node Identity Decommissioned"})

@admin_bp.route("/api/admin/inferences", methods=["GET"])
@admin_required()
def inferences():
    search = request.args.get("search", "")
    disease_q = request.args.get("disease", "all")
    risk_q = request.args.get("risk", "all")
    
    # SYSTEM DIAGNOSTIC LOG (Absolute Path)
    try:
        log_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "debug.log")
        with open(log_file, "a") as f:
            f.write(f"PARAMS_RECV: search={search}, disease={disease_q}, risk={risk_q}\n")
    except: pass

    query = {}
    
    # 1. Broad Search Query (Email/Disease Substring)
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"disease": {"$regex": search, "$options": "i"}}
        ]
        
    # 2. Specific Clinical Filter
    if disease_q and disease_q != "all":
        # Force a case-insensitive regex for the disease field
        query["disease"] = {"$regex": disease_q, "$options": "i"}
        
    # 3. Risk Assessment Filter
    if risk_q and risk_q != "all":
        query["risk_level"] = risk_q
            
    inf_list = list(mongo.db.records.find(query).sort("timestamp", -1))
    for p in inf_list: 
        p["_id"] = str(p["_id"])
        if "timestamp" in p and hasattr(p["timestamp"], "isoformat"):
            p["timestamp"] = p["timestamp"].isoformat()
    return jsonify(inf_list)

@admin_bp.route("/api/admin/notifications", methods=["GET", "POST"])
@admin_required()
def notifications():
    if request.method == "POST":
        data = request.json
        notif = {
            "title": data.get("title", "System Update"),
            "message": data.get("message", ""),
            "type": data.get("type", "info"),
            "timestamp": pd.Timestamp.now().isoformat(),
            "patient": data.get("patient", "Broadcast")
        }
        mongo.db.notifications.insert_one(notif)
        return jsonify({"message": "Announcement broadcasted successfully"}), 201
    
    notifs = list(mongo.db.notifications.find().sort("timestamp", -1))
    for n in notifs: n["_id"] = str(n["_id"])
    return jsonify(notifs)

@admin_bp.route("/api/roles", methods=["GET", "POST"])
@admin_required()
def roles():
    if request.method == "POST":
        data = request.json
        role_name = data.get("name", "").strip().lower()
        if mongo.db.roles.find_one({"name": role_name}): return jsonify({"error": "Role exists"}), 400
        mongo.db.roles.insert_one({"name": role_name, "permissions": data.get("permissions", [])})
        return jsonify({"message": f"Role {role_name} created"}), 201
    
    roles = list(mongo.db.roles.find({}, {'_id': False}))
    return jsonify({"roles": roles})

@admin_bp.route("/api/roles/<role_name>", methods=["PUT", "DELETE"])
@admin_required()
def manage_role(role_name):
    role_name = role_name.lower()
    
    if request.method == "PUT":
        data = request.json
        permissions = data.get("permissions", [])
        result = mongo.db.roles.update_one({"name": role_name}, {"$set": {"permissions": permissions}})
        if result.matched_count == 0:
            return jsonify({"error": "Role not found"}), 404
        return jsonify({"message": f"Role {role_name} updated"}), 200
        
    if request.method == "DELETE":
        if role_name in ['admin', 'patient']:
            return jsonify({"error": "System protected role node cannot be deleted"}), 403
            
        # Downgrade users before deleting role
        mongo.db.users.update_many({"role": role_name}, {"$set": {"role": "patient", "permissions": ["predict"]}})
        result = mongo.db.roles.delete_one({"name": role_name})
        
        if result.deleted_count == 0:
            return jsonify({"error": "Role not found"}), 404
        return jsonify({"message": f"Role {role_name} purged"}), 200
@admin_bp.route("/api/admin/ai-stats", methods=["GET"])
@admin_required()
def ai_stats():
    stats = mongo.db.ai_stats.find_one({"id": "global"}) or {"total": 0, "success": 0, "failed": 0, "last_used": "N/A"}
    if "_id" in stats: stats["_id"] = str(stats["_id"])
    return jsonify(stats)

@admin_bp.route("/api/admin/models", methods=["GET"])
@admin_required()
def get_models():
    # Standard 2026 fleet of free/stable models
    models = [
        {"id": "models/gemini-2.5-flash", "name": "Gemini 2.5 Flash (Ultra Fast)"},
        {"id": "models/gemini-flash-latest", "name": "Gemini Flash (Stable Stable)"},
        {"id": "models/gemini-2.0-flash", "name": "Gemini 2.0 Flash"},
        {"id": "models/gemini-pro-latest", "name": "Gemini Pro (Advanced)"},
        {"id": "models/gemma-3-27b-it", "name": "Gemma 3 (Lightweight)"}
    ]
    settings = mongo.db.settings.find_one({"id": "ai_config"})
    active = settings.get("active_model") if settings else "models/gemini-flash-latest"
    return jsonify({"models": models, "active": active})

@admin_bp.route("/api/admin/active-model", methods=["PUT"])
@admin_required()
def set_active_model():
    data = request.json
    model_id = data.get("model_id")
    if not model_id: return jsonify({"error": "No model specified"}), 400
    
    mongo.db.settings.update_one(
        {"id": "ai_config"}, 
        {"$set": {"active_model": model_id}}, 
        upsert=True
    )
    return jsonify({"message": f"Active AI node switched to {model_id}", "status": "success"})
