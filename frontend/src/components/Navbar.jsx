import { useCallback, useState } from 'react'
import { getAuthToken } from '../api'
import LoginModal from './LoginModal'

export default function Navbar() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [signedIn, setSignedIn] = useState(() => Boolean(getAuthToken()))
  const closeLogin = useCallback(() => setLoginOpen(false), [])
  const handleLoginSuccess = useCallback(() => setSignedIn(true), [])

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-brand-thistle/60 bg-brand-lavender/92 shadow-[0_1px_0_rgba(45,45,52,0.06)] backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-end gap-4 px-4 py-3 sm:px-6">
          {signedIn ? (
            <span className="text-sm font-medium text-brand-shadow/70">Signed in</span>
          ) : null}
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="border-0 bg-transparent p-0 text-sm font-medium text-brand-shadow transition-colors hover:text-brand-dusty"
          >
            {signedIn ? 'Account' : 'Login'}
          </button>
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
