// API client for enrollment applications, admin approval workflow, analytics, and staff auth.

const TOKEN_KEY = 'kwb_admin_token'
const USER_KEY = 'kwb_admin_user'
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || ''
}

async function request(path, { auth = false, headers = {}, ...options } = {}) {
  const reqHeaders = { 'Content-Type': 'application/json', ...headers }
  if (auth) {
    const token = getToken()
    if (token) reqHeaders.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: reqHeaders })
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}

export async function getEnrollments() {
  return request('/api/enrollments', { auth: true })
}

export async function getAnalytics() {
  return request('/api/analytics', { auth: true })
}

export async function getPaymentConfig() {
  return request('/api/payment-config', { auth: true })
}

export async function getEnrollmentEmails(id) {
  return request(`/api/enrollments/${encodeURIComponent(id)}/emails`, { auth: true })
}

export async function resendEnrollmentEmail(id) {
  return request(`/api/enrollments/${encodeURIComponent(id)}/resend-email`, {
    method: 'POST',
    auth: true,
  })
}

export async function addEnrollment(data) {
  return request('/api/enrollments', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function checkEnrollmentStatus(ref, phone) {
  const params = new URLSearchParams({ ref: ref.trim(), phone: phone.trim() })
  return request(`/api/enrollments/status?${params.toString()}`)
}

export async function reviewEnrollment(id, { status, adminNotes }) {
  return request(`/api/enrollments/${encodeURIComponent(id)}/review`, {
    method: 'PATCH',
    auth: true,
    body: JSON.stringify({ status, adminNotes }),
  })
}

export async function updateStatus(id, status) {
  return reviewEnrollment(id, { status })
}

export async function removeEnrollment(id) {
  return request(`/api/enrollments/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    auth: true,
  })
}

export async function login(username, password) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  if (data?.token) {
    sessionStorage.setItem(TOKEN_KEY, data.token)
    if (data.user) sessionStorage.setItem(USER_KEY, JSON.stringify(data.user))
    return true
  }
  return false
}

export function logout() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}

export function isLoggedIn() {
  return Boolean(getToken())
}

export function getAdminUser() {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY)) || { username: 'admin', fullName: 'Administrator' }
  } catch {
    return { username: 'admin', fullName: 'Administrator' }
  }
}

export function toCSV(rows) {
  const head = [
    'Reference Code',
    'Date',
    'Child',
    'Birthdate',
    'Program',
    'Branch',
    'Parent',
    'Phone',
    'Email',
    'Status',
    'Reviewed By',
    'Admin Notes',
    'Message',
  ]
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = rows.map((r) =>
    [
      r.referenceCode,
      new Date(r.createdAt).toLocaleDateString('en-PH'),
      r.childName,
      r.birthdate,
      r.program,
      r.branch,
      r.parentName,
      r.phone,
      r.email,
      r.status,
      r.reviewedBy || '',
      r.adminNotes || '',
      r.message,
    ]
      .map(esc)
      .join(','),
  )
  return [head.map(esc).join(','), ...lines].join('\n')
}
