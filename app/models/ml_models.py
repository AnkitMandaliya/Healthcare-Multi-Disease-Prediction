import os
import joblib

class MLModelManager:
    def __init__(self, models_dir):
        self.models_dir = models_dir
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
            
            if os.path.exists(m_path):
                self.models[disease] = joblib.load(m_path)
                print(f"Loaded {disease} model.")
            if os.path.exists(e_path):
                self.explainers[disease] = joblib.load(e_path)
            if os.path.exists(f_path):
                self.feature_lists[disease] = joblib.load(f_path)

    def get_model(self, disease):
        return self.models.get(disease)

    def get_explainer(self, disease):
        return self.explainers.get(disease)

    def get_features(self, disease):
        return self.feature_lists.get(disease)
