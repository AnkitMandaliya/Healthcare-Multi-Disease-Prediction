import os
from google import genai
from dotenv import load_dotenv
import sys

# Set encoding to UTF-8 for Windows terminal compatibility
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Load environment variables from .env file
load_dotenv()

def test_specific_model():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY not found in .env file.")
        return

    print(f"Testing API Key: {api_key[:5]}...{api_key[-5:]}")
    
    try:
        client = genai.Client(api_key=api_key)
        
        # Try a model from the list we just got
        test_model = "gemini-2.0-flash"
        print(f"Trying model: {test_model}")
        
        response = client.models.generate_content(
            model=test_model,
            contents="Hello, are you working? Respond with a short confirmation."
        )
        print("\nSUCCESS: API Key is WORKING!")
        print(f"Model used: {test_model}")
        print(f"Response from Gemini: {response.text}")
        
    except Exception as e:
        print("\nFAILURE: API Key TEST FAILED!")
        print(f"Error details: {str(e)}")

if __name__ == "__main__":
    test_specific_model()
