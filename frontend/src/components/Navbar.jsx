export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-brand-thistle/60 bg-brand-lavender/92 shadow-[0_1px_0_rgba(45,45,52,0.06)] backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-end px-4 py-3 sm:px-6">
        <a
          href="/login"
          className="text-sm font-medium text-brand-shadow no-underline transition-colors hover:text-brand-dusty"
        >
          Login
        </a>
      </nav>
    </header>
  )
}
