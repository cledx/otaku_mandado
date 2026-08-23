/**
 * Shared page title for Admin Tools hub and individual tool pages.
 * Pill box with shaded background so titles read clearly over the sales backdrop.
 */
export default function AdminToolTitle({ children }) {
  return (
    <h1 className="inline-flex rounded-full border border-brand-thistle/50 bg-brand-shadow/80 px-8 py-3 text-center font-sans text-2xl font-bold text-brand-lavender shadow-lg backdrop-blur-sm sm:px-10 sm:text-3xl">
      {children}
    </h1>
  )
}
