import { useCallback, useEffect, useState } from 'react'
import { getAuthToken, logout } from '../../api'
import LoginModal from '../LoginModal'
import NavbarLink from './NavbarLink'

const SIGNED_IN_VISIBLE_MS = 5000
const SIGNED_IN_FADE_MS = 500

/**
 * @param {{ to: string, text: string }[]} [links] - optional nav routes
 */
export default function Navbar({ links = [] }) {
  const [loginOpen, setLoginOpen] = useState(false)
  const [signedIn, setSignedIn] = useState(() => Boolean(getAuthToken()))
  const [signedInLabel, setSignedInLabel] = useState('hidden') // hidden | visible | fading
  const [loggingOut, setLoggingOut] = useState(false)
  const closeLogin = useCallback(() => setLoginOpen(false), [])
  const handleLoginSuccess = useCallback(() => {
    setSignedIn(true)
    setSignedInLabel('visible')
  }, [])

  useEffect(() => {
    if (signedInLabel !== 'visible') return

    const fadeTimer = window.setTimeout(
      () => setSignedInLabel('fading'),
      SIGNED_IN_VISIBLE_MS,
    )
    const hideTimer = window.setTimeout(
      () => setSignedInLabel('hidden'),
      SIGNED_IN_VISIBLE_MS + SIGNED_IN_FADE_MS,
    )

    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(hideTimer)
    }
  }, [signedInLabel])

  const handleLogout = useCallback(async () => {
    setLoggingOut(true)
    try {
      await logout()
      setSignedIn(false)
    } finally {
      setLoggingOut(false)
    }
  }, [])

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-brand-thistle/60 bg-brand-lavender/92 shadow-[0_1px_0_rgba(45,45,52,0.06)] backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-end gap-4 px-4 py-3 sm:px-6">
          {links.map(({ to, text }) => (
            <NavbarLink key={to} to={to} text={text} />
          ))}

          {signedIn ? (
            <>
              {signedInLabel !== 'hidden' ? (
                <span
                  className={`text-sm font-medium text-brand-shadow/70 transition-opacity duration-500 ${
                    signedInLabel === 'fading' ? 'opacity-0' : 'opacity-100'
                  }`}
                  aria-live="polite"
                >
                  Signed in
                </span>
              ) : null}
              <NavbarLink
                text={loggingOut ? 'Logging out…' : 'Log out'}
                onClick={handleLogout}
                disabled={loggingOut}
              />
            </>
          ) : (
            <NavbarLink text="Login" onClick={() => setLoginOpen(true)} />
          )}
        </nav>
      </header>

      <LoginModal
        open={loginOpen}
        onClose={closeLogin}
        onSuccess={handleLoginSuccess}
      />
    </>
  )
}
