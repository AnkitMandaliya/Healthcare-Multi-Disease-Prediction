import os
import time
import json
import socket
import logging
import sys
from datetime import datetime
import google.generativeai as genai
from google.api_core import exceptions
from dotenv import load_dotenv

# --- CONFIGURATION & SECURITY ---
# Masking sensitive keys for logging
def mask_key(key):
    if not key: return "MISSING"
    if len(key) <= 8: return "****"
    return f"{key[:4]}...{key[-4:]}"

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(levelname)s] - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("GeminiValidator")

class GeminiIntegrationTester:
    def __init__(self):
        load_dotenv()
        self.api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.results = {
            "status": "Incomplete",
            "latency_ms": None,
            "models_available": [],
            "connectivity": False,
            "error_details": None,
            "production_readiness": "Unverified"
        }

    def check_network(self):
        """Verify basic internet connectivity to Google APIs."""
        logger.info("Step 1: Checking Network Connectivity...")
        try:
            socket.create_connection(("generativelanguage.googleapis.com", 443), timeout=5)
            self.results["connectivity"] = True
            logger.info("✓ Network Connectivity: OK")
            return True
        except Exception as e:
            self.results["connectivity"] = False
            self.results["error_details"] = f"Network Failure: {str(e)}"
            logger.error(f"✗ Network Connectivity: FAILED - {str(e)}")
            return False

    def validate_api_key(self):
        """Test API key validity and fetch available models."""
        if not self.api_key:
            self.results["status"] = "Invalid"
            self.results["error_details"] = "Missing GEMINI_API_KEY in environment variables."
            logger.error("✗ API Key: MISSING")
            return False

        logger.info(f"Step 2: Validating API Key [{mask_key(self.api_key)}]...")
        genai.configure(api_key=self.api_key)
        
        try:
            # Attempt to list models as a validity check
            models = genai.list_models()
            model_list = [m.name for m in models]
            self.results["models_available"] = model_list
            self.results["status"] = "Valid"
            logger.info(f"✓ API Key Validation: SUCCESS ({len(model_list)} models found)")
            return True
        except exceptions.Unauthenticated:
            self.results["status"] = "Invalid"
            self.results["error_details"] = "401 Unauthenticated: Invalid API Key."
            logger.error("✗ API Key: INVALID (401)")
        except exceptions.PermissionDenied:
            self.results["status"] = "Invalid"
            self.results["error_details"] = "403 Permission Denied: Check API enablement and billing."
            logger.error("✗ API Key: PERMISSION DENIED (403)")
        except exceptions.ResourceExhausted:
            self.results["status"] = "Invalid"
            self.results["error_details"] = "429 Quota Exceeded: Check billing or usage limits."
            logger.error("✗ API Key: QUOTA EXCEEDED (429)")
        except Exception as e:
            self.results["status"] = "Error"
            self.results["error_details"] = f"Unexpected Error: {str(e)}"
            logger.error(f"✗ API Key Validation: FAILED - {str(e)}")
        
        return False

    def test_generation(self, model_name="gemini-2.0-flash"):
        """Test actual content generation stability and latency."""
        # Check if requested model exists, otherwise pick first valid one
        available = self.results["models_available"]
        if f"models/{model_name}" not in available and f"{model_name}" not in available:
            if available:
                # Filter for models that likely support generation
                gen_models = [m for m in available if "flash" in m or "pro" in m]
                model_name = gen_models[0].replace("models/", "") if gen_models else available[0].replace("models/", "")
                logger.warning(f"! Requested model not found. Switching to: {model_name}")
            else:
                logger.error("✗ Generation Test: No models available to test.")
                return False

        logger.info(f"Step 3: Testing Content Generation ({model_name})...")
        
        try:
            model = genai.GenerativeModel(model_name)
            start_time = time.time()
            
            response = model.generate_content(
                "Hello Gemini API. This is a production integration test. Respond with 'ACK: Integration Verified'.",
                generation_config=genai.types.GenerationConfig(
                    candidate_count=1,
                    max_output_tokens=20,
                    temperature=0.1
                )
            )
            
            latency = (time.time() - start_time) * 1000
            self.results["latency_ms"] = round(latency, 2)
            
            if response.text:
                logger.info(f"✓ Generation Test: SUCCESS (Latency: {self.results['latency_ms']}ms)")
                logger.info(f"Response: {response.text.strip()}")
                return True
            else:
                self.results["error_details"] = "Empty response received from API."
                logger.warning("! Generation Test: EMPTY RESPONSE")
                return False

        except exceptions.DeadlineExceeded:
            self.results["error_details"] = "API Timeout: Response took too long."
            logger.error("✗ Generation Test: TIMEOUT")
        except exceptions.InvalidArgument:
            self.results["error_details"] = "Invalid Argument: Model name or prompt issues."
            logger.error(f"✗ Generation Test: INVALID ARGUMENT ({model_name})")
        except Exception as e:
            self.results["error_details"] = f"Generation Error: {str(e)}"
            logger.error(f"✗ Generation Test: FAILED - {str(e)}")
        
        return False

    def finalize_report(self):
        """Print final production readiness report."""
        print("\n" + "="*60)
        print("         GEMINI API INTEGRATION VALIDATION REPORT")
        print("="*60)
        print(f"Timestamp:          {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"API Status:         {self.results['status']}")
        print(f"Connectivity:       {'OK' if self.results['connectivity'] else 'FAILED'}")
        print(f"Avg Latency:        {self.results['latency_ms'] if self.results['latency_ms'] else 'N/A'} ms")
        
        if self.results['status'] == "Valid" and self.results['latency_ms']:
            self.results['production_readiness'] = "READY"
        else:
            self.results['production_readiness'] = "NOT READY"

        print(f"Readiness:          {self.results['production_readiness']}")
        
        if self.results['error_details']:
            print(f"\n[!] Error Details:  {self.results['error_details']}")
            print("\n[Suggested Fixes]:")
            if "401" in self.results['error_details']:
                print("- Verify API Key in .env matches Google AI Studio.")
            elif "403" in self.results['error_details']:
                print("- Ensure 'Generative Language API' is enabled in Google Cloud Console.")
                print("- Check if the project is linked to an active billing account.")
            elif "429" in self.results['error_details']:
                print("- Wait for quota reset or upgrade to a paid tier.")
            elif "Network" in self.results['error_details']:
                print("- Check firewall/proxy settings. Ensure HTTPS outbound is allowed.")
        
        print("\n[Available Models (Sample)]:")
        for m in self.results['models_available'][:5]:
            print(f" - {m}")
        
        print("="*60 + "\n")

if __name__ == "__main__":
    tester = GeminiIntegrationTester()
    if tester.check_network():
        if tester.validate_api_key():
            tester.test_generation()
    
    tester.finalize_report()
