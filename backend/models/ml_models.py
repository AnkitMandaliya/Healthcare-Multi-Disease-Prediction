import os
import joblib

class MLModelManager:
    def __init__(self, models_dir=None):
        # Requirement 4: Use absolute paths for model loading
        if models_dir is None:
            # Fallback to absolute path relative to this file
            # Current file: backend/models/ml_models.py
            # Models are in: /models
            BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            self.models_dir = os.path.join(BASE_DIR, "models")
        else:
            self.models_dir = models_dir

        # Requirement 3: Ensure dictionaries are initialized in __init__
        self.models = {}
        self.explainers = {}
        self.feature_lists = {}

        self.disease_types = ["diabetes", "heart", "lung"]
        self.load_all()

    def load_all(self):
        # Requirement 5: Add debug print statements
        print(f"[DEBUG] Initializing MLModelManager. Models Directory: {self.models_dir}")
        
        for disease in self.disease_types:
            m_path = os.path.join(self.models_dir, f"{disease}_model.pkl")
            e_path = os.path.join(self.models_dir, f"{disease}_explainer.pkl")
            f_path = os.path.join(self.models_dir, f"{disease}_features.pkl")

            print(f"[DEBUG] Attempting to load resources for {disease}...")

            if os.path.exists(m_path):
                try:
                    self.models[disease] = joblib.load(m_path)
                    print(f"[DEBUG] SUCCESS: Loaded {disease} model from {m_path}")
                except Exception as e:
                    print(f"[DEBUG] ERROR: Failed to load {disease} model: {e}")

            if os.path.exists(e_path):
                try:
                    self.explainers[disease] = joblib.load(e_path)
                    print(f"[DEBUG] SUCCESS: Loaded {disease} explainer from {e_path}")
                except Exception as e:
                    print(f"[DEBUG] ERROR: Failed to load {disease} explainer: {e}")

            if os.path.exists(f_path):
                try:
                    self.feature_lists[disease] = joblib.load(f_path)
                    print(f"[DEBUG] SUCCESS: Loaded {disease} features from {f_path}")
                except Exception as e:
                    print(f"[DEBUG] ERROR: Failed to load {disease} features: {e}")

    # Requirement 1 & 2: Missing methods with safe .get() return
    def get_model(self, disease):
        return self.models.get(disease)

    def get_explainer(self, disease):
        return self.explainers.get(disease)

    def get_features(self, disease):
        return self.feature_lists.get(disease)

# Requirement 6: Ensure there is a global instance
model_manager = MLModelManager()