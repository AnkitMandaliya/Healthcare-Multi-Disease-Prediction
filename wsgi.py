import os
import sys
from app.main import app
from waitress import serve

if __name__ == "__main__":
    # Ensure BASE_DIR is in sys.path
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    sys.path.append(BASE_DIR)
    
    port = int(os.environ.get("PORT", 5000))
    print(f"[*] Starting HealthAI Production Dispatcher on port {port}...")
    serve(app, host='0.0.0.0', port=port, threads=4)
