import os
import sys
import subprocess
import glob

def check_python_files():
    print("\n--- CHECKING PYTHON INTEGRITY ---")
    py_files = glob.glob("**/*.py", recursive=True)
    if not py_files:
        print("No Python files found.")
        return False
    
    success_count = 0
    fail_count = 0
    for file in py_files:
        if "venv" in file or ".gemini" in file:
            continue
        try:
            # Use py_compile to check syntax without running
            import py_compile
            py_compile.compile(file, doraise=True)
            success_count += 1
        except Exception as e:
            print(f"Error in {file}: {e}")
            fail_count += 1
    
    print(f"Results: {success_count} files OK, {fail_count} files with errors.")
    return fail_count == 0

def check_frontend():
    print("\n--- CHECKING FRONTEND INTEGRITY ---")
    frontend_dir = "frontend"
    if not os.path.exists(frontend_dir):
        print("Frontend directory not found.")
        return False
    
    package_json = os.path.join(frontend_dir, "package.json")
    if not os.path.exists(package_json):
        print("package.json not found in frontend/.")
        return False
    
    print("Detected package.json. Checking scripts...")
    # Read package.json and see if dev/build exist
    with open(package_json, 'r') as f:
        import json
        data = json.load(f)
        scripts = data.get("scripts", {})
        if "dev" in scripts and "build" in scripts:
            print("Frontend scripts 'dev' and 'build' found.")
            return True
        else:
            print("Frontend missing 'dev' or 'build' scripts.")
            return False

def check_models():
    print("\n--- CHECKING AI MODELS ---")
    models_dir = "models"
    if not os.path.exists(models_dir):
        print("Models directory not found.")
        return False
    
    required_models = ["diabetes_model.pkl", "heart_model.pkl", "lung_model.pkl"]
    missing = [m for m in required_models if not os.path.exists(os.path.join(models_dir, m))]
    
    if not missing:
        print("All required prediction models are present.")
        return True
    else:
        print(f"Missing models: {missing}")
        return False

def main():
    print("="*40)
    print("HEALTHCARE PLATFORM: COMPONENT VALIDATION")
    print("="*40)
    
    py_ok = check_python_files()
    front_ok = check_frontend()
    models_ok = check_models()
    
    print("\n" + "="*40)
    if py_ok and front_ok and models_ok:
        print("RESULT: ALL SYSTEMS VERIFIED.")
    else:
        print("RESULT: SOME COMPONENTS HAVE ISSUES. PLEASE CHECK ABOVE LOGS.")
    print("="*40)

if __name__ == "__main__":
    main()
