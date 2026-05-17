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

/** Formats API price for display; falls back to $0 when missing. */
function formatPrice(price) {
  if (price == null || price === '') return '$0'
  const n = Number(price)
  if (Number.isNaN(n)) return String(price)
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

/**
 * Single product tile on the sale (drop) page grid.
 * @param {{ item: { id: number, name?: string, price?: number, description?: string, image_urls?: string[], status?: string } }} props
 */
export default function ProductCard({ item }) {
  const imageUrl = item.image_urls?.[0]
  const unavailable = item.status !== 'available'

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
      <p className="mt-1 text-lg font-bold text-brand-shadow">{formatPrice(item.price)}</p>
      <p className="mt-1 line-clamp-3 text-sm text-brand-shadow/75">
        {item.description || 'No description yet.'}
      </p>
      {unavailable ? (
        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-brand-dusty">
          {item.status === 'purchased' ? 'Sold' : 'Reserved'}
        </p>
      ) : null}
    </article>
  )
}
