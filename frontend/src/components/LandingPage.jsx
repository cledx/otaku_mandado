import { useEffect, useMemo, useState } from 'react'
import { fetchLandingSale } from '../api'
import DigitTimer from './DigitTimer'
import InfoCard from './landing/InfoCard'
import PageBackground from './layout/PageBackground'
import Navbar from './navbar/Navbar'
import PillLink from './ui/PillLink'

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'

function parseTargetMs(payload) {
  if (!payload?.phase || !payload.starts_at || !payload.ends_at) return null
  if (payload.phase === 'before') return Date.parse(payload.starts_at)
  if (payload.phase === 'during') return Date.parse(payload.ends_at)
  return null
}

function splitCountdown(ms) {
  if (ms <= 0) return { hours: 0, minutes: 0, seconds: 0 }
  const totalSec = Math.floor(ms / 1000)
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  return { hours, minutes, seconds }
}

export default function LandingPage() {
  const [payload, setPayload] = useState(null)
  const [error, setError] = useState(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        const data = await fetchLandingSale()
        if (!cancelled) {
          setError(null)
          setPayload(data)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message)
          setPayload(null)
        }
      }
    }

    void run()
    const id = window.setInterval(() => void run(), 60_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const targetMs = useMemo(() => parseTargetMs(payload), [payload])

  const { hours, minutes, seconds } = useMemo(() => {
    if (targetMs == null) return { hours: 0, minutes: 0, seconds: 0 }
    return splitCountdown(targetMs - now)
  }, [targetMs, now])

  const heading =
    payload?.phase === 'during'
      ? 'Time Left in Current Drop:'
      : 'Time Until Next Drop:'

  const showTimer = Boolean(payload && targetMs != null && !error)
  const dropHref = payload?.sale?.id != null ? `#sale-${payload.sale.id}` : '#'

  return (
    <div className="relative min-h-svh w-full bg-brand-shadow text-brand-shadow">
      <Navbar />

      <PageBackground />

      <main className="relative z-10 flex min-h-svh w-full flex-col">
        <div className="relative flex min-h-[70vh] flex-1 flex-col items-center justify-center px-4 pb-48 pt-10 sm:min-h-[75vh] sm:px-6 sm:pb-56 sm:pt-16">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
            <h1 className="mb-6 max-w-xl font-sans text-lg font-semibold tracking-wide text-brand-lavender drop-shadow-[0_2px_10px_rgba(45,45,52,0.9)] sm:text-xl">
              {error ? 'Drop schedule unavailable' : showTimer ? heading : 'No upcoming drop'}
            </h1>

            {error ? (
              <p className="mb-8 max-w-md text-sm text-brand-alabaster drop-shadow-md">{error}</p>
            ) : null}

            {showTimer ? (
              <>
                <DigitTimer hours={hours} minutes={minutes} seconds={seconds} />
                <PillLink to={dropHref}>Current Drop</PillLink>
              </>
            ) : !error ? (
              <p className="max-w-md text-sm text-brand-alabaster drop-shadow-md">
                There is no sale currently scheduled. Check back soon!
              </p>
            ) : null}
          </div>
        </div>

        <section className="relative -mt-36 mx-auto mb-10 w-full max-w-5xl px-4 sm:-mt-44 sm:mb-14 sm:px-6">
          <div className="rounded-2xl border border-brand-dusty/35 bg-brand-thistle/55 p-4 shadow-xl backdrop-blur-sm sm:rounded-3xl sm:p-6 md:p-8">
            <div className="grid gap-4 md:grid-cols-2 md:gap-6">
              <InfoCard title="Lorem ipsum dolor sit amet" variant="lavender">
                {LOREM}
              </InfoCard>
              <InfoCard title="Consectetur adipiscing elit" variant="alabaster">
                {LOREM}
              </InfoCard>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
