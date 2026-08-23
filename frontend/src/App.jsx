import { useEffect, useState } from 'react'
import AccountsPage from './components/AccountsPage'
import AdminToolsPage from './components/AdminToolsPage'
import AdminToolStubPage from './components/AdminToolStubPage'
import ChangePasswordPage from './components/ChangePasswordPage'
import CouponCodesPage from './components/CouponCodesPage'
import ItemViewPage from './components/ItemViewPage'
import LandingPage from './components/LandingPage'
import OrdersPage from './components/OrdersPage'
import ScheduleSalePage from './components/ScheduleSalePage'
import SalePage from './components/SalePage'
import UserSettingsPage from './components/UserSettingsPage'
import Footer from './components/layout/Footer'
import { parseAppRoute } from './utils/hashRoute'

/**
 * Root shell: hash-based routing until react-router is added.
 *
 * `parseAppRoute()` maps `window.location.hash` to a `{ page, ... }` object.
 * Supported hashes (navbar + landing CTAs):
 * - `#` / empty → LandingPage
 * - `#sale-{id}` → SalePage mode="id"
 * - `#current-sale` / `#upcoming-sale` / `#browse-shop` → SalePage modes
 * - `#schedule-sale` → ScheduleSalePage
 * - `#view-orders` / `#your-orders` → OrdersPage (admin | mine)
 * - `#view-accounts` → AccountsPage
 * - `#admin-tools` → AdminToolsPage
 * - `#user-settings` → UserSettingsPage
 * - `#change-password` → ChangePasswordPage
 * - `#coupon-codes` → CouponCodesPage
 * - `#scheduled-sales` / `#past-sales` / `#deleted-sales` / `#deleted-items` /
 *   `#past-orders` → AdminToolStubPage
 * - `#item-{saleId}-{itemId}` → ItemViewPage
 *
 * Footer is rendered on every page; each page mounts its own Navbar.
 */
function App() {
  // Initial parse on mount; kept in sync via hashchange / popstate below.
  const [route, setRoute] = useState(() => parseAppRoute())

  // Re-parse when the user navigates via hash links or browser back/forward.
  useEffect(() => {
    const syncRoute = () => setRoute(parseAppRoute())
    window.addEventListener('hashchange', syncRoute)
    window.addEventListener('popstate', syncRoute)
    return () => {
      window.removeEventListener('hashchange', syncRoute)
      window.removeEventListener('popstate', syncRoute)
    }
  }, [])

  // Choose the page component from the parsed route (default: landing).
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
  } else if (route.page === 'admin-tools') {
    page = <AdminToolsPage />
  } else if (route.page === 'user-settings') {
    page = <UserSettingsPage />
  } else if (route.page === 'change-password') {
    page = <ChangePasswordPage />
  } else if (route.page === 'coupon-codes') {
    page = <CouponCodesPage />
  } else if (route.page === 'admin-tool-stub') {
    page = <AdminToolStubPage title={route.title} />
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
