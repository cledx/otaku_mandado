import { useState } from 'react'
import { deleteItem } from '../../api'
import { itemRouteHash, setAppHash } from '../../utils/hashRoute'
import ConfirmDialog from '../ui/ConfirmDialog'
import EditablePrice from './EditablePrice'

/** Gray placeholder when an item has no Cloudinary image yet. */
function ImagePlaceholder() {
  return (
    <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-brand-alabaster">
      <svg
        className="size-12 text-brand-thistle sm:size-16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="8.5" cy="10" r="1.5" fill="currentColor" stroke="none" />
        <path d="M3 16l5-5 4 4 3-3 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function DeleteIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2M19 6v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" strokeLinecap="round" />
      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
    </svg>
  )
}

const STATUS_PILL = {
  available: { label: 'Available', className: 'bg-brand-available-bg text-brand-available' },
  reserved: { label: 'Reserved', className: 'bg-brand-dusty/25 text-brand-dusty' },
  purchased: { label: 'Sold', className: 'bg-brand-alabaster text-brand-shadow/70' },
}

/** Small pill showing item.status (available | reserved | purchased). */
function StatusPill({ status }) {
  const config = STATUS_PILL[status] ?? {
    label: status ? String(status) : 'Unknown',
    className: 'bg-brand-alabaster text-brand-shadow/70',
  }

  return (
    <span
      className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  )
}

/**
 * Single product tile on the sale (drop) page grid.
 * @param {{ item: object, admin?: boolean, saleId?: string, onDeleted?: (itemId: number) => void, onUpdated?: (item: object) => void }} props
 */
export default function ProductCard({ item, admin = false, saleId, onDeleted, onUpdated }) {
  const imageUrl = item.image_urls?.[0]
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const showDelete = admin && saleId != null
  const saleKey = item.sale_id ?? saleId
  const canNavigate = saleKey != null && item.id != null

  const navigateToItem = () => {
    if (!canNavigate) return
    setAppHash(itemRouteHash(saleKey, item.id))
  }

  const handleConfirmDelete = async () => {
    setDeleteError(null)
    setDeleting(true)
    try {
      await deleteItem(saleId, item.id)
      setConfirmOpen(false)
      onDeleted?.(item.id)
    } catch (e) {
      setDeleteError(e.message)
    } finally {
      setDeleting(false)
    }
  }

  const stopCardNav = (e) => {
    e.stopPropagation()
  }

  return (
    <>
      <article
        role={canNavigate ? 'link' : undefined}
        tabIndex={canNavigate ? 0 : undefined}
        onClick={canNavigate ? navigateToItem : undefined}
        onKeyDown={
          canNavigate
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigateToItem()
                }
              }
            : undefined
        }
        className={`relative flex flex-col overflow-hidden rounded-2xl bg-white p-3 shadow-sm sm:p-4 ${
          canNavigate ? 'cursor-pointer transition hover:ring-2 hover:ring-brand-dusty/40' : ''
        }`}
      >
        <div className="relative">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.name || 'Product'}
              className="aspect-square w-full rounded-lg object-cover"
            />
          ) : (
            <ImagePlaceholder />
          )}
          {showDelete ? (
            <button
              type="button"
              aria-label={`Delete ${item.name || 'item'}`}
              onClick={(e) => {
                stopCardNav(e)
                setDeleteError(null)
                setConfirmOpen(true)
              }}
              className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full border border-brand-thistle/80 bg-white/95 text-brand-dusty shadow-sm transition hover:border-brand-dusty hover:bg-brand-lavender hover:text-brand-shadow"
            >
              <DeleteIcon />
            </button>
          ) : null}
        </div>

        <h2 className="mt-3 truncate text-base font-medium text-brand-shadow">
          {item.name || 'Untitled'}
        </h2>
        {item.brand ? (
          <p className="mt-0.5 truncate text-sm text-brand-shadow/65">{item.brand}</p>
        ) : null}
        <div className="mt-2">
          <StatusPill status={item.status} />
        </div>
        <div onClick={admin ? stopCardNav : undefined} onKeyDown={admin ? stopCardNav : undefined}>
          <EditablePrice item={item} admin={admin} saleId={saleId} onUpdated={onUpdated} />
        </div>
        <p className="mt-1 line-clamp-3 text-sm text-brand-shadow/75">
          {item.description || 'No description yet.'}
        </p>
        {deleteError && !confirmOpen ? (
          <p className="mt-2 text-xs text-brand-dusty">{deleteError}</p>
        ) : null}
      </article>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete item?"
        message={
          deleteError
            ? `${deleteError} Try again, or cancel to close.`
            : `Remove “${item.name || 'this item'}” from the sale? This cannot be undone.`
        }
        confirmLabel="Delete"
        confirming={deleting}
        onClose={() => {
          if (!deleting) {
            setConfirmOpen(false)
            setDeleteError(null)
          }
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
    </>
  )
}
