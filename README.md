<p align="center">
  <img src="frontend/public/logo.png" width="120" height="120" alt="FinFlow Logo" />
</p>

# FinFlow – Personal Finance Tracker & ML Classifier

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![scikit-learn](https://img.shields.io/badge/ML-scikit--learn-F7931E.svg?logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-06B6D4.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

FinFlow is an autonomous, full-stack personal finance tracking platform with integrated Machine Learning. It features real-time cashflow analytics, category budgeting, automated savings goals, recurring bills management, and an ensemble **Random Forest Classifier** trained on 18 engineered features to classify transaction types with **Held-out test accuracy: 95.83% on 240 unseen rows** (evaluated on an 80/20 train/test split on 1,200 rows; training-set accuracy was 99.17%).

> **Organization**: **Vexora Technology**

---

## Key Features

- **Executive Analytics Dashboard**: Real-time KPI summaries (Total Inflow, Total Outflow, Net Savings, Capital Efficiency / Savings Rate), MoM cashflow area charts, category distribution donut visualizations, and live transaction feeds.
- **Machine Learning Inference Engine**: Classify transactions in real-time (`Income` vs `Expense`) using a trained `RandomForestClassifier` with full confidence scores, probability breakdown, and an uncertainty threshold (<60% confidence flagged as "Uncertain" for user override).
- **Algorithmic Cash-Flow Forecast**: Project upcoming balances across 30, 90, and 180 days combining historical run-rate and scheduled recurring obligations.
- **AI Financial Coach**: Contextual real-time advice cards detecting spending anomalies, category pacing, and upcoming bill reminders with one-click actions.
- **Transaction Tags & Attachments**: Tag transactions (`#food`, `#weekend`, `#tax`), filter by tags or receipt attachments, and preview receipt URLs directly in the ledger table.
- **Saved Views & Presets**: One-click preset filters (e.g. "Monthly Groceries", "High-value Expenses", "Salary Credits") with custom preset saving.
- **Non-Destructive Seeding Safety**: Benchmark sample seeding is non-destructive by default with explicit confirmation before any destructive replacement.
- **Recurring Bills Automation**: "Mark as Paid" action that automatically creates a ledger transaction and advances the bill's next due date by frequency.
- **Automated Savings Goals & Milestones**: Target deadlines, circular SVG progress rings, automatic monthly contribution pace calculation, and milestone notifications.
- **Complete Settings Control Center**: 7 comprehensive cards: Profile, Locale Preferences (INR, USD, EUR, GBP), Financial Defaults, Notifications Center, Data & Privacy (CSV/JSON/printable PDF export, CSV import, demo reset, account deletion), Security & Sessions, and About / System Health.
- **Global Command Palette (`Ctrl+K`)**: Live search across pages, transactions, budgets, goals, and recurring bills with keyboard arrow navigation and recent search history.
- **Mobile Fixed Navigation**: Dedicated bottom tab bar for smartphones and tablets.

---

## Demo Credentials & Offline Mode

You can test the entire application instantly without configuring external credentials:

- **Email**: `demo@finflow.app`
- **Password**: `Demo@1234`
- **One-Click**: Click the **"Try Demo"** button on the Login page.
- **Offline / Local Fallback**: When running without Supabase cloud credentials, FinFlow automatically generates cryptographic development JWTs using a non-production development secret, providing complete local autonomy.

---

## Architecture

```mermaid
graph TD
    User([User Browser])
    
    subgraph Frontend ["React 19 + Vite (Tailwind + Framer Motion + TanStack Query)"]
        Landing["Landing & 3D Hero"]
        Dash["Interactive Dashboard & Forecast"]
        Tx["Transactions Ledger & Tags"]
        Predict["ML Inference & History"]
        Budgets["Budgets, Goals & Recurring"]
        Settings["Settings 7-Card Center"]
        Cmd["Command Palette (Ctrl+K)"]
    end

    subgraph Backend ["FastAPI Python Engine"]
        AuthRouter["JWT Auth & RLS"]
        TxRouter["Transactions CRUD, Tags & CSV"]
        MLRouter["ML Inference & Evaluation (95.83% Test Acc)"]
        SmartRouter["Budgets, Forecast, Goals & Notifications"]
        RFModel[("RandomForest Classifier\n(18 Features, 95.83% Held-Out Acc)")]
        DB[("SQLite / PostgreSQL\n(Database Adapter Layer)")]
    end

    User --> Frontend
    Frontend -->|REST APIs + Bearer Token| Backend
    MLRouter --> RFModel
    TxRouter --> DB
    SmartRouter --> DB
```

---

## Machine Learning Specification

- **Model Architecture**: `RandomForestClassifier` (100 estimators, scikit-learn).
- **Target**: `transaction_type` (`Income` vs `Expense`).
- **Held-out Test Accuracy**: **95.83% on 240 unseen rows** (80/20 train/test split on 1,200 rows).
- **Test Confusion Matrix**: `[[172, 0], [10, 58]]` (172/172 test expenses correctly identified; 58/68 test incomes correctly identified).
- **Model Metadata**: Saved in `backend/app/model_metadata.json` with class precision/recall, training date, feature list, and deserialization security notice.
- **Uncertainty Threshold**: Predictions with confidence below 60% are flagged as "Uncertain" with an interactive manual override.
- **Engineered Feature Vector (18 Features)**:
  1. `amount`: Primary driver (~78.8% importance).
  2. `year`, `month`, `day_of_week`: Temporal factors.
  3. `payment_mode`: One-hot encoded (Cash, Credit Card, Debit Card, Net Banking, UPI).
  4. `location`: One-hot encoded (Bangalore, Bhubaneswar, Chennai, Delhi, Hyderabad, Jaipur, Kolkata, Mumbai, Pune).

---

## Getting Started Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 1. Set Up Backend

```bash
# Navigate to project root
cd FinFlow

# Create and activate python virtual environment
python -m venv backend/venv

# Windows
backend\venv\Scripts\activate
# Linux/macOS
source backend/venv/bin/activate

# Install dependencies (scikit-learn, fastapi, pandas, joblib, PyJWT, etc.)
pip install -r requirements.txt

# Start FastAPI server on port 8000
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend initializes `finflow.db` and loads the sample benchmark automatically.

### 2. Set Up Frontend

```bash
# In a new terminal, navigate to frontend
cd FinFlow/frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Visit **http://127.0.0.1:5173** in your browser.

---

## Running the Automated Test Suite

FinFlow includes a 42-test automated test suite across backend and frontend:

```bash
# Run all tests (both backend pytest and frontend vitest)
npm test

# Run backend tests only (18 tests)
npm run test:backend

# Run frontend vitest tests only (24 tests)
npm run test:frontend

# Run code style and linting (ruff + oxlint)
npm run lint
```

### Backend Test Coverage (18/18 Passed)
- Token rejection without Authorization header (401).
- Token rejection for forged / plain prefix tokens (`user_`, `local_user_`).
- Demo mode rejection in production environment.
- Transaction CRUD operations with strict validation.
- Safe non-destructive seeding vs destructive confirmation.
- Pagination, sorting, and tag/attachment filtering.
- Strict multi-tenant user isolation.
- Budget month/year strict calculation.
- Goal automated monthly contributions and milestone updates.
- Recurring bill "Mark as paid" transaction creation and date advancement.
- Cashflow forecasting API.
- Prediction history persistence, filtering, and deletion.
- Prediction feedback recording.
- Strict Pydantic input validation failure schema.
- Sliding-window rate limiting.
- System health checks (API, SQLite, ML model artifact).

### Frontend Test Coverage (24/24 Passed)
- Token retrieval via `supabase.auth.getSession()` and single-retry auto-refresh on 401.
- Structured response unwrapping and error handling.
- AuthContext state management, offline development fallback, demo login, and cache eviction on signout.
- ProtectedRoute authentication redirects and child rendering.
- ErrorBoundary crash interception and fallback rendering.
- CommandPalette `Ctrl+K` keybindings, query filtering, keyboard arrow navigation, and recent searches.
- Predictor 95.83% accuracy label verification and absence of false 99.2% claims.
- SiteFooter full and compact variants, links validation, and dynamic copyright year logic.

---

## Production Deployment Guide

### Frontend on Vercel

```bash
cd frontend
vercel --prod
```

Configure Environment Variables on Vercel:
- `VITE_API_BASE_URL`: `https://your-backend-api.onrender.com`
- `VITE_SUPABASE_URL`: `https://your-project.supabase.co` (optional)
- `VITE_SUPABASE_ANON_KEY`: `your-anon-key` (optional)

### Backend on Render / Railway

> ⚠️ **Persistent Disk Warning for SQLite**:
> When hosting on ephemeral platforms like Render or Railway without a managed PostgreSQL database, SQLite databases stored on the local container filesystem will be reset on every redeploy or restart unless an attached persistent disk mount (e.g. `/data/finflow.db`) is configured.
>
> **Recommended Production Setup**:
> 1. Attach a persistent disk to your service mounted at `/var/data`, and set `DATABASE_PATH=/var/data/finflow.db`.
> 2. Alternatively, set `DATABASE_URL=postgresql://user:pass@host:5432/db` to connect to a managed Supabase / PostgreSQL instance.

Configure Environment Variables on Render / Railway:
- `ENVIRONMENT`: `production`
- `CORS_ORIGINS`: `https://your-finflow-app.vercel.app`
- `MODEL_PATH`: `transaction_type_classifier.joblib`
- `DATASET_PATH`: `personal_finance_dummy_dataset_1200.csv`
- `SUPABASE_JWT_SECRET`: `your_production_supabase_jwt_secret` (required in production)
- `RATE_LIMIT_ENABLED`: `true`

---

## Project Structure

```
FinFlow/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, security middleware & rate limiting
│   │   ├── config.py            # Strict environment settings & CORS
│   │   ├── database.py          # SQLite / PostgreSQL adapter layer & migrations
│   │   ├── auth.py              # Cryptographic JWT authentication & multi-tenant isolation
│   │   ├── models.py            # Strict Pydantic models & validation schemas
│   │   ├── model_metadata.json  # Model version, 95.83% accuracy & security disclosure
│   │   ├── routers/
│   │   │   ├── auth.py          # Development & offline session issuance
│   │   │   ├── transactions.py  # CRUD, duplicates check, tags & CSV
│   │   │   ├── analytics.py     # Velocity metrics, tags, categories
│   │   │   ├── predictor.py     # Inference, history, feedback & health
│   │   │   └── smart.py         # Budgets, forecast, goals, recurring & preferences
│   │   └── services/
│   │       ├── predictor.py     # Inference service with uncertainty flag (<60%)
│   │       └── transactions.py  # Safe seeding, rules & duplicate detection
│   ├── scripts/
│   │   └── retrain_model.py     # 80/20 train/test evaluation script (95.83% test acc)
│   └── tests/
│       └── test_api.py          # 18-test pytest suite
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # ErrorBoundary
│   │   │   ├── layout/          # Navbar, CommandPalette, NotificationsBell, Tour, Footer
│   │   │   ├── dashboard/       # KPICard, CashflowChart, Donut, ForecastCard, CoachCards
│   │   │   └── ui/              # Button, Badge, Card, Modal, Toast, Input
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx  # Hero & feature showcase
│   │   │   ├── LoginPage.jsx    # Auth with demo trigger
│   │   │   ├── RegisterPage.jsx # Registration
│   │   │   ├── DashboardPage.jsx# Telemetry dashboard & forecast
│   │   │   ├── TransactionsPage.jsx # Ledger with tags, presets & attachments
│   │   │   ├── PredictorPage.jsx# ML playground & prediction history
│   │   │   ├── BudgetsPage.jsx  # Budgets, recurring automation & goals
│   │   │   └── SettingsPage.jsx # 7-section user control center
│   │   ├── test/                # Vitest test suites
│   │   └── lib/
│   │       ├── api.js           # REST API client with auto-refresh retry
│   │       └── supabase.js      # Supabase client & demo fallback
├── supabase/
│   └── migrations/
│       └── 20261009000000_initial_schema.sql # Complete RLS & indexes migration
├── requirements.txt
├── package.json
└── README.md
```

---

## Organization & Maintenance

- **Organization**: **Vexora Technology**

---

## License & Copyright

This project is licensed under the **MIT License**.

**Copyright © 2026 Vexora Technology . All rights reserved.**
