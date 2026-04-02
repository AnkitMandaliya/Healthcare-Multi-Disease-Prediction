# PROJECT BLUEPRINT: Healthcare Multi-Disease Prediction Platform

## 1. Project Overview & Strategy
An enterprise-grade, diagnostic-first platform utilizing **ML inference nodes** and **Generative AI** orchestrators for high-fidelity clinical health assessments.

### **Core Strategies Implementation**
*   **Unified AI Payload Strategy**: To minimize API quota consumption, the backend sends a single high-context prompt to Google Gemini. The response is internally split using a `---ROADMAP_START---` delimiter, enabling "Quick Advice" and a "90-Day Plan" in one API call.
*   **Quota Baki Strategy**: Implements a 1500-unit daily hard-cap for AI requests. Quota usage is monitored in real-time by the Admin Hubble via a dedicated MongoDB collection (`ai_stats`).
*   **Multi-Canvas PDF Strategy**: To prevent "open box" artifacts when clinical boxes span pages, the system renders discrete HTML "Virtual Pages" and captures them as separate high-resolution canvases before stitching them into a final A4 PDF.

---

## 2. Content & Persistent Schema (MongoDB)

### **Collection: `users`**
*   `name`: String (Full identity)
*   `email`: String (Unique key)
*   `password`: String (Hashed via Bcrypt)
*   `role`: String (Enum: `admin`, `doctor`, `patient`)
*   `profilePic`: String (Cloudinary URL)
*   `otp`: Object `{code, expires_at}` (Recovery challenge)

### **Collection: `predictions`**
*   `user_id`: ObjectId (Ownership link)
*   `disease`: String (Diagnostic target)
*   `inputs`: Object (Normalized biometric values)
*   `prediction`: String (Classification result)
*   `probability`: Float (Confidence coefficient)
*   `timestamp`: Date (Issuance moment)

### **Collection: `ai_stats`**
*   `date`: Date (Primary key for daily aggregation)
*   `total`: Number (Cumulative request count)
*   `success`: Number (Diagnostic confirmation count)
*   `failed`: Number (Network/Validation failure count)
*   `active_model`: String (Currently deployed Gemini node)

---

## 3. Authorization & Identity Protocol

### **JWT Access Control**
*   **Issuance**: JWT access tokens are generated on successful login with a **24-hour expiration**.
*   **Security**: All tokens are stored in `sessionStorage` in the frontend, preventing session leakage across browser tabs.
*   **Verification**: Backend implements `jwt_required()` decorators on all PROTECTED diagnostic routes.

### **Role-Based Access Control (RBAC)**
*   **Custom Decorator `@admin_required`**: Used to guard high-level orchestration routes (AI HUB, User Registry, Stats).
*   **Visibility Visibility Check**: Frontend implements tab-level isolation; if a user switches tabs, the node automatically verifies identity integrity.

---

## 4. Communication & OTP Service (Mail Protocol)

### **Mail Configuration (SMTP)**
*   **Provider**: Gmail SMTP Relay Server.
*   **Protocol**: TLS-Secured on Port 587.
*   **Implementation**: Utilizes `Flask-Mail` for asynchronous diagnostic alerting and security challenges.

### **OTP Recovery Logic**
1.  User requests a password reset.
2.  Backend generates a **6-digit cryptographic TOTP**.
3.  OTP is stored in the User document with a **10-minute expiration**.
4.  Email is dispatched with the code.
5.  Verification requires the USER_EMAIL and CODE; if valid, a one-time reset token is issued.

---

## 5. Machine Learning Pipeline (Basics to Advanced)

### **Preprocessing & Inference**
*   **Scaling Hierarchy**: Raw clinical data is passed through a `StandardScaler`. This is critical as the ML models are trained on normalized distributions (mean=0, variance=1).
*   **Diagnostic Handlers**:
    *   **Diabetes**: 8-feature vector analysis.
    *   **Heart**: Cardiovascular feature weighting.
    *   **Lung**: Respiratory probability scaling.
*   **Persistence**: Handled by `model_manager.py` using `joblib` for high-performance serialized model loading.

---

## 6. The Admin AI Hubble (Service Orchestration)

### **Metrics Tracking**
*   **Success Rate**: Dynamically calculated percentage (`success / total`). Zero-initialized to prevent `NaN` errors.
*   **Failure Analysis**: Tracks "System Blockages" where the AI Node fails to deliver a dual-part response.

### **Dynamic Node Switching**
Administrators can dynamically re-route AI requests to different Gemini versions (e.g., swapping `gemini-2.0-flash` for `gemini-2.5-pro`) via a single API call (`POST /api/admin/model/switch`). This allows for managing latency vs. accuracy in real-time.

---

## 7. Configuration Guide (Environment)
*   `MONGO_URI`: Primary database connection.
*   `GEMINI_API_KEY`: Google clinical intelligence key.
*   `CLOUDINARY_URL`: Asset storage orchestrator.
*   `MAIL_SERVER/PORT/USER/PASS`: SMTP communication credentials.
