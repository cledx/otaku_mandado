import { useEffect, useState } from 'react'
import AccountsPage from './components/AccountsPage'
import ItemViewPage from './components/ItemViewPage'
import LandingPage from './components/LandingPage'
import OrdersPage from './components/OrdersPage'
import ScheduleSalePage from './components/ScheduleSalePage'
import SalePage from './components/SalePage'
import Footer from './components/layout/Footer'
import { parseAppRoute } from './utils/hashRoute'

/**
 * Hash-based routing until react-router is added.
 * Navbar and landing CTAs use #current-sale, #upcoming-sale, #schedule-sale, #browse-shop, #view-orders, #your-orders, #view-accounts, #sale-{id}, and #item-{saleId}-{itemId}.
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

  let page
  if (route.page === 'item') {
    page = <ItemViewPage saleId={route.saleId} itemId={route.itemId} />
  } else if (route.page === 'sale') {
    page = <SalePage saleId={route.saleId} mode={route.mode} />
  } else if (route.page === 'schedule-sale') {
    page = <ScheduleSalePage />
  } else if (route.page === 'orders') {
    page = <OrdersPage mode={route.mode} />
  } else if (route.page === 'accounts') {
    page = <AccountsPage />
  } else {
    page = <LandingPage />
  }

  return (
    <>
      {page}
      <Footer />
    </>
  )
}

export default App
