import { useEffect, useState } from 'react'
import { changePassword, getAuthToken } from '../api'
import AdminToolTitle from './AdminToolTitle'
import PageBackground from './layout/PageBackground'
import Navbar from './navbar/Navbar'

const BACKGROUND = '/assets/backgrounds/sales.png'

const inputClass =
  'w-full rounded-xl border border-brand-thistle/80 bg-brand-alabaster/90 px-4 py-2.5 text-sm text-brand-shadow outline-none transition placeholder:text-brand-shadow/40 focus:border-brand-dusty focus:ring-2 focus:ring-brand-dusty/25'

/**
 * Change Password (`#change-password`) — any signed-in user can update their password.
 * Requires current password plus matching new password fields.
 */
export default function ChangePasswordPage() {
  const [signedIn, setSignedIn] = useState(() => Boolean(getAuthToken()))
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setSignedIn(Boolean(getAuthToken()))
  }, [])

  const resetFields = () => {
    setCurrentPassword('')
    setNewPassword('')
    setNewPasswordConfirm('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!newPassword || !newPasswordConfirm) {
      setError('Enter and confirm your new password.')
      return
    }
    if (newPassword !== newPasswordConfirm) {
      setError('New password fields do not match.')
      return
    }

    setSubmitting(true)
    try {
      await changePassword(currentPassword, newPassword, newPasswordConfirm)
      resetFields()
      setSuccess('Password updated successfully.')
    } catch (e) {
      setError(e.message || 'Could not change password.')
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
            href="#user-settings"
            aria-label="Back to User Settings"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-brand-lavender no-underline shadow-lg transition hover:bg-brand-shadow/60 hover:text-brand-alabaster focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dusty"
          >
            <i className="fa-solid fa-arrow-left text-xl" aria-hidden />
          </a>
          <AdminToolTitle>Change Password</AdminToolTitle>
        </div>

        <div className="rounded-2xl border border-brand-dusty/40 bg-brand-lavender/97 p-6 shadow-2xl ring-1 ring-brand-thistle/40 sm:rounded-3xl sm:p-8">
          {!signedIn ? (
            <p className="text-center text-sm text-brand-dusty" role="alert">
              Sign in to change your password.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-brand-shadow">
                  Current Password
                </span>
                <input
                  type="password"
                  name="current_password"
                  required
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-brand-shadow">
                  New Password
                </span>
                <input
                  type="password"
                  name="password"
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-brand-shadow">
                  Repeat New Password
                </span>
                <input
                  type="password"
                  name="password_confirmation"
                  required
                  autoComplete="new-password"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
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
                {submitting ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
