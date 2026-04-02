import os
from twilio.rest import Client
from dotenv import load_dotenv

# Load clinical environment
load_dotenv()

def test_sms_dispatch():
    # --- 1. CONFIG RETRIEVAL ---
    account_sid = os.getenv('TWILIO_ACCOUNT_SID')
    auth_token = os.getenv('TWILIO_AUTH_TOKEN')
    from_number = os.getenv('TWILIO_PHONE_NUMBER')
    
    # Target Mobile Terminal
    target_phone = "+916354578639" # Enforcing country code for India
    
    print(f"\n[SECUR-NODE] SMS PROTOCOL INITIALIZED")
    print(f"[CONFIG] TARGET: {target_phone}")
    print(f"[CONFIG] TWILIO_SENDER: {from_number}")
    
    if not account_sid or not auth_token or not from_number:
        print("\n[ALERT] TWILIO CONFIGURATION INCOMPLETE!")
        print("Please ensure SID, Token, and Phone are set in .env.")
        return

    # --- 2. TOKEN GENERATION (Simple for test) ---
    otp = "SECURITY-CHECK-999"
    print(f"[TOKEN] TEST MESSAGE READY: {otp}")

    # --- 3. TWILIO DISPATCH ---
    try:
        print("[DISPATCH] Establishing connection to Twilio Gateway...")
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=f"HealthAI: Secure identity token initialized. Verification code: {otp}",
            from_=from_number,
            to=target_phone
        )
        print(f"[SUCCESS] SMS dispatched. Message SID: {message.sid}")
        print("Please verify the mobile terminal for receipt.")
            
    except Exception as e:
        print(f"\n[FAILURE] SMS dispatch failed: {str(e)}")
        print("Tip: Ensure the target number is 'verified' in Twilio if using a trial account.")

if __name__ == "__main__":
    test_sms_dispatch()
