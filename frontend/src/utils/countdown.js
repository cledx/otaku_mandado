/**
 * Maps API timing payload to the timestamp the countdown should reach.
 * @param {{ phase?: string, starts_at?: string, ends_at?: string } | null} payload
 * @returns {number | null} epoch ms, or null when phase is "after" or data is missing
 */
export function parseCountdownTargetMs(payload) {
  if (!payload?.phase || !payload.starts_at || !payload.ends_at) return null
  if (payload.phase === 'before') return Date.parse(payload.starts_at)
  if (payload.phase === 'during') return Date.parse(payload.ends_at)
  return null
}

/**
 * @param {number} ms remaining milliseconds (may be negative; clamps to zero display)
 * @returns {{ hours: number, minutes: number, seconds: number }}
 */
export function splitCountdown(ms) {
  if (ms <= 0) return { hours: 0, minutes: 0, seconds: 0 }
  const totalSec = Math.floor(ms / 1000)
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  return { hours, minutes, seconds }
}
