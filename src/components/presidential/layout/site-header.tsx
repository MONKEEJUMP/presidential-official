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
    <header className="sticky top-0 z-40 border-b border-po-on-dark/10 bg-po-ink text-po-on-dark">
      <div className="relative mx-auto flex min-h-18 w-full max-w-7xl items-center justify-between gap-6 px-5 py-3 sm:px-8 lg:px-12">
        <Link
          className="inline-flex shrink-0 items-center bg-po-brand p-2"
          href="/"
        >
          <span
            aria-hidden="true"
            className="po-brand-mark block aspect-[1200/929] w-16 bg-contain bg-center bg-no-repeat"
          />
          <span className="sr-only">Presidential</span>
        </Link>

        <input
          aria-label="Toggle navigation"
          className="peer sr-only"
          id="presidential-navigation-toggle"
          type="checkbox"
        />
        <label
          className="flex h-11 w-11 cursor-pointer items-center justify-center border border-po-on-dark/25 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-po-brand md:hidden"
          htmlFor="presidential-navigation-toggle"
        >
          <span className="sr-only">Toggle navigation</span>
          <span aria-hidden="true" className="grid w-5 gap-1.5">
            <span className="h-px bg-po-on-dark" />
            <span className="h-px bg-po-on-dark" />
            <span className="h-px bg-po-on-dark" />
          </span>
        </label>

        <nav
          aria-label="Primary navigation"
          className="absolute inset-x-5 top-[calc(100%+0.01rem)] hidden border border-po-on-dark/15 bg-po-ink p-3 shadow-2xl peer-checked:block sm:inset-x-8 md:static md:block md:min-w-0 md:flex-1 md:border-0 md:bg-transparent md:p-0 md:shadow-none"
        >
          <ul className="grid md:flex md:items-center md:justify-end md:gap-1 md:whitespace-nowrap">
            {primaryNavItems.map((item) => (
              <li
                className="po-primary-nav-item"
                key={item.href}
              >
                <Link
                  className={[
                    "po-primary-nav-link",
                    item.href === "/find-us"
                      ? "po-primary-nav-link-featured"
                      : "",
                  ].join(" ")}
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
