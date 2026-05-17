function DigitPair({ value, variant }) {
  const s = String(value).padStart(2, '0')
  return (
    <>
      <TimerDigit d={s[0]} variant={variant} />
      <TimerDigit d={s[1]} variant={variant} />
    </>
  )
}

/** @param {'landing'|'drop'} variant — drop uses circular digits on the sale page */
function TimerDigit({ d, variant = 'landing' }) {
  const isDrop = variant === 'drop'
  return (
    <div
      className={
        isDrop
          ? 'flex size-11 items-center justify-center rounded-full border-2 border-brand-shadow bg-white sm:size-14'
          : 'flex h-14 min-w-[2.25rem] items-center justify-center rounded-lg bg-brand-lavender px-2 shadow-md ring-1 ring-brand-thistle/60 sm:h-20 sm:min-w-[3.25rem] sm:rounded-xl sm:px-3'
      }
    >
      <span
        className={`font-['Orbitron',sans-serif] font-bold leading-none text-brand-shadow tabular-nums ${
          isDrop ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-5xl'
        }`}
      >
        {d}
      </span>
    </div>
  )
}

function Colon() {
  return (
    <div className="flex flex-col justify-center gap-1.5 px-0.5 sm:gap-2 sm:px-1" aria-hidden>
      <span className="size-1.5 rounded-full bg-brand-shadow sm:size-2" />
      <span className="size-1.5 rounded-full bg-brand-shadow sm:size-2" />
    </div>
  )
}

/**
 * HH:MM:SS display for landing and sale pages.
 * @param {'landing'|'drop'} [variant]
 */
export default function DigitTimer({ hours, minutes, seconds, variant = 'landing' }) {
  return (
    <div
      className="flex items-center justify-center gap-1 sm:gap-2"
      role="timer"
      aria-live="polite"
    >
      <DigitPair value={hours} variant={variant} />
      <Colon />
      <DigitPair value={minutes} variant={variant} />
      <Colon />
      <DigitPair value={seconds} variant={variant} />
    </div>
  )
}
