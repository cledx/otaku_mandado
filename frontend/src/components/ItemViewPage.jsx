import { useCallback, useEffect, useRef, useState } from 'react'
import { createOrder, fetchItemPage, fetchNavContext, getAuthToken } from '../api'
import ItemDetailPanel from './item/ItemDetailPanel'
import ItemDisplayCase from './item/ItemDisplayCase'
import PageBackground from './layout/PageBackground'
import LoginModal from './LoginModal'
import Navbar from './navbar/Navbar'

/** Served from public/assets/backgrounds/ */
const ITEM_PAGE_BACKGROUND = '/assets/backgrounds/item_page.jpg'

/**
 * Single-item detail (#item-{saleId}-{itemId}). Matches Figma item view mockup.
 */
export default function ItemViewPage({ saleId, itemId }) {
  const [payload, setPayload] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [reserving, setReserving] = useState(false)
  const [reserveError, setReserveError] = useState(null)
  const [reserveSuccess, setReserveSuccess] = useState(false)
  const pendingReserveRef = useRef(false)

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
  const imageUrl = item?.image_urls?.[0]
  const backImageUrl = item?.image_urls?.[1]
  const ordered = Boolean(payload?.ordered_by_current_user)

  // Reserve button shows whenever the item is reservable in principle (shop or active drop, status available).
  // Guests still see it — clicking opens the login modal, then reserves on return.
  const canPotentiallyReserve =
    !!item &&
    item.status === 'available' &&
    (Boolean(payload?.sale?.shop) || Boolean(payload?.sale?.active_now)) &&
    !ordered

  const handleItemUpdated = (updated) => {
    setPayload((prev) => (prev ? { ...prev, item: updated } : prev))
  }

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
            {loadError === 'forbidden' || loadError.includes('403')
              ? 'This item is not available to view.'
              : loadError}
          </p>
        ) : !item ? (
          <p className="text-center text-sm text-brand-shadow/70">Loading item…</p>
        ) : (
          <>
            <section className="w-full shrink-0 sm:w-[min(100%,28rem)]">
              <ItemDisplayCase
                key={`${item.id}-${imageUrl}-${backImageUrl}`}
                imageUrl={imageUrl}
                backImageUrl={backImageUrl}
                alt={item.name || 'Product'}
              />
            </section>

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
