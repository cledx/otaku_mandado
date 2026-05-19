import { useEffect, useMemo, useState } from 'react'
import { fetchAccounts, fetchNavContext, getAuthToken } from '../api'
import AccountCard from './accounts/AccountCard'
import PageBackground from './layout/PageBackground'
import Navbar from './navbar/Navbar'

const ACCOUNTS_BACKGROUND = '/assets/backgrounds/sales.png'

/**
 * View Accounts (admin) page.
 *
 * Fetches /v1/accounts (admin-only) and renders one card per registered user.
 * Each card surfaces whether the user has pending orders so admins can chase
 * follow-ups without paging through the View Orders list.
 */
export default function AccountsPage() {
  const [authState, setAuthState] = useState('loading')
  const [accounts, setAccounts] = useState(null)
  const [loadError, setLoadError] = useState(null)

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

  useEffect(() => {
    if (authState !== 'admin') return undefined

    let cancelled = false
    const load = async () => {
      try {
        const data = await fetchAccounts()
        if (!cancelled) {
          setLoadError(null)
          setAccounts(Array.isArray(data) ? data : [])
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e.message || 'Could not load accounts.')
          setAccounts([])
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [authState])

  // Pending accounts float to the top so admins see actionable rows first.
  const sortedAccounts = useMemo(() => {
    if (!accounts) return []
    return [...accounts].sort((a, b) => {
      if (a.pending_orders !== b.pending_orders) {
        return a.pending_orders ? -1 : 1
      }
      return (a.email || '').localeCompare(b.email || '')
    })
  }, [accounts])

  const pendingCount = useMemo(
    () => (accounts ? accounts.filter((a) => a.pending_orders).length : 0),
    [accounts],
  )

  return (
    <div className="relative min-h-svh w-full bg-brand-shadow text-brand-shadow">
      <Navbar />
      <PageBackground imageUrl={ACCOUNTS_BACKGROUND} />

      <main className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-12 pt-24 sm:px-6 sm:pt-28">
        <header className="mb-6 text-center">
          <h1 className="font-sans text-2xl font-bold text-brand-lavender drop-shadow-[0_2px_10px_rgba(45,45,52,0.85)] sm:text-3xl">
            View Accounts
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-brand-alabaster drop-shadow-md">
            Every registered account. Accounts with pending orders are flagged so
            you can follow up before fulfilling the next drop.
          </p>
          {accounts && accounts.length > 0 ? (
            <p className="mt-3 text-xs text-brand-alabaster/85 drop-shadow-md">
              {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
              {pendingCount > 0
                ? ` · ${pendingCount} with pending orders`
                : ' · no pending orders'}
            </p>
          ) : null}
        </header>

        {authState === 'loading' ? (
          <p className="text-center text-sm text-brand-alabaster drop-shadow-md">
            Checking access…
          </p>
        ) : authState === 'guest' ? (
          <p className="text-center text-sm text-brand-alabaster drop-shadow-md" role="alert">
            Sign in to view accounts.
          </p>
        ) : authState !== 'admin' ? (
          <p className="text-center text-sm text-brand-alabaster drop-shadow-md" role="alert">
            Only admins can view all accounts.
          </p>
        ) : loadError ? (
          <p className="text-center text-sm text-brand-alabaster drop-shadow-md" role="alert">
            {loadError}
          </p>
        ) : accounts == null ? (
          <p className="text-center text-sm text-brand-alabaster drop-shadow-md">
            Loading accounts…
          </p>
        ) : sortedAccounts.length === 0 ? (
          <p className="text-center text-sm text-brand-alabaster drop-shadow-md">
            No accounts have been registered yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3 sm:gap-4">
            {sortedAccounts.map((account) => (
              <li key={account.id}>
                <AccountCard account={account} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
