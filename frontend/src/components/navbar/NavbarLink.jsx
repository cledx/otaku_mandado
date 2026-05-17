const baseClass =
  'text-sm font-medium text-brand-shadow no-underline transition-colors hover:text-brand-dusty disabled:cursor-not-allowed disabled:opacity-60'

/**
 * Navbar link or action control.
 * @param {string} [to] - href for navigation
 * @param {string} [text] - label (alternative to children)
 * @param {'link'|'button'} [as] - force element type; defaults to button when `to` is omitted
 * @param {() => void} [onClick]
 */
export default function NavbarLink({
  to,
  text,
  children,
  onClick,
  as,
  className = '',
  disabled = false,
  ...rest
}) {
  const label = children ?? text
  const classes = [baseClass, className].filter(Boolean).join(' ')
  const useButton = as === 'button' || (as !== 'link' && to == null)

  if (useButton) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`border-0 bg-transparent p-0 ${classes}`}
        {...rest}
      >
        {label}
      </button>
    )
  }

  return (
    <a href={to ?? '#'} onClick={onClick} className={classes} {...rest}>
      {label}
    </a>
  )
}
