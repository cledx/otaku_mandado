import { useEffect, useState } from 'react'
import { createSale, fetchNavContext, getAuthToken } from '../api'
import PageBackground from './layout/PageBackground'
import Navbar from './navbar/Navbar'

/** Shared sales/orders page background from public/assets/backgrounds/. */
const SALE_BACKGROUND = '/assets/backgrounds/sales.png'

/** Shared form control styles for the schedule fields. */
const inputClass =
  'w-full rounded-xl border border-brand-thistle/80 bg-brand-alabaster/90 px-4 py-2.5 text-sm text-brand-shadow outline-none transition placeholder:text-brand-shadow/40 focus:border-brand-dusty focus:ring-2 focus:ring-brand-dusty/25'

/**
 * Default start date: two days from today, formatted as YYYY-MM-DD for
 * `<input type="date">`. Gives admins a sensible lead time out of the box.
 */
function defaultStartDate() {
  const d = new Date()
  d.setDate(d.getDate() + 2)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Combines a date (YYYY-MM-DD) + time (HH:MM) into an ISO string using the
 * browser's local timezone. The API stores UTC; conversion happens here so
 * admins can think in local wall-clock time when scheduling.
 */
function buildStartTimeIso(startDate, timeOfDay) {
  const local = new Date(`${startDate}T${timeOfDay}:00`)
  if (Number.isNaN(local.getTime())) return null
  return local.toISOString()
}

/**
 * Schedule Sale page (`#schedule-sale`) — admin-only form to create a new drop.
 *
 * Collects name, local start date/time, and duration in hours, then POSTs via
 * `createSale`. On success, navigates to `#upcoming-sale` so the admin can
 * upload items on the Upcoming Sale page. Product images are intentionally
 * not part of this form.
 *
 * Access gate: guests and non-admin clients see a message instead of the form.
 */
export default function ScheduleSalePage() {
  // 'loading' | 'guest' | 'client' | 'admin' — drives the access gate UI.
  const [authState, setAuthState] = useState('loading')
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState(defaultStartDate)
  const [startTimeOfDay, setStartTimeOfDay] = useState('12:00')
  const [duration, setDuration] = useState('3')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Resolve whether the signed-in user is an admin before showing the form.
  useEffect(() => {
    if (!getAuthToken()) {
      setAuthState('guest')
      return
    }

    let cancelled = false
    const load = async () => {
      try {
        const ctx = await fetchNavContext()
        if (!cancelled) setAuthState(ctx.role === 'admin' ? 'admin' : 'client')
      } catch {
        if (!cancelled) setAuthState('guest')
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  /**
   * Validates local form fields, builds an ISO start_time, and creates the sale.
   * Duration is sent as hours; the backend derives ends_at from start + duration.
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Sale name is required.')
      return
    }

    const durationHours = Number(duration)
    if (!Number.isFinite(durationHours) || durationHours <= 0) {
      setError('Duration must be a positive number of hours.')
      return
    }

    if (!startDate) {
      setError('Start date is required.')
      return
    }

    if (!startTimeOfDay) {
      setError('Start time is required.')
      return
    }

    const startTime = buildStartTimeIso(startDate, startTimeOfDay)
    if (!startTime) {
      setError('Start date and time are invalid.')
      return
    }

    setSubmitting(true)
    try {
      await createSale({
        name: trimmedName,
        start_time: startTime,
        duration: durationHours,
      })
      // Hand off to Upcoming Sale so the admin can add catalog items next.
      window.location.hash = 'upcoming-sale'
    } catch (err) {
      setError(err.message || 'Could not schedule sale.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-svh w-full bg-brand-shadow text-brand-shadow">
      <Navbar />
      <PageBackground imageUrl={SALE_BACKGROUND} />

      <main className="relative z-10 mx-auto max-w-lg px-4 pb-12 pt-24 sm:px-6 sm:pt-28">
        <div className="rounded-2xl border border-brand-dusty/40 bg-brand-lavender/97 p-6 shadow-2xl ring-1 ring-brand-thistle/40 sm:rounded-3xl sm:p-8">
          <h1 className="mb-1 text-center font-sans text-2xl font-bold text-brand-shadow">
            Schedule a Sale
          </h1>
          <p className="mb-6 text-center text-sm text-brand-shadow/65">
            Set the drop name, start date and time, and duration. Add product images on the
            Upcoming Sale page after saving.
          </p>

          {/* Access gate: only admins see the create-sale form */}
          {authState === 'loading' ? (
            <p className="text-center text-sm text-brand-shadow/70">Checking access…</p>
          ) : authState !== 'admin' ? (
            <p className="text-center text-sm text-brand-dusty" role="alert">
              {authState === 'guest'
                ? 'Sign in as an admin to schedule a sale.'
                : 'Only admins can schedule sales.'}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-brand-shadow">
                  Sale name
                </span>
                <input
                  type="text"
                  name="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Spring Anime Drop"
                  autoComplete="off"
                />
              </label>

              {/* Local date + time; combined into ISO on submit */}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-brand-shadow">
                    Start date
                  </span>
                  <input
                    type="date"
                    name="start_date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-brand-shadow">
                    Start time
                  </span>
                  <input
                    type="time"
                    name="start_time"
                    required
                    value={startTimeOfDay}
                    onChange={(e) => setStartTimeOfDay(e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>
              <span className="-mt-2 block text-xs text-brand-shadow/55">
                Uses your device&apos;s local timezone for the drop start.
              </span>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-brand-shadow">
                  Duration (hours)
                </span>
                <input
                  type="number"
                  name="duration"
                  required
                  min="0.5"
                  step="0.5"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className={inputClass}
                  placeholder="3"
                />
                <span className="mt-1 block text-xs text-brand-shadow/55">
                  How long the drop stays live after it starts.
                </span>
              </label>

              {error ? (
                <p
                  className="rounded-lg bg-brand-dusty/15 px-3 py-2 text-center text-sm text-brand-dusty"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full rounded-full border border-brand-shadow bg-brand-shadow px-6 py-3 text-sm font-semibold text-brand-lavender shadow-md transition hover:border-brand-dusty hover:bg-brand-dusty disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Scheduling…' : 'Schedule sale'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
