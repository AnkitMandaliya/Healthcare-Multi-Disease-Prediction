import os
import joblib

class MLModelManager:
    def __init__(self, models_dir=None):
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        self.models_dir = BASE_DIR   # ✅ FIXED

        self.models = {}
        self.explainers = {}
        self.feature_lists = {}

        self.disease_types = ["diabetes", "heart", "lung"]
        self.load_all()

    def load_all(self):
        for disease in self.disease_types:
            m_path = os.path.join(self.models_dir, f"{disease}_model.pkl")
            e_path = os.path.join(self.models_dir, f"{disease}_explainer.pkl")
            f_path = os.path.join(self.models_dir, f"{disease}_features.pkl")

            print("Loading from:", m_path)  # ✅ DEBUG

            if os.path.exists(m_path):
                self.models[disease] = joblib.load(m_path)
                print(f"Loaded {disease} model.")

            if os.path.exists(e_path):
                self.explainers[disease] = joblib.load(e_path)

            if os.path.exists(f_path):
                self.feature_lists[disease] = joblib.load(f_path)