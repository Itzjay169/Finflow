const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function getAuthHeaders() {
  // Try Supabase session first
  const supabaseSession = localStorage.getItem('sb-session')
  if (supabaseSession) {
    try {
      const parsed = JSON.parse(supabaseSession)
      if (parsed?.access_token) {
        return { Authorization: `Bearer ${parsed.access_token}` }
      }
    } catch {}
  }

  // Try local/demo session
  const demoSession = localStorage.getItem('finflow_demo_session')
  if (demoSession) {
    try {
      const parsed = JSON.parse(demoSession)
      if (parsed?.session?.access_token) {
        return { Authorization: `Bearer ${parsed.session.access_token}` }
      }
    } catch {}
  }

  return {}
}

async function apiFetch(path, options = {}) {
  const { method = 'GET', body, params } = options

  let url = `${API_BASE}${path}`
  if (params) {
    const sp = new URLSearchParams()
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== '' && val !== 'all') {
        sp.set(key, String(val))
      }
    }
    const qs = sp.toString()
    if (qs) url += `?${qs}`
  }

  const headers = {
    ...getAuthHeaders(),
    ...(body ? { 'Content-Type': 'application/json' } : {}),
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(errData.detail || `API Error: ${res.status}`)
  }

  // CSV responses
  if (res.headers.get('content-type')?.includes('text/csv')) {
    return res.text()
  }

  return res.json()
}

// === Health ===
export const checkHealth = () => apiFetch('/health')

// === Summary ===
export const getSummary = () => apiFetch('/api/summary')

// === Transactions ===
export const getTransactions = (params) =>
  apiFetch('/api/transactions', { params })

export const createTransaction = (data) =>
  apiFetch('/api/transactions', { method: 'POST', body: data })

export const updateTransaction = (id, data) =>
  apiFetch(`/api/transactions/${id}`, { method: 'PUT', body: data })

export const deleteTransaction = (id) =>
  apiFetch(`/api/transactions/${id}`, { method: 'DELETE' })

export const bulkDeleteTransactions = (ids) =>
  apiFetch('/api/transactions/bulk-delete', {
    method: 'POST',
    body: { transaction_ids: ids },
  })

export const seedSampleData = () =>
  apiFetch('/api/transactions/seed-sample', { method: 'POST' })

export const exportTransactionsCsv = () =>
  apiFetch('/api/transactions/export-csv')

// === Analytics ===
export const getMonthlyAnalytics = () => apiFetch('/api/analytics/monthly')
export const getCategoryAnalytics = () => apiFetch('/api/analytics/category')
export const getPaymentModeAnalytics = () => apiFetch('/api/analytics/payment-mode')
export const getLocationAnalytics = () => apiFetch('/api/analytics/location')
export const getTrends = () => apiFetch('/api/analytics/trends')

// === Predict (Phase 6) ===
export const predict = (data) =>
  apiFetch('/api/predict', { method: 'POST', body: data })

export const getModelInsights = () => apiFetch('/api/model/insights')

// === Phase 7: Smart Features ===
export const getBudgets = (params) => apiFetch('/api/budgets', { params })
export const createOrUpdateBudget = (data) =>
  apiFetch('/api/budgets', { method: 'POST', body: data })
export const deleteBudget = (id) =>
  apiFetch(`/api/budgets/${id}`, { method: 'DELETE' })

export const getGoals = () => apiFetch('/api/goals')
export const createGoal = (data) =>
  apiFetch('/api/goals', { method: 'POST', body: data })
export const contributeToGoal = (id, amount) =>
  apiFetch(`/api/goals/${id}/contribute`, { method: 'POST', body: { amount } })
export const deleteGoal = (id) =>
  apiFetch(`/api/goals/${id}`, { method: 'DELETE' })

export const getRecurring = () => apiFetch('/api/recurring')
export const createRecurring = (data) =>
  apiFetch('/api/recurring', { method: 'POST', body: data })
export const deleteRecurring = (id) =>
  apiFetch(`/api/recurring/${id}`, { method: 'DELETE' })

export const getSmartInsights = () => apiFetch('/api/smart/insights')
export const getDailyHeatmap = (days = 180) =>
  apiFetch('/api/analytics/daily-heatmap', { params: { days } })

export const getNotifications = () => apiFetch('/api/notifications')
export const markNotificationRead = (id) =>
  apiFetch(`/api/notifications/${id}/read`, { method: 'POST' })
export const markAllNotificationsRead = () =>
  apiFetch('/api/notifications/read-all', { method: 'POST' })

export const getUserProfile = () => apiFetch('/api/user/profile')
export const updateUserProfile = (data) =>
  apiFetch('/api/user/profile', { method: 'PUT', body: data })

