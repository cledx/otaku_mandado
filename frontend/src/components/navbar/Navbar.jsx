import { useCallback, useEffect, useState } from 'react'
import { getAuthToken, logout } from '../../api'
import LoginModal from '../LoginModal'
import NavbarLink from './NavbarLink'
import useNavbarNav from './useNavbarNav'

const SIGNED_IN_VISIBLE_MS = 5000
const SIGNED_IN_FADE_MS = 500

export default function Navbar() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [signedIn, setSignedIn] = useState(() => Boolean(getAuthToken()))
  const [signedInLabel, setSignedInLabel] = useState('hidden')
  const [loggingOut, setLoggingOut] = useState(false)
  const { links } = useNavbarNav(signedIn)

  const closeLogin = useCallback(() => setLoginOpen(false), [])
  const handleLoginSuccess = useCallback(() => {
    // Full reload so sale pages, nav links, and admin UI re-fetch for the new role.
    window.location.reload()
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
      <header className="fixed inset-x-0 top-0 z-50 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-brand-thistle/60 bg-brand-lavender/92 py-3 pl-1 pr-4 shadow-[0_1px_0_rgba(45,45,52,0.06)] backdrop-blur-md sm:pl-2 sm:pr-6">
        <a
          href="#"
          aria-label="Otaku Mandado home"
          className="inline-flex shrink-0 rounded-full transition-opacity hover:opacity-85 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dusty focus-visible:ring-offset-2 focus-visible:ring-offset-brand-lavender"
        >
          <img
            src="/assets/logo.png"
            alt="Otaku Mandado"
            className="h-10 w-10 rounded-full object-cover sm:h-11 sm:w-11"
          />
        </a>

        <nav className="ml-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
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

              {links.map(({ to, text }) => (
                <NavbarLink key={text} to={to} text={text} />
              ))}

              <NavbarLink
                text={loggingOut ? 'Logging out…' : 'Logout'}
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
