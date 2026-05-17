/** Gray placeholder when an item has no Cloudinary image yet. */
function ImagePlaceholder() {
  return (
    <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-brand-alabaster">
      <svg
        className="size-12 text-brand-thistle sm:size-16"
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

/** Formats mx_price (MXN, rounded on the server) for display. */
function formatMxPrice(mxPrice) {
  if (mxPrice == null || mxPrice === '') return '$0'
  const n = Number(mxPrice)
  if (Number.isNaN(n)) return String(mxPrice)
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(n)
}

const STATUS_PILL = {
  available: { label: 'Available', className: 'bg-brand-available-bg text-brand-available' },
  reserved: { label: 'Reserved', className: 'bg-brand-dusty/25 text-brand-dusty' },
  purchased: { label: 'Sold', className: 'bg-brand-alabaster text-brand-shadow/70' },
}

/** Small pill showing item.status (available | reserved | purchased). */
function StatusPill({ status }) {
  const config = STATUS_PILL[status] ?? {
    label: status ? String(status) : 'Unknown',
    className: 'bg-brand-alabaster text-brand-shadow/70',
  }

  return (
    <span
      className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  )
}

/**
 * Single product tile on the sale (drop) page grid.
 * @param {{ item: { id: number, name?: string, brand?: string, mx_price?: number, description?: string, image_urls?: string[], status?: string } }} props
 */
export default function ProductCard({ item }) {
  const imageUrl = item.image_urls?.[0]

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white p-3 shadow-sm sm:p-4">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={item.name || 'Product'}
          className="aspect-square w-full rounded-lg object-cover"
        />
      ) : (
        <ImagePlaceholder />
      )}

      <h2 className="mt-3 truncate text-base font-medium text-brand-shadow">
        {item.name || 'Untitled'}
      </h2>
      {item.brand ? (
        <p className="mt-0.5 truncate text-sm text-brand-shadow/65">{item.brand}</p>
      ) : null}
      <div className="mt-2">
        <StatusPill status={item.status} />
      </div>
      <p className="mt-2 text-lg font-bold text-brand-shadow">{formatMxPrice(item.mx_price)}</p>
      <p className="mt-1 line-clamp-3 text-sm text-brand-shadow/75">
        {item.description || 'No description yet.'}
      </p>
    </article>
  )
}
