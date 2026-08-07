import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  deleteOrder,
  fetchNavContext,
  fetchOrders,
  getAuthToken,
  updateOrderStatus,
} from '../api'
import PageBackground from './layout/PageBackground'
import Navbar from './navbar/Navbar'
import OrderGroupCard from './orders/OrderGroupCard'

const ORDERS_BACKGROUND = '/assets/backgrounds/sales.png'

/** Buckets the flat /v1/orders list into one card per order_number, preserving server ordering. */
function groupByOrderNumber(orders) {
  const groups = new Map()
  for (const order of orders) {
    const key = order.order_number || `__no_number_${order.id}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(order)
  }
  return Array.from(groups, ([orderNumber, lines]) => ({ orderNumber, lines }))
}

/**
 * View Orders (admin) / Your Orders (client) page.
 * Hits /v1/orders, which returns every user's orders for admins and the signed-in
 * user's orders for clients. Cards are grouped by order_number.
 * @param {{ mode?: 'admin' | 'mine' }} props
 */
export default function OrdersPage({ mode = 'mine' }) {
  const [authState, setAuthState] = useState('loading')
  const [orders, setOrders] = useState(null)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    if (!getAuthToken()) {
      setAuthState('guest')
      return
    }

    let cancelled = false
    const loadRole = async () => {
      try {
        const ctx = await fetchNavContext()
        if (!cancelled) setAuthState(ctx.role === 'admin' ? 'admin' : 'client')
      } catch {
        if (!cancelled) setAuthState('guest')
      }
    }
    void loadRole()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (authState !== 'admin' && authState !== 'client') return undefined

    let cancelled = false
    const load = async () => {
      try {
        const data = await fetchOrders()
        if (!cancelled) {
          setLoadError(null)
          setOrders(Array.isArray(data) ? data : [])
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e.message || 'Could not load orders.')
          setOrders([])
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [authState])

  const showUser = authState === 'admin'
  const isAdminView = mode === 'admin'
  const canEditStatus = authState === 'admin' && isAdminView
  // Clients on Your Orders (and admins on View Orders) can cancel lines / whole
  // groups; status editing stays admin-only.
  const canCancel = (authState === 'client' && !isAdminView) || canEditStatus
  const groups = useMemo(() => (orders ? groupByOrderNumber(orders) : []), [orders])

  // Optimistic-friendly merge: server returns the canonical order, but we keep
  // any embedded `user` info we already had if the response omits it.
  const handleLineStatusChange = useCallback(async (orderId, nextStatus) => {
    const updated = await updateOrderStatus(orderId, nextStatus)
    setOrders((prev) => {
      if (!prev) return prev
      return prev.map((o) => {
        if (o.id !== orderId) return o
        return { ...o, ...updated, user: updated.user ?? o.user }
      })
    })
  }, [])

  // Soft-deletes a single order line; the backend frees the underlying item
  // when no other kept order still holds it.
  const handleLineDelete = useCallback(async (orderId) => {
    await deleteOrder(orderId)
    setOrders((prev) => (prev ? prev.filter((o) => o.id !== orderId) : prev))
  }, [])

  // Soft-deletes every line in an order group. Items are released, not deleted.
  const handleGroupDelete = useCallback(
    async (orderNumber) => {
      const targets = (orders ?? []).filter((o) => o.order_number === orderNumber)
      await Promise.all(targets.map((o) => deleteOrder(o.id)))
      const targetIds = new Set(targets.map((o) => o.id))
      setOrders((prev) => (prev ? prev.filter((o) => !targetIds.has(o.id)) : prev))
    },
    [orders],
  )

  const heading = isAdminView ? 'View Orders' : 'Your Orders'
  const subhead = isAdminView
    ? 'Every client order, grouped by order number, with the current fulfillment status per item.'
    : 'Your reservations and purchases, grouped by order number. Unreserve an item anytime to release it back to the shop.'

  return (
    <div className="relative min-h-svh w-full bg-brand-shadow text-brand-shadow">
      <Navbar />
      <PageBackground imageUrl={ORDERS_BACKGROUND} />

      <main className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-12 pt-24 sm:px-6 sm:pt-28">
        <header className="mb-6 text-center">
          <h1 className="font-sans text-2xl font-bold text-brand-lavender drop-shadow-[0_2px_10px_rgba(45,45,52,0.85)] sm:text-3xl">
            {heading}
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-brand-alabaster drop-shadow-md">
            {subhead}
          </p>
        </header>

        {authState === 'loading' ? (
          <p className="text-center text-sm text-brand-alabaster drop-shadow-md">
            Checking access…
          </p>
        ) : authState === 'guest' ? (
          <p className="text-center text-sm text-brand-alabaster drop-shadow-md" role="alert">
            Sign in to view orders.
          </p>
        ) : isAdminView && authState !== 'admin' ? (
          <p className="text-center text-sm text-brand-alabaster drop-shadow-md" role="alert">
            Only admins can view all orders. Try the Your Orders page instead.
          </p>
        ) : loadError ? (
          <p className="text-center text-sm text-brand-alabaster drop-shadow-md" role="alert">
            {loadError}
          </p>
        ) : orders == null ? (
          <p className="text-center text-sm text-brand-alabaster drop-shadow-md">
            Loading orders…
          </p>
        ) : groups.length === 0 ? (
          <p className="text-center text-sm text-brand-alabaster drop-shadow-md">
            {isAdminView ? 'No orders have been placed yet.' : 'You have no orders yet.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-4 sm:gap-5">
            {groups.map(({ orderNumber, lines }) => (
              <li key={orderNumber}>
                <OrderGroupCard
                  orderNumber={orderNumber}
                  lines={lines}
                  showUser={showUser}
                  showOrderTotal={isAdminView}
                  editable={canEditStatus}
                  onLineStatusChange={canEditStatus ? handleLineStatusChange : undefined}
                  onLineDelete={canCancel ? handleLineDelete : undefined}
                  onGroupDelete={canCancel ? handleGroupDelete : undefined}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
