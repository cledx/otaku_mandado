import { useCallback, useEffect, useState } from 'react'
import {
  createCouponCode,
  deleteCouponCode,
  fetchCouponCodes,
  fetchNavContext,
  getAuthToken,
  updateCouponCode,
} from '../api'
import AdminToolTitle from './AdminToolTitle'
import PageBackground from './layout/PageBackground'
import Navbar from './navbar/Navbar'
import ConfirmDialog from './ui/ConfirmDialog'

const BACKGROUND = '/assets/backgrounds/sales.png'

const inputClass =
  'w-full rounded-xl border border-brand-thistle/80 bg-brand-alabaster/90 px-4 py-2.5 text-sm text-brand-shadow outline-none transition placeholder:text-brand-shadow/40 focus:border-brand-dusty focus:ring-2 focus:ring-brand-dusty/25'

const iconBtnClass =
  'inline-flex size-9 items-center justify-center rounded-full border border-brand-thistle/70 bg-white text-brand-shadow transition hover:border-brand-dusty hover:bg-brand-lavender disabled:cursor-not-allowed disabled:opacity-50'

/** Default expiry: one month from today (YYYY-MM-DD for `<input type="date">`). */
function defaultExpiryDate() {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** ISO expiry → local YYYY-MM-DD for the date input. */
function isoToDateInput(iso) {
  if (!iso) return defaultExpiryDate()
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return defaultExpiryDate()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** End of the chosen local calendar day → ISO for the API. */
function expiryDateToIso(dateStr) {
  const local = new Date(`${dateStr}T23:59:59`)
  if (Number.isNaN(local.getTime())) return null
  return local.toISOString()
}

function formatExpiry(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function isExpired(iso) {
  if (!iso) return false
  const d = new Date(iso)
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now()
}

/**
 * Coupon Codes tool (`#coupon-codes`) — create, edit, delete, and list codes.
 */
export default function CouponCodesPage() {
  const [authState, setAuthState] = useState('loading')
  const [coupons, setCoupons] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const [editingId, setEditingId] = useState(null)
  const [code, setCode] = useState('')
  const [discount, setDiscount] = useState('')
  const [expiryDate, setExpiryDate] = useState(defaultExpiryDate)
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

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

  const loadCoupons = useCallback(async () => {
    try {
      const data = await fetchCouponCodes()
      setLoadError(null)
      setCoupons(Array.isArray(data) ? data : [])
    } catch (e) {
      setLoadError(e.message || 'Could not load coupon codes.')
      setCoupons([])
    }
  }, [])

  useEffect(() => {
    if (authState !== 'admin') return undefined
    void loadCoupons()
    return undefined
  }, [authState, loadCoupons])

  const resetForm = () => {
    setEditingId(null)
    setCode('')
    setDiscount('')
    setExpiryDate(defaultExpiryDate())
    setFormError(null)
  }

  const startEdit = (coupon) => {
    setEditingId(coupon.id)
    setCode(coupon.code || '')
    setDiscount(String(coupon.discount ?? ''))
    setExpiryDate(isoToDateInput(coupon.expiry))
    setFormError(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError(null)

    const trimmed = code.trim()
    if (!trimmed) {
      setFormError('Enter a coupon code.')
      return
    }

    const pct = Number.parseInt(discount, 10)
    if (!Number.isFinite(pct) || pct < 1 || pct > 100) {
      setFormError('Discount must be a whole number from 1 to 100.')
      return
    }

    const expiryIso = expiryDateToIso(expiryDate)
    if (!expiryIso) {
      setFormError('Pick a valid expiry date.')
      return
    }

    const payload = {
      code: trimmed,
      discount: pct,
      expiry: expiryIso,
    }

    setSubmitting(true)
    try {
      if (editingId != null) {
        const updated = await updateCouponCode(editingId, payload)
        setCoupons((prev) =>
          (Array.isArray(prev) ? prev : []).map((c) =>
            c.id === updated.id ? updated : c,
          ),
        )
        resetForm()
      } else {
        const created = await createCouponCode(payload)
        setCoupons((prev) => [created, ...(Array.isArray(prev) ? prev : [])])
        resetForm()
      }
    } catch (e) {
      setFormError(
        e.message ||
          (editingId != null
            ? 'Could not update coupon code.'
            : 'Could not create coupon code.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteCouponCode(deleteTarget.id)
      setCoupons((prev) =>
        (Array.isArray(prev) ? prev : []).filter((c) => c.id !== deleteTarget.id),
      )
      if (editingId === deleteTarget.id) resetForm()
      setDeleteTarget(null)
    } catch (e) {
      setDeleteError(e.message || 'Could not delete coupon code.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="relative min-h-svh w-full bg-brand-shadow text-brand-shadow">
      <Navbar />
      <PageBackground imageUrl={BACKGROUND} />

      <main className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-12 pt-24 sm:px-6 sm:pt-28">
        <div className="mb-8 flex items-center justify-center gap-3 sm:gap-4">
          <a
            href="#admin-tools"
            aria-label="Back to Admin Tools"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-brand-lavender no-underline shadow-lg transition hover:bg-brand-shadow/60 hover:text-brand-alabaster focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dusty"
          >
            <i className="fa-solid fa-arrow-left text-xl" aria-hidden />
          </a>
          <AdminToolTitle>Coupon Codes</AdminToolTitle>
        </div>

        {authState === 'loading' ? (
          <p className="text-center text-sm text-brand-alabaster drop-shadow-md">
            Checking access…
          </p>
        ) : authState !== 'admin' ? (
          <p className="text-center text-sm text-brand-lavender drop-shadow-md" role="alert">
            {authState === 'guest'
              ? 'Sign in as an admin to manage coupon codes.'
              : 'Only admins can manage coupon codes.'}
          </p>
        ) : (
          <>
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-brand-thistle/45 bg-brand-lavender/97 p-4 shadow-md ring-1 ring-brand-thistle/30 sm:p-5"
            >
              {editingId != null ? (
                <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-brand-dusty">
                  Editing {code || 'coupon'}
                </p>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-[1.4fr_0.7fr_1fr_auto] sm:items-end">
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-sm font-medium text-brand-shadow">
                    Code
                  </span>
                  <input
                    type="text"
                    name="code"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className={inputClass}
                    placeholder="SUMMER10"
                    autoComplete="off"
                    disabled={submitting}
                  />
                </label>

                <label className="block min-w-0">
                  <span className="mb-1.5 block text-sm font-medium text-brand-shadow">
                    Discount %
                  </span>
                  <input
                    type="number"
                    name="discount"
                    required
                    min="1"
                    max="100"
                    step="1"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className={inputClass}
                    placeholder="10"
                    disabled={submitting}
                  />
                </label>

                <label className="block min-w-0">
                  <span className="mb-1.5 block text-sm font-medium text-brand-shadow">
                    Expiry date
                  </span>
                  <input
                    type="date"
                    name="expiry"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className={inputClass}
                    disabled={submitting}
                  />
                </label>

                <div className="flex gap-2">
                  {editingId != null ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={submitting}
                      className="h-[42px] rounded-full border border-brand-thistle bg-white px-4 text-sm font-semibold text-brand-shadow transition hover:bg-brand-alabaster disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  ) : null}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-[42px] rounded-full border border-brand-shadow bg-brand-shadow px-6 text-sm font-semibold text-brand-lavender shadow-md transition hover:border-brand-dusty hover:bg-brand-dusty disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting
                      ? editingId != null
                        ? 'Saving…'
                        : 'Adding…'
                      : editingId != null
                        ? 'Save'
                        : 'Add'}
                  </button>
                </div>
              </div>

              {formError ? (
                <p
                  className="mt-3 rounded-lg bg-brand-dusty/15 px-3 py-2 text-center text-sm text-brand-dusty"
                  role="alert"
                >
                  {formError}
                </p>
              ) : null}
            </form>

            <section className="mt-8" aria-label="Existing coupon codes">
              <h2 className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-brand-lavender drop-shadow-md">
                Current codes
              </h2>

              {coupons === null ? (
                <p className="text-center text-sm text-brand-alabaster drop-shadow-md">
                  Loading…
                </p>
              ) : loadError ? (
                <p className="text-center text-sm text-brand-lavender drop-shadow-md" role="alert">
                  {loadError}
                </p>
              ) : coupons.length === 0 ? (
                <p className="text-center text-sm text-brand-alabaster drop-shadow-md">
                  No coupon codes yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {coupons.map((coupon) => {
                    const expired = isExpired(coupon.expiry)
                    const isEditing = editingId === coupon.id
                    return (
                      <li
                        key={coupon.id}
                        className={`flex flex-col gap-3 rounded-2xl border bg-brand-lavender/97 px-4 py-3 shadow-md ring-1 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${
                          isEditing
                            ? 'border-brand-dusty ring-brand-dusty/40'
                            : 'border-brand-thistle/45 ring-brand-thistle/30'
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="font-mono text-base font-bold tracking-wide text-brand-shadow">
                            {coupon.code}
                          </span>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-shadow/80">
                            <span>
                              <span className="font-semibold text-brand-shadow">
                                {coupon.discount}%
                              </span>{' '}
                              off
                            </span>
                            <span className={expired ? 'text-brand-dusty' : undefined}>
                              {expired ? 'Expired' : 'Expires'}{' '}
                              {formatExpiry(coupon.expiry)}
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            title="Edit coupon"
                            aria-label={`Edit ${coupon.code}`}
                            disabled={submitting || deleting}
                            onClick={() => startEdit(coupon)}
                            className={iconBtnClass}
                          >
                            <i className="fa-solid fa-pen text-sm" aria-hidden />
                          </button>
                          <button
                            type="button"
                            title="Delete coupon"
                            aria-label={`Delete ${coupon.code}`}
                            disabled={submitting || deleting}
                            onClick={() => {
                              setDeleteError(null)
                              setDeleteTarget(coupon)
                            }}
                            className={`${iconBtnClass} text-brand-dusty hover:text-brand-dusty`}
                          >
                            <i className="fa-solid fa-trash text-sm" aria-hidden />
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </main>

      <ConfirmDialog
        open={deleteTarget != null}
        title="Delete coupon code?"
        message={
          deleteError
            ? deleteError
            : deleteTarget
              ? `Remove ${deleteTarget.code}? It will no longer be available for new orders.`
              : ''
        }
        confirmLabel="Delete"
        confirming={deleting}
        onClose={() => {
          if (deleting) return
          setDeleteTarget(null)
          setDeleteError(null)
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  )
}
