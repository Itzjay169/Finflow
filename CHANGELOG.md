# Changelog

All notable changes to the FinFlow project are documented here.

## [v1.0.0] - Phase 8: Polish, Monitoring, Error Boundary & Test Suite
### Added
- Enterprise error handling with React `ErrorBoundary` and dedicated custom `NotFoundPage` (404).
- Sentry error tracking integration for `@sentry/react` in frontend and `sentry_sdk` in FastAPI backend.
- Comprehensive backend test suite (`backend/tests/test_api.py`) with 9/9 tests passing (health, summary, transactions CRUD, pagination, analytics, CSV export, ML prediction, budgets & goals, and multi-tenant RLS user isolation).
- Complete deployment guides for Vercel (frontend) and Render/Railway (backend with ML model).

## [Phase 7] - Extra Smart Features & Financial Automation
### Added
- Category budgets with animated progress bars dynamically warning (amber at 80%) and alerting (rose at 100%) when limits are exceeded.
- Savings goals tracker with animated SVG circular progress rings, deadline countdowns, and quick "Add Funds" deposit modal.
- Recurring bills tracker with urgency badges ("Due in 3 days", "Due in 7 days", "Overdue").
- Algorithmic Smart Insights engine calculating cashflow velocity, savings rate health, and spending anomalies.
- GitHub-style 120-day daily spending calendar heatmap with multi-level intensity shading.
- Global Command Palette (`Ctrl+K` / `Cmd+K`) supporting page navigation, actions, and instant transactions search.
- Notifications Bell with unread badge counter and categorized alert feed (recurring, budgets, goals, system).
- Full Settings page with name updates, currency selector (INR, USD, EUR, GBP), color accent switcher, CSV/PDF report generation, and account reset.
- Interactive 3-step animated Onboarding Tour for first-time users.

## [Phase 6] - ML Transaction Predictor & Model Insights
### Added
- Real-time inference engine (`/api/predict`) powered by trained `RandomForestClassifier` (18 engineered features, 99.2% benchmark accuracy).
- Model evaluation insights (`/api/model/insights`) returning live confusion matrix, per-class precision/recall, and feature importances.
- Interactive Machine Learning Playground (`/predictor`) with live parameter adjustments, quick test scenario presets, probability split meter, and one-click "Add as Verified Transaction".
- Visual Confusion Matrix heatmap and Gini impurity feature importance bar charts.

## [Phase 5] - Transactions Management Page
### Added
- Complete transaction management table (`/transactions`) with real-time text search, type filters (All, Income, Expense), category filters, and payment mode filters.
- Client-side and server-side sorting by Date and Amount.
- Multi-row bulk selection with batch deletion modal.
- Edit Transaction modal and safe Delete Confirmation dialog.
- Paginated pagination controls with page size selector.
- Direct CSV export downloading filtered or complete transaction archives.

## [Phase 4] - Interactive Analytics Dashboard
### Added
- High-level KPI summary cards for Total Income, Total Expenses, Net Savings, and Savings Rate with MoM trend indicators.
- Interactive Cashflow Bar/Area telemetry using Recharts.
- Category Spending breakdown donut chart with custom tooltips.
- Payment Mode and Geographic Location analytics.
- Recent transactions feed with one-click actions.
- Add Transaction modal with instant confetti celebration on submit.

## [Phase 3] - Data Layer & Core CRUD API
### Added
- Complete SQLite relational data layer matching Supabase schema with transactions, budgets, goals, recurring items, and profiles.
- Automatic dataset seeder importing 1,200 benchmark financial records into the demo account.
- Complete CRUD transaction endpoints and analytics aggregations in FastAPI.
- CSV export endpoint.

## [Phase 2] - Authentication, 3D Hero, Landing & Protected Routing
### Added
- Supabase Auth layer with offline/demo session fallback (`demo@finflow.app` / `Demo@1234`).
- FastAPI JWT verification dependency (`backend/app/auth.py`).
- Interactive Three.js 3D Hero (`@react-three/fiber`) with metallic coin stack reacting to mouse motion.
- High-conversion Landing page with feature matrix and hero metrics.
- Split-layout Login and Register pages with password-strength meter.
- Responsive Navbar with profile dropdown, mobile drawer, and dark/light mode toggle.

## [Phase 1] - Project Setup & Design Architecture
### Added
- Monorepo folder hierarchy: `/backend`, `/frontend`, `/supabase/migrations`, `/docs`.
- Trained `transaction_type_classifier.joblib` with 18 engineered features matching benchmark notebook.
- Design specification (`docs/DESIGN.md`) and project architecture (`docs/PROJECT.md`).
- FastAPI backend skeleton with CORS middleware.
- React frontend scaffold with Tailwind CSS, Framer Motion, and design system tokens.
