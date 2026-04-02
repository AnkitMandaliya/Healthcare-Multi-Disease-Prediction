import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

def test_gemini():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("MISSING API KEY")
        return

    genai.configure(api_key=api_key)
    
    # Try different model identifiers
    models_to_test = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b',
        'gemini-1.0-pro'
    ]

    for model_name in models_to_test:
        print(f"\n[TESTING] Model: {model_name}")
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Hello, this is a diagnostic test. Reply with 'ACK'.")
            print(f"[SUCCESS] {model_name} responded: {response.text}")
        except Exception as e:
            print(f"[FAILURE] {model_name} failed: {str(e)}")

if __name__ == "__main__":
    test_gemini()
