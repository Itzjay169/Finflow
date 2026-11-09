# Changelog

All notable changes to the FinFlow project are documented in this file.

## [v2.0.0] - Production Hardening, Security Overhaul, TanStack Query & Advanced Telemetry

### Critical Bug Fixes & Accuracy Correction
- **Honest Accuracy Labeling (Bug Fix A)**:
  - Replaced all claims of "99.2% accuracy" across documentation, UI, footers, tours, and models with the honest held-out test accuracy: **Held-out test accuracy: 95.83% on 240 unseen rows** (80/20 train/test split on 1,200 rows; confusion matrix `[[172, 0], [10, 58]]`).
  - Added `backend/app/model_metadata.json` with versioned precision, recall, and scikit-learn metadata.
  - Added standalone retraining evaluation script (`backend/scripts/retrain_model.py`).
  - Added security disclosure regarding untrusted `joblib` deserialization.
- **Production Authentication Security (Bug Fix B & C)**:
  - Fully rewrote `backend/app/auth.py`. Missing `Authorization` header returns structured 401.
  - Removed acceptance of plain token shortcuts (`user_`, `test_user_`, `local_user_`).
  - Removed insecure fallback where empty `SUPABASE_JWT_SECRET` accepted any token.
  - Token signature, expiration (`exp`), and algorithm (`HS256`) explicitly enforced.
  - Demo mode restricted strictly to non-production environments (`development`, `demo`, `test`).
  - Implemented `/api/auth/offline-session` issuing cryptographic development JWTs using `DEV_JWT_SECRET`.
  - Sign-out safely clears all cached auth storage keys (`finflow_auth_session`, `finflow_demo_session`).
- **Supabase Session Token Refresh (Bug Fix D)**:
  - Frontend `api.js` now obtains active tokens via `supabase.auth.getSession()` rather than incorrect localStorage keys.
  - Added automatic token refresh with single retry on 401 unauthorized responses.
- **Supabase Migration Syntax & RLS (Bug Fix E)**:
  - Fixed syntax error in `supabase/migrations/20261009000000_initial_schema.sql` replacing invalid `COALESMENT(...)` with `COALESCE(...)`.
  - Added comprehensive RLS policies (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) for all user-owned tables.
  - Created missing composite indexes for common querying patterns.
- **Database Architecture & Multi-Tenancy (Bug Fix F)**:
  - Unified database adapter layer in `backend/app/database.py` with multi-tenant `user_id` filtering on every query.
  - Added SQLite ephemeral disk reset warning for Render and Railway.
- **Budget Month Calculation Bug (Bug Fix G)**:
  - Fixed `/api/smart/insights` and `/api/budgets` to calculate spending strictly within the budget's month and year instead of all-time spending.
  - Displays all exceeded budgets with category, limit, spent, remaining, and month/year attributes.
- **Non-Destructive Seeding Safety (Bug Fix H)**:
  - `POST /api/transactions/seed-sample` is non-destructive by default (`replace_existing: false`).
  - Requires explicit `confirm: true` before destructive replacement.
  - Added confirmation modal in frontend before initiating any destructive re-seed.
- **Strict Pydantic Input Validation (Bug Fix I)**:
  - Validates positive amounts (`gt=0, le=100_000_000`), ISO dates, and strict Literals for `TransactionType`, `PaymentMode`, and `Frequency`.
- **Prediction History Tracking (Bug Fix J)**:
  - Implemented `prediction_history` database table storing inference inputs, predicted type, confidence, and probabilities.
  - Added `GET /api/predictions/history` with pagination, `DELETE /api/predictions/history/{id}`, and `POST /api/predictions/{id}/feedback`.
  - Added "Recent Predictions History" panel to the Predictor page with manual feedback buttons.

### Settings Control Center Upgrade
- **Complete 7-Card Center**:
  - **Profile**: Full name editing, read-only email display, avatar URL management.
  - **Preferences**: Currency selector (INR, USD, EUR, GBP), locale-aware formatting, theme toggle, accent color picker, density selector, timezone selector.
  - **Financial Defaults**: Default type, payment mode, location, monthly income/expense targets, savings target, and confetti toggle.
  - **Notifications**: Master toggle, budget alerts, recurring bill reminders, goal milestone alerts, quiet hours, and mark all read / clear all.
  - **Data & Privacy**: CSV export, full JSON export, printable PDF report, CSV import with duplicate detection, demo reset modal, and double-confirmation account deletion.
  - **Security**: Active session telemetry, last sign-in timestamp, sign out all devices, and connected auth provider display.
  - **About & Support**: App version, commit, API health status, held-out model accuracy badge (95.83%), legal links, and feedback email mailto link.
  - Persistence via `PUT /api/user/profile` and `GET/PUT /api/user/preferences`.

### New High-Value Features
- **Feature A: Attachments & Notes**: Supported `attachment_url` and expanded 500-character notes in transactions table and modals.
- **Feature B: Tags System**: Multi-tag assignment (`tags` table & column), tag filtering dropdown, and table row tag chips.
- **Feature C: Saved Filters & Views**: One-click saved presets ("Monthly Groceries", "Large Expenses", "Salary Only") and custom filter saving modal.
- **Feature D: Recurring Automation**: "Mark as Paid" action creating a ledger transaction and advancing next due date; upcoming bill horizon filtering (7, 30, 90 days).
- **Feature E: Cash-Flow Forecast**: Algorithmic projection endpoint (`GET /api/analytics/forecast`) projecting 30, 90, and 180-day trajectory.
- **Feature F: Goal Automation & Milestones**: Monthly contribution calculation based on deadline, circular progress ring, and milestone celebration badges.
- **Feature H: Duplicate Detection**: Pre-submission duplicate check warning before saving transactions.
- **Feature I: Dashboard Customization**: Reorderable and toggleable cards persisted to user preferences.
- **Feature J: Advanced Analytics**: Spending velocity (spend per day), largest single expense, and average transaction size metrics.
- **Feature K: AI Financial Coach**: Contextual advice cards with direct action triggers.
- **Feature L: Global Search (Ctrl+K)**: Cross-entity search (pages, transactions, budgets, goals, bills) with keyboard arrow navigation and recent searches.
- **Feature M: Mobile Navigation**: Fixed bottom navigation bar for mobile smartphones.

### Frontend Data Layer (TanStack Query)
- Replaced fragile manual `useEffect` fetching with `@tanstack/react-query`.
- Configured query caching, automatic garbage collection, and mutation-based query invalidation.
- Code-split all top-level routes using `React.lazy` and `Suspense`.

### Cleanup & Removals
- Removed committed `backend/finflow.db` and playwright logs from version control tracking.
- Added `*.db`, `*.sqlite`, `*.sqlite3`, and `backend/finflow.db` to `.gitignore`.
- Removed dead code, unused imports, duplicate exports, and legacy token bypasses.
- Cleaned ruff, vulture, oxlint, and vitest warnings.

---

## [v1.0.0] - Initial Release
- Initial release with React 19, FastAPI, SQLite, RandomForest classifier, and Supabase integration.
