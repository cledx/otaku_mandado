import { useEffect, useMemo, useState } from 'react'
import {
  fetchNavContext,
  fetchSale,
  fetchSalePage,
  fetchShopSalePage,
  getAuthToken,
  updateSale,
} from '../api'
import { parseCountdownTargetMs, splitCountdown } from '../utils/countdown'
import DigitTimer from './DigitTimer'
import PageBackground from './layout/PageBackground'
import Navbar from './navbar/Navbar'
import ItemUploadModal from './sale/ItemUploadModal'
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

function toLocalDateTimeInputValue(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function parseLocalDateTimeInputValue(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d
}

function formatQuickShiftLabel(minutes) {
  const sign = minutes > 0 ? '+' : '-'
  const absMinutes = Math.abs(minutes)
  if (absMinutes === 30) return `${sign}30m`
  if (absMinutes % 60 === 0) return `${sign}${absMinutes / 60}h`
  return `${sign}${absMinutes}m`
}

/**
 * Single-sale drop page (Figma "Drop Page").
 * @param {string} [saleId] — used when mode is "id" (#sale-{id} from landing)
 * @param {'id'|'current'|'upcoming'|'shop'} [mode] — shop loads sale named "Shop"; current/upcoming use nav_context
 */
export default function SalePage({ saleId, mode = 'id' }) {
  const isShop = mode === 'shop'
  const [navResolvedId, setNavResolvedId] = useState(null)
  const [resolveError, setResolveError] = useState(null)
  const [payload, setPayload] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [reschedulingStart, setReschedulingStart] = useState(false)
  const [rescheduleError, setRescheduleError] = useState(null)
  const [timeEditorOpen, setTimeEditorOpen] = useState(false)
  const [savingTimes, setSavingTimes] = useState(false)
  const [timeEditorError, setTimeEditorError] = useState(null)
  const [draftStartInput, setDraftStartInput] = useState('')
  const [draftEndInput, setDraftEndInput] = useState('')
  const [now, setNow] = useState(() => Date.now())

  const isUpcomingPage = mode === 'upcoming'

  // Public #sale-{id} passes saleId; #browse-shop and nav sales resolve asynchronously.
  const resolvedId = mode === 'id' ? saleId : navResolvedId

  // Show delete controls when the signed-in user is an admin.
  useEffect(() => {
    if (!getAuthToken()) {
      setIsAdmin(false)
      return
    }

    let cancelled = false
    const loadRole = async () => {
      try {
        const ctx = await fetchNavContext()
        if (!cancelled) setIsAdmin(ctx.role === 'admin')
      } catch {
        if (!cancelled) setIsAdmin(false)
      }
    }
    void loadRole()
    return () => {
      cancelled = true
    }
  }, [])

  const handleItemDeleted = (itemId) => {
    setPayload((prev) => {
      if (!prev?.sale?.items) return prev
      return {
        ...prev,
        sale: {
          ...prev.sale,
          items: prev.sale.items.filter((item) => item.id !== itemId),
        },
      }
    })
  }

  const handleItemsCreated = (created) => {
    if (!Array.isArray(created) || created.length === 0) return
    setPayload((prev) => ({
      ...prev,
      sale: {
        ...prev?.sale,
        items: [...(prev?.sale?.items ?? []), ...created],
      },
    }))
  }

  const handleItemUpdated = (updated) => {
    setPayload((prev) => {
      if (!prev?.sale?.items) return prev
      return {
        ...prev,
        sale: {
          ...prev.sale,
          items: prev.sale.items.map((i) => (i.id === updated.id ? updated : i)),
        },
      }
    })
  }

  const reloadSalePage = async (saleIdForReload) => {
    const pageData = await fetchSalePage(saleIdForReload)
    return mergeAdminItems(pageData, saleIdForReload)
  }

  const rescheduleStart = async (startTimeMs) => {
    if (!resolvedId) return
    setReschedulingStart(true)
    setRescheduleError(null)
    try {
      const startTime = new Date(startTimeMs).toISOString()
      await updateSale(resolvedId, { start_time: startTime })
      setPayload(await reloadSalePage(resolvedId))
    } catch (e) {
      setRescheduleError(e.message || 'Could not update start time.')
    } finally {
      setReschedulingStart(false)
    }
  }

  const handleStartIn10Minutes = () => rescheduleStart(Date.now() + 10 * 60 * 1000)
  const handleStartNow = () => rescheduleStart(Date.now())

  const openTimeEditor = () => {
    setDraftStartInput(toLocalDateTimeInputValue(payload?.starts_at))
    setDraftEndInput(toLocalDateTimeInputValue(payload?.ends_at))
    setTimeEditorError(null)
    setTimeEditorOpen(true)
  }

  const nudgeDraftTime = (field, minutesDelta) => {
    const currentValue = field === 'start' ? draftStartInput : draftEndInput
    const parsed = parseLocalDateTimeInputValue(currentValue)
    if (!parsed) return
    const next = new Date(parsed.getTime() + minutesDelta * 60 * 1000)
    const nextValue = toLocalDateTimeInputValue(next)
    if (field === 'start') setDraftStartInput(nextValue)
    else setDraftEndInput(nextValue)
  }

  const handleSaveTimes = async () => {
    if (!resolvedId) return
    const startDate = parseLocalDateTimeInputValue(draftStartInput)
    const endDate = parseLocalDateTimeInputValue(draftEndInput)
    if (!startDate || !endDate) {
      setTimeEditorError('Start and end must both be valid date-times.')
      return
    }
    if (endDate.getTime() <= startDate.getTime()) {
      setTimeEditorError('End time must be after start time.')
      return
    }

    setSavingTimes(true)
    setTimeEditorError(null)
    setRescheduleError(null)
    try {
      const durationHours = (endDate.getTime() - startDate.getTime()) / (60 * 60 * 1000)
      await updateSale(resolvedId, {
        start_time: startDate.toISOString(),
        duration: durationHours,
      })
      setPayload(await reloadSalePage(resolvedId))
      setTimeEditorOpen(false)
    } catch (e) {
      setTimeEditorError(e.message || 'Could not update sale times.')
    } finally {
      setSavingTimes(false)
    }
  }

  // #current-sale and #upcoming-sale: map nav_context booleans to a concrete sale id.
  useEffect(() => {
    if (mode === 'id' || mode === 'shop') return

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

  const mergeAdminItems = async (pageData, saleIdForAdmin) => {
    if (!isAdmin || !getAuthToken()) return pageData
    const sale = await fetchSale(saleIdForAdmin)
    return {
      ...pageData,
      sale: {
        ...pageData.sale,
        items: sale.items ?? [],
      },
    }
  }

  // #browse-shop: persistent catalog (no countdown).
  useEffect(() => {
    if (!isShop) return

    let cancelled = false

    const load = async () => {
      try {
        const pageData = await fetchShopSalePage()
        const data = await mergeAdminItems(pageData, String(pageData.sale.id))
        if (!cancelled) {
          setNavResolvedId(String(pageData.sale.id))
          setLoadError(null)
          setResolveError(null)
          setPayload(data)
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e.message)
          setPayload(null)
          setNavResolvedId(null)
        }
      }
    }

    void load()
    const id = window.setInterval(() => void load(), 60_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [isShop, isAdmin])

  // Public sale_pages for timing; admins merge in items with yen price from GET /v1/sales/:id.
  useEffect(() => {
    if (isShop || !resolvedId) return

    let cancelled = false

    const load = async () => {
      try {
        const pageData = await fetchSalePage(resolvedId)
        const data = await mergeAdminItems(pageData, resolvedId)

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
  }, [isShop, resolvedId, isAdmin])

  // Tick every second so the countdown stays in sync with the landing page.
  useEffect(() => {
    if (isShop) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [isShop])

  const targetMs = useMemo(() => parseCountdownTargetMs(payload), [payload])
  const { hours, minutes, seconds } = useMemo(() => {
    if (targetMs == null) return { hours: 0, minutes: 0, seconds: 0 }
    return splitCountdown(targetMs - now)
  }, [targetMs, now])

  const phase = payload?.phase
  const items = payload?.sale?.items ?? []
  const showTimer =
    !isShop && Boolean(payload && targetMs != null && !loadError && !resolveError)
  const badge = dropBadgeLabel(phase)

  return (
    <div className="relative min-h-svh w-full bg-brand-shadow text-brand-shadow">
      <Navbar />

      <PageBackground imageUrl={SALE_BACKGROUND} />

      {/* Drop header: badge + countdown (Figma header strip); shop omits timing */}
      {(!isShop || (isAdmin && resolvedId)) ? (
        <header className="relative z-10 border-b border-brand-thistle/80 bg-brand-thistle/45 pt-10 backdrop-blur-sm">
          <div
            className={`mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:px-6 ${isShop
                ? 'items-end justify-end py-4 sm:flex-row sm:py-5'
                : 'items-start py-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-6 sm:py-10'
              }`}
          >
            {!isShop ? (
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
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
            ) : null}

            {isAdmin && resolvedId ? (
              <div className="flex flex-col items-end gap-2">
                {rescheduleError ? (
                  <p className="text-right text-xs text-brand-dusty" role="alert">
                    {rescheduleError}
                  </p>
                ) : null}
                <div className="flex items-start justify-end gap-3">
                  {isUpcomingPage ? (
                    <div className="flex flex-col items-stretch gap-2">
                      <button
                        type="button"
                        onClick={() => void handleStartIn10Minutes()}
                        disabled={reschedulingStart}
                        className="rounded-full border border-brand-dusty bg-brand-lavender px-6 py-2.5 text-sm font-semibold text-brand-shadow shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {reschedulingStart ? 'Updating…' : 'Start in 10 minutes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleStartNow()}
                        disabled={reschedulingStart}
                        className="rounded-full border border-brand-dusty bg-brand-lavender px-6 py-2.5 text-sm font-semibold text-brand-shadow shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {reschedulingStart ? 'Updating…' : 'Start now'}
                      </button>
                    </div>
                  ) : null}
                  <div className="flex flex-col items-stretch gap-2">
                    <button
                      type="button"
                      onClick={() => setUploadOpen(true)}
                      className="rounded-full border border-brand-shadow bg-white px-6 py-2.5 text-sm font-semibold text-brand-shadow shadow-sm transition hover:border-brand-dusty hover:bg-brand-lavender"
                    >
                      Item Upload
                    </button>
                    {!isShop ? (
                      <button
                        type="button"
                        onClick={openTimeEditor}
                        className="rounded-full border border-brand-shadow bg-white px-6 py-2.5 text-sm font-semibold text-brand-shadow shadow-sm transition hover:border-brand-dusty hover:bg-brand-lavender"
                      >
                        Edit Timer
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </header>
      ) : null}

      <ItemUploadModal
        open={uploadOpen}
        saleId={resolvedId}
        onClose={() => setUploadOpen(false)}
        onItemsCreated={handleItemsCreated}
      />

      {timeEditorOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-shadow/55 px-4 py-6">
          <div className="w-full max-w-xl rounded-2xl border border-brand-thistle/70 bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-brand-shadow sm:text-xl">Edit sale times</h2>
              <button
                type="button"
                onClick={() => setTimeEditorOpen(false)}
                disabled={savingTimes}
                className="rounded-full border border-brand-shadow px-3 py-1 text-xs font-semibold text-brand-shadow transition hover:bg-brand-lavender disabled:cursor-not-allowed disabled:opacity-60"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-brand-shadow">Start time</span>
                <input
                  type="datetime-local"
                  value={draftStartInput}
                  onChange={(e) => setDraftStartInput(e.target.value)}
                  className="w-full rounded-xl border border-brand-thistle/80 bg-brand-alabaster/90 px-4 py-2.5 text-sm text-brand-shadow outline-none transition focus:border-brand-dusty focus:ring-2 focus:ring-brand-dusty/25"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {[-120, -60, -30, 30, 60, 120].map((delta) => (
                    <button
                      key={`start-${delta}`}
                      type="button"
                      onClick={() => nudgeDraftTime('start', delta)}
                      className="rounded-full border border-brand-thistle bg-brand-lavender/65 px-3 py-1.5 text-xs font-semibold text-brand-shadow transition hover:bg-brand-lavender"
                    >
                      {formatQuickShiftLabel(delta)}
                    </button>
                  ))}
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-brand-shadow">End time</span>
                <input
                  type="datetime-local"
                  value={draftEndInput}
                  onChange={(e) => setDraftEndInput(e.target.value)}
                  className="w-full rounded-xl border border-brand-thistle/80 bg-brand-alabaster/90 px-4 py-2.5 text-sm text-brand-shadow outline-none transition focus:border-brand-dusty focus:ring-2 focus:ring-brand-dusty/25"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {[-120, -60, -30, 30, 60, 120].map((delta) => (
                    <button
                      key={`end-${delta}`}
                      type="button"
                      onClick={() => nudgeDraftTime('end', delta)}
                      className="rounded-full border border-brand-thistle bg-brand-lavender/65 px-3 py-1.5 text-xs font-semibold text-brand-shadow transition hover:bg-brand-lavender"
                    >
                      {formatQuickShiftLabel(delta)}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            {timeEditorError ? (
              <p className="mt-4 rounded-lg bg-brand-dusty/10 px-3 py-2 text-sm text-brand-dusty" role="alert">
                {timeEditorError}
              </p>
            ) : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTimeEditorOpen(false)}
                disabled={savingTimes}
                className="rounded-full border border-brand-shadow px-4 py-2 text-sm font-semibold text-brand-shadow transition hover:bg-brand-lavender disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSaveTimes()}
                disabled={savingTimes}
                className="rounded-full border border-brand-shadow bg-brand-shadow px-5 py-2 text-sm font-semibold text-brand-lavender transition hover:border-brand-dusty hover:bg-brand-dusty disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingTimes ? 'Saving…' : 'Save times'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <main
        className={
          isShop && !(isAdmin && resolvedId)
            ? 'relative z-10 mx-auto max-w-7xl px-4 pb-8 pt-24 sm:px-6 sm:pb-10'
            : 'relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10'
        }
      >
        {resolveError ? (
          <p className="text-center text-sm text-brand-alabaster drop-shadow-md">{resolveError}</p>
        ) : loadError ? (
          <p className="text-center text-sm text-brand-alabaster drop-shadow-md">{loadError}</p>
        ) : (isShop ? !payload : !resolvedId) ? (
          <p className="text-center text-sm text-brand-alabaster drop-shadow-md">Loading sale…</p>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-brand-alabaster drop-shadow-md">
            {isShop ? 'No items in the shop yet. Check back soon!' : 'No items in this drop yet. Check back soon!'}
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-5">
            {items.map((item) => (
              <li key={item.id}>
                <ProductCard
                  item={item}
                  admin={isAdmin}
                  saleId={resolvedId ?? payload?.sale?.id}
                  onDeleted={handleItemDeleted}
                  onUpdated={handleItemUpdated}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
