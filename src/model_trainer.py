import pandas as pd
import joblib
import os
import shap
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

from src.preprocessing import HealthcarePreprocessor
from src.evaluation import ModelEvaluator

class EnterpriseModelTrainer:
    """
    State-of-the-art ML trainer with SHAP explainability and robust validation.
    """
    def __init__(self):
        self.preprocessor = HealthcarePreprocessor()
        self.evaluator = ModelEvaluator()

    def get_candidate_models(self):
        """Standard algorithms for healthcare benchmarks."""
        return {
            "LogisticRegression": LogisticRegression(max_iter=2000, random_state=42),
            "RandomForest": RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42),
            "XGBoost": XGBClassifier(use_label_encoder=False, eval_metric='logloss', random_state=42)
        }

    def train_disease_model(self, disease_name, data_path, target_col):
        """Enterprise training flow with SHAP and Cross-Validation."""
        print(f"\n[PHASE 1] Data Engineering: {disease_name.upper()}")
        
        # 1. Load & Clean
        df = pd.read_csv(data_path)
        df = self.preprocessor.clean_data(df)
        df = self.preprocessor.encode_categorical(df, disease_name)
        
        # Outlier Handling for numeric metrics
        numeric_cols = df.select_dtypes([np.number]).columns.tolist()
        if target_col in numeric_cols: numeric_cols.remove(target_col)
        df = self.preprocessor.handle_outliers(df, numeric_cols)
        
        X = df.drop(target_col, axis=1)
        y = df[target_col]
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
        
        print(f"[PHASE 2] Model Selection & Cross-Validation")
        candidates = self.get_candidate_models()
        best_f1 = -1
        best_pipeline = None
        best_name = ""
        
        skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        
        for name, model in candidates.items():
            pipeline = Pipeline([
                ('imputer', SimpleImputer(strategy='median')),
                ('scaler', StandardScaler()),
                ('classifier', model)
            ])
            
            # Cross-Validation for robustness
            cv_scores = cross_val_score(pipeline, X_train, y_train, cv=skf, scoring='f1')
            
            pipeline.fit(X_train, y_train)
            y_pred = pipeline.predict(X_test)
            y_prob = pipeline.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else None
            
            metrics = self.evaluator.get_metrics(y_test, y_pred, y_prob)
            print(f"  > {name:<18} | F1-Score: {metrics['f1_score']:.4f} | ROC-AUC: {metrics.get('roc_auc', 0):.4f}")
            
            if metrics['f1_score'] > best_f1:
                best_f1 = metrics['f1_score']
                best_pipeline = pipeline
                best_name = name
                best_metrics = metrics
                best_cv = cv_scores

        print(f"[PHASE 3] Finalizing Winner: {best_name}")
        
        # 2. SHAP Explainability
        print(f"  > Generating SHAP Explainer...")
        try:
            # We use a sample of the training data for the background
            X_transformed = best_pipeline.named_steps['scaler'].transform(
                best_pipeline.named_steps['imputer'].transform(X_train)
            )
            model_final = best_pipeline.named_steps['classifier']
            
            # KernelExplainer is slow but works for all models. 
            # TreeExplainer is fast for RF/XGB.
            if best_name in ["RandomForest", "XGBoost"]:
                explainer = shap.TreeExplainer(model_final)
            else:
                explainer = shap.Explainer(model_final, X_transformed)
                
            joblib.dump(explainer, f"models/{disease_name}_explainer.pkl")
            # Save feature names for UI mapping
            joblib.dump(X.columns.tolist(), f"models/{disease_name}_features.pkl")
        except Exception as e:
            print(f"  ! SHAP generation failed: {e}")
        
        # 3. Persistence & Auditing
        self.evaluator.save_report(disease_name, best_metrics, best_name, best_cv)
        os.makedirs("models", exist_ok=True)
        joblib.dump(best_pipeline, f"models/{disease_name}_model.pkl")
        
if __name__ == "__main__":
    trainer = EnterpriseModelTrainer()
    config = [
        ("diabetes", "data/diabetes.csv", "Outcome"),
        ("heart", "data/heart.csv", "target"),
        ("lung", "data/lung.csv", "LUNG_CANCER")
    ]
    for disease, path, target in config:
        if os.path.exists(path):
            trainer.train_disease_model(disease, path, target)
