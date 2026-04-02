import os
from app.models.ml_models import MLModelManager
from app.controllers.prediction_controller import PredictionController

# Get base directory relative to this file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(BASE_DIR, "models")

model_manager = MLModelManager(MODELS_DIR)
prediction_ctrl = PredictionController(model_manager)
