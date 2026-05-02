import os
from backend.controllers.model_manager import model_manager
from backend.controllers.prediction_controller import PredictionController

# Centrally managed controller instances
prediction_ctrl = PredictionController(model_manager)
