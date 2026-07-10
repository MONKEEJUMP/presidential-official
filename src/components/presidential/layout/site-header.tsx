import Link from "next/link";

const primaryNavItems = [
  { href: "/moon-rocks", label: "Moon Rocks" },
  { href: "/moon-pods", label: "Moon Pods" },
  { href: "/orbit", label: "Orbit" },
  { href: "/our-story", label: "Our Story" },
  { href: "/learn", label: "Learn" },
  { href: "/find-us", label: "Find Presidential" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-po-line bg-po-canvas/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-col items-start gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-6 sm:px-8 sm:py-0 lg:px-12">
        <Link
          className="inline-flex shrink-0 items-center"
          href="/"
        >
          <span
            aria-hidden="true"
            className="block h-9 w-36 bg-contain bg-left bg-no-repeat"
            style={{ backgroundImage: "url('/brand/presidential-logo.webp')" }}
          />
          <span className="sr-only">Presidential</span>
        </Link>
        <nav
          aria-label="Primary navigation"
          className="flex w-full min-w-0 flex-1 items-center justify-start overflow-x-auto sm:w-auto sm:justify-end"
        >
          <ul className="flex items-center gap-1 whitespace-nowrap">
            {primaryNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  className="inline-flex px-3 py-2 text-sm font-semibold text-po-body transition-colors hover:text-po-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-po-brand"
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
