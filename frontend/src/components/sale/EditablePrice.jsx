import { useEffect, useId, useRef, useState } from 'react'
import { updateItem } from '../../api'

/** Formats mx_price (MXN, rounded on the server) for display. */
export function formatMxPrice(mxPrice) {
  if (mxPrice == null || mxPrice === '') return '$0'
  const n = Number(mxPrice)
  if (Number.isNaN(n)) return String(mxPrice)
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(n)
}

/**
 * Customer-facing MXN price; admins click to edit underlying JPY `price` on the server.
 */
export default function EditablePrice({ item, admin, saleId, onUpdated }) {
  const inputId = useId()
  const inputRef = useRef(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const canEdit = Boolean(admin && saleId != null)
  const display = formatMxPrice(item.mx_price)
  const showYen = Boolean(admin)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const startEdit = () => {
    if (!canEdit || saving) return
    setDraft(item.price != null && item.price !== '' ? String(item.price) : '')
    setError(null)
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setError(null)
  }

  const savePrice = async () => {
    const yen = Number(draft)
    if (draft.trim() === '' || Number.isNaN(yen) || yen < 0) {
      setError('Enter a valid yen amount')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const updated = await updateItem(saleId, item.id, { price: yen })
      onUpdated?.(updated)
      setEditing(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="mt-2">
        <label htmlFor={inputId} className="mb-1 block text-xs font-medium text-brand-shadow/70">
          Price (¥ JPY)
        </label>
        <div className="flex items-center gap-2">
          <input
            id={inputId}
            ref={inputRef}
            type="number"
            min="0"
            step="1"
            value={draft}
            disabled={saving}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void savePrice()
              if (e.key === 'Escape') cancelEdit()
            }}
            className="w-full min-w-0 rounded-lg border border-brand-thistle bg-white px-2 py-1.5 text-sm text-brand-shadow outline-none focus:border-brand-dusty focus:ring-2 focus:ring-brand-dusty/25"
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => void savePrice()}
            className="shrink-0 rounded-full bg-brand-shadow px-3 py-1 text-xs font-semibold text-brand-lavender disabled:opacity-60"
          >
            {saving ? '…' : 'Save'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={cancelEdit}
            className="shrink-0 text-xs font-medium text-brand-shadow/70 hover:text-brand-shadow"
          >
            Cancel
          </button>
        </div>
        <p className="mt-1 text-xs text-brand-shadow/55">Shown to customers as {display}</p>
        {error ? <p className="mt-1 text-xs text-brand-dusty">{error}</p> : null}
      </div>
    )
  }

  if (canEdit) {
    return (
      <div className="mt-2">
        <button
          type="button"
          onClick={startEdit}
          className="group rounded-lg px-1 py-0.5 text-left transition hover:bg-brand-alabaster/80"
          title="Edit price (stored in yen)"
        >
          <span className="text-lg font-bold text-brand-shadow group-hover:text-brand-dusty">
            {display}
          </span>
          <span className="ml-2 text-xs font-medium text-brand-shadow/50 group-hover:text-brand-dusty">
            Edit
          </span>
        </button>
        {showYen ? (
          item.price != null ? (
            <p className="mt-0.5 text-xs text-brand-shadow/50">
              ¥{Number(item.price).toLocaleString()} JPY
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-brand-dusty">No price set — click to add</p>
          )
        ) : null}
      </div>
    )
  }

  return <p className="mt-2 text-lg font-bold text-brand-shadow">{display}</p>
}
