import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchNavContext, getAuthToken } from '../../api'
import { buildNavbarLinks } from './navLinks'

const REFRESH_MS = 60_000

export default function useNavbarNav(signedIn) {
  const [role, setRole] = useState(null)
  const [visibility, setVisibility] = useState({})

  const refresh = useCallback(async () => {
    if (!getAuthToken()) {
      setRole(null)
      setVisibility({})
      return
    }

    try {
      const data = await fetchNavContext()
      setRole(data.role === 'admin' ? 'admin' : 'client')
      setVisibility({
        current_sale: Boolean(data.current_sale),
        upcoming_sale: Boolean(data.upcoming_sale),
      })
    } catch {
      setRole(null)
      setVisibility({})
    }
  }, [])

  useEffect(() => {
    if (!signedIn) {
      setRole(null)
      setVisibility({})
      return
    }

    void refresh()
    const id = window.setInterval(() => void refresh(), REFRESH_MS)
    return () => window.clearInterval(id)
  }, [signedIn, refresh])

  const links = useMemo(() => {
    if (!signedIn || !role) return []
    return buildNavbarLinks(role, visibility)
  }, [signedIn, role, visibility])

  const applyUser = useCallback((user) => {
    if (user?.role === 'admin' || user?.role === 'client') {
      setRole(user.role)
    }
    void refresh()
  }, [refresh])

  return { links, applyUser, refresh }
}
