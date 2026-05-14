function DigitPair({ value }) {
  const s = String(value).padStart(2, '0')
  return (
    <>
      <TimerDigit d={s[0]} />
      <TimerDigit d={s[1]} />
    </>
  )
}

function TimerDigit({ d }) {
  return (
    <div className="flex h-14 min-w-[2.25rem] items-center justify-center rounded-lg bg-white px-2 shadow-md sm:h-20 sm:min-w-[3.25rem] sm:rounded-xl sm:px-3">
      <span className="font-['Orbitron',sans-serif] text-3xl font-bold leading-none text-neutral-900 tabular-nums sm:text-5xl">
        {d}
      </span>
    </div>
  )
}

function Colon() {
  return (
    <div className="flex flex-col justify-center gap-1.5 px-0.5 sm:gap-2 sm:px-1" aria-hidden>
      <span className="size-1.5 rounded-full bg-neutral-900 sm:size-2" />
      <span className="size-1.5 rounded-full bg-neutral-900 sm:size-2" />
    </div>
  )
}

export default function DigitTimer({ hours, minutes, seconds }) {
  return (
    <div
      className="flex items-center justify-center gap-1 sm:gap-2"
      role="timer"
      aria-live="polite"
    >
      <DigitPair value={hours} />
      <Colon />
      <DigitPair value={minutes} />
      <Colon />
      <DigitPair value={seconds} />
    </div>
  )
}
