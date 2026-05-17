import { useEffect, useId } from 'react'

/**
 * Modal confirmation dialog (backdrop + focus trap via initial focus on confirm).
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  confirming = false,
  onClose,
  onConfirm,
}) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !confirming) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose, confirming])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-brand-shadow/55 backdrop-blur-sm"
        disabled={confirming}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-2xl border border-brand-dusty/40 bg-brand-lavender/97 p-6 shadow-2xl ring-1 ring-brand-thistle/40 sm:rounded-3xl sm:p-8"
      >
        <h2 id={titleId} className="text-lg font-bold text-brand-shadow sm:text-xl">
          {title}
        </h2>
        <p className="mt-3 text-sm text-brand-shadow/75">{message}</p>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            disabled={confirming}
            onClick={onClose}
            className="rounded-full border border-brand-thistle bg-white px-5 py-2 text-sm font-semibold text-brand-shadow transition hover:bg-brand-alabaster disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={confirming}
            onClick={onConfirm}
            className="rounded-full border border-brand-dusty bg-brand-dusty px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dusty/90 disabled:opacity-60"
          >
            {confirming ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
