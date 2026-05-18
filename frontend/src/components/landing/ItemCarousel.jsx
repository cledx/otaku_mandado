import { useEffect, useMemo, useState } from 'react'
import { formatMxPrice } from '../sale/EditablePrice'

const ROTATE_MS = 5_000

function shuffle(items) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function CarouselImage({ item }) {
  const imageUrl = item.image_urls?.[0]
  if (!imageUrl) {
    return (
      <div className="mx-auto flex aspect-square w-full max-w-[200px] items-center justify-center rounded-lg bg-brand-lavender/60 sm:max-w-[220px]">
        <svg
          className="size-12 text-brand-thistle"
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

  return (
    <img
      src={imageUrl}
      alt={item.name || 'Producto'}
      className="mx-auto aspect-square w-full max-w-[200px] rounded-lg object-cover shadow-sm sm:max-w-[220px]"
    />
  )
}

/**
 * Auto-rotating item showcase on the landing page (shop catalog or active drop).
 * @param {{ items: object[], emptyMessage: string, slidesLabel?: string }} props
 */
export default function ItemCarousel({ items, emptyMessage, slidesLabel = 'Artículos' }) {
  const shuffled = useMemo(() => shuffle(items), [items])
  const [index, setIndex] = useState(0)
  const count = shuffled.length
  const activeIndex = count > 0 ? index % count : 0

  useEffect(() => {
    if (count <= 1) return undefined
    const id = window.setInterval(() => {
      setIndex((i) => i + 1)
    }, ROTATE_MS)
    return () => window.clearInterval(id)
  }, [count])

  if (count === 0) {
    return <p className="text-sm leading-relaxed text-brand-shadow/75 sm:text-base">{emptyMessage}</p>
  }

  const item = shuffled[activeIndex]

  const go = (delta) => {
    setIndex((i) => i + delta)
  }

  return (
    <div
      className="flex flex-col items-center"
      aria-live="polite"
      aria-atomic="true"
      aria-roledescription="carousel"
    >
      <div className="relative w-full">
        {count > 1 ? (
          <>
            <button
              type="button"
              aria-label="Artículo anterior"
              onClick={() => go(-1)}
              className="absolute left-0 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-brand-thistle/50 bg-white/90 text-brand-shadow shadow-sm transition hover:bg-brand-lavender sm:-left-1"
            >
              <span aria-hidden className="text-lg leading-none">
                ‹
              </span>
            </button>
            <button
              type="button"
              aria-label="Artículo siguiente"
              onClick={() => go(1)}
              className="absolute right-0 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-brand-thistle/50 bg-white/90 text-brand-shadow shadow-sm transition hover:bg-brand-lavender sm:-right-1"
            >
              <span aria-hidden className="text-lg leading-none">
                ›
              </span>
            </button>
          </>
        ) : null}

        <div key={item.id} className="px-8 transition-opacity duration-500 sm:px-10">
          <CarouselImage item={item} />
          <h3 className="mt-4 text-center font-sans text-lg font-bold text-brand-shadow sm:text-xl">
            {item.name || 'Sin título'}
          </h3>
          {item.brand ? (
            <p className="mt-1 text-center text-sm font-medium text-brand-shadow/65">{item.brand}</p>
          ) : null}
          <p className="mt-2 text-center text-lg font-bold text-brand-shadow">{formatMxPrice(item.mx_price)}</p>
        </div>
      </div>

      {count > 1 ? (
        <div
          className="mt-4 flex flex-wrap justify-center gap-1.5"
          role="tablist"
          aria-label={`Diapositivas: ${slidesLabel}`}
        >
          {shuffled.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={`Mostrar ${slide.name || 'artículo'} (${i + 1} de ${count})`}
              onClick={() => setIndex(i)}
              className={`size-2 rounded-full transition ${
                i === activeIndex ? 'bg-brand-shadow' : 'bg-brand-shadow/25 hover:bg-brand-shadow/45'
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
