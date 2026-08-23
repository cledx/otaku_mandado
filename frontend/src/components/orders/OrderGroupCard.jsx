import { useState } from 'react'
import { itemRouteHash, setAppHash } from '../../utils/hashRoute'
import ConfirmDialog from '../ui/ConfirmDialog'
import OrderStatusSelect from './OrderStatusSelect'

function ItemThumb({ item }) {
  const url = item?.image_urls?.[0]
  if (url) {
    return (
      <img
        src={url}
        alt={item?.name || 'Item'}
        className="size-16 shrink-0 rounded-lg object-cover sm:size-20"
      />
    )
  }
  return (
    <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-brand-alabaster sm:size-20">
      <svg
        className="size-8 text-brand-thistle"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="8.5" cy="10" r="1.5" fill="currentColor" stroke="none" />
        <path d="M3 16l5-5 4 4 3-3 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function DeleteIcon({ className = 'size-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2M19 6v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" strokeLinecap="round" />
      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
    </svg>
  )
}

function formatPriceMx(value) {
  if (value == null) return null
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return null
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(numeric)
}

function formatDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * Single order group (rows that share an order_number). Header summarizes the order;
 * each row shows one item and its individual fulfillment status. When `editable`,
 * status pills become dropdowns (per-row updates one line; header pill bulk-
 * updates every line). Cancel controls appear whenever delete handlers are
 * provided (independent of `editable`): a per-line "Unreserve" button cancels
 * just that line, the header "Cancel order" button cancels the whole group.
 * Cancelling an order frees the item — it does NOT delete the item.
 *
 * Client-only (`showCouponField`): a coupon input sits beside the order number.
 * Once a code is applied it is shown greyed out and locked.
 *
 * @param {{
 *   orderNumber: string,
 *   lines: object[],
 *   showUser?: boolean,
 *   showOrderTotal?: boolean,
 *   showCouponField?: boolean,
 *   editable?: boolean,
 *   onLineStatusChange?: (orderId: number, nextStatus: string) => Promise<void> | void,
 *   onLineDelete?: (orderId: number) => Promise<void> | void,
 *   onGroupDelete?: (orderNumber: string) => Promise<void> | void,
 *   onApplyCoupon?: (orderNumber: string, code: string) => Promise<void> | void,
 * }} props
 */
