import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")
print(f"Using API Key: {api_key[:10]}...")

client = genai.Client(api_key=api_key)

models_to_try = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest']

for model_name in models_to_try:
    try:
        print(f"Trying model: {model_name}...")
        response = client.models.generate_content(model=model_name, contents="Hello, this is a diagnostic test. Respond with 'System Online'.")
        print(f"SUCCESS with {model_name}: {response.text}")
        break
    except Exception as e:
        print(f"FAILED with {model_name}: {e}")
