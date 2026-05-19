function formatDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatTotalSpent(value) {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return null
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(numeric)
}

const ROLE_STYLE = {
  admin: 'bg-brand-lavender text-brand-shadow',
  client: 'bg-brand-alabaster text-brand-shadow/80',
}

/**
 * Single-row account summary used by the View Accounts page.
 * The pending-orders pill is the load-bearing piece — it tells the admin at a
 * glance whether this user has outstanding orders to chase down. The
 * total-spent figure (MXN) is updated by the Order model whenever a line
 * flips to "payment fulfilled".
 *
 * @param {{ account: {
 *   id: number,
 *   email: string,
 *   role: 'admin' | 'client',
 *   created_at?: string | null,
 *   pending_orders: boolean,
 *   pending_orders_count?: number,
 *   total_spent?: number,
 * } }} props
 */
export default function AccountCard({ account }) {
  const {
    email,
    role,
    created_at: createdAt,
    pending_orders: hasPending,
    pending_orders_count: pendingCount,
    total_spent: totalSpent,
  } = account
  const joinedLabel = formatDate(createdAt)
  const totalSpentLabel = formatTotalSpent(totalSpent ?? 0)
  const roleClass = ROLE_STYLE[role] ?? 'bg-brand-alabaster text-brand-shadow/70'
  const pendingLabel =
    pendingCount && pendingCount > 1
      ? `${pendingCount} pending orders`
      : 'Pending order'

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-brand-thistle/45 bg-brand-lavender/97 p-4 shadow-md ring-1 ring-brand-thistle/30 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="min-w-0">
        <p className="truncate text-base font-semibold text-brand-shadow" title={email}>
          {email}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-shadow/65">
          <span
            className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${roleClass}`}
          >
            {role || 'unknown'}
          </span>
          {joinedLabel ? <span>Joined {joinedLabel}</span> : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
        {totalSpentLabel ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-alabaster px-3 py-1 text-xs font-semibold text-brand-shadow/80"
            title="Total amount paid across this user's fulfilled orders"
          >
            <span className="text-[10px] uppercase tracking-wide text-brand-shadow/55">
              Total spent
            </span>
            <span>{totalSpentLabel}</span>
          </span>
        ) : null}
        {hasPending ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-dusty/20 px-3 py-1 text-xs font-semibold text-brand-dusty">
            <span className="size-1.5 rounded-full bg-brand-dusty" aria-hidden />
            {pendingLabel}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-available-bg px-3 py-1 text-xs font-semibold text-brand-available">
            <span className="size-1.5 rounded-full bg-brand-available" aria-hidden />
            No pending orders
          </span>
        )}
      </div>
    </article>
  )
}
