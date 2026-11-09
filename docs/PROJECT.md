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
- [x] **Phase 2: Authentication & Landing Page**
  - [x] Supabase Auth integration (email/password, session refresh) + demo mode
  - [x] Animated 3D Hero (Three.js / react-three-fiber floating coin stack)
  - [x] Split-layout Login / Register with password strength meter
  - [x] Protected routes & session management
- [x] **Phase 3: Data Layer & Analytics APIs**
  - [x] SQLite / Supabase Postgres tables with schema matching
  - [x] CSV import & 1,200 sample data seeder
  - [x] Summary, CRUD transactions, and analytics endpoints
  - [x] 6/6 test pass
- [x] **Phase 4: Dashboard**
  - [x] Animated KPI cards (Income, Expense, Net Savings, Savings Rate)
  - [x] Interactive Recharts (cashflow area/bar, category donut, payment mode, location)
  - [x] Recent transactions feed and Add Transaction modal with confetti
- [x] **Phase 5: Transactions Page**
  - [x] Searchable, filterable, sortable table with multi-filters
  - [x] Add/Edit/Delete modals with full validation
  - [x] Bulk select/delete and direct CSV export
  - [x] Pagination with page size selector
- [x] **Phase 6: ML Predictor & Model Insights**
  - [x] Inference endpoint POST /api/predict (exact 18-feature vector, Held-out test accuracy: 95.83% on 240 unseen rows)
  - [x] Interactive predictor playground with confidence and probability split meter
  - [x] Quick "Add as Verified Transaction" action
  - [x] Model Insights (confusion matrix, precision/recall, feature importances)
- [x] **Phase 7: Smart Features**
  - [x] Category budgets with dynamic alert thresholds (amber/rose)
  - [x] Savings goals with animated SVG progress rings & deposit action
  - [x] Recurring bills tracker with due date countdown badges
  - [x] Daily spending activity heatmap (GitHub-style 120-day grid)
  - [x] Algorithmic smart financial insights engine
  - [x] Global Command Palette (Ctrl+K)
  - [x] Notifications bell with unread dropdown
  - [x] Settings page with currency selector, accent color picker, and exports
  - [x] Animated onboarding tour for first-time visitors
- [x] **Phase 8: Polish, Monitoring, Deployment & Docs**
  - [x] Enterprise error boundary & custom 404 page
  - [x] Sentry monitoring integration
  - [x] 9/9 automated pytest test suite passed (including multi-tenant isolation)
  - [x] Complete README.md and CHANGELOG.md documentation
  - [x] Full deployment guides for Vercel and Render/Railway
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
