import pandas as pd
import numpy as np
import joblib
import os
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline

def find_best_model():
    data_path = "data/diabetes.csv"
    
    if not os.path.exists(data_path):
        return

    df = pd.read_csv(data_path)
    
    # Preprocessing: Handle zeros
    zero_cols = ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI']
    for col in zero_cols:
        df[col] = df[col].replace(0, np.nan)
        
    X = df.drop('Outcome', axis=1)
    y = df['Outcome']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

    models = [
        ('RF', RandomForestClassifier(random_state=42), {
            'model__n_estimators': [100, 300],
            'model__max_depth': [None, 5, 10],
            'model__class_weight': ['balanced', None]
        }),
        ('GB', GradientBoostingClassifier(random_state=42), {
            'model__n_estimators': [100, 200],
            'model__learning_rate': [0.05, 0.1],
            'model__max_depth': [3, 5]
        }),
        ('LR', LogisticRegression(max_iter=1000, random_state=42), {
            'model__C': [0.1, 1, 10]
        })
    ]

    best_overall_score = 0
    best_overall_model = None
    best_model_name = ""

    for name, model, params in models:
        pipe = Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler()),
            ('model', model)
        ])
        
        grid = GridSearchCV(pipe, params, cv=5, scoring='accuracy', n_jobs=-1)
        grid.fit(X_train, y_train)
        
        score = grid.score(X_test, y_test)
        print(f"{name} best accuracy: {score:.4f}")
        
        if score > best_overall_score:
            best_overall_score = score
            best_overall_model = grid.best_estimator_
            best_model_name = name

    print(f"\nWinner: {best_model_name} with Accuracy {best_overall_score:.4f}")
    
    # Save the winner
    joblib.dump(best_overall_model, "models/diabetes_model.pkl")
    joblib.dump(X.columns.tolist(), "models/diabetes_features.pkl")

if __name__ == "__main__":
    find_best_model()
