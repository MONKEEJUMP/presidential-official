"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const primaryNavItems = [
  { href: "/moon-rocks", label: "Moon Rocks" },
  { href: "/moon-pods", label: "Moon Pods" },
  { href: "/orbit", label: "Orbit" },
  { href: "/our-story", label: "Our Story" },
  { href: "/learn", label: "Learn" },
  { href: "/find-us", label: "Find Presidential" },
  { href: "/contact", label: "Contact" },
  { href: "/loyalty", label: "Loyalty" },
] as const;

export function SiteHeader() {
  const [navigationOpen, setNavigationOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-po-ink text-po-on-dark">
      <div className="relative mx-auto flex min-h-18 w-full max-w-7xl items-center justify-between gap-6 px-5 py-3 sm:px-8 lg:px-12">
        <Link
          className="inline-flex shrink-0 items-center"
          href="/"
        >
          <Image
            alt="Presidential"
            className="h-9 w-auto sm:h-10 lg:h-11"
            height={604}
            priority
            sizes="(min-width: 1024px) 134px, (min-width: 640px) 122px, 110px"
            src="/media/brand/presidential-banner.png"
            width={1839}
          />
        </Link>

        <button
          aria-controls="presidential-primary-navigation"
          aria-expanded={navigationOpen}
          className="flex h-11 w-11 cursor-pointer items-center justify-center border border-po-on-dark/25 bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-po-brand lg:hidden"
          onClick={() => setNavigationOpen((open) => !open)}
          type="button"
        >
          <span className="sr-only">Toggle navigation</span>
          <span aria-hidden="true" className="grid w-5 gap-1.5">
            <span className="h-px bg-po-on-dark" />
            <span className="h-px bg-po-on-dark" />
            <span className="h-px bg-po-on-dark" />
          </span>
        </button>

        <nav
          aria-label="Primary navigation"
          className={`absolute inset-x-5 top-[calc(100%+0.01rem)] border border-po-on-dark/15 bg-po-ink p-3 shadow-2xl sm:inset-x-8 lg:static lg:block lg:min-w-0 lg:flex-1 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none ${navigationOpen ? "block" : "hidden"}`}
          id="presidential-primary-navigation"
        >
          <ul className="grid lg:flex lg:items-center lg:justify-end lg:gap-0 lg:whitespace-nowrap">
            {primaryNavItems.map((item) => (
              <li className="po-primary-nav-item" key={item.href}>
                <Link
                  className={[
                    "po-primary-nav-link",
                    item.href === "/find-us"
                      ? "po-primary-nav-link-featured"
                      : "",
                  ].join(" ")}
                  href={item.href}
                  onClick={() => setNavigationOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <span
        aria-hidden="true"
        className="po-gold-thread-inlay !absolute inset-x-0 bottom-0 h-0"
      />
    </header>
  );
}
