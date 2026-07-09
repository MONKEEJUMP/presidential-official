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
    <footer className="border-t border-po-line bg-po-ink px-6 py-12 text-po-on-dark sm:px-10 lg:px-16">
      <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(320px,1fr)]">
        <div className="flex max-w-xl flex-col gap-4">
          <Link
            className="text-sm font-black uppercase tracking-normal text-po-on-dark"
            href="/"
          >
            PRESIDENTIAL
          </Link>
          <p className="text-sm leading-6 text-po-on-dark-muted">
            Official home of Presidential cannabis products. Availability varies
            by licensed retailer. For adults 21+ where legal.
          </p>
        </div>

        <nav aria-label="Footer navigation">
          <ul className="grid gap-3 text-sm font-semibold text-po-on-dark-muted sm:grid-cols-2 lg:grid-cols-3">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  className="transition-colors hover:text-po-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-po-gold"
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
