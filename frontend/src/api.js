const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export async function fetchLandingSale() {
  const res = await fetch(`${API_BASE}/v1/landing_sale`)
  if (!res.ok) throw new Error(`landing_sale ${res.status}`)
  return (await res.json()).data
}
