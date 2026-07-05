import Link from "next/link";

const primaryNavItems = [
  { href: "/", label: "Presidential" },
  { href: "/moon-rocks", label: "Moon Rocks" },
  { href: "/moon-pods", label: "Moon Pods" },
  { href: "/orbit", label: "Orbit" },
  { href: "/our-story", label: "Our Story" },
  { href: "/learn", label: "Learn Presidential" },
  { href: "/find-us", label: "Find Presidential" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-col items-start gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-8 sm:py-0 lg:px-12">
        <Link
          className="shrink-0 text-sm font-bold uppercase tracking-normal text-zinc-950"
          href="/"
        >
          Presidential
        </Link>
        <nav
          aria-label="Primary navigation"
          className="flex w-full min-w-0 flex-1 items-center justify-start overflow-x-auto sm:w-auto sm:justify-end"
        >
          <ul className="flex items-center gap-1 whitespace-nowrap">
            {primaryNavItems.slice(1).map((item) => (
              <li key={item.href}>
                <Link
                  className="inline-flex px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:text-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900"
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
