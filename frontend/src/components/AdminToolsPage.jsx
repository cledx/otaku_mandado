import PageBackground from './layout/PageBackground'
import Navbar from './navbar/Navbar'
import AdminToolTitle from './AdminToolTitle'

const BACKGROUND = '/assets/backgrounds/sales.png'

/** Admin tool menu entries — destinations are stubs until each tool is built. */
const ADMIN_TOOLS = [
  {
    to: '#scheduled-sales',
    text: 'Scheduled Sales',
    description: 'See all future scheduled sales',
  },
  {
    to: '#past-sales',
    text: 'Past Sales',
    description: 'View all finished sales',
  },
  {
    to: '#deleted-sales',
    text: 'Deleted Sales',
    description: 'Show all sales that were deleted',
  },
  {
    to: '#deleted-items',
    text: 'Deleted Items',
    description: 'Show all items that were deleted',
  },
  {
    to: '#create-coupon-code',
    text: 'Create Coupon code',
    description: 'Create a new coupon code',
  },
  {
    to: '#past-orders',
    text: 'Past Orders',
    description: 'Show all completed orders',
  },
]

/**
 * Admin Tools menu (`#admin-tools`) — hub for admin-only utilities.
 * Hover a link to see its description (native `title` tooltip).
 */
export default function AdminToolsPage() {
  return (
    <div className="relative min-h-svh w-full bg-brand-shadow text-brand-shadow">
      <Navbar />
      <PageBackground imageUrl={BACKGROUND} />

      <main className="relative z-10 mx-auto w-full max-w-lg px-4 pb-12 pt-24 sm:px-6 sm:pt-28">
        <header className="mb-8 flex justify-center">
          <AdminToolTitle>Admin Tools</AdminToolTitle>
        </header>

        <nav aria-label="Admin tools" className="flex flex-col gap-3">
          {ADMIN_TOOLS.map(({ to, text, description }) => (
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
