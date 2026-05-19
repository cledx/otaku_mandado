/**
 * Mirrors Order::STATUSES in the backend; order matters for the dropdown
 * (renders top-to-bottom in fulfillment progression).
 */
export const ORDER_STATUSES = [
  'pending',
  'payment fulfilled',
  'items purchased',
  'items sent',
  'items received',
]

export const ORDER_STATUS_STYLE = {
  pending: { label: 'Pending', className: 'bg-brand-dusty/20 text-brand-dusty' },
  'payment fulfilled': { label: 'Payment fulfilled', className: 'bg-brand-thistle/45 text-brand-shadow' },
  'items purchased': { label: 'Items purchased', className: 'bg-brand-lavender text-brand-shadow' },
  'items sent': { label: 'Items sent', className: 'bg-brand-alabaster text-brand-shadow' },
  'items received': { label: 'Items received', className: 'bg-brand-available-bg text-brand-available' },
}

export function orderStatusConfig(status) {
  return (
    ORDER_STATUS_STYLE[status] ?? {
      label: status ? String(status) : 'Unknown',
      className: 'bg-brand-alabaster text-brand-shadow/70',
    }
  )
}
