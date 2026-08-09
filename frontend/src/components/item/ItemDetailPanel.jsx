import { useEffect, useId, useState } from 'react'
import { deleteItem, duplicateItem, updateItem } from '../../api'
import { itemRouteHash, setAppHash } from '../../utils/hashRoute'
import {
  cloudinaryPreviewUrl,
  isCloudinaryConfigured,
  loadCloudinaryWidgetScript,
  openCloudinarySingleUpload,
} from '../../utils/cloudinaryUpload'
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

function ImageSlotPreview({ url, label }) {
  if (!url) {
    return (
      <div
        className="mx-auto flex aspect-square w-28 items-center justify-center rounded-lg bg-white/15 sm:w-32"
        aria-label={`${label}: no image`}
      >
        <span className="text-xs text-white/60">No image</span>
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={label}
      className="mx-auto aspect-square w-28 rounded-lg object-cover sm:w-32"
    />
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
    previewFront: '',
    previewBack: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [duplicating, setDuplicating] = useState(false)
  const [duplicateError, setDuplicateError] = useState(null)
  const [widgetReady, setWidgetReady] = useState(false)
  const [uploadingSlot, setUploadingSlot] = useState(null)
  const [uploadError, setUploadError] = useState(null)

  const cloudinaryConfigured = isCloudinaryConfigured()

  useEffect(() => {
    const ids = Array.isArray(item?.image) ? item.image : []
    const urls = Array.isArray(item?.image_urls) ? item.image_urls : []
    setDraft({
      name: item?.name ?? '',
      brand: item?.brand ?? '',
      description: item?.description ?? '',
      status: item?.status ?? 'reserved',
      imageFront: ids[0] ?? '',
      imageBack: ids[1] ?? '',
      previewFront: urls[0] ?? cloudinaryPreviewUrl(ids[0]) ?? '',
      previewBack: urls[1] ?? cloudinaryPreviewUrl(ids[1]) ?? '',
    })
    setSaveSuccess(false)
    setSaveError(null)
    setUploadError(null)
  }, [item])

  useEffect(() => {
    if (!isAdmin || !cloudinaryConfigured) {
      setWidgetReady(false)
      return
    }

    let cancelled = false
    setWidgetReady(false)

    loadCloudinaryWidgetScript()
      .then(() => {
        if (!cancelled) setWidgetReady(true)
      })
      .catch((e) => {
        if (!cancelled) setUploadError(e.message)
      })

    return () => {
      cancelled = true
    }
  }, [isAdmin, cloudinaryConfigured])

  const handleChange = (field) => (e) => {
    setDraft((prev) => ({ ...prev, [field]: e.target.value }))
    setSaveSuccess(false)
  }

  const handleReplaceImage = (slot) => {
    if (!cloudinaryConfigured) {
      setUploadError('Cloudinary is not configured for this environment.')
      return
    }
    if (!widgetReady) {
      setUploadError('Upload widget is still loading. Please wait a moment.')
      return
    }

    setUploadError(null)
    setUploadingSlot(slot)

    try {
      openCloudinarySingleUpload({
        onPublicId: (publicId, info) => {
          const preview = info?.secure_url || cloudinaryPreviewUrl(publicId) || ''
          setDraft((prev) =>
            slot === 'front'
              ? { ...prev, imageFront: publicId, previewFront: preview }
              : { ...prev, imageBack: publicId, previewBack: preview },
          )
          setSaveSuccess(false)
        },
        onClose: () => setUploadingSlot(null),
        onError: (err) => {
          setUploadError(err?.message || 'Image upload failed.')
          setUploadingSlot(null)
        },
      })
    } catch (err) {
      setUploadError(err.message)
      setUploadingSlot(null)
    }
  }

  const handleClearBack = () => {
    setDraft((prev) => ({ ...prev, imageBack: '', previewBack: '' }))
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

  const handleDuplicate = async () => {
    setDuplicateError(null)
    setDuplicating(true)
    try {
      const copy = await duplicateItem(saleId, item.id)
      setAppHash(itemRouteHash(saleId, copy.id))
    } catch (err) {
      setDuplicateError(err.message)
    } finally {
      setDuplicating(false)
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

  const uploadBusy = uploadingSlot !== null
  const replaceDisabled = !cloudinaryConfigured || !widgetReady || uploadBusy || saving

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

        <div className="space-y-4 border-t border-white/25 pt-4">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-white/80">
            Images
          </p>

          {!cloudinaryConfigured ? (
            <p className="text-center text-sm text-brand-lavender" role="alert">
              Cloudinary is not configured. Set{' '}
              <code className="text-xs">VITE_CLOUDINARY_CLOUD_NAME</code> and{' '}
              <code className="text-xs">VITE_CLOUDINARY_UPLOAD_PRESET</code>.
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-center text-xs text-white/90">Front / spin face</p>
              <ImageSlotPreview url={draft.previewFront} label="Front image" />
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => handleReplaceImage('front')}
                  disabled={replaceDisabled}
                  className="rounded-full border border-white/80 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadingSlot === 'front'
                    ? 'Uploading…'
                    : draft.imageFront
                      ? 'New image'
                      : 'Add image'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-center text-xs text-white/90">Back / spin face</p>
              <ImageSlotPreview url={draft.previewBack} label="Back image" />
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleReplaceImage('back')}
                  disabled={replaceDisabled}
                  className="rounded-full border border-white/80 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadingSlot === 'back'
                    ? 'Uploading…'
                    : draft.imageBack
                      ? 'New image'
                      : 'Add image'}
                </button>
                {draft.imageBack ? (
                  <button
                    type="button"
                    onClick={handleClearBack}
                    disabled={uploadBusy || saving}
                    className="rounded-full border border-white/40 bg-transparent px-3 py-1.5 text-xs font-semibold text-white/85 transition hover:bg-white/10 disabled:opacity-60"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {uploadError ? (
            <p className="text-center text-sm text-brand-lavender" role="alert">
              {uploadError}
            </p>
          ) : null}
        </div>

        {saveError ? (
          <p className="text-center text-sm text-brand-lavender" role="alert">
            {saveError}
          </p>
        ) : null}
        {duplicateError ? (
          <p className="text-center text-sm text-brand-lavender" role="alert">
            {duplicateError}
          </p>
        ) : null}
        {saveSuccess ? (
          <p className="text-center text-sm font-medium text-white/90">Changes saved.</p>
        ) : null}

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || uploadBusy || duplicating}
            className="rounded-full border border-white bg-white px-6 py-2.5 text-sm font-semibold text-brand-dusty shadow-sm transition hover:bg-brand-lavender disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => void handleDuplicate()}
            disabled={saving || uploadBusy || duplicating}
            className="rounded-full border border-white/80 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"
          >
            {duplicating ? 'Duplicating…' : 'Duplicate'}
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteError(null)
              setConfirmDeleteOpen(true)
            }}
            disabled={duplicating}
            className="rounded-full border border-brand-lavender/80 bg-transparent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
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
