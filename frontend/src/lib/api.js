import { isLiveSupabase, supabase } from './supabase'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

/**
 * Retrieves the active access token for the request.
 * Prioritizes active Supabase session through supabase.auth.getSession(),
 * falling back to local offline development JWT if running without cloud credentials.
 */
async function getAuthToken() {
  if (isLiveSupabase && supabase) {
    try {
      const { data } = await supabase.auth.getSession()
      if (data?.session?.access_token) {
        return data.session.access_token
      }
    } catch {
      // Fall through to offline cache
    }
  }

  // Check local offline auth session
  const authSession = localStorage.getItem('finflow_auth_session')
  if (authSession) {
    try {
      const parsed = JSON.parse(authSession)
      if (parsed?.access_token) return parsed.access_token
      if (parsed?.session?.access_token) return parsed.session.access_token
    } catch {
      localStorage.removeItem('finflow_auth_session')
    }
  }

  // Check demo session
  const demoSession = localStorage.getItem('finflow_demo_session')
  if (demoSession) {
    try {
      const parsed = JSON.parse(demoSession)
      if (parsed?.access_token) return parsed.access_token
      if (parsed?.session?.access_token) return parsed.session.access_token
    } catch {
      localStorage.removeItem('finflow_demo_session')
    }
  }

  return null
}

/**
 * Handles 401 unauthorized errors with automatic session token refresh retry.
 * If refresh fails, securely signs out and redirects to /login.
 */
async function handleUnauthorized() {
  if (isLiveSupabase && supabase) {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (!error && data?.session?.access_token) {
        return data.session.access_token
      }
    } catch {
      // Refresh failed
    }
  }

  // Clear stale cached auth and redirect to login
  localStorage.removeItem('finflow_auth_session')
  localStorage.removeItem('finflow_demo_session')
  if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
    window.location.href = '/login'
  }
  return null
}

export async function apiFetch(path, options = {}) {
  const { method = 'GET', body, params, retryOn401 = true, signal } = options

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

  const token = await getAuthToken()
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  }

  let res
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
      signal,
    })
  } catch (netErr) {
    if (netErr.name === 'AbortError') throw netErr
    throw new Error('Network error: Failed to connect to FinFlow API. Please ensure the backend server is running.')
  }

  // Handle 401 Unauthorized with single token refresh retry
  if (res.status === 401 && retryOn401) {
    const newToken = await handleUnauthorized()
    if (newToken) {
      return apiFetch(path, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        },
        retryOn401: false,
      })
    }
    throw new Error('Session expired. Please sign in again.')
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ message: res.statusText }))
    const errorMessage =
      errData?.error?.message ||
      errData?.detail?.message ||
      errData?.detail ||
      `API Error: ${res.status}`
    throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage))
  }

  // Return text for CSV responses
  if (res.headers.get('content-type')?.includes('text/csv')) {
    return res.text()
  }

  const json = await res.json()
  // Transparently unwrap response envelope if present
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data
  }
  return json
}

// === Health Checks ===
export const checkHealth = () => apiFetch('/health')
export const checkModelHealth = () => apiFetch('/api/model/health')

// === Auth Operations ===
export const createOfflineSession = (data) =>
  apiFetch('/api/auth/offline-session', { method: 'POST', body: data })

export const createDemoSession = () =>
  apiFetch('/api/auth/demo-session', { method: 'POST' })

export const getCurrentUserIdentity = () => apiFetch('/api/auth/me')

// === Summary & Transactions ===
export const getSummary = () => apiFetch('/api/summary')

export const getTransactions = (params, signal) =>
  apiFetch('/api/transactions', { params, signal })

export const createTransaction = (data) =>
  apiFetch('/api/transactions', { method: 'POST', body: data })

export const checkPotentialDuplicate = (data) =>
  apiFetch('/api/transactions/check-duplicate', { method: 'POST', body: data })

export const updateTransaction = (id, data) =>
  apiFetch(`/api/transactions/${id}`, { method: 'PUT', body: data })

export const deleteTransaction = (id) =>
  apiFetch(`/api/transactions/${id}`, { method: 'DELETE' })

export const bulkDeleteTransactions = (ids) =>
  apiFetch('/api/transactions/bulk-delete', {
    method: 'POST',
    body: { transaction_ids: ids },
  })

export const seedSampleData = (options) =>
  apiFetch('/api/transactions/seed-sample', {
    method: 'POST',
    body: options || { replace_existing: false, confirm: false },
  })

export const exportTransactionsCsv = () =>
  apiFetch('/api/transactions/export-csv')

export const importTransactionsCsv = (csvText) =>
  apiFetch('/api/transactions/import-csv', {
    method: 'POST',
    body: { csv_text: csvText },
  })

// === Analytics ===
export const getMonthlyAnalytics = (months = 12) =>
  apiFetch('/api/analytics/monthly', { params: { months } })
export const getCategoryAnalytics = () => apiFetch('/api/analytics/category')
export const getPaymentModeAnalytics = () => apiFetch('/api/analytics/payment-mode')
export const getLocationAnalytics = () => apiFetch('/api/analytics/location')
export const getTagAnalytics = () => apiFetch('/api/analytics/tags')
export const getTrends = () => apiFetch('/api/analytics/trends')
export const getCashFlowForecast = (months = 3) =>
  apiFetch('/api/analytics/forecast', { params: { months } })
export const getDailyHeatmap = (days = 180) =>
  apiFetch('/api/analytics/daily-heatmap', { params: { days } })

// === ML Predictor ===
export const predict = (data) =>
  apiFetch('/api/predict', { method: 'POST', body: data })
export const getModelSummary = () => apiFetch('/api/model/summary')
export const getModelInsights = () => apiFetch('/api/model/insights')
export const getPredictionHistory = (params) =>
  apiFetch('/api/predictions/history', { params })
