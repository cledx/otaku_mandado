import { useCallback, useEffect, useRef, useState } from 'react'
import { createOrder, fetchItemPage, fetchNavContext, getAuthToken } from '../api'
import ItemDetailPanel from './item/ItemDetailPanel'
import ItemDisplayCase from './item/ItemDisplayCase'
import PageBackground from './layout/PageBackground'
import LoginModal from './LoginModal'
import Navbar from './navbar/Navbar'

/** Dedicated item-view backdrop from public/assets/backgrounds/. */
const ITEM_PAGE_BACKGROUND = '/assets/backgrounds/item_page.jpg'

/**
 * Single-item detail page (`#item-{saleId}-{itemId}`).
 *
 * Layout matches the Figma item view: photo display case on the left (or top on
 * mobile) and a dusty detail panel on the right with name, price (admin),
 * status, and reserve controls.
 *
 * Reservation flow:
 * 1. Guest clicks Reserve → LoginModal opens; intent stored in `pendingReserveRef`
 * 2. After successful login, page reloads and auto-submits `createOrder`
 * 3. Signed-in users with a reservable item call `createOrder` immediately
 *
 * Admins get a second fetch once role is known so yen `price` is included in
 * the item payload (public item pages omit cost for clients).
 *
 * @param {string|number} saleId — sale that owns the item (from the hash route)
 * @param {string|number} itemId — item to display
 */
export default function ItemViewPage({ saleId, itemId }) {
  // Full item_page payload: item, sale flags, ordered_by_current_user, etc.
  const [payload, setPayload] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  // Reserve button / API in-flight and outcome messaging.
  const [reserving, setReserving] = useState(false)
  const [reserveError, setReserveError] = useState(null)
  const [reserveSuccess, setReserveSuccess] = useState(false)
  // Remembers that the user wanted to reserve before being asked to log in.
  const pendingReserveRef = useRef(false)

  /** Reloads item page data (used after reserve and after login). */
  const reload = useCallback(async () => {
    try {
      const data = await fetchItemPage(saleId, itemId)
      setPayload(data)
      setLoadError(null)
    } catch (e) {
      setPayload(null)
      setLoadError(e.message)
    }
  }, [saleId, itemId])

  // Detect admin role so we can request yen pricing and enable admin UI in the panel.
  useEffect(() => {
    if (!getAuthToken()) {
      setIsAdmin(false)
      return
    }

    let cancelled = false
    const loadRole = async () => {
      try {
        const ctx = await fetchNavContext()
        if (!cancelled) setIsAdmin(ctx.role === 'admin')
      } catch {
        if (!cancelled) setIsAdmin(false)
      }
    }
    void loadRole()
    return () => {
      cancelled = true
    }
  }, [])

  // Item page includes yen `price` only for admins; refetch once role is known.
  useEffect(() => {
    if (!isAdmin) return
    void reload()
  }, [isAdmin, reload])

  // Initial (and route-change) load for the selected sale/item pair.
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await fetchItemPage(saleId, itemId)
        if (!cancelled) {
          setPayload(data)
          setLoadError(null)
        }
      } catch (e) {
        if (!cancelled) {
          setPayload(null)
          setLoadError(e.message)
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [saleId, itemId])

  const item = payload?.item
  // Front / back product photos; display case flips between them when both exist.
  const imageUrl = item?.image_urls?.[0]
  const backImageUrl = item?.image_urls?.[1]
  const ordered = Boolean(payload?.ordered_by_current_user)

  // Reserve button shows whenever the item is reservable in principle (shop or
  // active drop, status available, not already ordered by this user).
  // Guests still see it — clicking opens the login modal, then reserves on return.
  const canPotentiallyReserve =
    !!item &&
    item.status === 'available' &&
    (Boolean(payload?.sale?.shop) || Boolean(payload?.sale?.active_now)) &&
    !ordered

  /** Merges an admin inline edit (name/price/etc.) into the current payload. */
  const handleItemUpdated = (updated) => {
    setPayload((prev) => (prev ? { ...prev, item: updated } : prev))
  }

  /** Creates an order line for this item and refreshes page state. */
  const submitReserve = useCallback(async () => {
    if (!item) return
    setReserving(true)
    setReserveError(null)
    setReserveSuccess(false)
    try {
      await createOrder(item.id)
      setReserveSuccess(true)
      await reload()
    } catch (e) {
      setReserveError(e.message)
    } finally {
      setReserving(false)
    }
  }, [item, reload])

  /**
   * Reserve CTA handler. Unauthenticated users are diverted to LoginModal with
   * pending intent; authenticated users submit immediately when eligible.
   */
  const handleReserve = () => {
    if (!getAuthToken()) {
      pendingReserveRef.current = true
      setReserveError(null)
      setLoginOpen(true)
      return
    }
    if (!canPotentiallyReserve) return
    void submitReserve()
  }

  /**
   * After login: refresh role + item, then complete a pending reserve if the
   * user had clicked Reserve before authenticating.
   */
  const handleLoginSuccess = async () => {
    setLoginOpen(false)
    try {
      const ctx = await fetchNavContext()
      setIsAdmin(ctx.role === 'admin')
    } catch {
      setIsAdmin(false)
    }
    await reload()
    if (pendingReserveRef.current) {
      pendingReserveRef.current = false
      await submitReserve()
    }
  }

  /** Closing the modal without logging in clears any pending reserve intent. */
  const handleLoginClose = () => {
    pendingReserveRef.current = false
    setLoginOpen(false)
  }

  return (
    <div className="relative min-h-svh w-full text-brand-shadow">
      <Navbar />

      <PageBackground imageUrl={ITEM_PAGE_BACKGROUND} overlay={false} />

      <main className="relative z-10 mx-auto flex min-h-svh max-w-6xl flex-col items-center justify-center gap-10 px-4 pb-12 pt-24 sm:flex-row sm:items-center sm:justify-center sm:gap-16 sm:px-6 sm:pb-16 sm:pt-28">
        {loadError ? (
          <p className="text-center text-sm text-brand-dusty" role="alert">
            {/* Soften forbidden/403 into friendlier copy for clients */}
            {loadError === 'forbidden' || loadError.includes('403')
              ? 'This item is not available to view.'
              : loadError}
          </p>
        ) : !item ? (
          <p className="text-center text-sm text-brand-shadow/70">Loading item…</p>
        ) : (
          <>
            {/* Product photography / flip display */}
            <section className="w-full shrink-0 sm:w-[min(100%,28rem)]">
              <ItemDisplayCase
                key={`${item.id}-${imageUrl}-${backImageUrl}`}
                imageUrl={imageUrl}
                backImageUrl={backImageUrl}
                alt={item.name || 'Product'}
              />
            </section>

            {/* Detail panel: metadata, admin edits, reserve CTA */}
            <section className="w-full max-w-md">
              <div className="rounded-3xl bg-brand-dusty px-8 py-10 shadow-lg sm:px-10 sm:py-12">
                <ItemDetailPanel
                  item={item}
                  saleId={saleId}
                  saleShop={Boolean(payload?.sale?.shop)}
                  isAdmin={isAdmin}
                  reservable={canPotentiallyReserve}
                  ordered={ordered}
                  onItemUpdated={handleItemUpdated}
                  onReserve={handleReserve}
                  reserving={reserving}
                  reserveError={reserveError}
                  reserveSuccess={reserveSuccess}
                />
              </div>
            </section>
          </>
        )}
      </main>

      <LoginModal
        open={loginOpen}
        onClose={handleLoginClose}
        onSuccess={() => void handleLoginSuccess()}
      />
    </div>
  )
}