export default function OrderGroupCard({
  orderNumber,
  lines,
  showUser = false,
  showOrderTotal = false,
  showCouponField = false,
  editable = false,
  onLineStatusChange,
  onLineDelete,
  onGroupDelete,
  onApplyCoupon,
}) {
  const [groupConfirmOpen, setGroupConfirmOpen] = useState(false)
  const [groupDeleting, setGroupDeleting] = useState(false)
  const [groupError, setGroupError] = useState(null)

  const [lineConfirm, setLineConfirm] = useState(null) // { id, name } | null
  const [lineDeleting, setLineDeleting] = useState(false)
  const [lineError, setLineError] = useState(null)

  const existingCoupon = lines.find((l) => l.coupon_code?.code)?.coupon_code ?? null
  const [couponDraft, setCouponDraft] = useState('')
  const [couponSubmitting, setCouponSubmitting] = useState(false)
  const [couponError, setCouponError] = useState(null)

  const earliest = lines.reduce((acc, line) => {
    if (!line.created_at) return acc
    const ts = Date.parse(line.created_at)
    if (Number.isNaN(ts)) return acc
    return acc == null || ts < acc ? ts : acc
  }, null)
  const createdLabel = earliest != null ? formatDate(new Date(earliest).toISOString()) : null

  const uniqueStatuses = Array.from(new Set(lines.map((l) => l.status).filter(Boolean)))
  const groupStatus = uniqueStatuses.length === 1 ? uniqueStatuses[0] : null
  const allLinesPending = lines.length > 0 && lines.every((l) => l.status === 'pending')

  const userEmail = showUser ? lines.find((l) => l.user?.email)?.user?.email : null

  const orderTotalMx = showOrderTotal
    ? lines.reduce((sum, line) => {
        const price = line.item?.mx_price
        const numeric = typeof price === 'number' ? price : Number(price)
        return sum + (Number.isFinite(numeric) ? numeric : 0)
      }, 0)
    : null
  const orderTotalLabel =
    showOrderTotal && orderTotalMx != null ? formatPriceMx(orderTotalMx) : null

  const openItem = (line) => {
    const saleId = line.item?.sale_id
    const itemId = line.item?.id
    if (saleId == null || itemId == null) return
    setAppHash(itemRouteHash(saleId, itemId))
  }

  const updateAllLines = async (nextStatus) => {
    if (!onLineStatusChange) return
    const targets = lines.filter((l) => l.status !== nextStatus)
    await Promise.all(targets.map((l) => onLineStatusChange(l.id, nextStatus)))
  }

  const confirmGroupDelete = async () => {
    if (!onGroupDelete) return
    setGroupError(null)
    setGroupDeleting(true)
    try {
      await onGroupDelete(orderNumber)
      setGroupConfirmOpen(false)
    } catch (e) {
      setGroupError(e?.message || 'Could not cancel order.')
    } finally {
      setGroupDeleting(false)
    }
  }

  const confirmLineDelete = async () => {
    if (!onLineDelete || !lineConfirm) return
    setLineError(null)
    setLineDeleting(true)
    try {
      await onLineDelete(lineConfirm.id)
      setLineConfirm(null)
    } catch (e) {
      setLineError(e?.message || 'Could not cancel item.')
    } finally {
      setLineDeleting(false)
    }
  }

  const submitCoupon = async (event) => {
    event.preventDefault()
    if (!onApplyCoupon || existingCoupon) return
    const trimmed = couponDraft.trim()
    if (!trimmed) {
      setCouponError('Enter a coupon code.')
      return
    }
    setCouponError(null)
    setCouponSubmitting(true)
    try {
      await onApplyCoupon(orderNumber, trimmed)
      setCouponDraft('')
    } catch (e) {
      setCouponError(e?.message || 'Could not apply coupon code.')
    } finally {
      setCouponSubmitting(false)
    }
  }

  return (
    <>
      <article className="rounded-2xl border border-brand-thistle/45 bg-brand-lavender/97 p-5 shadow-md ring-1 ring-brand-thistle/30 sm:p-6">
        <header className="flex flex-col gap-3 border-b border-brand-thistle/40 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-shadow/55">
              Order
            </p>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="truncate font-mono text-lg font-semibold text-brand-shadow">
                {orderNumber}
              </h2>
              {userEmail ? (
                <span
                  className="truncate text-sm font-medium text-brand-shadow/75"
                  title={userEmail}
                >
                  {userEmail}
                </span>
              ) : null}
            </div>

            {showCouponField ? (
              <div className="mt-2">
                {existingCoupon ? (
                  <label className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-brand-shadow/60">Coupon</span>
                    <input
                      type="text"
                      value={existingCoupon.code}
                      disabled
                      readOnly
                      aria-label={`Coupon code ${existingCoupon.code} applied`}
                      className="w-36 rounded-lg border border-brand-thistle/50 bg-brand-thistle/25 px-3 py-1.5 font-mono text-sm text-brand-shadow/50"
                    />
                    {existingCoupon.discount != null ? (
                      <span className="text-xs text-brand-shadow/55">
                        {existingCoupon.discount}% off
                      </span>
                    ) : null}
                  </label>
                ) : (
                  <form
                    onSubmit={submitCoupon}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <label className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-brand-shadow/70">Coupon</span>
                      <input
                        type="text"
                        name="coupon_code"
                        value={couponDraft}
                        onChange={(e) => setCouponDraft(e.target.value)}
                        disabled={couponSubmitting}
                        placeholder="Enter code"
                        autoComplete="off"
                        aria-label={`Coupon code for order ${orderNumber}`}
                        className="w-36 rounded-lg border border-brand-thistle/80 bg-brand-alabaster/90 px-3 py-1.5 font-mono text-sm text-brand-shadow outline-none transition placeholder:text-brand-shadow/40 focus:border-brand-dusty focus:ring-2 focus:ring-brand-dusty/25 disabled:opacity-60"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={couponSubmitting || !couponDraft.trim()}
                      className="rounded-full border border-brand-shadow bg-brand-shadow px-3 py-1.5 text-xs font-semibold text-brand-lavender transition hover:border-brand-dusty hover:bg-brand-dusty disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {couponSubmitting ? 'Applying…' : 'Apply'}
                    </button>
                  </form>
                )}
                {couponError ? (
                  <p className="mt-1 text-xs text-brand-dusty" role="alert">
                    {couponError}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-shadow/65">
              {createdLabel ? <span>Placed {createdLabel}</span> : null}
              <span>
                {lines.length} {lines.length === 1 ? 'item' : 'items'}
              </span>
              {orderTotalLabel ? (
                <span className="font-semibold text-brand-shadow/85">
                  Total {orderTotalLabel}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            {groupStatus ? (
              <OrderStatusSelect
                status={groupStatus}
                size="lg"
                editable={editable}
                ariaLabel={`Change status for every item in order ${orderNumber}`}
                onChange={updateAllLines}
              />
            ) : (
              <p className="text-xs text-brand-shadow/55">
                Mixed statuses — update each item below
              </p>
            )}
            {onGroupDelete && allLinesPending ? (
              <button
                type="button"
                onClick={() => {
                  setGroupError(null)
                  setGroupConfirmOpen(true)
                }}
                className="inline-flex items-center gap-1.5 self-end rounded-full border border-brand-dusty/60 bg-white px-3 py-1 text-xs font-semibold text-brand-dusty transition hover:border-brand-dusty hover:bg-brand-dusty/10"
              >
                <DeleteIcon className="size-3.5" />
                Cancel order
              </button>
            ) : null}
            {groupError ? (
              <p className="max-w-xs text-right text-xs text-brand-dusty" role="alert">
                {groupError}
              </p>
            ) : null}
          </div>
        </header>

        <ul className="mt-4 flex flex-col divide-y divide-brand-thistle/30">
          {lines.map((line) => {
            const item = line.item
            const canNavigate = item?.sale_id != null && item?.id != null
            const priceLabel = formatPriceMx(item?.mx_price)
            return (
              <li key={line.id} className="py-3 first:pt-0 last:pb-0">
                <div
                  role={canNavigate ? 'link' : undefined}
                  tabIndex={canNavigate ? 0 : undefined}
                  onClick={canNavigate ? () => openItem(line) : undefined}
                  onKeyDown={
                    canNavigate
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            openItem(line)
                          }
                        }
                      : undefined
                  }
                  className={`flex items-center gap-4 rounded-xl p-2 transition ${
                    canNavigate ? 'cursor-pointer hover:bg-brand-alabaster/70' : ''
                  }`}
                >
                  <ItemThumb item={item} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-medium text-brand-shadow">
                      {item?.name || 'Untitled item'}
                    </p>
                    {item?.brand ? (
                      <p className="truncate text-sm text-brand-shadow/65">{item.brand}</p>
                    ) : null}
                    {priceLabel ? (
                      <p className="mt-0.5 text-sm font-medium text-brand-shadow/80">{priceLabel}</p>
                    ) : null}
                  </div>
                  <div
                    className="flex shrink-0 items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <OrderStatusSelect
                      status={line.status}
                      editable={editable}
                      ariaLabel={`Change status for ${item?.name || 'item'}`}
                      onChange={(next) => onLineStatusChange?.(line.id, next)}
                    />
                    {onLineDelete && line.status === 'pending' ? (
                      <button
                        type="button"
                        aria-label={`Unreserve ${item?.name || 'item'}`}
                        title="Unreserve this item (frees it for others)"
                        onClick={() => {
                          setLineError(null)
                          setLineConfirm({ id: line.id, name: item?.name || 'this item' })
                        }}
                        className="inline-flex items-center rounded-full border border-brand-thistle/80 bg-white px-3 py-1 text-xs font-semibold text-brand-dusty transition hover:border-brand-dusty hover:bg-brand-dusty/10"
                      >
                        Unreserve
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </article>

      <ConfirmDialog
        open={groupConfirmOpen}
        title="Cancel this order?"
        message={
          groupError
            ? `${groupError} Try again, or cancel to close.`
            : `Cancel order ${orderNumber}? Every item in this order will be released back to the shop so other customers can reserve them. The items themselves are not deleted.`
        }
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        confirming={groupDeleting}
        onClose={() => {
          if (!groupDeleting) {
            setGroupConfirmOpen(false)
            setGroupError(null)
          }
        }}
        onConfirm={() => void confirmGroupDelete()}
      />

      <ConfirmDialog
        open={Boolean(lineConfirm)}
        title="Unreserve this item?"
        message={
          lineError
            ? `${lineError} Try again, or cancel to close.`
            : `Unreserve “${lineConfirm?.name ?? 'this item'}” from order ${orderNumber}? The item will be released back to the shop so it can be reserved again.`
        }
        confirmLabel="Unreserve"
        cancelLabel="Keep reserved"
        confirming={lineDeleting}
        onClose={() => {
          if (!lineDeleting) {
            setLineConfirm(null)
            setLineError(null)
          }
        }}
        onConfirm={() => void confirmLineDelete()}
      />
    </>
  )
}
