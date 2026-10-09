# Changelog

All notable changes to the FinFlow project are documented here.

## [Phase 1] - Project Setup & Design Architecture
### Added
- Monorepo folder hierarchy: `/backend`, `/frontend`, `/supabase/migrations`, `/docs`.
- Pinned `scikit-learn==1.5.2` and trained the exact `transaction_type_classifier.joblib` (95.83% accuracy, identical confusion matrix and 18-feature order).
- Complete design specification (`docs/DESIGN.md`) synthesized from Stitch concepts with dark/light themes, glassmorphism, and Indian Rupee typography.
- Architecture documentation (`docs/PROJECT.md`) and engineering decision records (`docs/DECISIONS.md`).
- Environment variable schemas (`.env.example`) and git repository setup.
- FastAPI backend skeleton with health-check and CORS middleware.
- React frontend scaffold with Tailwind CSS, Framer Motion, and reusable component library.
