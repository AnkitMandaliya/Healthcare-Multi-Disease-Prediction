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
    user = mongo.db.users.find_one({'email': 'testdoctor@example.com'})
    if user:
        otp_record = mongo.db.otps.find_one({'uid': str(user['_id'])})
        if otp_record:
            print(f"OTP FOUND: {otp_record['otp']}")
        else:
            print("OTP NOT FOUND")
    else:
        print("USER NOT FOUND")
