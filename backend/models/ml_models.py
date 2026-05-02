import os
import joblib

class MLModelManager:
    def __init__(self, models_dir=None):
        # Requirement 3: Load models using absolute paths from backend/models directory
        if models_dir is None:
            # The .pkl files have been moved to the same directory as this file
            self.models_dir = os.path.dirname(os.path.abspath(__file__))
        else:
            self.models_dir = models_dir

        self.models = {}
        self.explainers = {}
        self.feature_lists = {}

        self.disease_types = ["diabetes", "heart", "lung"]
        self.load_all()

    def load_all(self):
        # Requirement 6: Print loaded models for debugging
        print(f"[DEBUG] Model Manager Initializing...")
        print(f"[DEBUG] Target Directory: {self.models_dir}")
        
        for disease in self.disease_types:
            m_path = os.path.join(self.models_dir, f"{disease}_model.pkl")
            e_path = os.path.join(self.models_dir, f"{disease}_explainer.pkl")
            f_path = os.path.join(self.models_dir, f"{disease}_features.pkl")

            # Load Model
            if os.path.exists(m_path):
                try:
                    self.models[disease] = joblib.load(m_path)
                    print(f"[DEBUG] SUCCESS: Loaded {disease.upper()} model.")
                except Exception as e:
                    print(f"[DEBUG] ERROR: Failed to load {disease} model: {e}")
            else:
                print(f"[DEBUG] WARNING: {disease}_model.pkl not found at {m_path}")

            # Load Explainer
            if os.path.exists(e_path):
                try:
                    self.explainers[disease] = joblib.load(e_path)
                    print(f"[DEBUG] SUCCESS: Loaded {disease.upper()} explainer.")
                except Exception as e:
                    print(f"[DEBUG] ERROR: Failed to load {disease} explainer: {e}")

            # Load Features (Requirement 4: Ensure input features match training feature order)
            if os.path.exists(f_path):
                try:
                    self.feature_lists[disease] = joblib.load(f_path)
                    print(f"[DEBUG] SUCCESS: Loaded {disease.upper()} feature registry.")
                except Exception as e:
                    print(f"[DEBUG] ERROR: Failed to load {disease} features: {e}")

    def get_model(self, disease):
        return self.models.get(disease)

    def get_explainer(self, disease):
        return self.explainers.get(disease)

    def get_features(self, disease):
        return self.feature_lists.get(disease)

# Global Instance
model_manager = MLModelManager()