import os
import sys
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)
from backend.extensions import mongo
from flask import Flask
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['MONGO_URI'] = os.getenv('MONGO_URI')
mongo.init_app(app)

with app.app_context():
    # Update AI config to use a valid model
    res = mongo.db.settings.update_one(
        {"id": "ai_config"},
        {"$set": {"active_model": "gemini-1.5-flash"}},
        upsert=True
    )
    if res.modified_count > 0 or res.upserted_id:
        print("SUCCESS: Database AI configuration updated to 'gemini-1.5-flash'.")
    else:
        print("INFO: Database already configured correctly.")
