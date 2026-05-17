/**
 * Full-viewport background image with a dark gradient overlay.
 * @param {string} [imageUrl] — path under public/, e.g. landing_page.png or sales.png
 */
export default function PageBackground({
  imageUrl = '/assets/backgrounds/landing_page.png',
  className = '',
}) {
  const style = {
    backgroundImage: `linear-gradient(to bottom, rgba(45,45,52,0.32), rgba(45,45,52,0.58)), url('${imageUrl}')`,
    backgroundSize: '100% 100%, 100% 100%',
    backgroundPosition: 'center, center',
    backgroundRepeat: 'no-repeat, no-repeat',
  }

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-0 min-h-svh w-full ${className}`.trim()}
      style={style}
    />
  )
}
