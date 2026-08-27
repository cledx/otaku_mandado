import { useEffect, useState } from 'react'
import { createAccount, fetchNavContext, getAuthToken } from '../api'
import AdminToolTitle from './AdminToolTitle'
import PageBackground from './layout/PageBackground'
import Navbar from './navbar/Navbar'

const BACKGROUND = '/assets/backgrounds/sales.png'
const DEFAULT_PASSWORD = 'password'

const inputClass =
  'w-full rounded-xl border border-brand-thistle/80 bg-brand-alabaster/90 px-4 py-2.5 text-sm text-brand-shadow outline-none transition placeholder:text-brand-shadow/40 focus:border-brand-dusty focus:ring-2 focus:ring-brand-dusty/25'

/**
 * Create New User (`#create-new-user`) — admin provisions an account with a fixed
 * default password of "password". Role dropdown: User (client) or Admin.
 */
export default function CreateNewUserPage() {
  const [authState, setAuthState] = useState('loading')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('client')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!getAuthToken()) {
      setAuthState('guest')
      return
    }

    let cancelled = false
    const loadRole = async () => {
      try {
        const ctx = await fetchNavContext()
        if (!cancelled) setAuthState(ctx.role === 'admin' ? 'admin' : 'client')
      } catch {
        if (!cancelled) setAuthState('guest')
      }
    }
    void loadRole()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const trimmed = email.trim()
    if (!trimmed) {
      setError('Enter an email address.')
      return
    }

    setSubmitting(true)
    try {
      const created = await createAccount({ email: trimmed, role })
      setEmail('')
      setRole('client')
      setSuccess(
        `Created ${created.email} as ${created.role === 'admin' ? 'Admin' : 'User'}. Default password is “${DEFAULT_PASSWORD}”.`,
      )
    } catch (e) {
      setError(e.message || 'Could not create user.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-svh w-full bg-brand-shadow text-brand-shadow">
      <Navbar />
      <PageBackground imageUrl={BACKGROUND} />

      <main className="relative z-10 mx-auto w-full max-w-lg px-4 pb-12 pt-24 sm:px-6 sm:pt-28">
        <div className="mb-8 flex items-center justify-center gap-3 sm:gap-4">
          <a
            href="#admin-tools"
            aria-label="Back to Admin Tools"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-brand-lavender no-underline shadow-lg transition hover:bg-brand-shadow/60 hover:text-brand-alabaster focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dusty"
          >
            <i className="fa-solid fa-arrow-left text-xl" aria-hidden />
          </a>
          <AdminToolTitle>Create New User</AdminToolTitle>
        </div>

        <div className="rounded-2xl border border-brand-dusty/40 bg-brand-lavender/97 p-6 shadow-2xl ring-1 ring-brand-thistle/40 sm:rounded-3xl sm:p-8">
          {authState === 'loading' ? (
            <p className="text-center text-sm text-brand-shadow/70">Checking access…</p>
          ) : authState !== 'admin' ? (
            <p className="text-center text-sm text-brand-dusty" role="alert">
              {authState === 'guest'
                ? 'Sign in as an admin to create users.'
                : 'Only admins can create users.'}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="rounded-lg border border-brand-thistle/50 bg-brand-alabaster/70 px-3 py-2 text-center text-sm text-brand-shadow/80">
                New accounts use the default password{' '}
                <span className="font-mono font-semibold text-brand-shadow">
                  {DEFAULT_PASSWORD}
                </span>
                . Share it with the user so they can sign in and change it.
              </p>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-brand-shadow">
                  Email
                </span>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="user@example.com"
                  disabled={submitting}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-brand-shadow">
                  Role
                </span>
                <select
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                >
                  <option value="client">User</option>
                  <option value="admin">Admin</option>
                </select>
              </label>

              {error ? (
                <p
                  className="rounded-lg bg-brand-dusty/15 px-3 py-2 text-center text-sm text-brand-dusty"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              {success ? (
                <p
                  className="rounded-lg bg-brand-available-bg px-3 py-2 text-center text-sm text-brand-available"
                  role="status"
                >
                  {success}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full rounded-full border border-brand-shadow bg-brand-shadow px-6 py-3 text-sm font-semibold text-brand-lavender shadow-md transition hover:border-brand-dusty hover:bg-brand-dusty disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Creating…' : 'Create user'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
