import { useEffect, useRef, useState } from 'react'
import { ORDER_STATUSES, orderStatusConfig } from './orderStatus'

function ChevronDownIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 12 8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M1.5 1.75 6 6.25l4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Pill-shaped status indicator. When `editable`, clicking opens a dropdown of
 * fulfillment statuses; selecting one calls `onChange(nextStatus)` (async).
 *
 * The parent owns persistence so a single component works for both per-line
 * updates and bulk group updates.
 *
 * @param {{
 *   status: string,
 *   editable?: boolean,
 *   size?: 'sm' | 'lg',
 *   ariaLabel?: string,
 *   onChange?: (nextStatus: string) => Promise<void> | void,
 * }} props
 */
export default function OrderStatusSelect({
  status,
  editable = false,
  size = 'sm',
  ariaLabel,
  onChange,
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const wrapperRef = useRef(null)

  const config = orderStatusConfig(status)
  const padding = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'
  const iconSize = size === 'lg' ? 'size-3.5' : 'size-3'

  useEffect(() => {
    if (!open) return undefined
    const onDocClick = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!editable) {
    return (
      <span
        className={`inline-flex w-fit rounded-full font-semibold ${padding} ${config.className}`}
      >
        {config.label}
      </span>
    )
  }

  const handlePick = async (next) => {
    if (next === status || saving) {
      setOpen(false)
      return
    }
    setError(null)
    setSaving(true)
    try {
      await onChange?.(next)
      setOpen(false)
    } catch (e) {
      setError(e?.message || 'Could not update status.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative inline-flex flex-col items-end gap-1" ref={wrapperRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel || `Change status (currently ${config.label})`}
        disabled={saving}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className={`inline-flex w-fit items-center gap-1.5 rounded-full font-semibold transition hover:ring-2 hover:ring-brand-dusty/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dusty disabled:cursor-wait disabled:opacity-70 ${padding} ${config.className}`}
      >
        <span>{saving ? 'Saving…' : config.label}</span>
        <ChevronDownIcon className={iconSize} />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label="Order status"
          className="absolute right-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-xl border border-brand-thistle/60 bg-white text-left shadow-xl ring-1 ring-brand-shadow/10"
          onClick={(e) => e.stopPropagation()}
        >
          {ORDER_STATUSES.map((option) => {
            const optConfig = orderStatusConfig(option)
            const isCurrent = option === status
            return (
              <li key={option}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isCurrent}
                  onClick={() => void handlePick(option)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition hover:bg-brand-alabaster/80 ${
                    isCurrent ? 'bg-brand-alabaster/60 font-semibold text-brand-shadow' : 'text-brand-shadow/85'
                  }`}
                >
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${optConfig.className}`}
                  >
                    {optConfig.label}
                  </span>
                  {isCurrent ? (
                    <span className="text-xs text-brand-shadow/55">current</span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}

      {error ? (
        <p className="max-w-[14rem] text-right text-xs text-brand-dusty" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
