<p align="center">
  <img src="../frontend/public/logo.png" width="120" height="120" alt="FinFlow Logo" />
</p>

# FinFlow – Backend API & Machine Learning Engine

High-performance asynchronous backend and ML inference service powering the FinFlow financial intelligence platform, built with FastAPI, SQLite / Supabase PostgreSQL, and scikit-learn.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![scikit-learn](https://img.shields.io/badge/ML-scikit--learn-F7931E.svg?logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../LICENSE)
[![Instagram](https://img.shields.io/badge/Instagram-@jay__dev._._-E4405F?logo=instagram&logoColor=white)](https://www.instagram.com/jay_dev._._?xtok=MTh1Z3B0eHo3NHdveQ==)

---

## Machine Learning & Held-Out Test Accuracy

- **Model**: `RandomForestClassifier` (100 estimators, scikit-learn).
- **Held-out Test Accuracy**: **95.83% on 240 unseen rows** (evaluated on an 80/20 train/test split on 1,200 rows).
- **Test Confusion Matrix**: `[[172, 0], [10, 58]]` (172/172 test expenses correctly identified; 58/68 test incomes correctly identified).
- **Note on Accuracy**: Training-set accuracy is ~99.17%. FinFlow reports held-out test accuracy (95.83%), never training accuracy, to avoid overfitting bias.
- **Uncertainty Threshold**: Predictions with confidence below 0.60 are flagged as "Uncertain", requiring manual user confirmation.
- **Security Notice**: Machine learning model artifacts use `joblib`. In production, load only trusted, internally generated artifacts; loading untrusted pickle/joblib files can execute arbitrary code.

To retrain the model and regenerate metadata:
```bash
python backend/scripts/retrain_model.py
```

---

## Architecture & Features

1. **FastAPI Core Engine**: High-velocity asynchronous RESTful API with automated OpenAPI / Swagger documentation at `/docs` and versioned aliases at `/api/v1`.
2. **Security & Authentication**:
   - Cryptographic JWT verification (HS256).
   - Rejects forged or unauthenticated requests (returns structured 401).
   - Environment-scoped demo mode (disabled in `ENVIRONMENT=production`).
   - Security headers middleware (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `X-XSS-Protection`).
   - Sliding-window rate limiting for auth and inference endpoints.
3. **Database Adapter Layer**:
   - Authoritative SQLite runtime for local development and demo mode.
   - Ready for Supabase PostgreSQL with multi-tenant user isolation on every query.
   - Non-destructive sample dataset seeding with safety confirmation.
4. **Core Capabilities**:
   - Transactions ledger with tag assignment, attachment URLs, duplicate detection, and RFC 4180 CSV export/import.
   - Strict month-and-year scoped budget spending calculations.
   - Algorithmic cash-flow forecasting (`GET /api/analytics/forecast`).
   - Automated recurring bills with "Mark as Paid" action.
   - Automated savings goals with monthly contribution calculations.
   - Prediction history tracking, pagination, deletion, and feedback collection.
   - 7-section user preferences & profile management center.

---

## Ephemeral Cloud Deployment Warning

> ⚠️ **Persistent Disk Warning for SQLite on Render / Railway**:
> Container filesystems on Render and Railway are ephemeral. SQLite database files stored in the container will be deleted on restarts or deployments unless stored on an attached persistent volume.
>
> To persist SQLite data:
> 1. Attach a persistent disk mounted at `/var/data`.
> 2. Set environment variable `DATABASE_PATH=/var/data/finflow.db`.
> 3. Alternatively, connect to managed Supabase / PostgreSQL by providing `DATABASE_URL=postgresql://...`.

---

## Getting Started Locally

```bash
# Navigate to project root
cd FinFlow

# Activate virtual environment
backend\venv\Scripts\activate   # Windows
source backend/venv/bin/activate # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn backend.app.main:app --reload --port 8000
```

---

## Running Backend Tests

```bash
# Run pytest with asyncio support
pytest backend/tests -v
```
All 18 automated backend test cases pass with full multi-tenant isolation, strict validation, and error schema verification.

---

## Organization & Maintenance

- **Organization**: **Vexora Technology**
- **Instagram**: Follow on Instagram: [@jay_dev._._](https://www.instagram.com/jay_dev._._?xtok=MTh1Z3B0eHo3NHdveQ==)
