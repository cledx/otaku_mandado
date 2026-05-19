import { useEffect, useState } from 'react'
import ItemViewPage from './components/ItemViewPage'
import LandingPage from './components/LandingPage'
import OrdersPage from './components/OrdersPage'
import ScheduleSalePage from './components/ScheduleSalePage'
import SalePage from './components/SalePage'
import { parseAppRoute } from './utils/hashRoute'

/**
 * Hash-based routing until react-router is added.
 * Navbar and landing CTAs use #current-sale, #upcoming-sale, #schedule-sale, #browse-shop, #view-orders, #your-orders, #sale-{id}, and #item-{saleId}-{itemId}.
 */
function App() {
  const [route, setRoute] = useState(() => parseAppRoute())

  useEffect(() => {
    const syncRoute = () => setRoute(parseAppRoute())
    window.addEventListener('hashchange', syncRoute)
    window.addEventListener('popstate', syncRoute)
    return () => {
      window.removeEventListener('hashchange', syncRoute)
      window.removeEventListener('popstate', syncRoute)
    }
  }, [])

  if (route.page === 'item') {
    return <ItemViewPage saleId={route.saleId} itemId={route.itemId} />
  }

  if (route.page === 'sale') {
    return <SalePage saleId={route.saleId} mode={route.mode} />
  }

  if (route.page === 'schedule-sale') {
    return <ScheduleSalePage />
  }

  if (route.page === 'orders') {
    return <OrdersPage mode={route.mode} />
  }

  return <LandingPage />
}

export default App
