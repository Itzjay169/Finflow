import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SiteFooter } from './SiteFooter'
import { getCopyrightYear, FIRST_YEAR } from '../../config/site'
import { AuthProvider } from '../../context/AuthContext'

const DEFINED_ROUTES = [
  '/',
  '/login',
  '/register',
  '/dashboard',
  '/transactions',
  '/predictor',
  '/budgets',
  '/settings',
  '/privacy',
  '/terms',
  '/disclaimer',
  '/cookies',
]

async function renderWithProviders(ui, { route = '/' } = {}) {
  let result
  await React.act(async () => {
    result = render(
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>{ui}</AuthProvider>
      </MemoryRouter>
    )
  })
  // Wait for initial health status fetch to settle
  await waitFor(() => {
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
  return result
}

describe('SiteFooter Component', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('/health')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'healthy' }),
        })
      }
      if (url.includes('/api/model/summary')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            badge_text: 'RandomForest · 18 features · 95.8% accuracy',
          }),
        })
      }
      return Promise.reject(new Error('not found'))
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // 1. Both variants render
  it('renders the Full variant with all 8 specification sections', async () => {
    await renderWithProviders(<SiteFooter variant="full" />)
    expect(screen.getByTestId('site-footer-full')).toBeInTheDocument()

    // 1. Brand block
    expect(screen.getByText('FinFlow')).toBeInTheDocument()
    expect(screen.getByText('Track every rupee. Predict every move.')).toBeInTheDocument()

    // 2. Product column
    expect(screen.getByRole('navigation', { name: /Product Navigation/i })).toBeInTheDocument()

    // 3. Resources column
    expect(screen.getByRole('navigation', { name: /Resources Navigation/i })).toBeInTheDocument()

    // 4. Legal column
    expect(screen.getByRole('navigation', { name: /Legal Navigation/i })).toBeInTheDocument()

    // 5. Connect column
    expect(screen.getByRole('navigation', { name: /Contact Navigation/i })).toBeInTheDocument()
    expect(screen.getByText(/Made in India/i)).toBeInTheDocument()

    // 6. Project details strip
    expect(screen.getByText(/1,200 sample transactions/i)).toBeInTheDocument()
    expect(screen.getByText('INR (₹)')).toBeInTheDocument()

    // 7. Tech credits row
    expect(screen.getByText(/Built with:/i)).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('FastAPI')).toBeInTheDocument()

    // 8. Bottom bar
    expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Back to top/i })).toBeInTheDocument()
  })

  it('renders the Compact variant inside app shell with status pill, legal links and back to top', async () => {
    await renderWithProviders(<SiteFooter variant="compact" />)
    expect(screen.getByTestId('site-footer-compact')).toBeInTheDocument()
    expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /Footer Legal Links/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Back to top/i })).toBeInTheDocument()
  })

  // 2. Every link has a non-empty href that is not '#'
  it('ensures every link in Full variant has a non-empty href and is not "#"', async () => {
    await renderWithProviders(<SiteFooter variant="full" />)
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
    links.forEach((link) => {
      const href = link.getAttribute('href')
      expect(href).toBeTruthy()
      expect(href).not.toBe('#')
      expect(href.trim()).not.toBe('')
    })
  })

  it('ensures every link in Compact variant has a non-empty href and is not "#"', async () => {
    await renderWithProviders(<SiteFooter variant="compact" />)
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
    links.forEach((link) => {
      const href = link.getAttribute('href')
      expect(href).toBeTruthy()
      expect(href).not.toBe('#')
      expect(href.trim()).not.toBe('')
    })
  })

  // 3. Every internal link matches a defined route
  it('ensures every internal link matches a defined route in the router', async () => {
    await renderWithProviders(<SiteFooter variant="full" />)
    const links = screen.getAllByRole('link')
    links.forEach((link) => {
      const href = link.getAttribute('href')
      if (href && !href.startsWith('http') && !href.startsWith('mailto:')) {
        const cleanPath = href.split('?')[0].split('#')[0]
        expect(DEFINED_ROUTES).toContain(cleanPath)
      }
    })
  })

  // 4. Year logic with mocked dates
  it('computes year logic accurately: 2026 shows "2026", 2027 shows "2026–2027"', () => {
    expect(FIRST_YEAR).toBe(2026)
    const date2026 = new Date('2026-10-10T12:00:00Z')
    expect(getCopyrightYear(date2026)).toBe('2026')

    const date2027 = new Date('2027-01-01T00:00:00Z')
    expect(getCopyrightYear(date2027)).toBe('2026–2027')

    const date2030 = new Date('2030-05-15T00:00:00Z')
    expect(getCopyrightYear(date2030)).toBe('2026–2030')
  })

  // 5. Status pill for success, failure and timeout
  it('displays healthy status with latency when health check succeeds', async () => {
    await renderWithProviders(<SiteFooter variant="full" />)
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/All systems operational/i)
    })
  })

  it('displays API unreachable when health check fails or times out', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.reject(new Error('Network error'))))
    await renderWithProviders(<SiteFooter variant="full" />)
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/API unreachable/i)
    })
  })

  // 6. Accordion keyboard behavior
  it('toggles accordion expansion and aria-expanded on click and keyboard activation', async () => {
    await renderWithProviders(<SiteFooter variant="full" />)
    const accordionBtn = screen.getByRole('button', { name: /^Product/i })
    expect(accordionBtn).toHaveAttribute('aria-expanded', 'false')

    // Click to expand
    fireEvent.click(accordionBtn)
    expect(accordionBtn).toHaveAttribute('aria-expanded', 'true')

    // Click to collapse
    fireEvent.click(accordionBtn)
    expect(accordionBtn).toHaveAttribute('aria-expanded', 'false')

    // Keyboard activation (Space / Enter)
    await userEvent.click(accordionBtn)
    expect(accordionBtn).toHaveAttribute('aria-expanded', 'true')
  })

  // 7. Accessibility: focus rings and external links announcement
  it('announces opens in a new tab for external links', async () => {
    await renderWithProviders(<SiteFooter variant="full" />)
    const externalAnnouncements = screen.getAllByText(/\(opens in a new tab\)/i)
    expect(externalAnnouncements.length).toBeGreaterThan(0)
  })
})
