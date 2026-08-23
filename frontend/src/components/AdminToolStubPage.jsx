import PageBackground from './layout/PageBackground'
import Navbar from './navbar/Navbar'

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
        <h1 className="font-sans text-2xl font-bold text-brand-lavender drop-shadow-[0_2px_10px_rgba(45,45,52,0.85)] sm:text-3xl">
          {title}
        </h1>
        <p className="mt-4 text-base text-brand-alabaster drop-shadow-md">
          Under Construction
        </p>
      </main>
    </div>
  )
}
