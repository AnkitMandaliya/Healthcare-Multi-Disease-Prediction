import os
import time
import socket
import logging
import sys
from datetime import datetime
from google import genai
from google.genai import errors
from dotenv import load_dotenv

# --- SECURITY & LOGGING ---
def mask_key(key):
    if not key: return "MISSING"
    return f"{key[:4]}...{key[-4:]}"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(levelname)s] - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("GeminiValidatorV2")

class GeminiEnterpriseValidator:
    def __init__(self):
        load_dotenv()
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.client = None
        self.results = {
            "status": "Inactive",
            "latency_ms": None,
            "models": [],
            "error": None,
            "readiness": "CRITICAL"
        }

    def run_all_tests(self):
        """Execute the full enterprise validation suite."""
        try:
            # 1. Connectivity
            socket.create_connection(("generativelanguage.googleapis.com", 443), timeout=5)
            logger.info("✓ Connectivity: OK")

            # 2. Authentication
            if not self.api_key:
                raise ValueError("GEMINI_API_KEY not found in .env")
            
            self.client = genai.Client(api_key=self.api_key)
            logger.info(f"✓ SDK Client Initialized [{mask_key(self.api_key)}]")

            # 3. Model Discovery
            models = self.client.models.list()
            self.results["models"] = [m.name for m in models]
            self.results["status"] = "Valid"
            logger.info(f"✓ Model Discovery: {len(self.results['models'])} models available")

            # 4. Stress/Generation Test
            test_model = "gemini-2.0-flash" 
            logger.info(f"Step 4: Testing Generation with {test_model}...")
            
            start = time.time()
            response = self.client.models.generate_content(
                model=test_model,
                contents="Verify production readiness."
            )
            self.results["latency_ms"] = round((time.time() - start) * 1000, 2)
            
            if response.text:
                logger.info(f"✓ Generation: SUCCESS ({self.results['latency_ms']}ms)")
                self.results["readiness"] = "PRODUCTION_READY"
            else:
                self.results["error"] = "Empty response"
                
        except errors.ClientError as e:
            self.results["error"] = f"Client Error: {e.message}"
            if "429" in str(e):
                self.results["error"] = "Quota Exceeded (429) - Free Tier Limit Reached"
            elif "401" in str(e):
                self.results["error"] = "Invalid API Key (401)"
            logger.error(f"✗ Validation Failed: {self.results['error']}")
            
        except Exception as e:
            self.results["error"] = f"Unexpected Error: {str(e)}"
            logger.error(f"✗ Validation Failed: {str(e)}")

        self.print_summary()

    def print_summary(self):
        print("\n" + "="*50)
        print("     GEMINI PRODUCTION VALIDATION SUMMARY")
        print("="*50)
        print(f"Final Status:  {self.results['status']}")
        print(f"Readiness:     {self.results['readiness']}")
        print(f"Latency:       {self.results['latency_ms'] or 'N/A'} ms")
        print(f"Error:         {self.results['error'] or 'None'}")
        print("-" * 50)
        if self.results['readiness'] != "PRODUCTION_READY":
            print("[CRITICAL] Deployment blocked by: " + (self.results['error'] or "Unknown failure"))
        print("="*50 + "\n")

if __name__ == "__main__":
    validator = GeminiEnterpriseValidator()
    validator.run_all_tests()
