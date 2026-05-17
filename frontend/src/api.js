const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const AUTH_TOKEN_KEY = 'auth_token'

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setAuthToken(token) {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token)
  else localStorage.removeItem(AUTH_TOKEN_KEY)
}

export async function fetchLandingSale() {
  const res = await fetch(`${API_BASE}/v1/landing_sale`)
  if (!res.ok) throw new Error(`landing_sale ${res.status}`)
  return (await res.json()).data
}

function parseAuthError(body, fallback) {
  if (body.error) return body.error
  if (body.message) return body.message
  if (Array.isArray(body.errors)) return body.errors.join(', ')
  if (body.errors && typeof body.errors === 'object') {
    return Object.entries(body.errors)
      .flatMap(([field, msgs]) =>
        (Array.isArray(msgs) ? msgs : [msgs]).map((m) =>
          field === 'base' ? m : `${field} ${m}`,
        ),
      )
      .join(', ')
  }
  return fallback
}

async function authenticate(path, user, fallbackError) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ user }),
  })

  const token = res.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  const body = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg = parseAuthError(body, fallbackError)
    throw new Error(msg === fallbackError && res.statusText ? res.statusText : msg)
  }
  if (!token) throw new Error('No authentication token received')

  setAuthToken(token)
  return body.data ?? body.user ?? { email: user.email }
}

export function login(email, password) {
  return authenticate('/users/sign_in', { email, password }, 'Invalid email or password')
}

export function register(email, password, passwordConfirmation) {
  return authenticate(
    '/users',
    { email, password, password_confirmation: passwordConfirmation },
    'Registration failed',
  )
}
