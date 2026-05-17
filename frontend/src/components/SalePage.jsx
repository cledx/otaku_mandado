import { useEffect, useMemo, useState } from 'react'
import { fetchNavContext, fetchSalePage, getAuthToken } from '../api'
import { parseCountdownTargetMs, splitCountdown } from '../utils/countdown'
import DigitTimer from './DigitTimer'
import PageBackground from './layout/PageBackground'
import Navbar from './navbar/Navbar'
import ProductCard from './sale/ProductCard'

/** Served from public/assets/backgrounds/ (same pattern as landing_page.png). */
const SALE_BACKGROUND = '/assets/backgrounds/sales.png'

/** Header badge copy — "Upcoming" before the drop window, "Today's" once live or after. */
function dropBadgeLabel(phase) {
  if (phase === 'before') return 'Upcoming Drop:'
  return "Today's Drop:"
}

/** Countdown label under the badge; mirrors landing page wording. */
function timerHeading(phase) {
  if (phase === 'during') return 'Time Left in Current Drop:'
  if (phase === 'before') return 'Time Until Drop Starts:'
  return 'This drop has ended'
}

/**
 * Single-sale drop page (Figma "Drop Page").
 * @param {string} [saleId] — used when mode is "id" (#sale-{id} from landing)
 * @param {'id'|'current'|'upcoming'} [mode] — current/upcoming resolve via nav_context (auth required)
 */
export default function SalePage({ saleId, mode = 'id' }) {
  const [navResolvedId, setNavResolvedId] = useState(null)
  const [resolveError, setResolveError] = useState(null)
  const [payload, setPayload] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [now, setNow] = useState(() => Date.now())

  // Public hash routes pass saleId directly; navbar routes resolve from nav_context.
  const resolvedId = mode === 'id' ? saleId : navResolvedId

  // #current-sale and #upcoming-sale: map nav_context booleans to a concrete sale id.
  useEffect(() => {
    if (mode === 'id') return

    let cancelled = false

    const resolve = async () => {
      if (!getAuthToken()) {
        if (!cancelled) {
          setResolveError('Sign in to view this sale.')
          setNavResolvedId(null)
        }
        return
      }

      try {
        const ctx = await fetchNavContext()
        const id = mode === 'current' ? ctx.current_sale_id : ctx.upcoming_sale_id
        if (!id) {
          throw new Error(
            mode === 'current' ? 'No current sale is available.' : 'No upcoming sale is scheduled.',
          )
        }
        if (!cancelled) {
          setNavResolvedId(String(id))
          setResolveError(null)
        }
      } catch (e) {
        if (!cancelled) {
          setResolveError(e.message)
          setNavResolvedId(null)
        }
      }
    }

    void resolve()
    return () => {
      cancelled = true
    }
  }, [mode])

  // Load sale + items from the public sale_pages endpoint; refresh every minute.
  useEffect(() => {
    if (!resolvedId) return

    let cancelled = false

    const load = async () => {
      try {
        const data = await fetchSalePage(resolvedId)
        if (!cancelled) {
          setLoadError(null)
          setPayload(data)
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e.message)
          setPayload(null)
        }
      }
    }

    void load()
    const id = window.setInterval(() => void load(), 60_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [resolvedId])

  // Tick every second so the countdown stays in sync with the landing page.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const targetMs = useMemo(() => parseCountdownTargetMs(payload), [payload])
  const { hours, minutes, seconds } = useMemo(() => {
    if (targetMs == null) return { hours: 0, minutes: 0, seconds: 0 }
    return splitCountdown(targetMs - now)
  }, [targetMs, now])

  const phase = payload?.phase
  const items = payload?.sale?.items ?? []
  const showTimer = Boolean(payload && targetMs != null && !loadError && !resolveError)
  const badge = dropBadgeLabel(phase)

  return (
    <div className="relative min-h-svh w-full bg-brand-shadow text-brand-shadow">
      <Navbar />

      <PageBackground imageUrl={SALE_BACKGROUND} />

      {/* Drop header: badge + countdown (Figma header strip) */}
      <header className="relative z-10 border-b border-brand-thistle/80 bg-brand-thistle/45 pt-10 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-8 sm:flex-row sm:flex-wrap sm:gap-6 sm:px-6 sm:py-10">
          <span className="rounded-2xl border-[3px] border-brand-shadow bg-white px-6 py-2 text-lg font-semibold tracking-wide sm:text-xl">
            {badge}
          </span>

          <div className="flex flex-col items-start gap-3">
            <p className="text-left text-sm font-medium sm:text-base">
              {resolveError || loadError
                ? 'Drop unavailable'
                : showTimer
                  ? timerHeading(phase)
                  : timerHeading(phase ?? 'after')}
            </p>
            {showTimer ? (
              <DigitTimer hours={hours} minutes={minutes} seconds={seconds} variant="drop" />
            ) : null}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {resolveError ? (
          <p className="text-center text-sm text-brand-alabaster drop-shadow-md">{resolveError}</p>
        ) : loadError ? (
          <p className="text-center text-sm text-brand-alabaster drop-shadow-md">{loadError}</p>
        ) : !resolvedId ? (
          <p className="text-center text-sm text-brand-alabaster drop-shadow-md">Loading sale…</p>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-brand-alabaster drop-shadow-md">
            No items in this drop yet. Check back soon!
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-5">
            {items.map((item) => (
              <li key={item.id}>
                <ProductCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
