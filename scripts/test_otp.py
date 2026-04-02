import os
import smtplib
import pyotp
from email.message import EmailMessage
from dotenv import load_dotenv

# Load clinical environment
load_dotenv()

def test_secure_dispatch():
    # --- 1. CONFIG RETRIEVAL ---
    mail_user = os.getenv("MAIL_USERNAME")
    mail_pass = os.getenv("MAIL_PASSWORD")
    mail_sender = os.getenv("MAIL_DEFAULT_SENDER", mail_user)
    
    # Target Identity Node
    target_email = "mandaliyaankit1@gmail.com"
    
    print(f"\n[SECUR-NODE] SECURITY PROTOCOL INITIALIZED")
    print(f"[CONFIG] TARGET: {target_email}")
    print(f"[CONFIG] SMTP_NODE: {mail_user}")
    
    if not mail_pass or mail_pass == "YOUR_GMAIL_APP_PASSWORD":
        print("\n[ALERT] GMAIL APP PASSWORD MISSING!")
        print("Please set your 16-character App Password in the .env file.")
        print("Tutorial: https://support.google.com/accounts/answer/185833\n")
        return

    # --- 2. TOKEN GENERATION (PYOTP) ---
    # Using 6-digit TOTP for clinical verification
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    otp = totp.now()
    print(f"[TOKEN] OTP GENERATED: {otp}")

    # --- 3. SMTP DISPATCH ---
    try:
        msg = EmailMessage()
        msg['Subject'] = "HealthAI Security Recovery Protocol"
        msg['From'] = mail_sender
        msg['To'] = target_email
        msg.set_content(f"""
SECURITY ALERT: CLINICAL NODE RECOVERY

A recovery protocol has been authorized for your HealthAI node.
Your Identity Verification Code (OTP) is: {otp}

This token is active for the next clinical session (10 minutes).
If you did not authorize this node relocation, please secure your credentials.

-- HealthAI Secure Infrastructure
""")

        print("[DISPATCH] Establishing SMTP connection...")
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(mail_user, mail_pass)
            server.send_message(msg)
            print("[SUCCESS] OTP dispatched to clinical hub. Please verify your inbox.")
            
    except Exception as e:
        print(f"\n[FAILURE] SMTP dispatch failed: {str(e)}")
        print("Ensure 'Less Secure Apps' is off and you are using an 'App Password'.")

if __name__ == "__main__":
    test_secure_dispatch()
