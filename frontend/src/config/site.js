/**
 * FinFlow Site & Brand Configuration
 * Centralized configuration source reading environment variables.
 * No personal data is hardcoded; if an environment variable is empty, the link is omitted.
 */

export const FIRST_YEAR = 2026

export const siteConfig = {
  name: 'FinFlow',
  logoUrl: '/logo.png',
  tagline: 'Track every rupee. Predict every move.',
  description:
    'FinFlow is an enterprise-grade personal finance management and intelligence platform. It pairs high-velocity cashflow telemetry with trained machine learning inference to help you monitor, project, and master your financial future.',
  ownerName: import.meta.env.VITE_OWNER_NAME || 'FinFlow',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || '',
  githubUrl: import.meta.env.VITE_GITHUB_URL || 'https://github.com/Itzjay169/Finflow',
  linkedinUrl: import.meta.env.VITE_LINKEDIN_URL || '',
  xUrl: import.meta.env.VITE_X_URL || '',
  portfolioUrl: import.meta.env.VITE_PORTFOLIO_URL || '',
  repoUrl: import.meta.env.VITE_REPO_URL || 'https://github.com/Itzjay169/Finflow',
  changelogUrl: import.meta.env.VITE_CHANGELOG_URL || '',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
  apiDocsEnabled: true, // FastAPI /docs enabled
}

/**
 * Computes dynamic copyright year string:
 * "2026" during 2026, "2026–{currentYear}" in subsequent years.
 */
export function getCopyrightYear(currentDate = new Date()) {
  const currentYear = currentDate.getFullYear()
  if (currentYear <= FIRST_YEAR) {
    return `${FIRST_YEAR}`
  }
  return `${FIRST_YEAR}–${currentYear}`
}

/**
 * Verified technologies listed in package.json & requirements.txt
 */
export const TECH_CREDITS = [
  { name: 'React', url: 'https://react.dev' },
  { name: 'Vite', url: 'https://vite.dev' },
  { name: 'Tailwind CSS', url: 'https://tailwindcss.com' },
  { name: 'Framer Motion', url: 'https://motion.dev' },
  { name: 'Recharts', url: 'https://recharts.org' },
  { name: 'Three.js', url: 'https://threejs.org' },
  { name: 'FastAPI', url: 'https://fastapi.tiangolo.com' },
  { name: 'Supabase', url: 'https://supabase.com' },
  { name: 'scikit-learn', url: 'https://scikit-learn.org' },
]
