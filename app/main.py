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
from app.extensions import mongo, bcrypt, jwt, mail

# --- CORE INITIALIZATION ---
app = Flask(__name__, static_folder="../frontend/dist", static_url_path="/")
app.config["MONGO_URI"] = os.environ.get("MONGO_URI", "mongodb://localhost:27017/healthai")
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET", "super-enterprise-secret-v3-enterprise-deployment-2026") # 48 chars for security
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

# Communication Config (OTP/Alerts)
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

CORS(app)
mongo.init_app(app)
jwt.init_app(app)
bcrypt.init_app(app)
mail.init_app(app)

# --- MVC COMPONENT INITIALIZATION ---
from app.controllers import model_manager, prediction_ctrl

# --- BLUEPRINT REGISTRATION ---
# Important: Import routes AFTER initializing components they depend on
from app.routes.auth_routes import auth_bp
from app.routes.prediction_routes import predict_bp
from app.routes.admin_routes import admin_bp
from app.routes.user_routes import user_bp

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

with app.app_context():
    seed_db()

# --- STATIC CONTENT & ERROR HANDLING ---
@app.route("/")
def serve():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/api/uploads/<filename>")
def get_upload(filename):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    return send_from_directory(os.path.join(base_dir, "static", "uploads"), filename)

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, "index.html")

@app.route("/api/health")
def health_check():
    return jsonify({
        "status": "online",
        "timestamp": pd.Timestamp.now().isoformat(),
        "models_loaded": list(model_manager.models.keys())
    })

@app.route("/<path:path>")
def catch_all(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
