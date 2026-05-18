const CASE_BOTTOM = '/assets/display-case-bottom.png'
const CASE_TOP = '/assets/display-case-top.png'

function ImagePlaceholder() {
  return (
    <div className="flex size-full items-center justify-center rounded-lg bg-brand-alabaster/80" aria-hidden>
      <svg
        className="size-16 text-brand-thistle sm:size-20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="8.5" cy="10" r="1.5" fill="currentColor" stroke="none" />
        <path d="M3 16l5-5 4 4 3-3 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function ProductFace({ src, alt, rotateY, hiddenFromAssistiveTech }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center [backface-visibility:hidden]"
      style={{ transform: `rotateY(${rotateY}deg)` }}
      aria-hidden={hiddenFromAssistiveTech || undefined}
    >
      <img
        src={src}
        alt={alt}
        className="max-h-full max-w-full object-contain drop-shadow-md"
        draggable={false}
      />
    </div>
  )
}

/**
 * Layered display stand: base plate → product image → glass case (top PNG).
 * On load, the product slowly rotates front → back → front once, then stays still.
 */
export default function ItemDisplayCase({ imageUrl, backImageUrl, alt }) {
  const backUrl = backImageUrl || imageUrl

  return (
    <div className="relative mx-auto aspect-[3/4] w-full max-w-sm sm:max-w-md">
      <img
        src={CASE_BOTTOM}
        alt=""
        className="pointer-events-none absolute inset-0 z-10 size-full object-contain"
        draggable={false}
      />

      <div
        className="absolute left-[19%] right-[19%] top-[20%] z-20 aspect-square [perspective:900px]"
        aria-hidden={!imageUrl}
      >
        {imageUrl ? (
          <div className="relative size-full animate-item-case-spin">
            <ProductFace src={imageUrl} alt={alt} rotateY={0} />
            <ProductFace src={backUrl} alt="" rotateY={180} hiddenFromAssistiveTech />
          </div>
        ) : (
          <ImagePlaceholder />
        )}
      </div>

      <img
        src={CASE_TOP}
        alt=""
        className="pointer-events-none absolute inset-0 z-30 size-full object-contain"
        draggable={false}
      />
    </div>
  )
}
