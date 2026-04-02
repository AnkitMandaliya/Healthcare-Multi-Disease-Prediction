from pymongo import MongoClient
from datetime import datetime, time
import os

# Connect to database
client = MongoClient('mongodb://localhost:27017/')
db = client['healthai']

def check_local_ai_usage():
    print("\n[SECUR-LOG] CALCULATING LOCAL AI USAGE UNITS")
    
    # Define start of today
    start_of_day = datetime.combine(datetime.now(), time.min)
    
    # 1. Successful Records in Database
    count = db.records.count_documents({"timestamp": {"$gte": start_of_day}})
    
    # 2. Total Records for all time
    total = db.records.count_documents({})
    
    print(f"[METRIC] Total AI generation units used locally today: {count}")
    print(f"[METRIC] Overall historical diagnostic units: {total}")
    
    if count > 10:
        print("[ADVISORY] Local usage is high. You might have hit the Google Free Tier RPM limit.")
    else:
        print("[ADVISORY] Local usage is low. If you have 429 errors, it's likely a Google-side global quota reset issue.")

if __name__ == "__main__":
    check_local_ai_usage()
