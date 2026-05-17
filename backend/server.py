
import os
import sys
import logging
from datetime import timedelta
from dotenv import load_dotenv
import pandas as pd
import re
import traceback
from werkzeug.exceptions import HTTPException

# Load environment variables
load_dotenv()

import socket
socket.setdefaulttimeout(10) # 10 second limit for all network calls (including Email)
logging_format = "%(asctime)s %(levelname)s [%(name)s] %(message)s"
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format=logging_format)

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
app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL', 'False') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')
app.config['MAIL_TIMEOUT'] = int(os.getenv('MAIL_TIMEOUT', 10))

CORS(app, supports_credentials=True, resources={r"/*": {
    "origins": [
        re.compile(r"https?://.*\.onrender\.com"),
        "http://localhost:5173", 
        "http://127.0.0.1:5173"
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
    # Ensure performance and security indexes
    try:
        # User security
        # Drop old single unique indexes if they exist to allow the new compound rule
        try:
            mongo.db.users.drop_index("email_1")
            mongo.db.users.drop_index("phone_1")
        except Exception:
            pass # Indexes might not exist or already dropped

        # Create compound unique index for the combination of email and phone
        mongo.db.users.create_index([("email", 1), ("phone", 1)], unique=True, sparse=True)
        
        # Predictive records performance
        mongo.db.records.create_index([("email", 1), ("timestamp", -1)])
        mongo.db.records.create_index([("disease", 1), ("timestamp", -1)])
        mongo.db.records.create_index("risk_level")
        
        # Notification throughput
        mongo.db.notifications.create_index([("patient", 1), ("timestamp", -1)])
    except Exception as e:
        print("Note: Index creation status:", e)

print("Checking MongoDB connection and database registry...")
with app.app_context():
    try:
        seed_db()
        print("Database registry check complete.")
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
        "GMAIL_APP_SCRIPT_URL": "Set" if os.getenv("GMAIL_APP_SCRIPT_URL") else "Missing",
        "JWT_SECRET": "Set" if os.getenv("JWT_SECRET") else "Missing"
    }


    return jsonify({
        "status": "online",
        "timestamp": pd.Timestamp.now().isoformat(),
        "database": db_status,
        "environment": env_vars,
        "models_loaded": list(model_manager.models.keys())
    })

# ❌ Removed frontend static serving routes (IMPORTANT FIX)

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

# --- RUN LOCAL ---
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
