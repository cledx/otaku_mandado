export default function PillLink({ to = '#', children, className = '', ...rest }) {
  return (
    <a
      href={to}
      className={`mt-10 inline-flex rounded-full border border-brand-lavender bg-brand-shadow px-10 py-3 text-sm font-semibold text-brand-lavender no-underline shadow-lg transition hover:border-brand-alabaster hover:bg-brand-dusty hover:text-brand-lavender ${className}`.trim()}
      {...rest}
    >
      {children}
    </a>
  )
}
