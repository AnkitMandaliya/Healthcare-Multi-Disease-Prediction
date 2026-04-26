import pandas as pd
import joblib
import os
from sklearn.metrics import f1_score, roc_auc_score, accuracy_score
from sklearn.model_selection import train_test_split

def get_full_report():
    models_info = [
        ("Diabetes", "data/diabetes.csv", "models/diabetes_model.pkl", "Outcome"),
        ("Heart", "data/heart.csv", "models/heart_model.pkl", "target"),
        ("Lung Cancer", "data/lung.csv", "models/lung_model.pkl", "LUNG_CANCER")
    ]
    
    print("--- MULTI-DISEASE PERFORMANCE AUDIT ---")
    
    for name, data_path, model_path, target in models_info:
        if not os.path.exists(data_path) or not os.path.exists(model_path):
            continue
            
        df = pd.read_csv(data_path)
        # Quick preprocessing for Lung (it uses strings)
        if name == "Lung Cancer":
            df[target] = df[target].map({'YES': 1, 'NO': 0})
            
        X = df.drop(target, axis=1)
        y = df[target]
        
        # Test split consistent with training
        _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
        
        model = joblib.load(model_path)
        
        try:
            # Check if model expect transformed features (from my optimization)
            if hasattr(model, 'feature_names_in_'):
                # Handle the case where some features were added (like BMI_Age)
                expected_features = model.feature_names_in_
                if "BMI_Age" in expected_features and "BMI_Age" not in X_test.columns:
                    X_test['BMI_Age'] = X_test['BMI'] * X_test['Age']
                if "Glucose_Insulin" in expected_features and "Glucose_Insulin" not in X_test.columns:
                    X_test['Glucose_Insulin'] = X_test['Glucose'] * X_test['Insulin']
                
                # Filter/Order columns to match training
                X_test = X_test[expected_features]
            
            y_pred = model.predict(X_test)
            y_prob = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else y_pred
            
            f1 = f1_score(y_test, y_pred, average='binary', zero_division=0)
            auc = roc_auc_score(y_test, y_prob)
            acc = accuracy_score(y_test, y_pred)
            
            print(f"[{name}] Acc: {acc:.2f} | F1: {f1:.2f} | AUC: {auc:.2f}")
        except Exception as e:
            print(f"[{name}] Error: {e}")

if __name__ == "__main__":
    get_full_report()
