# Enterprise Healthcare AI Platform

An industry-standard, clinical-grade platform for multi-disease prediction, features SHAP-based explainability, robust ML pipelines, and an immersive "Mission Control" UI.

## 🚀 Deployment & Operation

### 1. Unified Server (Production)
```bash
python app/main.py
```
*Accessible at http://127.0.0.1:5000*

### 2. Enterprise Training Unit
To retrain with cross-validation and SHAP generation:
```bash
$env:PYTHONPATH = "."
python src/model_trainer.py
```

---
*Developed for Clinical Excellence and Architectural Integrity.*