export const deletePredictionHistoryItem = (id) =>
  apiFetch(`/api/predictions/history/${id}`, { method: 'DELETE' })
export const recordPredictionFeedback = (id, actualType) =>
  apiFetch(`/api/predictions/${id}/feedback`, { method: 'POST', body: { actual_type: actualType } })

// === Budgets ===
export const getBudgets = (params) => apiFetch('/api/budgets', { params })
export const createOrUpdateBudget = (data) =>
  apiFetch('/api/budgets', { method: 'POST', body: data })
export const deleteBudget = (id) =>
  apiFetch(`/api/budgets/${id}`, { method: 'DELETE' })

// === Savings Goals ===
export const getGoals = () => apiFetch('/api/goals')
export const createGoal = (data) =>
  apiFetch('/api/goals', { method: 'POST', body: data })
export const contributeToGoal = (id, amount) =>
  apiFetch(`/api/goals/${id}/contribute`, { method: 'POST', body: { amount } })
export const deleteGoal = (id) =>
  apiFetch(`/api/goals/${id}`, { method: 'DELETE' })

// === Recurring Transactions ===
export const getRecurring = (params) => apiFetch('/api/recurring', { params })
export const createRecurring = (data) =>
  apiFetch('/api/recurring', { method: 'POST', body: data })
export const markRecurringPaid = (id) =>
  apiFetch(`/api/recurring/${id}/mark-paid`, { method: 'POST' })
export const deleteRecurring = (id) =>
  apiFetch(`/api/recurring/${id}`, { method: 'DELETE' })

// === Smart Insights & Coach ===
export const getSmartInsights = () => apiFetch('/api/smart/insights')

// === Tags, Saved Filters & Rules ===
export const getTags = () => apiFetch('/api/tags')
export const createTag = (data) => apiFetch('/api/tags', { method: 'POST', body: data })
export const deleteTag = (id) => apiFetch(`/api/tags/${id}`, { method: 'DELETE' })

export const getSavedFilters = () => apiFetch('/api/saved-filters')
export const createSavedFilter = (data) =>
  apiFetch('/api/saved-filters', { method: 'POST', body: data })
export const deleteSavedFilter = (id) =>
  apiFetch(`/api/saved-filters/${id}`, { method: 'DELETE' })

export const getCategoryRules = () => apiFetch('/api/category-rules')
export const createCategoryRule = (data) =>
  apiFetch('/api/category-rules', { method: 'POST', body: data })
export const deleteCategoryRule = (id) =>
  apiFetch(`/api/category-rules/${id}`, { method: 'DELETE' })

// === Notifications ===
export const getNotifications = () => apiFetch('/api/notifications')
export const markNotificationRead = (id) =>
  apiFetch(`/api/notifications/${id}/read`, { method: 'POST' })
export const markAllNotificationsRead = () =>
  apiFetch('/api/notifications/read-all', { method: 'POST' })
export const clearAllNotifications = () =>
  apiFetch('/api/notifications/clear-all', { method: 'DELETE' })

// === User Profile & Preferences Center ===
export const getUserProfile = () => apiFetch('/api/user/profile')
export const updateUserProfile = (data) =>
  apiFetch('/api/user/profile', { method: 'PUT', body: data })

export const getUserPreferences = () => apiFetch('/api/user/preferences')
export const updateUserPreferences = (data) =>
  apiFetch('/api/user/preferences', { method: 'PUT', body: data })

export const resetDemoData = (confirmation = 'RESET DEMO DATA') =>
  apiFetch(`/api/user/reset-demo?confirmation=${encodeURIComponent(confirmation)}`, { method: 'POST' })

export const deleteUserAccount = (confirmation = 'DELETE MY ACCOUNT') =>
  apiFetch(`/api/user/account?confirmation=${encodeURIComponent(confirmation)}&confirm=true`, { method: 'DELETE' })

export const exportAllUserDataJson = () => apiFetch('/api/export/all/json')

export const getTransactionsCsvTemplate = () => apiFetch('/api/export/template/transactions-csv')

export const getSystemInfo = () => apiFetch('/api/system/info')

export const getPrintableReport = () => apiFetch('/api/reports/printable')

// Aggregate export for convenience
export const api = {
  checkHealth,
  checkModelHealth,
  createOfflineSession,
  createDemoSession,
  getCurrentUserIdentity,
  getSummary,
  getTransactions,
  createTransaction,
  checkPotentialDuplicate,
  updateTransaction,
  deleteTransaction,
  bulkDeleteTransactions,
  seedSampleData,
  exportTransactionsCsv,
  importTransactionsCsv,
  getTransactionsCsvTemplate,
  getMonthlyAnalytics,
  getCategoryAnalytics,
  getPaymentModeAnalytics,
  getLocationAnalytics,
  getTagAnalytics,
  getTrends,
  getCashFlowForecast,
  getDailyHeatmap,
  predict,
  getModelSummary,
  getModelInsights,
  getPredictionHistory,
  deletePredictionHistoryItem,
  recordPredictionFeedback,
  getBudgets,
  createOrUpdateBudget,
  deleteBudget,
  getGoals,
  createGoal,
  contributeToGoal,
  deleteGoal,
  getRecurring,
  createRecurring,
  markRecurringPaid,
  deleteRecurring,
  getSmartInsights,
  getTags,
  createTag,
  deleteTag,
  getSavedFilters,
  createSavedFilter,
  deleteSavedFilter,
  getCategoryRules,
  createCategoryRule,
  deleteCategoryRule,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearAllNotifications,
  getUserProfile,
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  resetDemoData,
  deleteUserAccount,
  exportAllUserDataJson,
  getSystemInfo,
  getPrintableReport,
}
