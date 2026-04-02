import os
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

# Load local environment state
load_dotenv()

def test_full_cycle():
    # 1. RETRIEVE CONFIG
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
    api_key = os.getenv('CLOUDINARY_API_KEY')
    api_secret = os.getenv('CLOUDINARY_API_SECRET')

    if not cloud_name or 'your_cloud_name' in cloud_name:
        print("\n[ALERT] CLOUDINARY CONFIGURATION MISSING!")
        print("Please update your .env file with actual credentials.")
        return

    print(f"\n[SECUR-NODE] TESTING CLOUDINARY CONNECTIVITY")
    print(f"[CONFIG] CLOUD_NAME: {cloud_name}")

    # 2. CREATE LOCAL DUMMY IMAGE
    local_filename = "test_diagnostic_unit.txt"
    with open(local_filename, "w") as f:
        f.write("DUMMY IMAGE DATA FOR DIAGNOSTIC TESTING")
    # Rename to .png to trick Cloudinary for a simple text upload test (Cloudinary handles many types)
    final_local = "test_image.png"
    if os.path.exists(final_local): os.remove(final_local)
    os.rename(local_filename, final_local)
    
    print(f"[PROCESS] Created local test node: {final_local}")

    try:
        # 2. CONFIGURE NODE
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret
        )

        # 3. UPLOAD TO CLOUDINARY
        print("[PROCESS] Dispatching local node to Cloudinary...")
        res = cloudinary.uploader.upload(final_local, folder="healthai_tests")

        if res.get("secure_url"):
            print(f"[SUCCESS] Cloudinary verification complete! URL: {res.get('secure_url')}")
            
            # 4. REMOVE LOCAL IF SUCCESSFUL
            print("[CLEANUP] Removing local source node as requested...")
            os.remove(final_local)
            print("[DONE] Local node purged. System is cloud-native.")
        else:
            print("[FAILURE] Dispatch failed. Unknown internal error.")

    except Exception as e:
        print(f"\n[FAILURE] Cloudinary node refused connection: {str(e)}")
        print("Check if your API_KEY/SECRET is valid and active.")
        if os.path.exists(final_local):
            print("[INFO] Local node preserved for manual inspection due to failure.")

if __name__ == "__main__":
    test_full_cycle()
