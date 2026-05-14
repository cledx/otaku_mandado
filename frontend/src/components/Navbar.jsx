export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-pink-200/60 bg-[#f3d1dc]/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-end px-4 py-3 sm:px-6">
        <a
          href="/login"
          className="text-sm font-medium text-neutral-900 no-underline transition-opacity hover:opacity-70"
        >
          Login
        </a>
      </nav>
    </header>
  )
}
