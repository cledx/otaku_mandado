import { useCallback, useEffect, useRef, useState } from 'react'
import { getAuthToken, logout } from '../../api'
import LoginModal from '../LoginModal'
import NavbarLink from './NavbarLink'
import useNavbarNav from './useNavbarNav'

const SIGNED_IN_VISIBLE_MS = 5000
const SIGNED_IN_FADE_MS = 500
// Matches Tailwind's `lg` breakpoint; below this the nav collapses into a dropdown.
const DESKTOP_BREAKPOINT_PX = 1024

const mobileLinkClass =
  'block w-full px-6 py-3 text-center text-base hover:bg-brand-thistle/30 focus-visible:bg-brand-thistle/30 focus-visible:outline-none'

export default function Navbar() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [signedIn, setSignedIn] = useState(() => Boolean(getAuthToken()))
  const [signedInLabel, setSignedInLabel] = useState('hidden')
  const [loggingOut, setLoggingOut] = useState(false)
  const { links } = useNavbarNav(signedIn)
  const headerRef = useRef(null)

  const closeLogin = useCallback(() => setLoginOpen(false), [])
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const toggleMenu = useCallback(() => setMenuOpen((open) => !open), [])
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

  useEffect(() => {
    if (!menuOpen) return

    const handleKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    const handlePointer = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    const handleResize = () => {
      if (window.innerWidth >= DESKTOP_BREAKPOINT_PX) setMenuOpen(false)
    }
    const handleHashChange = () => setMenuOpen(false)

    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handlePointer)
    window.addEventListener('resize', handleResize)
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handlePointer)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [menuOpen])

  const handleLogout = useCallback(async () => {
    setLoggingOut(true)
    try {
      await logout()
      setSignedIn(false)
    } finally {
      setLoggingOut(false)
      setMenuOpen(false)
    }
  }, [])

  const handleMobileLinkClick = useCallback(() => setMenuOpen(false), [])
  const handleMobileLogin = useCallback(() => {
    setMenuOpen(false)
    setLoginOpen(true)
  }, [])

  return (
    <>
      <header
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-50 flex items-center gap-x-4 border-b border-brand-thistle/60 bg-brand-lavender/92 py-3 pl-1 pr-4 shadow-[0_1px_0_rgba(45,45,52,0.06)] backdrop-blur-md sm:pl-2 sm:pr-6"
      >
        <a
          href="#"
          onClick={closeMenu}
          aria-label="Otaku Mandado home"
          className="inline-flex shrink-0 rounded-full transition-opacity hover:opacity-85 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dusty focus-visible:ring-offset-2 focus-visible:ring-offset-brand-lavender"
        >
          <img
            src="/assets/logo.png"
            alt="Otaku Mandado"
            className="h-10 w-10 rounded-full object-cover sm:h-11 sm:w-11"
          />
        </a>

        <nav className="ml-auto hidden flex-wrap items-center justify-end gap-x-4 gap-y-2 lg:flex">
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

        <button
          type="button"
          onClick={toggleMenu}
          aria-expanded={menuOpen}
          aria-controls="primary-mobile-nav"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="ml-auto inline-flex items-center justify-center rounded-md p-2 text-brand-shadow transition-colors hover:bg-brand-thistle/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dusty lg:hidden"
        >
          {menuOpen ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </svg>
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          )}
        </button>

        {menuOpen ? (
          <div
            id="primary-mobile-nav"
            className="absolute inset-x-0 top-full border-b border-brand-thistle/60 bg-brand-lavender/95 shadow-md backdrop-blur-md lg:hidden"
          >
            <nav
              aria-label="Primary"
              className="flex flex-col py-2"
            >
              {signedIn ? (
                <>
                  {links.map(({ to, text }) => (
                    <NavbarLink
                      key={text}
                      to={to}
                      text={text}
                      onClick={handleMobileLinkClick}
                      className={mobileLinkClass}
                    />
                  ))}
                  <NavbarLink
                    text={loggingOut ? 'Logging out…' : 'Logout'}
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className={mobileLinkClass}
                  />
                </>
              ) : (
                <NavbarLink
                  text="Login"
                  onClick={handleMobileLogin}
                  className={mobileLinkClass}
                />
              )}
            </nav>
          </div>
        ) : null}
      </header>

      <LoginModal
        open={loginOpen}
        onClose={closeLogin}
        onSuccess={handleLoginSuccess}
      />
    </>
  )
}
