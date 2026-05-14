import os
from dotenv import load_dotenv

load_dotenv()

key = os.environ.get("GEMINI_API_KEY")
if key:
    print(f"Key found: {key[:4]}...{key[-4:]}")
else:
    print("Key NOT found in environment.")
