/**
 * Full-viewport background image with a dark gradient overlay.
 * @param {string} [imageUrl] — path under public/, e.g. landing_page.png or sales.png
 */
export default function PageBackground({
  imageUrl = '/assets/backgrounds/landing_page.png',
  className = '',
  overlay = true,
}) {
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
