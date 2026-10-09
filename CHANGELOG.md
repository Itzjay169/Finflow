# Changelog

All notable changes to the FinFlow project are documented here.

## [Phase 2] - Authentication, 3D Hero, Landing & Protected Routing
### Added
- Complete Supabase Auth layer (`frontend/src/context/AuthContext.jsx` & `frontend/src/lib/supabase.js`) supporting live Supabase and immediate offline/demo fallback.
- Backend FastAPI JWT verification dependency (`backend/app/auth.py`) decoding Supabase HS256 tokens and developer demo sessions.
- Interactive Three.js 3D Hero with `@react-three/fiber` & `@react-three/drei` displaying a floating rotating metallic coin stack reacting to mouse position, with lightweight 2.5D SVG fallback on mobile or reduced-motion devices.
- High-conversion Landing page with hero section, metrics counters (95.8% accuracy, 1,200 rows, 18 features), feature matrix, and demo launch CTA.
- Split-layout Login and Register pages featuring animated feature ticker, live password-strength meter, inline validation, and one-click demo login (`demo@finflow.app` / `Demo@1234`).
- Responsive Navbar with avatar initials, profile dropdown (Settings / Sign Out), theme switcher, and mobile hamburger drawer.
- Multi-breakpoint visual verification at 360px, 768px, 1024px, and 1440px via Playwright.

## [Phase 1] - Project Setup & Design Architecture
### Added
- Monorepo folder hierarchy: `/backend`, `/frontend`, `/supabase/migrations`, `/docs`.
- Pinned `scikit-learn==1.5.2` and trained the exact `transaction_type_classifier.joblib` (95.83% accuracy, identical confusion matrix and 18-feature order).
- Complete design specification (`docs/DESIGN.md`) synthesized from Stitch concepts with dark/light themes, glassmorphism, and Indian Rupee typography.
- Architecture documentation (`docs/PROJECT.md`) and engineering decision records (`docs/DECISIONS.md`).
- Environment variable schemas (`.env.example`) and git repository setup.
- FastAPI backend skeleton with health-check and CORS middleware.
- React frontend scaffold with Tailwind CSS, Framer Motion, and reusable component library.
