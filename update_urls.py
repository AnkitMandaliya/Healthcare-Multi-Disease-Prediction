import os

api_url = 'https://healthcare-multi-disease-prediction.onrender.com'

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = False
    if "fetch('/api/" in content:
        content = content.replace("fetch('/api/", f"fetch('{api_url}/api/")
        modified = True
    if "fetch(`/api/" in content:
        content = content.replace("fetch(`/api/", f"fetch(`{api_url}/api/")
        modified = True
        
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {filepath}')

for root, _, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            update_file(os.path.join(root, file))
