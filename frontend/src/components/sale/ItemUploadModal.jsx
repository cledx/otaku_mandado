import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createItemsFromPublicIds } from '../../api'
import {
  isCloudinaryConfigured,
  loadCloudinaryWidgetScript,
  openCloudinaryBulkUpload,
} from '../../utils/cloudinaryUpload'

/**
 * Admin modal: bulk upload to Cloudinary, then POST public_ids to item create.
 */
export default function ItemUploadModal({ open, saleId, onClose, onItemsCreated }) {
  const titleId = useId()
  const [publicIds, setPublicIds] = useState([])
  const [queueEnded, setQueueEnded] = useState(false)
  const [widgetOpen, setWidgetOpen] = useState(false)
  const [widgetReady, setWidgetReady] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const widgetRef = useRef(null)

  const configured = isCloudinaryConfigured()

  // Preload widget while modal is open so .open() runs in the same click gesture as the button.
  useEffect(() => {
    if (!open || !configured) {
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
        if (!cancelled) setError(e.message)
      })

    return () => {
      cancelled = true
    }
  }, [open, configured])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !processing && !widgetOpen) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose, processing, widgetOpen])

  useEffect(() => {
    if (!open) {
      setPublicIds([])
      setQueueEnded(false)
      setWidgetOpen(false)
      setWidgetReady(false)
      setProcessing(false)
      setError(null)
      widgetRef.current = null
    }
  }, [open])

  const addPublicId = useCallback((id) => {
    setPublicIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setError(null)
  }, [])

  const handleOpenWidget = () => {
    if (!configured) {
      setError('Cloudinary is not configured for this environment.')
      return
    }
    if (!widgetReady) {
      setError('Upload widget is still loading. Please wait a moment.')
      return
    }

    setError(null)
    setWidgetOpen(true)

    try {
      widgetRef.current = openCloudinaryBulkUpload({
        onPublicId: addPublicId,
        onQueueEnd: () => {
          setQueueEnded(true)
          setWidgetOpen(false)
        },
        onClose: () => {
          setWidgetOpen(false)
        },
        onError: (err) => {
          setError(err?.message || String(err))
          setWidgetOpen(false)
        },
      })
    } catch (e) {
      setWidgetOpen(false)
      setError(e.message)
    }
  }

  const handleCreateItems = async () => {
    if (!saleId || publicIds.length === 0) return

    setProcessing(true)
    setError(null)
    try {
      const { items: created, errors: itemErrors } = await createItemsFromPublicIds(
        saleId,
        publicIds,
      )
      onItemsCreated?.(Array.isArray(created) ? created : [])
      if (itemErrors?.length) {
        setError(
          `Created ${created?.length ?? 0} item(s), but some images need review: ${JSON.stringify(itemErrors)}`,
        )
        return
      }
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setProcessing(false)
    }
  }

  if (!open) return null

  const canCreate = publicIds.length > 0 && (queueEnded || !widgetOpen) && !processing
  const chooseLabel = !widgetReady
    ? 'Loading upload…'
    : widgetOpen
      ? 'Uploading…'
      : publicIds.length
        ? 'Upload more images'
        : 'Choose images'

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 sm:p-6 ${widgetOpen ? 'z-[90]' : 'z-[100]'}`}
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-brand-shadow/55 backdrop-blur-sm"
        disabled={processing || widgetOpen}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-lg rounded-2xl border border-brand-dusty/40 bg-brand-lavender/97 p-6 shadow-2xl ring-1 ring-brand-thistle/40 sm:rounded-3xl sm:p-8"
      >
        <h2 id={titleId} className="text-lg font-bold text-brand-shadow sm:text-xl">
          Item upload
        </h2>
        <p className="mt-2 text-sm text-brand-shadow/75">
          Upload product images to Cloudinary, then create items with AI-generated names and
          descriptions.
        </p>

        {!configured ? (
          <p className="mt-4 rounded-xl border border-brand-dusty/40 bg-brand-alabaster/80 px-4 py-3 text-sm text-brand-dusty">
            Set <code className="text-xs">VITE_CLOUDINARY_CLOUD_NAME</code> and{' '}
            <code className="text-xs">VITE_CLOUDINARY_UPLOAD_PRESET</code> in your frontend env.
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!configured || !widgetReady || processing || widgetOpen}
            onClick={handleOpenWidget}
            className="rounded-full border border-brand-shadow bg-brand-shadow px-5 py-2 text-sm font-semibold text-brand-lavender transition hover:bg-brand-dusty disabled:cursor-not-allowed disabled:opacity-60"
          >
            {chooseLabel}
          </button>
        </div>

        {publicIds.length > 0 ? (
          <p className="mt-4 text-sm font-medium text-brand-shadow">
            {publicIds.length} image{publicIds.length === 1 ? '' : 's'} ready
            {queueEnded ? ' — upload complete' : ''}
          </p>
        ) : null}

        {error ? <p className="mt-3 text-sm text-brand-dusty">{error}</p> : null}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            disabled={processing || widgetOpen}
            onClick={onClose}
            className="rounded-full border border-brand-thistle bg-white px-5 py-2 text-sm font-semibold text-brand-shadow transition hover:bg-brand-alabaster disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canCreate}
            onClick={() => void handleCreateItems()}
            className="rounded-full border border-brand-dusty bg-brand-dusty px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dusty/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processing
              ? 'Creating items…'
              : `Create ${publicIds.length || ''} item${publicIds.length === 1 ? '' : 's'}`.trim()}
          </button>
        </div>
      </div>
    </div>
  )
}
