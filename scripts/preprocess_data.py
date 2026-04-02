import os
import pandas as pd
import sys

# Add src to path
sys.path.append(os.path.join(os.getcwd(), 'src'))

from preprocessing import HealthcarePreprocessor

def preprocess_all_data():
    """
    Loads raw data, applies preprocessing, and saves to processed directory.
    """
    data_dir = 'data'
    output_dir = os.path.join(data_dir, 'processed')
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created directory: {output_dir}")

    preprocessor = HealthcarePreprocessor()
    
    datasets = {
        'diabetes': 'diabetes.csv',
        'heart': 'heart.csv',
        'lung': 'lung.csv'
    }

    for disease, filename in datasets.items():
        input_path = os.path.join(data_dir, filename)
        output_path = os.path.join(output_dir, filename)
        
        if not os.path.exists(input_path):
            print(f"Warning: {input_path} not found. Skipping.")
            continue

        print(f"\n--- Processing {disease.upper()} ---")
        df = pd.read_csv(input_path)
        print(f"Initial shape: {df.shape}")
        
        # 1. Cleaning
        df_cleaned = preprocessor.clean_data(df, disease_type=disease)
        print(f"Shape after cleaning: {df_cleaned.shape}")
        
        # 2. Encoding
        df_encoded = preprocessor.encode_categorical(df_cleaned, disease_type=disease)
        print(f"Shape after encoding: {df_encoded.shape}")
        
        # 3. Handle Outliers (Optional - applying to numeric columns)
        numeric_cols = df_encoded.select_dtypes(['number']).columns.tolist()
        # Exclude target columns or binary columns if known
        if 'Outcome' in numeric_cols: numeric_cols.remove('Outcome')
        if 'target' in numeric_cols: numeric_cols.remove('target')
        if 'LUNG_CANCER' in numeric_cols: numeric_cols.remove('LUNG_CANCER')
        
        df_final = preprocessor.handle_outliers(df_encoded, numeric_cols)
        
        # 4. Save
        df_final.to_csv(output_path, index=False)
        print(f"Saved processed data to: {output_path}")
        
        # Quick check for nulls
        null_count = df_final.isnull().sum().sum()
        print(f"Remaining null values: {null_count}")

if __name__ == "__main__":
    preprocess_all_data()
