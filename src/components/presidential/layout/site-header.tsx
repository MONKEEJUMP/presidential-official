"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { HeaderStoreFinder } from "./header-store-finder";

const primaryNavItems = [
  { href: "/moon-rocks", label: "Moon Rocks" },
  { href: "/vapes", label: "Vapes" },
  { href: "/our-story", label: "Our Story" },
  { href: "/about", label: "About" },
  { href: "/learn", label: "Learn" },
  { href: "/pop-up", label: "Pop Up" },
  { href: "/contact", label: "Contact" },
  { href: "/loyalty", label: "Loyalty" },
  { href: "/find-us", label: "Find Us" },
  { href: "/sales", label: "Login" },
] as const;

export function SiteHeader() {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setNavigationOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/" || window.location.hash) {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  useEffect(() => {
    if (!navigationOpen) {
      return;
    }

    const closeNavigation = () => setNavigationOpen(false);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeNavigation();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", closeNavigation, { passive: true });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", closeNavigation);
    };
  }, [navigationOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-po-ink text-po-on-dark">
        <div className="relative mx-auto flex min-h-18 w-full max-w-7xl items-center justify-between gap-6 px-5 py-3 sm:px-8 lg:px-12">
          <Link
            aria-label="Presidential — home"
            className="inline-flex shrink-0 cursor-pointer items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-po-brand"
            href="/"
            onClick={(event) => {
              setNavigationOpen(false);

              if (pathname === "/") {
                event.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            <span
              aria-hidden="true"
              className="mr-2 shrink-0 font-display text-[0.68rem] font-semibold tracking-[0.075em] text-po-on-dark"
            >
              THE REAL
            </span>
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
            className="flex h-11 w-11 cursor-pointer items-center justify-center border border-po-on-dark/25 bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-po-brand min-[1170px]:hidden"
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
            className={`absolute inset-x-5 top-[calc(100%+0.01rem)] max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain border border-po-on-dark/15 bg-po-ink p-3 shadow-2xl [-webkit-overflow-scrolling:touch] sm:inset-x-8 min-[1170px]:static min-[1170px]:block min-[1170px]:max-h-none min-[1170px]:min-w-0 min-[1170px]:flex-1 min-[1170px]:overflow-visible min-[1170px]:border-0 min-[1170px]:bg-transparent min-[1170px]:p-0 min-[1170px]:shadow-none ${navigationOpen ? "block" : "hidden"}`}
            id="presidential-primary-navigation"
          >
            <ul className="grid min-[1170px]:flex min-[1170px]:items-center min-[1170px]:justify-end min-[1170px]:gap-0 min-[1170px]:whitespace-nowrap">
              {primaryNavItems.map((item) => (
                <li className="po-primary-nav-item" key={item.href}>
                  <Link
                    className="po-primary-nav-link"
                    href={item.href}
                    onClick={() => setNavigationOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <HeaderStoreFinder onRoute={() => setNavigationOpen(false)} />
            </ul>
          </nav>
        </div>
        <span
          aria-hidden="true"
          className="po-gold-thread-inlay !absolute inset-x-0 bottom-0 h-0"
        />
      </header>
      {navigationOpen ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-30 touch-pan-y bg-transparent min-[1170px]:hidden"
          data-presidential-mobile-menu-backdrop
          onClick={() => setNavigationOpen(false)}
        />
      ) : null}
    </>
  );
}
