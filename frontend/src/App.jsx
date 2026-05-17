import { useEffect, useState } from 'react'
import LandingPage from './components/LandingPage'
import SalePage from './components/SalePage'

/**
 * Hash-based routing until react-router is added.
 * Navbar and landing CTAs use #current-sale, #upcoming-sale, and #sale-{id}.
 */
function parseRoute() {
  const hash = window.location.hash.replace(/^#/, '')
  if (hash === 'current-sale') return { page: 'sale', mode: 'current' }
  if (hash === 'upcoming-sale') return { page: 'sale', mode: 'upcoming' }
  const saleMatch = hash.match(/^sale-(\d+)$/)
  if (saleMatch) return { page: 'sale', mode: 'id', saleId: saleMatch[1] }
  return { page: 'landing' }
}

function App() {
  const [route, setRoute] = useState(parseRoute)

  useEffect(() => {
    const onHashChange = () => setRoute(parseRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (route.page === 'sale') {
    return <SalePage saleId={route.saleId} mode={route.mode} />
  }

  return <LandingPage />
}

export default App
