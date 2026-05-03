
import os
import sys
from datetime import timedelta
from dotenv import load_dotenv
import pandas as pd

# Load environment variables
load_dotenv()

# Project path configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from backend.extensions import mongo, bcrypt, jwt, mail

# --- CORE INITIALIZATION ---
# ❌ Removed static_folder (IMPORTANT FIX)
app = Flask(__name__)

app.config["MONGO_URI"] = os.environ.get("MONGO_URI", "mongodb://localhost:27017/healthai")
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET", "super-enterprise-secret-v3-enterprise-deployment-2026")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

# Communication Config (OTP/Alerts)
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

CORS(app, supports_credentials=True, resources={r"/*": {
    "origins": [
        "http://localhost:5173", 
        "http://127.0.0.1:5173", 
        "https://healthcare-multi-disease-prediction.onrender.com",
        "https://healthcare-multi-disease-prediction-frontend.onrender.com"
    ]
}})
mongo.init_app(app)
jwt.init_app(app)

@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    from bson.objectid import ObjectId
    try:
        user = mongo.db.users.find_one({"_id": ObjectId(jwt_data["sub"])})
        return user
    except:
        return None

bcrypt.init_app(app)
mail.init_app(app)

# --- MVC COMPONENT INITIALIZATION ---
from backend.controllers import model_manager, prediction_ctrl

# --- BLUEPRINT REGISTRATION ---
from backend.routes.auth_routes import auth_bp
from backend.routes.prediction_routes import predict_bp
from backend.routes.admin_routes import admin_bp
from backend.routes.user_routes import user_bp

app.register_blueprint(auth_bp)
app.register_blueprint(predict_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(user_bp)

# --- DB SEEDING ---
def seed_db():
    if mongo.db.roles.count_documents({}) == 0:
        mongo.db.roles.insert_many([
            {"name": "admin", "permissions": ["predict", "manage_roles", "view_stats"]},
            {"name": "doctor", "permissions": ["predict", "view_stats"]},
            {"name": "patient", "permissions": []}
        ])
        from bson.objectid import ObjectId
        mongo.db.users.replace_one(
            {"email": "admin@healthai.com"},
            {
                "_id": ObjectId("69bf8e411bf0dc1731c11b9c"),
                "name": "System Admin 1",
                "email": "admin@healthai.com",
                "password": "$2b$12$INOTlCslJdNRFMUs4BCgguXavgC8f/.G.VYD449E7wLap1cdOFUoa",
                "role": "admin",
                "avatar": "/api/uploads/avatar_69bf8e411bf0dc1731c11b9c.png",
                "bio": "Expert system architect overseeing global clinical nodes and AI predictive infrastructure.",
                "location": "Central Intelligence Hub",
                "phone": "+916354578639",
                "specialization": "Clinical AI Architect",
                "department": "Systems Management Unit",
                "medical_degree": "Ph.D. Neural Intelligence",
                "experience": "12+ Years"
            },
            upsert=True
        )

print("Checking MongoDB connection and seeding database...")
with app.app_context():
    try:
        seed_db()
        print("DB check/seeding complete.")
    except Exception as e:
        print("DB connection failed:", e)

# --- BASIC ROUTES (IMPORTANT FIX) ---
@app.route("/")
def home():
    return "Backend is running successfully 🚀"

@app.route("/api/uploads/<filename>")
def get_upload(filename):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    return send_from_directory(os.path.join(base_dir, "static", "uploads"), filename)

@app.route("/api/health")
def health_check():
    db_status = "unknown"
    try:
        mongo.db.command("ping")
        db_status = "connected"
    except Exception as e:
        db_status = f"failed: {str(e)}"

    env_vars = {
        "MONGO_URI": "Set" if os.getenv("MONGO_URI") else "Missing",
        "MAIL_USERNAME": "Set" if os.getenv("MAIL_USERNAME") else "Missing",
        "MAIL_PASSWORD": "Set" if os.getenv("MAIL_PASSWORD") else "Missing",
        "JWT_SECRET": "Set" if os.getenv("JWT_SECRET") else "Missing",
        "TWILIO_ACCOUNT_SID": "Set" if os.getenv("TWILIO_ACCOUNT_SID") else "Missing"
    }

    return jsonify({
        "status": "online",
        "timestamp": pd.Timestamp.now().isoformat(),
        "database": db_status,
        "environment": env_vars,
        "models_loaded": list(model_manager.models.keys())
    })

# ❌ Removed frontend static serving routes (IMPORTANT FIX)

import traceback
from werkzeug.exceptions import HTTPException

@app.errorhandler(Exception)
def handle_exception(e):
    if isinstance(e, HTTPException):
        return e
    print(f"Unhandled Exception: {str(e)}")
    print(traceback.format_exc())
    return jsonify({
        "error": str(e),
        "type": type(e).__name__,
        "traceback": traceback.format_exc() if os.environ.get("DEBUG_MODE") == "True" else "Check server logs"
    }), 500

# --- RUN LOCAL (NOT USED IN RENDER BUT SAFE) ---
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)