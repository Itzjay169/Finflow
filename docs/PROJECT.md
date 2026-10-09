# FinFlow – Personal Finance Tracker: Project Roadmap & Specification

## Architecture Overview
FinFlow is a full-stack personal finance application with machine learning predictions, interactive financial telemetry, real-time budgeting, and automated classification.

```
                      ┌────────────────────────────────────────┐
                      │            Frontend (React)            │
                      │  Vite + Tailwind + Framer Motion       │
                      │  Three.js Hero + Recharts Telemetry    │
                      └──────────────────┬─────────────────────┘
                                         │
                    ┌────────────────────┴─────────────────────┐
                    │                                          │
                    ▼                                          ▼
       ┌────────────────────────┐                 ┌────────────────────────┐
       │     Supabase Auth      │                 │    FastAPI Backend     │
       │   PostgreSQL + RLS     │                 │   JWT Auth Verification│
       │  (Users, Data, Stats)  │                 │   ML Model Inference   │
       └────────────────────────┘                 │   Analytics & Reports  │
                                                  └────────────────────────┘
```

---

## Phase Checklist

- [x] **Phase 1: Project Setup & Design System**
  - [x] Repository structure (/backend, /frontend, /supabase, /docs)
  - [x] Requirements & pinned scikit-learn (1.5.2)
  - [x] Design tokens, CSS variables, reusable components
  - [x] FastAPI skeleton with health check
  - [x] Stitch design research & docs
- [ ] **Phase 2: Authentication & Landing Page**
  - [ ] Supabase Auth integration (email/password, session refresh)
  - [ ] Animated 3D Hero (Three.js / react-three-fiber floating coin stack)
  - [ ] Split-layout Login / Register with password strength meter
  - [ ] Protected routes & session management
- [ ] **Phase 3: Data Layer & Analytics APIs**
  - [ ] Supabase Postgres tables with RLS policies
  - [ ] CSV import & sample data seeder
  - [ ] Summary, CRUD transactions, and analytics endpoints
- [ ] **Phase 4: Dashboard**
  - [ ] Animated KPI cards (Income, Expense, Net Savings, Savings Rate)
  - [ ] Interactive charts (Income vs Expense, category donut, payment mode bar)
  - [ ] Collapsible animated sidebar and responsive views
- [ ] **Phase 5: Transactions Page**
  - [ ] Searchable, filterable, sortable table with sliding pill toggles
  - [ ] Add/Edit/Delete modals with full validation
  - [ ] Bulk select/delete and CSV export
- [ ] **Phase 6: ML Predictor & Model Insights**
  - [ ] Inference endpoint POST /api/predict (exact 18-feature vector)
  - [ ] Interactive predictor UI with confidence gauges
  - [ ] Model Insights tab (accuracy 95.8%, confusion matrix, feature importances)
- [ ] **Phase 7: Smart Features**
  - [ ] Category budgets with alert thresholds
  - [ ] Savings goals with animated progress rings
  - [ ] Spending heatmap calendar & smart insights
  - [ ] PDF report export & global command palette (Ctrl+K)
- [ ] **Phase 8: Polish, Monitoring, Deployment & Docs**
  - [ ] Sentry error monitoring integration
  - [ ] Multi-resolution testing (360px, 768px, 1024px, 1440px)
  - [ ] End-to-end tests
  - [ ] Deployment configs (Vercel frontend, Railway/Render backend)
  - [ ] Demo video/GIF recording & final README

---

## Core API Endpoints
- `GET /health` - Service health status
- `GET /api/summary` - Financial KPIs
- `GET /api/transactions` - Filtered & paginated transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/{id}` - Update transaction
- `DELETE /api/transactions/{id}` - Delete transaction
- `POST /api/transactions/bulk-delete` - Bulk delete
- `POST /api/transactions/seed-sample` - Load 1,200 demo transactions
- `GET /api/analytics/monthly` - Monthly income vs expense
- `GET /api/analytics/category` - Category spending breakdown
- `GET /api/analytics/payment-mode` - Payment mode breakdown
- `GET /api/analytics/location` - Geographical expense distribution
- `POST /api/predict` - ML prediction with confidence score
- `GET /api/model/insights` - Accuracy, confusion matrix, feature importance
