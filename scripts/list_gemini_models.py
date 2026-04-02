import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

def list_gemini_models():
    api_key = os.getenv("GEMINI_API_KEY")
    genai.configure(api_key=api_key)
    
    print("\n[LISTING] Available Models for this Key:")
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"- {m.name} ({m.display_name})")
    except Exception as e:
        print(f"[FAILURE] ListModels failed: {str(e)}")

if __name__ == "__main__":
    list_gemini_models()
