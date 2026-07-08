import Link from "next/link";

const footerLinks = [
  { href: "/moon-rocks", label: "Moon Rocks" },
  { href: "/moon-pods", label: "Moon Pods" },
  { href: "/orbit", label: "Orbit" },
  { href: "/our-story", label: "Our Story" },
  { href: "/learn", label: "Learn" },
  { href: "/find-us", label: "Find Presidential" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-950 px-6 py-12 text-white sm:px-10 lg:px-16">
      <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(320px,1fr)]">
        <div className="flex max-w-xl flex-col gap-4">
          <Link
            className="text-sm font-black uppercase tracking-normal text-white"
            href="/"
          >
            PRESIDENTIAL
          </Link>
          <p className="text-sm leading-6 text-zinc-300">
            Official home of Presidential cannabis products. Availability varies
            by licensed retailer. For adults 21+ where legal.
          </p>
        </div>

        <nav aria-label="Footer navigation">
          <ul className="grid gap-3 text-sm font-semibold text-zinc-300 sm:grid-cols-2 lg:grid-cols-3">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  className="transition-colors hover:text-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200"
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
