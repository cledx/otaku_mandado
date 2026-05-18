const variants = {
  lavender: 'bg-brand-lavender/95',
  alabaster: 'bg-brand-alabaster/95',
}

export default function InfoCard({ title, children, variant = 'lavender', className = '' }) {
  return (
    <article
      className={`rounded-xl p-6 text-left shadow-md ring-1 ring-brand-thistle/30 sm:p-8 ${variants[variant] ?? variants.lavender} ${className}`.trim()}
    >
      {title ? (
        <h2 className="mb-3 text-center font-sans text-lg font-bold text-brand-shadow sm:text-xl">
          {title}
        </h2>
      ) : null}
      <div className="text-center text-sm leading-relaxed text-brand-shadow/75 sm:text-base">
        {children}
      </div>
    </article>
  )
}
