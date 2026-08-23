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

/** Authenticated sale with items (includes yen price for admin). */
export function fetchSale(saleId) {
  return authFetch(`/v1/sales/${saleId}`)
}

/** Creates a timed drop (admin). */
export function createSale(sale) {
  return authFetch('/v1/sales', {
    method: 'POST',
    body: { sale },
  })
}

/** Updates a timed drop (admin). */
export function updateSale(saleId, sale) {
  return authFetch(`/v1/sales/${saleId}`, {
    method: 'PATCH',
    body: { sale },
  })
}

/** Public drop page: sale + items + phase/timing (GET /v1/sale_pages/:id). */
export async function fetchSalePage(id) {
  const res = await fetch(`${API_BASE}/v1/sale_pages/${id}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || `sale_page ${res.status}`)
  return body.data
}

/** Public item detail (visibility rules on the server). Sends JWT when signed in. */
export async function fetchItemPage(saleId, itemId) {
  const token = getAuthToken()
  const headers = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}/v1/item_pages/${saleId}/${itemId}`, { headers })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || `item_page ${res.status}`)
  }
  return body.data
}

/** Reserves an item for the signed-in user (POST /v1/orders). */
export function createOrder(itemId) {
  return authFetch('/v1/orders', {
    method: 'POST',
    body: { order: { item_id: itemId } },
  })
}

/**
 * Lists orders for the View Orders / Your Orders page.
 * Admins receive every user's orders (each includes a `user` field); clients receive only their own.
 */
export function fetchOrders() {
  return authFetch('/v1/orders')
}

/**
 * Updates a single order's fulfillment status. Admins can update any order;
 * clients can only update their own (enforced server-side).
 */
export function updateOrderStatus(orderId, status) {
  return authFetch(`/v1/orders/${orderId}`, {
    method: 'PATCH',
    body: { order: { status } },
  })
}

/**
 * Soft-deletes a single order line. The backing item stays in place; if no
 * other kept orders hold it, the server flips it back to "available" so it
 * can be reserved again.
 */
export function deleteOrder(orderId) {
  return authFetch(`/v1/orders/${orderId}`, { method: 'DELETE' })
}

/**
 * Client applies a coupon to every line sharing an order_number.
 * Returns the updated order lines for that group.
 */
export function applyOrderCoupon(orderNumber, code) {
  return authFetch('/v1/orders/apply_coupon', {
    method: 'POST',
    body: { order_number: orderNumber, code },
  })
}

/**
 * Lists every registered account (admin only). Each entry includes `pending_orders`
 * (boolean), `pending_orders_count`, and `total_spent` (MXN, credited as orders
 * flip to "payment fulfilled") so the View Accounts page can flag users with
 * outstanding orders and surface their lifetime spend.
 */
export function fetchAccounts() {
  return authFetch('/v1/accounts')
}

/** Lists kept coupon codes (admin). */
export function fetchCouponCodes() {
  return authFetch('/v1/coupon_codes')
}

/** Creates a coupon code (admin). `discount` is percent 1–100; `expiry` is ISO. */
export function createCouponCode(couponCode) {
  return authFetch('/v1/coupon_codes', {
    method: 'POST',
    body: { coupon_code: couponCode },
  })
}

/** Updates a coupon code (admin). */
export function updateCouponCode(id, couponCode) {
  return authFetch(`/v1/coupon_codes/${id}`, {
    method: 'PATCH',
    body: { coupon_code: couponCode },
  })
}

/** Soft-deletes a coupon code (admin). */
export function deleteCouponCode(id) {
  return authFetch(`/v1/coupon_codes/${id}`, { method: 'DELETE' })
}

/** Persistent shop catalog (sale named "Shop"; GET /v1/shop_sale). */
export async function fetchShopSalePage() {
  const res = await fetch(`${API_BASE}/v1/shop_sale`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || `shop_sale ${res.status}`)
  return body.data
}

async function authFetch(path, options = {}) {
  const token = getAuthToken()
  if (!token) throw new Error('Not signed in')

  const { method = 'GET', body } = options
  const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` }
  if (body != null) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  })
  const parsed = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg =
      parsed.error ||
      (Array.isArray(parsed.errors) ? parsed.errors.join(', ') : null) ||
      res.statusText ||
      `Request failed (${res.status})`
    throw new Error(msg)
  }
  return parsed.data
}

/** Soft-deletes an item nested under a sale (admin). */
export function deleteItem(saleId, itemId) {
  return authFetch(`/v1/sales/${saleId}/items/${itemId}`, { method: 'DELETE' })
}

/** Updates an item; pass `price` in JPY (server recalculates mx_price). */
export function updateItem(saleId, itemId, item) {
  return authFetch(`/v1/sales/${saleId}/items/${itemId}`, {
    method: 'PATCH',
    body: { item },
  })
}

/** Clones an item under the same sale; copy is always status "available". */
export function duplicateItem(saleId, itemId) {
  return authFetch(`/v1/sales/${saleId}/items/${itemId}/duplicate`, {
    method: 'POST',
  })
}

/** Moves an item from a drop sale onto the permanent Shop catalog. */
export function moveItemToShop(saleId, itemId) {
  return authFetch(`/v1/sales/${saleId}/items/${itemId}/move_to_shop`, {
    method: 'POST',
  })
}

/** Creates items from Cloudinary public_ids (runs AI metadata on the server). */
export async function createItemsFromPublicIds(saleId, publicIds) {
  const token = getAuthToken()
  if (!token) throw new Error('Not signed in')

  const res = await fetch(`${API_BASE}/v1/sales/${saleId}/items`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ public_ids: publicIds }),
  })
  const parsed = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg =
      parsed.error ||
      (Array.isArray(parsed.errors) ? parsed.errors.join(', ') : null) ||
      res.statusText ||
      `Request failed (${res.status})`
    throw new Error(msg)
  }
  return { items: parsed.data, errors: parsed.errors }
}

export function fetchNavContext() {
  return authFetch('/v1/nav_context')
}

export function fetchCurrentUser() {
  return authFetch('/me')
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

export async function logout() {
  const token = getAuthToken()
  if (token) {
    try {
      await fetch(`${API_BASE}/users/sign_out`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
    } catch {
      // Clear local session even if the server is unreachable
    }
  }
  setAuthToken(null)
}
