import PageBackground from './layout/PageBackground'
import Navbar from './navbar/Navbar'
import AdminToolTitle from './AdminToolTitle'

const BACKGROUND = '/assets/backgrounds/sales.png'

/** Settings menu entries — destinations may be stubs until each screen is built. */
const USER_SETTINGS = [
  {
    to: '#change-password',
    text: 'Change Password',
    description: 'Update the password for your account',
  },
]

/**
 * User Settings menu (`#user-settings`) — hub for account preferences.
 * Available to every signed-in role. Hover a link for its description.
 */
export default function UserSettingsPage() {
  return (
    <div className="relative min-h-svh w-full bg-brand-shadow text-brand-shadow">
      <Navbar />
      <PageBackground imageUrl={BACKGROUND} />

      <main className="relative z-10 mx-auto w-full max-w-lg px-4 pb-12 pt-24 sm:px-6 sm:pt-28">
        <header className="mb-8 flex justify-center">
          <AdminToolTitle>User Settings</AdminToolTitle>
        </header>

        <nav aria-label="User settings" className="flex flex-col gap-3">
          {USER_SETTINGS.map(({ to, text, description }) => (
            <a
              key={to}
              href={to}
              title={description}
              className="rounded-xl border border-brand-thistle/50 bg-brand-alabaster/90 px-5 py-3.5 text-center text-sm font-semibold text-brand-shadow no-underline shadow-sm transition hover:border-brand-dusty hover:bg-brand-lavender/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dusty focus-visible:ring-offset-2 focus-visible:ring-offset-brand-shadow"
            >
              {text}
            </a>
          ))}
        </nav>
      </main>
    </div>
  )
}
