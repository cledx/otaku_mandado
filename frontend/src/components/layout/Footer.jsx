/**
 * Site-wide footer.
 *
 * Pages set `min-h-svh` on their outer wrapper, so this sits below the fold
 * and only appears once the user scrolls past the page content. The page
 * background is `fixed`, so the footer carries its own solid background
 * (`brand-shadow`) to stay legible when scrolled into view.
 */
export default function Footer() {
  return (
    <footer className="relative z-10 w-full bg-brand-shadow/90">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-1.5 text-[10px] leading-none text-brand-alabaster/40">
        <span>Site Designed by Carlos Ledoux</span>

        <a
          href="https://www.linkedin.com/in/carlos-ledoux/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Carlos Ledoux on LinkedIn"
          className="inline-flex text-brand-alabaster/40 transition hover:text-brand-alabaster/80 focus:outline-none"
        >
          <svg
            aria-hidden="true"
            focusable="false"
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
          </svg>
        </a>

        <a
          href="https://github.com/cledx"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Carlos Ledoux on GitHub"
          className="inline-flex text-brand-alabaster/40 transition hover:text-brand-alabaster/80 focus:outline-none"
        >
          <svg
            aria-hidden="true"
            focusable="false"
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-1.93c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11.04 11.04 0 0 1 5.79 0c2.21-1.5 3.18-1.18 3.18-1.18.62 1.59.23 2.77.11 3.06.74.81 1.18 1.84 1.18 3.1 0 4.44-2.7 5.41-5.27 5.69.41.36.78 1.06.78 2.13v3.16c0 .31.21.66.79.55C20.22 21.38 23.5 17.07 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
          </svg>
        </a>
      </div>
    </footer>
  )
}
