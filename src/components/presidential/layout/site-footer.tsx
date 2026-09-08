import Link from "next/link";
import { PARTNERS_LABEL } from '@/content/partners-copy';

const footerLinks = [
  { href: '/partners', label: PARTNERS_LABEL },
  { href: "/moon-rocks", label: "Moon Rocks" },
  { href: "/moon-pods", label: "Moon Pods" },
  { href: "/orbit", label: "Orbit" },
  { href: "/our-story", label: "Our Story" },
  { href: "/about", label: "About" },
  { href: "/learn", label: "Learn" },
  { href: "/find-us", label: "Find Presidential" },
  { href: "/contact", label: "Contact" },
  { href: "/presidential-thc", label: "Presidential THC" },
  { href: "/presidential-cannabis", label: "Presidential Cannabis" },
  { href: "/presidential-blunts", label: "Presidential Blunts" },
] as const;

export function SiteFooter() {
  return (
    <footer className="po-gold-thread-inlay bg-po-ink px-6 py-14 text-po-on-dark sm:px-10 lg:px-16 lg:py-20">
      <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.85fr)]">
        <div className="flex max-w-xl flex-col gap-6">
          <Link
            className="inline-flex w-fit items-center"
            href="/"
          >
            <span
              aria-hidden="true"
              className="po-brand-mark block aspect-[1200/929] w-32 bg-contain bg-center bg-no-repeat"
            />
            <span className="sr-only">Presidential</span>
          </Link>
          <p className="max-w-md text-sm leading-6 text-po-on-dark-muted">
            Official home of Presidential cannabis products. Availability varies
            by licensed retailer. For adults 21+ where legal.
          </p>
        </div>

        <nav aria-label="Footer navigation">
          <ul className="grid border-t border-po-on-dark/20 text-sm font-semibold text-po-on-dark-muted sm:grid-cols-2">
            {footerLinks.map((link) => (
              <li className="po-footer-nav-item" key={link.href}>
                <Link
                  className="po-footer-nav-link"
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
