import { useEffect, useMemo, useState } from 'react'
import { fetchLandingSale, fetchSalePage, fetchShopSalePage } from '../api'
import DigitTimer from './DigitTimer'
import InfoCard from './landing/InfoCard'
import ItemCarousel from './landing/ItemCarousel'
import PageBackground from './layout/PageBackground'
import Navbar from './navbar/Navbar'
import PillLink from './ui/PillLink'

/**
 * Resolves the countdown target from the landing-sale payload.
 *
 * - `before` → count down to `starts_at` (time until the next drop opens)
 * - `during` → count down to `ends_at` (time left in the live drop)
 * - `after` / missing fields → no timer (returns null)
 */
function parseTargetMs(payload) {
  if (!payload?.phase || !payload.starts_at || !payload.ends_at) return null
  if (payload.phase === 'before') return Date.parse(payload.starts_at)
  if (payload.phase === 'during') return Date.parse(payload.ends_at)
  return null
}

/**
 * Splits a remaining millisecond delta into display units for DigitTimer.
 * Clamps at zero so an expired target never shows negative digits.
 */
function splitCountdown(ms) {
  if (ms <= 0) return { hours: 0, minutes: 0, seconds: 0 }
  const totalSec = Math.floor(ms / 1000)
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  return { hours, minutes, seconds }
}

/**
 * Home / landing page (hash `#` or empty).
 *
 * Hero shows a live countdown toward the next or current drop, then a dual
 * info + carousel section below. While a drop is live, the carousel and CTA
 * promote that drop; otherwise they promote the permanent Shop catalog.
 *
 * Data sources:
 * - `fetchLandingSale()` — phase, sale id, starts_at / ends_at (polled every 60s)
 * - `fetchSalePage(id)` — items for the live drop carousel
 * - `fetchShopSalePage()` — items for the shop carousel when no drop is live
 */
export default function LandingPage() {
  // Landing schedule payload from the API (phase + sale timing).
  const [payload, setPayload] = useState(null)
  const [error, setError] = useState(null)
  // Shop catalog items shown when waiting for the next drop.
  const [shopItems, setShopItems] = useState([])
  // Live-drop items shown when phase === 'during'.
  const [dropItems, setDropItems] = useState([])
  // Wall-clock tick so the countdown re-renders every second.
  const [now, setNow] = useState(() => Date.now())

  // Load (and periodically refresh) the landing sale schedule.
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

  // When there is no live drop, fetch shop items for the waiting-state carousel.
  // Skipped entirely while a current drop is active (drop carousel takes over).
  useEffect(() => {
    if (payload?.phase === 'during' && payload?.sale?.id) return undefined

    let cancelled = false

    const run = async () => {
      try {
        const pageData = await fetchShopSalePage()
        if (!cancelled) setShopItems(pageData?.sale?.items ?? [])
      } catch {
        if (!cancelled) setShopItems([])
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [payload?.phase, payload?.sale?.id])

  // When a drop is live, fetch that sale's items for the "drop en curso" carousel.
  useEffect(() => {
    if (payload?.phase !== 'during' || payload?.sale?.id == null) return undefined

    let cancelled = false
    const saleId = payload.sale.id

    const run = async () => {
      try {
        const pageData = await fetchSalePage(saleId)
        if (!cancelled) setDropItems(pageData?.sale?.items ?? [])
      } catch {
        if (!cancelled) setDropItems([])
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [payload?.phase, payload?.sale?.id])

  // 1 Hz clock for DigitTimer; independent of the 60s schedule poll.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const targetMs = useMemo(() => parseTargetMs(payload), [payload])

  const { hours, minutes, seconds } = useMemo(() => {
    if (targetMs == null) return { hours: 0, minutes: 0, seconds: 0 }
    return splitCountdown(targetMs - now)
  }, [targetMs, now])

  // Copy switches based on whether a drop is currently open.
  const heading =
    payload?.phase === 'during'
      ? 'Time Left in Current Drop:'
      : 'Time Until Next Drop:'

  const showTimer = Boolean(payload && targetMs != null && !error)
  const hasCurrentDrop = payload?.phase === 'during' && payload?.sale?.id != null
  const showDropLink = showTimer && hasCurrentDrop
  const dropHref = hasCurrentDrop ? `#sale-${payload.sale.id}` : '#'
  // Prefer live-drop items when available; otherwise fall back to shop samples.
  const carouselItems = hasCurrentDrop ? dropItems : shopItems

  return (
    <div className="relative min-h-svh w-full bg-brand-shadow text-brand-shadow">
      <Navbar />

      <PageBackground />

      <main className="relative z-10 flex min-h-svh w-full flex-col">
        {/* Hero: countdown + optional "Current Drop" CTA */}
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
                {showDropLink ? <PillLink to={dropHref}>Current Drop</PillLink> : null}
              </>
            ) : !error ? (
              <p className="max-w-md text-sm text-brand-alabaster drop-shadow-md">
                There is no sale currently scheduled. Check back soon!
              </p>
            ) : null}
          </div>
        </div>

        {/* Overlapping info + carousel panel (Spanish copy for local audience) */}
        <section className="relative -mt-36 mx-auto mb-10 w-full max-w-5xl px-4 sm:-mt-44 sm:mb-14 sm:px-6">
          <div className="rounded-2xl border border-brand-dusty/35 bg-brand-thistle/55 p-4 shadow-xl backdrop-blur-sm sm:rounded-3xl sm:p-6 md:p-8">
            <div className="grid gap-4 md:grid-cols-2 md:gap-6">
              {hasCurrentDrop ? (
                <InfoCard title="¡Drop en curso!" variant="lavender">
                  <p>
                    ¡Ahora mismo hay un drop en marcha! Los artículos que ves en el carrusel son solo una
                    muestra de lo que está disponible en esta entrega.
                  </p>
                  <p className="mt-4">
                    Entra al drop completo para ver todo el catálogo, elegir tus favoritos y asegurarlos
                    antes de que se acabe el tiempo. Cada pieza es por tiempo limitado: no dejes pasar la
                    oportunidad.
                  </p>
                  <PillLink to={dropHref} className="mt-6 px-8 py-2.5 text-sm">
                    Ir al drop actual
                  </PillLink>
                </InfoCard>
              ) : (
                <InfoCard title="Mientras esperas" variant="lavender">
                  <p>
                    El próximo drop está en camino, pero eso no significa que te quedes con las manos
                    vacías. Mientras cuentas los minutos, pásate por nuestra tienda permanente.
                  </p>
                  <p className="mt-4">
                    Ahí encontrarás piezas disponibles todo el año, listas para llevártelas cuando quieras.
                    Échales un vistazo en el carrusel y entra a la tienda cuando algo te llame la atención.
                  </p>
                  <PillLink to="#browse-shop" className="mt-6 px-8 py-2.5 text-sm">
                    Ver tienda
                  </PillLink>
                </InfoCard>
              )}
              <InfoCard variant="alabaster">
                <ItemCarousel
                  items={carouselItems}
                  slidesLabel={hasCurrentDrop ? 'Drop actual' : 'Tienda'}
                  emptyMessage={
                    hasCurrentDrop
                      ? 'Todavía no hay artículos en este drop. Vuelve pronto.'
                      : 'Todavía no hay artículos en la tienda. Vuelve pronto.'
                  }
                />
              </InfoCard>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
