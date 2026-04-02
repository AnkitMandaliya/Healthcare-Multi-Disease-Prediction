import pandas as pd
import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

class HealthcarePreprocessor:
    """
    Enterprise-grade data cleaning and transformation for healthcare datasets.
    Handles nulls, duplicates, outliers, and scaling.
    """
    def __init__(self, strategy='median', with_scaling=True):
        self.strategy = strategy
        self.imputer = SimpleImputer(strategy=strategy)
        # Real-world data is often skewed; RobustScaler is better than StandardScaler
        from sklearn.preprocessing import RobustScaler
        self.scaler = RobustScaler() if with_scaling else None
        self.fitted = False

    def handle_outliers(self, df, columns):
        """Uses IQR to clip outliers in numerical columns."""
        df_out = df.copy()
        for col in columns:
            if col in df_out.columns:
                Q1 = df_out[col].quantile(0.25)
                Q3 = df_out[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                df_out[col] = df_out[col].clip(lower=lower_bound, upper=upper_bound)
        return df_out

    def clean_data(self, df, disease_type=None):
        """Removes duplicates, trims strings, and handles obvious data errors."""
        cleaned_df = df.copy()
        
        # 1. Deduplication
        cleaned_df = cleaned_df.drop_duplicates()

        # 2. String Cleaning
        object_cols = cleaned_df.select_dtypes(['object']).columns
        for col in object_cols:
            cleaned_df[col] = cleaned_df[col].astype(str).str.strip()

        # 3. Handle '0' as NaN for specific Diabetes columns
        if disease_type == 'diabetes':
            cols_to_fix = ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI']
            for col in cols_to_fix:
                if col in cleaned_df.columns:
                    cleaned_df[col] = cleaned_df[col].replace(0, np.nan)
            
            # Impute NaN values
            cleaned_df[cols_to_fix] = self.imputer.fit_transform(cleaned_df[cols_to_fix])

        # 4. Numeric specific cleaning (e.g. negative values)
        numeric_cols = cleaned_df.select_dtypes([np.number]).columns
        for col in numeric_cols:
            if cleaned_df[col].min() < 0:
                cleaned_df[col] = cleaned_df[col].apply(lambda x: abs(x) if x < 0 else x)
        
        # 5. Data Quality Scoring (Real-world requirement)
        self.last_quality_score = self.calculate_data_integrity(cleaned_df)
            
        return cleaned_df

    def calculate_data_integrity(self, df):
        """Calculates a percentage score of data completeness and reliability."""
        if df.empty: return 0
        null_penalty = df.isnull().sum().sum() / (df.shape[0] * df.shape[1])
        outlier_count = 0
        num_cols = df.select_dtypes([np.number]).columns
        for col in num_cols:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            outliers = df[(df[col] < (Q1 - 1.5 * IQR)) | (df[col] > (Q3 + 1.5 * IQR))]
            outlier_count += len(outliers)
        
        outlier_penalty = outlier_count / (df.shape[0] * df.shape[1]) if not df.empty else 0
        score = max(0, 100 * (1 - (null_penalty + outlier_penalty)))
        return round(score, 2)

    def encode_categorical(self, df, disease_type):
        """Standardized categorical encoding for healthcare entities."""
        encoded_df = df.copy()
        
        if disease_type == "lung":
            # Map string inputs from frontend if necessary
            for col, val in encoded_df.items():
                if isinstance(val.iloc[0], str):
                    if val.iloc[0].upper() in ['YES', 'NO']:
                        encoded_df[col] = encoded_df[col].astype(str).str.upper().map({'YES': 1, 'NO': 0})
                    elif val.iloc[0].upper() in ['M', 'F']:
                        encoded_df[col] = encoded_df[col].astype(str).str.upper().map({'M': 1, 'F': 0})

            # Existing numeric 2/1 mapping for standard datasets
            cols_to_map = ['SMOKING', 'YELLOW_FINGERS', 'ANXIETY', 'PEER_PRESSURE', 'CHRONIC DISEASE', 
                           'FATIGUE ', 'ALLERGY ', 'WHEEZING', 'ALCOHOL CONSUMING', 'COUGHING', 
                           'SHORTNESS OF BREATH', 'SWALLOWING DIFFICULTY', 'CHEST PAIN']
            for col in cols_to_map:
                if col in encoded_df.columns:
                    # Check if it's already 0/1 (mapped strings) or needs 2/1 -> 1/0 conversion
                    if encoded_df[col].dtype != object and encoded_df[col].max() > 1:
                        encoded_df[col] = encoded_df[col].map({2: 1, 1: 0})

        elif disease_type == "heart":
            if 'sex' in encoded_df.columns:
                # Handle both 'M'/'F' strings and 1/0 numbers
                encoded_df['sex'] = encoded_df['sex'].astype(str).str.upper().map({'M': 1, 'F': 0, '1': 1, '0': 0})
                
        return encoded_df.fillna(0)

    def preprocess(self, df, disease_type=None, is_training=False):
        """Unified entry point for full transformation pipeline."""
        # 1. Cleaning
        df = self.clean_data(df, disease_type)
        
        # 2. Categorical Encoding
        df = self.encode_categorical(df, disease_type)
        
        # 3. Scaling if needed
        if self.scaler:
             numeric_cols = df.select_dtypes([np.number]).columns
             if is_training:
                 df[numeric_cols] = self.scaler.fit_transform(df[numeric_cols])
                 self.fitted = True
             else:
                 try:
                     if self.fitted:
                        df[numeric_cols] = self.scaler.transform(df[numeric_cols])
                     else:
                        # Fallback for online inference without pre-fitted scaler
                        df[numeric_cols] = (df[numeric_cols] - df[numeric_cols].median()) / (df[numeric_cols].quantile(0.75) - df[numeric_cols].quantile(0.25))
                 except:
                     pass 
                      
        return df.fillna(0)
