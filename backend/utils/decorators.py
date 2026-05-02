from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt

def admin_required():
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            from backend.extensions import mongo
            from bson.objectid import ObjectId
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            try:
                user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
                if not user or user.get("role") != "admin":
                    claims = get_jwt()
                    if claims.get("role") != "admin":
                       return jsonify({"error": "Admin access required"}), 403
            except:
                claims = get_jwt()
                if claims.get("role") != "admin":
                   return jsonify({"error": "Invalid secure authorization"}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper
