import os
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, roc_auc_score

class ModelEvaluator:
    """
    Evaluates ML models and generates comprehensive reports for clinical auditing.
    """
    @staticmethod
    def get_metrics(y_true, y_pred, y_prob=None):
        """Calculates standard classification metrics, including ROC-AUC."""
        metrics = {
            "accuracy": float(accuracy_score(y_true, y_pred)),
            "precision": float(precision_score(y_true, y_pred, zero_division=0)),
            "recall": float(recall_score(y_true, y_pred, zero_division=0)),
            "f1_score": float(f1_score(y_true, y_pred, zero_division=0))
        }
        
        if y_prob is not None:
            try:
                metrics["roc_auc"] = float(roc_auc_score(y_true, y_prob))
            except:
                metrics["roc_auc"] = 0.0
                
        return metrics

    @staticmethod
    def save_report(disease_name, metrics, best_model_name, cv_scores=None):
        """Saves a textual report of the model performance for enterprise auditing."""
        report_dir = "models/reports"
        os.makedirs(report_dir, exist_ok=True)
        
        report_path = os.path.join(report_dir, f"{disease_name}_report.txt")
        with open(report_path, "w") as f:
            f.write(f"--- {disease_name.upper()} ENTERPRISE AI REPORT ---\n")
            f.write(f"Best Estimator: {best_model_name}\n")
            f.write("-" * 40 + "\n")
            for metric, value in metrics.items():
                f.write(f"{metric.upper():<12}: {value:.4f}\n")
            
            if cv_scores is not None:
                f.write("-" * 40 + "\n")
                f.write(f"5-Fold CV Mean: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})\n")
            f.write("-" * 40 + "\n")
        
        print(f"REPORT: {report_path}")

    @staticmethod
    def log_confusion_matrix(y_true, y_pred, disease_name):
        """Logs confusion matrix for debugging."""
        cm = confusion_matrix(y_true, y_pred)
        print(f"\nCONFUSION MATRIX [{disease_name}]:")
        print(cm)
