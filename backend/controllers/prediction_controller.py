import os
import pandas as pd
import numpy as np
from google import genai
from flask import jsonify
from datetime import datetime
from src.preprocessing import HealthcarePreprocessor
from backend.controllers.model_manager import model_manager

class PredictionController:
    def __init__(self, model_manager):
        self.model_manager = model_manager
        self.ai_cache = {} 
        self.preprocessor = HealthcarePreprocessor()

    def get_risk_level(self, prob):
        if prob < 0.3: return "Low"
        if prob < 0.7: return "Medium"
        return "High"

    def predict(self, disease, form_data, user_email, mongo):
        # 1. Validation
        model = self.model_manager.get_model(disease)
        expected_features = self.model_manager.get_features(disease)
        
        if not model or not expected_features:
            return jsonify({"error": f"Model for {disease} not found", "status": "error"}), 404

        try:
            # Prepare data
            input_df = pd.DataFrame([form_data])
            
            # Normalize disease name for preprocessor
            proc_disease = "lung" if disease == "lungs" else disease
            
            # Categorical encoding (M/F, YES/NO etc)
            try:
                input_df = self.preprocessor.encode_categorical(input_df, proc_disease)
            except Exception as e:
                print(f"Preprocessor Encoding Error: {e}")

            # Ensure all expected features exist and convert to numeric
            for feat in expected_features:
                if feat not in input_df.columns:
                    input_df[feat] = 0
            
            # Use errors='coerce' to safely skip anything that didn't get encoded correctly
            input_df = input_df[expected_features].apply(pd.to_numeric, errors='coerce').fillna(0)

            # Raw prediction
            prob = float(model.predict_proba(input_df)[0][1])
            prediction = 1 if prob > 0.5 else 0
            risk = self.get_risk_level(prob)

            # 2. SHAP Explanation
            explanation = []
            if disease in self.model_manager.explainers:
                try:
                    X_transformed = self.preprocessor.preprocess(input_df, proc_disease, is_training=False)
                    exp_vals = self.model_manager.explainers[disease](X_transformed)
                    
                    if hasattr(exp_vals, "values"):
                        values = exp_vals.values[0]
                        if isinstance(values, list) or isinstance(values, np.ndarray):
                            if len(values.shape) > 1: # multi-class model check
                                values = values[:, 1] if values.shape[1] > 1 else values[:, 0]
                    
                    feat_importance = []
                    for i, name in enumerate(expected_features):
                        val_idx = min(i, len(values)-1)
                        feat_importance.append({"feature": name, "impact": float(values[val_idx])})
                    
                    explanation = sorted(feat_importance, key=lambda x: abs(x['impact']), reverse=True)[:5]
                except Exception as e:
                    print(f"SHAP Error: {e}")

            # Formatting
            res_text = ""
            if disease == "diabetes": res_text = "Diabetes Positive" if prediction == 1 else "Diabetes Negative"
            elif disease == "heart": res_text = "Heart Disease Detected" if prediction == 1 else "No Heart Disease"
            else: res_text = "Lung Cancer Detected" if prediction == 1 else "No Lung Cancer"

            # 3. Save to DB
            mongo.db.records.insert_one({
                "email": user_email,
                "disease": disease.capitalize(),
                "prediction": int(prediction),
                "prediction_text": res_text,
                "risk_level": risk,
                "probability": float(prob),
                "raw_inputs": form_data,
                "timestamp": datetime.now()
            })

            # Add to Notifications System
            mongo.db.notifications.insert_one({
                "title": f"{disease.capitalize()} Neural Check-up",
                "message": f"Source: {user_email} - {res_text} identified with {risk} risk profile.",
                "type": "warning" if risk == "High" else "info",
                "timestamp": datetime.now().isoformat(),
                "patient": user_email
            })

            print(f"[PREDICT] {disease} analysis finalized for node {user_email}")
            return jsonify({
                "prediction": res_text,
                "probability": prob,
                "risk_level": risk,
                "explanation": explanation,
                "status": "success"
            })
        except Exception as e:
            print(f"Prediction Error: {e}")
            return jsonify({"error": str(e), "status": "error"}), 400

    def get_dashboard_stats(self, disease_type, mongo, user_email=None, days=7):
        """Aggregates metrics using a high-performance single-pass aggregation pipeline."""
        try:
            query = {}
            if disease_type != 'all':
                query["disease"] = disease_type.capitalize()
            if user_email:
                query["email"] = user_email

            # Start of the range for trend analysis
            start_date = datetime.now() - pd.Timedelta(days=days)

            pipeline = [
                {"$match": query},
                {"$facet": {
                    "totals": [
                        {"$group": {
                            "_id": None,
                            "total": {"$sum": 1},
                            "high": {"$sum": {"$cond": [{"$eq": ["$risk_level", "High"]}, 1, 0]}},
                            "medium": {"$sum": {"$cond": [{"$eq": ["$risk_level", "Medium"]}, 1, 0]}},
                            "low": {"$sum": {"$cond": [{"$eq": ["$risk_level", "Low"]}, 1, 0]}}
                        }}
                    ],
                    "trend": [
                        {"$match": {"timestamp": {"$gte": start_date}}},
                        {"$group": {
                            "_id": {
                                "month": {"$month": "$timestamp"},
                                "day": {"$dayOfMonth": "$timestamp"}
                            },
                            "count": {"$sum": 1},
                            "critical": {"$sum": {"$cond": [{"$eq": ["$risk_level", "High"]}, 1, 0]}}
                        }}
                    ]
                }}
            ]

            agg_results = list(mongo.db.records.aggregate(pipeline))[0]
            
            # 1. Totals Processing
            t = agg_results["totals"][0] if agg_results["totals"] else {"total": 0, "high": 0, "medium": 0, "low": 0}
            total_records = t["total"]
            critical_records = t["high"]

            # 2. Line Data Processing (Trend)
            trend_map = {f"{r['_id']['month']}-{r['_id']['day']}": r for r in agg_results["trend"]}
            line_data = []
            for i in range(days - 1, -1, -1):
                d = datetime.now() - pd.Timedelta(days=i)
                key = f"{d.month}-{d.day}"
                data = trend_map.get(key, {"count": 0, "critical": 0})
                line_data.append({
                    "name": d.strftime("%b %d"),
                    "value": data["count"],
                    "criticality": data["critical"]
                })

            # 3. Risk Distribution
            total_dist = (t["low"] + t["medium"] + t["high"]) or 1
            distribution = [
                {"name": "Normal/Safe", "value": round((t["low"] + t["medium"]) / total_dist * 100, 1)},
                {"name": "Clinical High Risk", "value": round(t["high"] / total_dist * 100, 1)}
            ]

            # 4. Feature Importance (Performance Metrics)
            bar_data = [
                {"name": "Model Status", "value": 100 if total_records > 0 else 0},
                {"name": "Node Sync", "value": 100 if user_email else 0},
                {"name": "Active Stream", "value": 0}
            ]

            # 5. Operational Logs (User specific)
            records = list(mongo.db.records.find(query).sort("timestamp", -1).limit(6))
            logs = []
            for r in records:
                logs.append({
                    "title": f"{r['disease']} Screening",
                    "time": r['timestamp'].strftime("%b %d") if hasattr(r['timestamp'], 'strftime') else "Recent",
                    "sub": "Individual Diagnostic",
                    "risk": r['risk_level']
                })

            return jsonify({
                "live_volume": total_records,
                "critical_flags": critical_records,
                "lineData": line_data,
                "distribution": distribution,
                "barData": bar_data,
                "logs": logs,
                "insights": [
                    {"title": "Intelligence Mode", "text": "All diagnostic clusters operational. Low latency detected.", "category": "system", "type": "info", "color": "text-blue-400"},
                    {"title": "Clinical Recommendation", "text": f"You have {critical_records} high-risk cases pending neural analysis.", "category": "medical", "type": "critical", "color": "text-red-400"}
                ]
            })
        except Exception as e:
            print(f"Stats Error: {e}")
            return jsonify({"error": str(e)}), 500

    def generate_ai_advice(self, data, mongo):
        """Generates AI Clinical Advisory using Gemini."""
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return jsonify({"advice": "GEMINI_API_KEY not configured.", "status": "error"}), 200

        # Increment total requests
        mongo.db.ai_stats.update_one({"id": "global"}, {"$inc": {"total": 1}}, upsert=True)

        # 1. Fetch Selected Model from Settings
        settings = mongo.db.settings.find_one({"id": "ai_config"})
        active_model = settings.get("active_model") if settings else "gemini-1.5-flash"

        client = genai.Client(api_key=api_key)
        
        # Build combined prompt
        prompt = self._build_prompt(data)

        # Try active model first, then fallbacks (Modern 2026 Fleet)
        models_to_try = [active_model, 'models/gemini-2.5-flash', 'models/gemini-2.0-flash', 'models/gemini-flash-latest']
        
        last_error = ""
        for model_name in models_to_try:
            try:
                response = client.models.generate_content(model=model_name, contents=prompt)
                
                # Log success
                mongo.db.ai_stats.update_one({"id": "global"}, {"$inc": {"success": 1}}, upsert=True)
                mongo.db.ai_stats.update_one({"id": "global"}, {"$set": {"last_used": model_name}}, upsert=True)
                
                return jsonify({
                    "combined_advice": response.text, 
                    "status": "success", 
                    "model": model_name
                })
            except Exception as e:
                last_error = str(e)
                print(f"Node {model_name} failed: {e}")
                continue

        # Log failure
        mongo.db.ai_stats.update_one({"id": "global"}, {"$inc": {"failed": 1}}, upsert=True)
        return jsonify({
            "error": f"All clinical nodes exceeded quota or are offline: {last_error}", 
            "status": "error"
        }), 503

    def _build_prompt(self, data):
        return f"""
        Act as a professional medical consultant. 
        Patient diagnostic data for {data.get('disease')}: {data.get('inputs')}. 
        Risk Level: {data.get('risk_level')}.
        
        Please provide your response in exactly the following TWO parts separated by a distinct marker '---ROADMAP_START---':
        
        PART 1: QUICK ADVISORY
        Word Limit: STRICTLY MAX 150 words.
        Constraint: DO NOT use ANY Markdown symbols like * or **. Use PLAIN TEXT only.
        Generate a high-impact, immediate clinical summary.
        
        ---ROADMAP_START---
        
        PART 2: STRATEGIC HEALTH ROADMAP
        Word Limit: STRICTLY MAX 400 words.
        Constraint: DO NOT use ANY Markdown symbols like * or **. Use PLAIN TEXT only.
        
        STRUCTURE:
        Generate a structured 90-DAY CLINICAL PLAN in 3 EXPLICIT SECTIONS with ALL-CAPS HEADINGS:
        PHASE 1: IMMEDIATE STABILIZATION (DAYS 1-30)
        PHASE 2: TARGETED INTERVENTION (DAYS 31-60)
        PHASE 3: LONG-TERM MAINTENANCE (DAYS 61-90)
        
        Ensure the combined response fits perfectly into a 2-page clinical report along with other patient data. Keep it professional and dense.
"""
