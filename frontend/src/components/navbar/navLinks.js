/**
 * @param {'admin'|'client'} role
 * @param {{ current_sale?: boolean, upcoming_sale?: boolean }} visibility
 * @returns {{ to: string, text: string }[]}
 */
export function buildNavbarLinks(role, visibility = {}) {
  const { current_sale: currentSale, upcoming_sale: upcomingSale } = visibility
  const links = []

  if (currentSale) {
    links.push({ to: '#current-sale', text: 'Current Sale' })
  }

  if (role === 'admin') {
    if (upcomingSale) {
      links.push({ to: '#upcoming-sale', text: 'Upcoming Sale' })
    }
    links.push(
      { to: '#schedule-sale', text: 'Schedule a Sale' },
      { to: '#browse-shop', text: 'Browse Shop' },
      { to: '#view-orders', text: 'View Orders' },
      { to: '#view-accounts', text: 'View Accounts' },
      { to: '#admin-tools', text: 'Admin Tools' },
    )
  } else {
    links.push(
      { to: '#your-orders', text: 'Your Orders' },
      { to: '#browse-shop', text: 'Browse Shop' },
      { to: '#account-settings', text: 'Account Settings' },
    )
  }

  return links
}
