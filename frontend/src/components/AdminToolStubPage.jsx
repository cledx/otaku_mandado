import PageBackground from './layout/PageBackground'
import Navbar from './navbar/Navbar'
import AdminToolTitle from './AdminToolTitle'

const BACKGROUND = '/assets/backgrounds/sales.png'

/**
 * Shared stub for admin tools that are not built yet.
 * @param {string} title — tool name shown in the heading
 */
export default function AdminToolStubPage({ title = 'Admin Tool' }) {
  return (
    <div className="relative min-h-svh w-full bg-brand-shadow text-brand-shadow">
      <Navbar />
      <PageBackground imageUrl={BACKGROUND} />

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-4 pb-12 pt-24 sm:px-6 sm:pt-28">
        <div className="flex items-center gap-3 sm:gap-4">
          <a
            href="#admin-tools"
            aria-label="Back to Admin Tools"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-brand-lavender no-underline shadow-lg transition hover:bg-brand-shadow/60 hover:text-brand-alabaster focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dusty"
          >
            <i className="fa-solid fa-arrow-left text-xl" aria-hidden />
          </a>
          <AdminToolTitle>{title}</AdminToolTitle>
        </div>
        <p className="mt-4 text-base text-brand-alabaster drop-shadow-md">
          Under Construction
        </p>
      </main>
    </div>
  )
}
