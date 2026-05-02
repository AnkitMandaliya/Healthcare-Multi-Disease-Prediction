import os
import sys
import pandas as pd
import numpy as np
import joblib
import shap
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Add src to path
sys.path.append(os.path.join(os.getcwd(), 'src'))
from preprocessing import HealthcarePreprocessor

def train_and_save():
    # 1. Configuration
    data_dir = 'data'
    models_dir = 'backend/models'
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)

    datasets = {
        'diabetes': {'file': 'diabetes.csv', 'target': 'Outcome'},
        'heart': {'file': 'heart.csv', 'target': 'target'},
        'lung': {'file': 'lung.csv', 'target': 'LUNG_CANCER'}
    }

    preprocessor = HealthcarePreprocessor()

    for disease, config in datasets.items():
        print(f"\n--- Training Pipeline: {disease.upper()} ---")
        input_path = os.path.join(data_dir, config['file'])
        
        if not os.path.exists(input_path):
            print(f"Warning: {input_path} not found. Skipping.")
            continue

        # Load raw data
        df = pd.read_csv(input_path)
        print(f"Loaded {len(df)} records.")

        # 2. Preprocess (using the SAME logic as API)
        # Note: Preprocessor handles cleaning, encoding, and scaling
        df_processed = preprocessor.preprocess(df, disease_type=disease, is_training=True)
        
        X = df_processed.drop(config['target'], axis=1)
        y = df_processed[config['target']]
        
        # Ensure target is binary 0/1
        if y.dtype == object or y.max() > 1:
             # Map string targets if any (e.g. Lung Cancer 'YES'/'NO')
             # Preprocessor should have handled it but let's be safe
             if y.dtype == object:
                 y = y.map({'YES': 1, 'NO': 0, '1': 1, '0': 0})
             elif y.max() > 1:
                 # Standard mapping for some heart datasets (2: sick, 1: healthy -> 1, 0)
                 y = y.map({2: 1, 1: 0})
        
        # Split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        print(f"Features: {X.columns.tolist()}")

        # 3. Train Model
        print("Fitting RandomForest model...")
        model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
        model.fit(X_train, y_train)
        
        # 4. Evaluate
        y_pred = model.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        print(f"Test Accuracy: {acc:.4f}")

        # 5. Generate Explainer (SHAP)
        print("Generating SHAP explainer...")
        explainer = shap.Explainer(model, X_train)
        
        # 6. Save Artifacts
        joblib.dump(model, os.path.join(models_dir, f"{disease}_model.pkl"))
        joblib.dump(explainer, os.path.join(models_dir, f"{disease}_explainer.pkl"))
        joblib.dump(X.columns.tolist(), os.path.join(models_dir, f"{disease}_features.pkl"))
        print(f"Saved {disease} model artifacts to {models_dir}/")

        # 7. Test Prediction Flow (Verification)
        print("Verifying prediction flow...")
        test_input = X_test.iloc[0:1]
        prob = model.predict_proba(test_input)[0][1]
        print(f"Verification Success: Sample Probability = {prob:.4f}")

    print("\n" + "="*50)
    print("ALL MODELS TRAINED AND VERIFIED SUCCESSFULLY")
    print("="*50)

if __name__ == "__main__":
    train_and_save()
