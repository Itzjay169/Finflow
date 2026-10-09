# Architectural & Engineering Decisions (FinFlow)

---

## 1. Stack Selection
- **Frontend**: React 18 / 19 with Vite, Tailwind CSS, Framer Motion, Recharts, Lucide React, React Router 6/7, Three.js (@react-three/fiber + @react-three/drei).
- **Backend**: FastAPI (Python 3.11), Uvicorn, Pandas, Scikit-learn, Joblib, PyJWT, Cryptography, Pydantic v2.
- **Database & Auth**: Supabase Postgres with Row Level Security (RLS) enabled on all tables, Supabase Auth (JWT tokens verified server-side on FastAPI with RS256/HS256 fallback).
- **Monitoring**: Sentry (`@sentry/react` & `sentry-sdk[fastapi]`).

---

## 2. Machine Learning Pipeline & Pinned Dependencies
- **Scikit-learn Version**: Pinned strictly to `1.5.2` (the exact version matching the Colab training pipeline).
- **Model Architecture**: `RandomForestClassifier(random_state=42)` trained on 80/20 train/test split.
- **Model Output Metrics**:
  - Overall Accuracy: `95.83%` (0.9583333333333334)
  - Confusion Matrix: `[[172, 0], [10, 58]]`
  - Expense Class (False): Precision `0.95`, Recall `1.00`, F1 `0.97`
  - Income Class (True): Precision `1.00`, Recall `0.85`, F1 `0.92`
- **18 Feature Vector Order (Strictly Enforced)**:
  1. `amount` (float/int)
  2. `year` (int)
  3. `month` (1-12)
  4. `day_of_week` (0=Monday, 6=Sunday)
  5. `payment_mode_Cash`
  6. `payment_mode_Credit Card`
  7. `payment_mode_Debit Card`
  8. `payment_mode_Net Banking`
  9. `payment_mode_UPI`
  10. `location_Bangalore`
  11. `location_Bhubaneswar`
  12. `location_Chennai`
  13. `location_Delhi`
  14. `location_Hyderabad`
  15. `location_Jaipur`
  16. `location_Kolkata`
  17. `location_Mumbai`
  18. `location_Pune`
  *(Baselines dropped due to `drop_first=True`: payment_mode = `Bank Transfer`, location = `Ahmedabad`).*

---

## 3. Database & Security Model
- All tables must include `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`.
- Row Level Security (RLS) enabled on all public tables:
  `CREATE POLICY user_isolation ON <table> FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`
- Supabase JWT verified on every FastAPI protected endpoint via `Depends(get_current_user)`.
- Fallback local development database supported via SQLite if Supabase credentials are not provided.

---

## 4. UI/UX & Responsive Design
- Glassmorphic translucent cards with light and dark mode toggles via CSS variables.
- Indian Rupee currency standard (`en-IN` grouping: e.g. `₹1,23,456.00`).
- Responsive breakpoints tested at 360px (mobile), 768px (tablet), 1024px (laptop), 1440px (desktop).
