import { useEffect, useId, useState } from 'react'
import { deleteItem, updateItem } from '../../api'
import { setAppHash } from '../../utils/hashRoute'
import ConfirmDialog from '../ui/ConfirmDialog'
import EditablePrice, { formatMxPrice } from '../sale/EditablePrice'

const STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'purchased', label: 'Sold' },
]

const inputClass =
  'w-full rounded-lg border border-white/30 bg-white/95 px-3 py-2 text-center text-base text-brand-shadow outline-none focus:border-white focus:ring-2 focus:ring-white/40'

function ReadOnlyRow({ label, value }) {
  return (
    <p className="text-center text-base leading-relaxed text-white sm:text-lg">
      <span className="font-semibold">{label}:</span>{' '}
      <span className="font-normal">{value || '—'}</span>
    </p>
  )
}

/**
 * Item info card: read-only for customers; inline-editable form for admins.
 */
export default function ItemDetailPanel({
  item,
  saleId,
  saleShop,
  isAdmin,
  reservable,
  ordered,
  onItemUpdated,
  onReserve,
  reserving,
  reserveError,
  reserveSuccess,
}) {
  const formId = useId()
  const [draft, setDraft] = useState({
    name: '',
    brand: '',
    description: '',
    status: 'reserved',
    imageFront: '',
    imageBack: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  useEffect(() => {
    const ids = Array.isArray(item?.image) ? item.image : []
    setDraft({
      name: item?.name ?? '',
      brand: item?.brand ?? '',
      description: item?.description ?? '',
      status: item?.status ?? 'reserved',
      imageFront: ids[0] ?? '',
      imageBack: ids[1] ?? '',
    })
    setSaveSuccess(false)
    setSaveError(null)
  }, [item])

  const handleChange = (field) => (e) => {
    setDraft((prev) => ({ ...prev, [field]: e.target.value }))
    setSaveSuccess(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      const image = [draft.imageFront.trim(), draft.imageBack.trim()].filter(Boolean)
      const updated = await updateItem(saleId, item.id, {
        name: draft.name.trim(),
        brand: draft.brand.trim(),
        description: draft.description.trim(),
        status: draft.status,
        image,
      })
      onItemUpdated?.(updated)
      setSaveSuccess(true)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    setDeleteError(null)
    setDeleting(true)
    try {
      await deleteItem(saleId, item.id)
      setConfirmDeleteOpen(false)
      setAppHash(saleShop ? 'browse-shop' : `sale-${saleId}`)
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  if (!isAdmin) {
    return (
      <>
        <div className="space-y-3">
          <ReadOnlyRow label="Item" value={item.name} />
          <ReadOnlyRow label="Brand" value={item.brand} />
          <ReadOnlyRow label="Description" value={item.description} />
          <ReadOnlyRow label="Price" value={formatMxPrice(item.mx_price)} />
        </div>

        {ordered ? (
          <p className="mt-6 text-center text-sm font-medium text-white/90">
            You have reserved this item.
          </p>
        ) : null}

        {reserveError ? (
          <p className="mt-4 text-center text-sm text-brand-lavender" role="alert">
            {reserveError}
          </p>
        ) : null}

        {reserveSuccess ? (
          <p className="mt-4 text-center text-sm font-medium text-white/90">
            Reserved successfully.
          </p>
        ) : null}

        {reservable ? (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={onReserve}
              disabled={reserving}
              className="rounded-2xl bg-[#d32f2f] px-10 py-3 text-lg font-semibold text-white shadow-md transition hover:bg-[#b71c1c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {reserving ? 'Reserving…' : 'Reserve'}
            </button>
          </div>
        ) : null}
      </>
    )
  }

  return (
    <>
      <form id={formId} onSubmit={(e) => void handleSave(e)} className="space-y-4">
        <div>
          <label htmlFor={`${formId}-name`} className="mb-1 block text-center text-sm font-semibold text-white">
            Item
          </label>
          <input
            id={`${formId}-name`}
            type="text"
            value={draft.name}
            onChange={handleChange('name')}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor={`${formId}-brand`} className="mb-1 block text-center text-sm font-semibold text-white">
            Brand
          </label>
          <input
            id={`${formId}-brand`}
            type="text"
            value={draft.brand}
            onChange={handleChange('brand')}
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor={`${formId}-description`}
            className="mb-1 block text-center text-sm font-semibold text-white"
          >
            Description
          </label>
          <textarea
            id={`${formId}-description`}
            rows={3}
            value={draft.description}
            onChange={handleChange('description')}
            className={`${inputClass} resize-y`}
          />
        </div>

        <div>
          <label htmlFor={`${formId}-status`} className="mb-1 block text-center text-sm font-semibold text-white">
            Status
          </label>
          <select
            id={`${formId}-status`}
            value={draft.status}
            onChange={handleChange('status')}
            className={inputClass}
          >
            {STATUSES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-1 text-center text-sm font-semibold text-white">Price</p>
          <EditablePrice
            item={item}
            admin
            saleId={saleId}
            variant="onCard"
            onUpdated={onItemUpdated}
          />
        </div>

        <div className="space-y-3 border-t border-white/25 pt-4">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-white/80">
            Images (Cloudinary public IDs)
          </p>
          <div>
            <label htmlFor={`${formId}-img-front`} className="mb-1 block text-center text-xs text-white/90">
              Front / spin face
            </label>
            <input
              id={`${formId}-img-front`}
              type="text"
              value={draft.imageFront}
              onChange={handleChange('imageFront')}
              placeholder="folder/asset"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor={`${formId}-img-back`} className="mb-1 block text-center text-xs text-white/90">
              Back / spin face
            </label>
            <input
              id={`${formId}-img-back`}
              type="text"
              value={draft.imageBack}
              onChange={handleChange('imageBack')}
              placeholder="folder/asset (optional)"
              className={inputClass}
            />
          </div>
        </div>

        {saveError ? (
          <p className="text-center text-sm text-brand-lavender" role="alert">
            {saveError}
          </p>
        ) : null}
        {saveSuccess ? (
          <p className="text-center text-sm font-medium text-white/90">Changes saved.</p>
        ) : null}

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full border border-white bg-white px-6 py-2.5 text-sm font-semibold text-brand-dusty shadow-sm transition hover:bg-brand-lavender disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteError(null)
              setConfirmDeleteOpen(true)
            }}
            className="rounded-full border border-brand-lavender/80 bg-transparent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Delete item
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDeleteOpen}
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
            setConfirmDeleteOpen(false)
            setDeleteError(null)
          }
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
    </>
  )
}
