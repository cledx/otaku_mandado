/** @returns {{ page: string, mode?: string, saleId?: string, itemId?: string }} */
export function parseAppRoute() {
  const hash = window.location.hash.replace(/^#/, '')
  const itemMatch = hash.match(/^item-(\d+)-(\d+)$/)
  if (itemMatch) {
    return { page: 'item', saleId: itemMatch[1], itemId: itemMatch[2] }
  }
  if (hash === 'schedule-sale') return { page: 'schedule-sale' }
  if (hash === 'browse-shop') return { page: 'sale', mode: 'shop' }
  if (hash === 'current-sale') return { page: 'sale', mode: 'current' }
  if (hash === 'upcoming-sale') return { page: 'sale', mode: 'upcoming' }
  if (hash === 'view-orders') return { page: 'orders', mode: 'admin' }
  if (hash === 'your-orders') return { page: 'orders', mode: 'mine' }
  if (hash === 'view-accounts') return { page: 'accounts' }
  const saleMatch = hash.match(/^sale-(\d+)$/)
  if (saleMatch) return { page: 'sale', mode: 'id', saleId: saleMatch[1] }
  return { page: 'landing' }
}

/** Hash fragment for an item detail page (no leading #). */
export function itemRouteHash(saleId, itemId) {
  return `item-${saleId}-${itemId}`
}

/** Updates the URL hash and notifies hash-based routers (including when the hash is unchanged). */
export function setAppHash(hash) {
  const bare = hash.replace(/^#/, '')
  if (window.location.hash.replace(/^#/, '') === bare) {
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    return
  }
  window.location.hash = bare
}
