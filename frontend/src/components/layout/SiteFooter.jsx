import React, { useState, useEffect, useId } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  TrendingUp,
  ArrowUp,
  ExternalLink,
  ChevronDown,
  Mail,
  Globe,
  Database,
  Cpu,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { siteConfig, getCopyrightYear, TECH_CREDITS } from '../../config/site'

const GithubIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      clipRule="evenodd"
    />
  </svg>
)

const LinkedinIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
)

const XIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)


/**
 * Hook to measure and poll API health latency with tab-visibility awareness
 */
function useApiHealth() {
  const [status, setStatus] = useState({
    state: 'loading', // 'healthy' | 'error' | 'loading'
    latency: null,
  })

  useEffect(() => {
    let timerId = null
    let abortController = null

    const checkStatus = async () => {
      if (document.hidden) return // Paused while tab is hidden

      const startTime = performance.now()
      abortController = new AbortController()
      const timeoutId = setTimeout(() => {
        if (abortController) abortController.abort()
      }, 5000)

      try {
        const res = await fetch(`${siteConfig.apiBaseUrl}/health`, {
          signal: abortController.signal,
          headers: { Accept: 'application/json' },
        })
        clearTimeout(timeoutId)
        const endTime = performance.now()
        if (res.ok) {
          const latencyMs = Math.round(endTime - startTime)
          setStatus({ state: 'healthy', latency: latencyMs })
        } else {
          setStatus({ state: 'error', latency: null })
        }
      } catch {
        setStatus({ state: 'error', latency: null })
      }
    }

    checkStatus()
    timerId = setInterval(checkStatus, 60000) // Poll every 60s

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkStatus()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (timerId) clearInterval(timerId)
      if (abortController) abortController.abort()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return status
}

/**
 * Hook to fetch public model summary for telemetry badge
 */
function useModelSummary() {
  const [modelSummary, setModelSummary] = useState(null)

  useEffect(() => {
    let isMounted = true
    const fetchSummary = async () => {
      try {
        const res = await fetch(`${siteConfig.apiBaseUrl}/api/model/summary`, {
          headers: { Accept: 'application/json' },
        })
        if (res.ok && isMounted) {
          const data = await res.json()
          setModelSummary(data)
        }
      } catch {
        // Hide badge if call fails
        if (isMounted) setModelSummary(null)
      }
    }
    fetchSummary()
    return () => {
      isMounted = false
    }
  }, [])

  return modelSummary
}

export function SiteFooter({ variant: forcedVariant }) {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const health = useApiHealth()
  const modelSummary = useModelSummary()
  const shouldReduceMotion = useReducedMotion()

  // State for mobile accordion expand/collapse
  const [openAccordions, setOpenAccordions] = useState({})

  const toggleAccordion = (key) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  // Determine variant: full or compact
  const currentPath = location.pathname
  const fullPaths = ['/', '/privacy', '/terms', '/disclaimer', '/cookies']
  const isFullVariant =
    forcedVariant === 'full' ||
    (!forcedVariant && (fullPaths.includes(currentPath) || currentPath === '/404'))

  const currentYearDisplay = getCopyrightYear()

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
    })
  }

  // Animation variants respecting prefers-reduced-motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  }

  const itemVariants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: 'easeOut' },
    },
  }

  // Build metadata injected at build time
  const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'
  const commitSha = typeof __COMMIT_SHA__ !== 'undefined' ? __COMMIT_SHA__ : 'dev'
  const buildDate = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '2026-10-10'

  // Product links (only real defined pages from router)
  const productLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Transactions', path: '/transactions' },
    { label: 'Budgets & Goals', path: '/budgets' },
    { label: 'ML Predictor', path: '/predictor' },
  ]

  // Resource links (omits any link if env var is empty)
  const resourceLinks = [
    ...(siteConfig.apiDocsEnabled
      ? [{ label: 'API Documentation', href: `${siteConfig.apiBaseUrl}/docs`, external: true }]
      : []),
    ...(siteConfig.repoUrl
      ? [
          { label: 'GitHub Repository', href: siteConfig.repoUrl, external: true },
          { label: 'Setup Guide', href: `${siteConfig.repoUrl}#quick-start`, external: true },
          { label: 'Report an Issue', href: `${siteConfig.repoUrl}/issues`, external: true },
        ]
      : []),
    ...(siteConfig.changelogUrl
      ? [{ label: 'Changelog', href: siteConfig.changelogUrl, external: true }]
      : []),
  ]

  // Legal links
  const legalLinks = [
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Terms of Use', path: '/terms' },
    { label: 'Financial Disclaimer', path: '/disclaimer' },
    { label: 'Cookie Notice', path: '/cookies' },
  ]

  // Social links
  const socialLinks = [
    siteConfig.githubUrl && { name: 'GitHub', icon: GithubIcon, href: siteConfig.githubUrl },
    siteConfig.linkedinUrl && { name: 'LinkedIn', icon: LinkedinIcon, href: siteConfig.linkedinUrl },
    siteConfig.xUrl && { name: 'X', icon: XIcon, href: siteConfig.xUrl },
    siteConfig.portfolioUrl && { name: 'Portfolio', icon: Globe, href: siteConfig.portfolioUrl },
  ].filter(Boolean)


  const productAccordionId = useId()
  const resourceAccordionId = useId()
  const legalAccordionId = useId()
  const contactAccordionId = useId()

  // Status Pill Component
  const StatusPill = () => (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm"
    >
      <span className="relative flex h-2 w-2">
        {health.state === 'healthy' ? (
          <>
            {!shouldReduceMotion && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </>
        ) : (
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
        )}
      </span>
      <span>
        {health.state === 'healthy'
          ? `All systems operational · ${health.latency || 12} ms`
          : 'API unreachable'}
      </span>
    </div>
  )

  // COMPACT VARIANT (for auth pages and inside authenticated app shell)
  if (!isFullVariant) {
    return (
      <footer
        data-testid="site-footer-compact"
        className="relative z-10 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#080C14]/80 backdrop-blur-md pt-5 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-6 transition-colors"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            {/* Copyright & Owner */}
            <div className="text-center md:text-left">
              <span>
                &copy; {currentYearDisplay} {siteConfig.ownerName}. All rights reserved.
              </span>
            </div>

            {/* Status Pill */}
            <div className="flex items-center justify-center">
              <StatusPill />
            </div>

            {/* Legal Quick Links + Back to Top */}
            <div className="flex items-center flex-wrap justify-center gap-4">
              <nav aria-label="Footer Legal Links" className="flex items-center gap-3">
                <Link
                  to="/privacy"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none rounded transition-colors"
                >
                  Privacy
                </Link>
                <span>&bull;</span>
                <Link
                  to="/terms"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none rounded transition-colors"
                >
                  Terms
                </Link>
                <span>&bull;</span>
                <Link
                  to="/disclaimer"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none rounded transition-colors"
                >
                  Disclaimer
                </Link>
              </nav>

              <button
                type="button"
                onClick={scrollToTop}
                aria-label="Back to top"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none transition-all cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Top</span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    )
  }

  // FULL VARIANT (for Landing, Legal pages, 404)
  return (
    <footer
      data-testid="site-footer-full"
      className="relative z-10 mt-16 border-t border-slate-200 dark:border-slate-800/90 bg-white/85 dark:bg-[#080C14]/90 backdrop-blur-xl transition-colors"
    >
      {/* Gradient Top Border Accent */}
      <div className="h-0.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-12"
        >
          {/* Main 5-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
            {/* 1. Brand Block */}
            <motion.div variants={itemVariants} className="space-y-4 sm:col-span-2 lg:col-span-1">
              <Link
                to={isAuthenticated ? '/dashboard' : '/'}
                className="inline-flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none rounded-xl"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  {siteConfig.name}
                </span>
              </Link>

              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {siteConfig.tagline}
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {siteConfig.description}
              </p>

              <div className="pt-2">
                <StatusPill />
              </div>
            </motion.div>

            {/* 2. Product Column */}
            <motion.div variants={itemVariants} className="space-y-3">
              {/* Desktop / Tablet Header */}
              <h2 className="hidden sm:block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Product
              </h2>

              {/* Mobile Accordion Header */}
              <button
                type="button"
                onClick={() => toggleAccordion('product')}
                aria-expanded={Boolean(openAccordions.product)}
                aria-controls={productAccordionId}
                className="sm:hidden w-full flex items-center justify-between py-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 cursor-pointer"
              >
                <span>Product</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${openAccordions.product ? 'rotate-180' : ''}`}
                />
              </button>

              <nav
                id={productAccordionId}
                aria-label="Product Navigation"
                className={`${openAccordions.product ? 'block' : 'hidden'} sm:block`}
              >
                <ul className="space-y-2 text-xs">
                  {productLinks.map((link) => {
                    // Signed-out user clicking goes to Login and returns to destination
                    const toTarget = isAuthenticated
                      ? link.path
                      : { pathname: '/login', state: { from: { pathname: link.path } } }
                    return (
                      <li key={link.path}>
                        <Link
                          to={toTarget}
                          className="group relative inline-block text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none rounded py-0.5"
                        >
                          <span>{link.label}</span>
                          <span className="block h-0.5 max-w-0 group-hover:max-w-full transition-all duration-300 bg-indigo-500" />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>
            </motion.div>

            {/* 3. Resources Column */}
            <motion.div variants={itemVariants} className="space-y-3">
              <h2 className="hidden sm:block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Resources
              </h2>

              <button
                type="button"
                onClick={() => toggleAccordion('resources')}
                aria-expanded={Boolean(openAccordions.resources)}
                aria-controls={resourceAccordionId}
                className="sm:hidden w-full flex items-center justify-between py-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 cursor-pointer"
              >
                <span>Resources</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${openAccordions.resources ? 'rotate-180' : ''}`}
                />
              </button>

              <nav
                id={resourceAccordionId}
                aria-label="Resources Navigation"
                className={`${openAccordions.resources ? 'block' : 'hidden'} sm:block`}
              >
                <ul className="space-y-2 text-xs">
                  {resourceLinks.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none rounded py-0.5"
                      >
                        <span>{link.label}</span>
                        <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </motion.div>

            {/* 4. Legal Column */}
            <motion.div variants={itemVariants} className="space-y-3">
              <h2 className="hidden sm:block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Legal & Governance
              </h2>

              <button
                type="button"
                onClick={() => toggleAccordion('legal')}
                aria-expanded={Boolean(openAccordions.legal)}
                aria-controls={legalAccordionId}
                className="sm:hidden w-full flex items-center justify-between py-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 cursor-pointer"
              >
                <span>Legal</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${openAccordions.legal ? 'rotate-180' : ''}`}
                />
              </button>

              <nav
                id={legalAccordionId}
                aria-label="Legal Navigation"
                className={`${openAccordions.legal ? 'block' : 'hidden'} sm:block`}
              >
                <ul className="space-y-2 text-xs">
                  {legalLinks.map((link) => (
                    <li key={link.path}>
                      <Link
                        to={link.path}
                        className="group relative inline-block text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none rounded py-0.5"
                      >
                        <span>{link.label}</span>
                        <span className="block h-0.5 max-w-0 group-hover:max-w-full transition-all duration-300 bg-indigo-500" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </motion.div>

            {/* 5. Contact Column */}
            <motion.div variants={itemVariants} className="space-y-3">
              <h2 className="hidden sm:block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Connect
              </h2>

              <button
                type="button"
                onClick={() => toggleAccordion('contact')}
                aria-expanded={Boolean(openAccordions.contact)}
                aria-controls={contactAccordionId}
                className="sm:hidden w-full flex items-center justify-between py-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 cursor-pointer"
              >
                <span>Connect</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${openAccordions.contact ? 'rotate-180' : ''}`}
                />
              </button>

              <nav
                id={contactAccordionId}
                aria-label="Contact Navigation"
                className={`${openAccordions.contact ? 'block' : 'hidden'} sm:block space-y-3`}
              >
                {siteConfig.contactEmail && (
                  <div>
                    <a
                      href={`mailto:${siteConfig.contactEmail}`}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none rounded transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{siteConfig.contactEmail}</span>
                    </a>
                  </div>
                )}

                {/* Social icons row */}
                {socialLinks.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    {socialLinks.map((item) => (
                      <motion.a
                        key={item.name}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label={`${item.name} (opens in a new tab)`}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-500/10 dark:bg-slate-900/90 dark:hover:bg-indigo-500/20 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none transition-colors"
                      >
                        <item.icon className="w-3.5 h-3.5" />
                        <span className="sr-only">{item.name}</span>
                      </motion.a>
                    ))}
                  </div>
                )}

                {/* Made in India badge */}
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                    <span role="img" aria-label="India flag">
                      🇮🇳
                    </span>
                    Made in India
                  </span>
                </div>
              </nav>
            </motion.div>
          </div>

          {/* 6. Project Details Strip */}
          <motion.div
            variants={itemVariants}
            className="pt-6 border-t border-slate-200 dark:border-slate-800/80"
          >
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                v{appVersion}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                commit: {commitSha}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                build: {buildDate}
              </span>

              {/* Model Badge (fed from public GET /api/model/summary, hidden if fails) */}
              {modelSummary && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold">
                  <Cpu className="w-3 h-3" />
                  {modelSummary.badge_text || 'RandomForest · 18 features · 95.8% accuracy'}
                </span>
              )}

              {/* Dataset Badge */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <Database className="w-3 h-3 text-cyan-500" />
                1,200 sample transactions · 14 categories · 6 payment modes · 10 cities
              </span>

              {/* Currency Badge */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                INR (₹)
              </span>
            </div>
          </motion.div>

          {/* 7. Tech Credits Row */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400"
          >
            <span className="font-semibold text-slate-700 dark:text-slate-300">Built with:</span>
            {TECH_CREDITS.map((tech, index) => (
              <React.Fragment key={tech.name}>
                <a
                  href={tech.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none rounded transition-colors inline-flex items-center"
                >
                  {tech.name}
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
                {index < TECH_CREDITS.length - 1 && <span className="text-slate-300 dark:text-slate-700">&bull;</span>}
              </React.Fragment>
            ))}
          </motion.div>

          {/* 8. Bottom Bar: Copyright claim & Back to Top */}
          <motion.div
            variants={itemVariants}
            className="pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400"
          >
            <div className="space-y-1 text-center md:text-left">
              {/* Line 1 */}
              <p className="font-medium text-slate-700 dark:text-slate-300">
                &copy; {currentYearDisplay} {siteConfig.ownerName}. All rights reserved.
              </p>
              {/* Line 2 */}
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
                FinFlow, its source code, design, text and graphics are the property of {siteConfig.ownerName}. Copying, distributing or reusing any part without written permission is prohibited. Third-party libraries and fonts remain under their own licenses.
              </p>
            </div>

            {/* Back to top button */}
            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Back to top"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none transition-all cursor-pointer shrink-0 shadow-sm"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Back to top</span>
            </button>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  )
}
export default SiteFooter
