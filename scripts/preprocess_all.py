import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
import os

def expert_preprocess(file_path, target_col, output_name):
    print(f"\n--- Preprocessing Node: {file_path} ---")
    
    # 1. Understand Dataset
    df = pd.read_csv(file_path)
    rows, cols = df.shape
    print(f"Structure: {rows} records, {cols} features.")
    print(f"Target Variable Identified: {target_col}")
    
    # Data Types
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(include=['object']).columns.tolist()
    print(f"Numerical: {len(num_cols)}, Categorical: {len(cat_cols)}")

    # 8. Data Cleaning (Inconsistent text) - Run before encoding
    for col in cat_cols:
        df[col] = df[col].astype(str).str.lower().str.strip()
    
    # 2. Handle Missing Values
    missing_pct = (df.isnull().sum() / len(df)) * 100
    print("Missing Node Integrity Percentages:")
    print(missing_pct[missing_pct > 0] if any(missing_pct > 0) else "Clinical data integrity 100% (No missing values).")
    
    for col in df.columns:
        if df[col].isnull().any():
            if col in num_cols:
                df[col] = df[col].fillna(df[col].mean())
            else:
                df[col] = df[col].fillna(df[col].mode()[0])

    # 3. Remove Duplicates
    dup_count = df.duplicated().sum()
    if dup_count > 0:
        print(f"Duplicate Registry Entries Found: {dup_count}. Initializing Purge.")
        df = df.drop_duplicates()
    else:
        print("No duplicate node entries identified.")

    # 4. Handle Outliers (IQR Capping)
    print("Executing IQR Outlier Suppression Protocol...")
    for col in num_cols:
        if col == target_col: continue
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        
        # Capping instead of dropping to preserve sample size
        df[col] = np.clip(df[col], lower_bound, upper_bound)

    # 5. Encode Categorical Variables
    print("Encoding multi-dimensional categorical features...")
    le = LabelEncoder()
    # Separate binary and non-binary for encoding strategy
    for col in cat_cols:
        if col == target_col: continue
        if df[col].nunique() <= 2:
            df[col] = le.fit_transform(df[col])
        else:
            df = pd.get_dummies(df, columns=[col], prefix=[col], drop_first=True)

    # Encode binary target if it's categorical (e.g. LUNG_CANCER 'YES'/'NO')
    if df[target_col].dtype == 'object':
        df[target_col] = le.fit_transform(df[target_col])

    # 6. Feature Engineering (Simplified Age Grouping)
    if 'Age' in df.columns:
        df['Age_Scale'] = pd.cut(df['Age'], bins=[0, 30, 50, 100], labels=[0, 1, 2]).astype(int)
    elif 'AGE' in df.columns:
        df['Age_Scale'] = pd.cut(df['AGE'], bins=[0, 30, 50, 100], labels=[0, 1, 2]).astype(int)

    # 7. Feature Scaling
    print("Applying Neural Feature Scaling (Standardization)...")
    scaler = StandardScaler()
    X = df.drop(target_col, axis=1)
    y = df[target_col]
    
    X_cols = X.columns
    X_scaled = scaler.fit_transform(X)
    X = pd.DataFrame(X_scaled, columns=X_cols)

    # 9. Split Dataset (80/20)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"Dataset Split successful: Train({len(X_train)}), Test({len(X_test)})")

    # 10. Output
    output_dir = "data/processed"
    if not os.path.exists(output_dir): os.makedirs(output_dir)
    
    X_train.to_csv(f"{output_dir}/X_train_{output_name}.csv", index=False)
    X_test.to_csv(f"{output_dir}/X_test_{output_name}.csv", index=False)
    y_train.to_csv(f"{output_dir}/y_train_{output_name}.csv", index=False)
    y_test.to_csv(f"{output_dir}/y_test_{output_name}.csv", index=False)
    
    print(f"Node '{output_name}' finalized. Processed shards saved to {output_dir}/")
    return {
        "dataset": output_name,
        "rows": rows,
        "features": len(X_cols),
        "target": target_col,
        "missing_cleaned": any(missing_pct > 0),
        "duplicates_removed": dup_count
    }

# Execution
try:
    results = []
    # Diabetes
    results.append(expert_preprocess('data/diabetes.csv', 'Outcome', 'diabetes'))
    # Heart
    results.append(expert_preprocess('data/heart.csv', 'target', 'heart'))
    # Lung
    results.append(expert_preprocess('data/lung.csv', 'LUNG_CANCER', 'lung'))
    
    print("\n\n" + "="*50)
    print("EXECUTIVE SUMMARY: Clinical Data Preprocessing Completed")
    print("="*50)
    for res in results:
        print(f"System: {res['dataset'].upper()}")
        print(f"  - Initial Records: {res['rows']}")
        print(f"  - Final Neural Dimensions: {res['features']}")
        print(f"  - Cleaned Duplicates/Missing: {res['duplicates_removed']}/{res['missing_cleaned']}")
    print("="*50)
except Exception as e:
    print(f"Pre-inference node crash: {str(e)}")
