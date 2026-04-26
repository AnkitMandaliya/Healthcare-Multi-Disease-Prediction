import pandas as pd
import numpy as np
import joblib
import os
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

def run_evaluation():
    data_path = "data/diabetes.csv"
    model_path = "models/diabetes_model.pkl"
    
    print(f"--- Healthcare Disease Prediction Evaluation ---")
    
    if not os.path.exists(data_path):
        print(f"Error: Dataset {data_path} not found.")
        return

    # Load Data
    df = pd.read_csv(data_path)
    X = df.drop('Outcome', axis=1)
    y = df['Outcome']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

    model = None
    # Try to load existing model
    if os.path.exists(model_path):
        try:
            model = joblib.load(model_path)
            print("Successfully loaded existing model.")
        except Exception as e:
            print(f"Warning: Could not load existing model (likely version mismatch). Retraining...")
    
    # Train if model is missing or failed to load
    if model is None:
        print("Training model...")
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        # Save to fix version mismatch for future use
        os.makedirs("models", exist_ok=True)
        joblib.dump(model, model_path)
        print("Model trained and saved.")

    # Prediction
    y_pred = model.predict(X_test)

    # Metrics
    metrics = {
        "Accuracy":  accuracy_score(y_test, y_pred),
        "Precision": precision_score(y_test, y_pred),
        "Recall":    recall_score(y_test, y_pred),
        "F1-Score":  f1_score(y_test, y_pred)
    }

    # Output
    print("\n[RESULTS]")
    for name, val in metrics.items():
        print(f"{name:<12}: {val:.4f}")

    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    print("-" * 40)

if __name__ == "__main__":
    run_evaluation()
