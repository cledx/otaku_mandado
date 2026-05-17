import { useEffect, useId, useRef, useState } from 'react'
import { login, register } from '../api'

const inputClass =
  'w-full rounded-xl border border-brand-thistle/80 bg-brand-alabaster/90 px-4 py-2.5 text-sm text-brand-shadow outline-none transition placeholder:text-brand-shadow/40 focus:border-brand-dusty focus:ring-2 focus:ring-brand-dusty/25'

export default function LoginModal({ open, onClose, onSuccess }) {
  const titleId = useId()
  const emailRef = useRef(null)
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const isRegister = mode === 'register'

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    setError(null)
    const t = window.setTimeout(() => emailRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => emailRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [mode, open])

  useEffect(() => {
    if (!open) {
      setMode('signin')
      setEmail('')
      setPassword('')
      setPasswordConfirmation('')
      setError(null)
    }
  }, [open])

  if (!open) return null

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setPasswordConfirmation('')
  }

  const switchMode = (next) => {
    setMode(next)
    setError(null)
    setPassword('')
    setPasswordConfirmation('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const trimmedEmail = email.trim()
      const user = isRegister
        ? await register(trimmedEmail, password, passwordConfirmation)
        : await login(trimmedEmail, password)
      resetForm()
      onSuccess?.(user)
      onClose()
    } catch (err) {
      setError(err.message || (isRegister ? 'Registration failed' : 'Sign in failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-brand-shadow/55 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-2xl border border-brand-dusty/40 bg-brand-lavender/97 p-6 shadow-2xl ring-1 ring-brand-thistle/40 sm:rounded-3xl sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-brand-shadow/60 transition hover:bg-brand-thistle/40 hover:text-brand-shadow"
        >
          <span aria-hidden className="text-xl leading-none">
            &times;
          </span>
        </button>

        <h2
          id={titleId}
          className="mb-1 pr-8 text-center font-sans text-xl font-bold text-brand-shadow sm:text-2xl"
        >
          {isRegister ? 'Create account' : 'Sign in'}
        </h2>
        <p className="mb-6 text-center text-sm text-brand-shadow/65">
          {isRegister
            ? 'Register to save orders and get drop updates.'
            : 'Enter your account details to continue.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-brand-shadow">
              Email
            </span>
            <input
              ref={emailRef}
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-brand-shadow">
              Password
            </span>
            <input
              type="password"
              name="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </label>

          {isRegister ? (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-brand-shadow">
                Confirm password
              </span>
              <input
                type="password"
                name="password_confirmation"
                autoComplete="new-password"
                required
                minLength={6}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
            </label>
          ) : null}

          {error ? (
            <p
              className="rounded-lg bg-brand-dusty/15 px-3 py-2 text-center text-sm text-brand-dusty"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-full border border-brand-shadow bg-brand-shadow px-6 py-3 text-sm font-semibold text-brand-lavender shadow-md transition hover:border-brand-dusty hover:bg-brand-dusty disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? isRegister
                ? 'Creating account…'
                : 'Signing in…'
              : isRegister
                ? 'Create account'
                : 'Sign in'}
          </button>

          {isRegister ? (
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="w-full rounded-full border border-brand-thistle bg-transparent px-6 py-3 text-sm font-semibold text-brand-shadow transition hover:border-brand-dusty hover:bg-brand-thistle/35"
            >
              Back to sign in
            </button>
          ) : (
            <button
              type="button"
              onClick={() => switchMode('register')}
              className="w-full rounded-full border border-brand-thistle bg-transparent px-6 py-3 text-sm font-semibold text-brand-shadow transition hover:border-brand-dusty hover:bg-brand-thistle/35"
            >
              Create account
            </button>
          )}
        </form>
      </div>
    </div>
  )
}