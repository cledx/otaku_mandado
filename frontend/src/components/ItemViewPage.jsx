import { useCallback, useEffect, useState } from 'react'
import { createOrder, fetchItemPage, getAuthToken } from '../api'
import { formatMxPrice } from './sale/EditablePrice'
import ItemDisplayCase from './item/ItemDisplayCase'
import PageBackground from './layout/PageBackground'
import LoginModal from './LoginModal'
import Navbar from './navbar/Navbar'

/** Served from public/assets/backgrounds/ */
const ITEM_PAGE_BACKGROUND = '/assets/backgrounds/item_page.jpg'

function InfoRow({ label, value }) {
  return (
    <p className="text-center text-base leading-relaxed text-white sm:text-lg">
      <span className="font-semibold">{label}:</span>{' '}
      <span className="font-normal">{value || '—'}</span>
    </p>
  )
}

/**
 * Single-item detail (#item-{saleId}-{itemId}). Matches Figma item view mockup.
 */
export default function ItemViewPage({ saleId, itemId }) {
  const [payload, setPayload] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [reserving, setReserving] = useState(false)
  const [reserveError, setReserveError] = useState(null)
  const [reserveSuccess, setReserveSuccess] = useState(false)

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

  const handleReserve = async () => {
    if (!getAuthToken()) {
      setLoginOpen(true)
      return
    }
    if (!payload?.reservable || !item) return

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
  }

  const handleLoginSuccess = () => {
    window.location.reload()
  }

  const showReserve = Boolean(payload?.reservable)
  const ordered = Boolean(payload?.ordered_by_current_user)

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
                imageUrl={imageUrl}
                backImageUrl={backImageUrl}
                alt={item.name || 'Product'}
              />
            </section>

            <section className="w-full max-w-md">
              <div className="rounded-3xl bg-brand-dusty px-8 py-10 shadow-lg sm:px-10 sm:py-12">
                <div className="space-y-3">
                  <InfoRow label="Item" value={item.name} />
                  <InfoRow label="Brand" value={item.brand} />
                  <InfoRow label="Character" value={item.description} />
                  <InfoRow label="Price" value={formatMxPrice(item.mx_price)} />
                </div>

                {ordered ? (
                  <p className="mt-6 text-center text-sm font-medium text-white/90">
                    You have reserved this item.
                  </p>
                ) : null}

                {reserveError ? (
                  <p className="mt-4 text-center text-sm text-brand-lavender" role="alert">
                    {reserveError}
                  </p>
                ) : null}

                {reserveSuccess ? (
                  <p className="mt-4 text-center text-sm font-medium text-white/90">
                    Reserved successfully.
                  </p>
                ) : null}

                {showReserve ? (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={() => void handleReserve()}
                      disabled={reserving}
                      className="rounded-2xl bg-[#d32f2f] px-10 py-3 text-lg font-semibold text-white shadow-md transition hover:bg-[#b71c1c] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {reserving ? 'Reserving…' : 'Reserve'}
                    </button>
                  </div>
                ) : null}
              </div>
            </section>
          </>
        )}
      </main>

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  )
}
