/**
 * Cloudinary Upload Widget (bulk local images → public_ids).
 * Requires VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET (unsigned preset).
 */

const WIDGET_SCRIPT = 'https://upload-widget.cloudinary.com/global/all.js'

let scriptPromise = null

export function isCloudinaryConfigured() {
  return Boolean(
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME && import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  )
}

function cloudinaryReady() {
  return typeof window !== 'undefined' && typeof window.cloudinary?.createUploadWidget === 'function'
}

/** Poll until createUploadWidget exists (script onload can fire before the global is ready). */
function waitForCloudinaryApi(maxMs = 10_000) {
  if (cloudinaryReady()) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const started = Date.now()
    const tick = () => {
      if (cloudinaryReady()) {
        resolve()
        return
      }
      if (Date.now() - started > maxMs) {
        reject(new Error('Cloudinary upload widget API did not become available'))
        return
      }
      window.setTimeout(tick, 50)
    }
    tick()
  })
}

/** Load the widget script once; safe to call when the upload modal opens. */
export function loadCloudinaryWidgetScript() {
  if (cloudinaryReady()) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const finish = () => waitForCloudinaryApi().then(resolve).catch(reject)

    const existing = document.querySelector(`script[src="${WIDGET_SCRIPT}"]`)
    if (existing) {
      // Script tag already injected — "load" may have fired before we subscribed.
      if (existing.readyState === 'complete' || existing.readyState === 'loaded') {
        finish()
        return
      }
      existing.addEventListener('load', finish, { once: true })
      existing.addEventListener(
        'error',
        () => reject(new Error('Cloudinary widget failed to load')),
        { once: true },
      )
      return
    }

    const script = document.createElement('script')
    script.src = WIDGET_SCRIPT
    script.async = true
    script.onload = finish
    script.onerror = () => reject(new Error('Cloudinary widget failed to load'))
    document.head.appendChild(script)
  })

  return scriptPromise
}

/**
 * CDN preview URL for a public_id (unsigned delivery; no transform).
 * @param {string} publicId
 * @returns {string | null}
 */
export function cloudinaryPreviewUrl(publicId) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const id = typeof publicId === 'string' ? publicId.trim() : ''
  if (!cloudName || !id) return null
  return `https://res.cloudinary.com/${cloudName}/image/upload/${id}`
}

/**
 * Opens the Cloudinary upload widget (call synchronously from a click handler).
 * @param {{
 *   onPublicId: (id: string, info?: { secure_url?: string }) => void,
 *   onQueueEnd?: () => void,
 *   onClose?: () => void,
 *   onError?: (err: unknown) => void,
 *   multiple?: boolean,
 *   maxFiles?: number,
 * }} handlers
 * @returns {object} widget instance
 */
function openCloudinaryUpload({
  onPublicId,
  onQueueEnd,
  onClose,
  onError,
  multiple = true,
  maxFiles = 50,
}) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.',
    )
  }

  if (!cloudinaryReady()) {
    throw new Error('Cloudinary widget is not ready yet. Wait a moment and try again.')
  }

  const folder = import.meta.env.VITE_CLOUDINARY_UPLOAD_FOLDER || 'otaku_mandado/items'

  const widget = window.cloudinary.createUploadWidget(
    {
      cloudName,
      uploadPreset,
      folder,
      sources: ['local'],
      multiple,
      maxFiles,
      clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      showAdvancedOptions: false,
    },
    (error, result) => {
      if (error) {
        onError?.(error)
        return
      }
      if (!result) return

      if (result.event === 'success' && result.info?.public_id) {
        onPublicId(result.info.public_id, result.info)
      }
      if (result.event === 'queues-end') {
        onQueueEnd?.()
      }
      if (result.event === 'close') {
        onClose?.()
      }
    },
  )

  if (!widget || typeof widget.open !== 'function') {
    throw new Error('Failed to create Cloudinary upload widget')
  }

  widget.open()
  return widget
}

/**
 * Opens the Cloudinary bulk upload widget (call synchronously from a click handler).
 * @param {{ onPublicId: (id: string) => void, onQueueEnd?: () => void, onClose?: () => void, onError?: (err: unknown) => void }} handlers
 * @returns {object} widget instance
 */
export function openCloudinaryBulkUpload(handlers) {
  return openCloudinaryUpload({ ...handlers, multiple: true, maxFiles: 50 })
}

/**
 * Opens a single-file Cloudinary upload widget (call synchronously from a click handler).
 * @param {{ onPublicId: (id: string, info?: { secure_url?: string }) => void, onClose?: () => void, onError?: (err: unknown) => void }} handlers
 * @returns {object} widget instance
 */
export function openCloudinarySingleUpload(handlers) {
  return openCloudinaryUpload({ ...handlers, multiple: false, maxFiles: 1 })
}
