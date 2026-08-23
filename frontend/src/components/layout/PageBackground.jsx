/**
 * Page background image.
 *
 * @param {string} [imageUrl] — path under public/, e.g. landing_page.png or sales.png
 * @param {'fixed' | 'scroll'} [attach='fixed']
 *   - `fixed` — stretches to the viewport and ignores scroll
 *   - `scroll` — full width at the image’s native ratio; scrolls with the page
 */
export default function PageBackground({
  imageUrl = '/assets/backgrounds/landing_page.png',
  className = '',
  overlay = true,
  attach = 'fixed',
}) {
  if (attach === 'scroll') {
    return (
      <div
        aria-hidden
        className={`pointer-events-none relative z-0 w-full ${className}`.trim()}
      >
        <img src={imageUrl} alt="" draggable={false} className="block h-auto w-full" />
        {overlay ? (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(to bottom, rgba(45,45,52,0.32), rgba(45,45,52,0.58))',
            }}
          />
        ) : null}
      </div>
    )
  }

  const backgroundImage = overlay
    ? `linear-gradient(to bottom, rgba(45,45,52,0.32), rgba(45,45,52,0.58)), url('${imageUrl}')`
    : `url('${imageUrl}')`
  const backgroundSize = overlay ? '100% 100%, 100% 100%' : '100% 100%'
  const backgroundPosition = overlay ? 'center, center' : 'center'
  const backgroundRepeat = overlay ? 'no-repeat, no-repeat' : 'no-repeat'

  const style = {
    backgroundImage,
    backgroundSize,
    backgroundPosition,
    backgroundRepeat,
  }

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-0 min-h-svh w-full ${className}`.trim()}
      style={style}
    />
  )
}
