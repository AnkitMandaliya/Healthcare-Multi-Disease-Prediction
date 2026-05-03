import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

print("Listing models...")
try:
    for model in client.models.list():
        print(f"Model: {model.name} (Supports generateContent: {'generateContent' in model.supported_generation_methods})")
except Exception as e:
    print(f"Listing failed: {e}")
