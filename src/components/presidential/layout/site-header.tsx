"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PARTNERS_LABEL } from '@/content/partners-copy';



const navigationGroups = [
  {
    id: "products",
    label: "Products",
    items: [
      { href: "/moon-rocks", label: "Moon Rocks" },
      { href: "/vapes", label: "Vapes" },
    ],
  },
  {
    id: "discover",
    label: "Discover",
    items: [
      { href: "/learn", label: "Learn" },
      { href: "/our-story", label: "Our Story" },
      { href: "/about", label: "About" },
    ],
  },
  {
    id: "connect",
    label: "Connect",
    items: [
      { href: "/pop-up", label: "Pop Up" },
      { href: "/loyalty", label: "Loyalty" },
      { href: "/contact", label: "Contact" },
    ],
  },
] as const;

type NavigationGroupId = (typeof navigationGroups)[number]["id"];

const GROUP_OPEN_DELAY_MS = 120;
const GROUP_CLOSE_DELAY_MS = 180;

function Chevron({ open }: { readonly open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-3 w-3 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 12 8"
    >
      <path
        d="m1 1 5 5 5-5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function canHover(): boolean {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function HeaderNavigation({ pathname }: { readonly pathname: string }) {
  const [desktop, setDesktop] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLAnchorElement>(null);
  const measureRef = useRef<HTMLUListElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const pinnedGroupRef = useRef<NavigationGroupId | null>(null);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<NavigationGroupId | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const activeGroupTriggerRef = useRef<HTMLButtonElement | null>(null);
  const focusedGroupRef = useRef<NavigationGroupId | null>(null);
  const groupOpenTimerRef = useRef<number | null>(null);
  const groupCloseTimerRef = useRef<number | null>(null);
  useEffect(() => {
    const row = rowRef.current;
    const brand = brandRef.current;
    const measure = measureRef.current;
    if (!row || !brand || !measure) return;
    let disposed = false;
    let lastFit = false;
    const updateFit = () => {
      if (disposed) return;
      const css = getComputedStyle(row);
      const available = row.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight);
      const needed = brand.getBoundingClientRect().width + measure.getBoundingClientRect().width + parseFloat(css.columnGap);
      const fits = needed <= available;
      setDesktop(fits);
      if (fits !== lastFit) {
        if (groupOpenTimerRef.current) window.clearTimeout(groupOpenTimerRef.current);
        if (groupCloseTimerRef.current) window.clearTimeout(groupCloseTimerRef.current);
        pinnedGroupRef.current = null;
        setOpenGroup(null);
        setNavigationOpen(false);
        lastFit = fits;
      }
    };
    const observer = new ResizeObserver(updateFit);
    observer.observe(row);
    observer.observe(brand);
    observer.observe(measure);
    void document.fonts.ready.then(updateFit);
    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (pathname !== "/" || window.location.hash) {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  useEffect(() => {
    const closeNavigation = () => {
      if (groupOpenTimerRef.current) window.clearTimeout(groupOpenTimerRef.current);
      if (groupCloseTimerRef.current) window.clearTimeout(groupCloseTimerRef.current);
      pinnedGroupRef.current = null;
      focusedGroupRef.current = null;
      setNavigationOpen(false);
      setOpenGroup(null);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && headerRef.current?.contains(event.target)) {
        return;
      }

      closeNavigation();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeNavigation();
        if (desktop) activeGroupTriggerRef.current?.focus();
        else hamburgerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", closeNavigation, { passive: true });

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", closeNavigation);
    };
  }, [navigationOpen, openGroup, desktop]);

  useEffect(
    () => () => {
      if (groupOpenTimerRef.current) {
        window.clearTimeout(groupOpenTimerRef.current);
      }
      if (groupCloseTimerRef.current) {
        window.clearTimeout(groupCloseTimerRef.current);
      }
    },
    [],
  );

  function clearGroupTimers() {
    if (groupOpenTimerRef.current) {
      window.clearTimeout(groupOpenTimerRef.current);
      groupOpenTimerRef.current = null;
    }
    if (groupCloseTimerRef.current) {
      window.clearTimeout(groupCloseTimerRef.current);
      groupCloseTimerRef.current = null;
    }
  }

  function closeMenus() {
    clearGroupTimers();
    focusedGroupRef.current = null;
    pinnedGroupRef.current = null;
    setNavigationOpen(false);
    setOpenGroup(null);
  }

  function keepGroupOpen() {
    if (groupCloseTimerRef.current) {
      window.clearTimeout(groupCloseTimerRef.current);
      groupCloseTimerRef.current = null;
    }
  }

  function scheduleGroupOpen(groupId: NavigationGroupId) {
    if (!desktop || !canHover()) return;
    keepGroupOpen();
    if (groupOpenTimerRef.current) {
      window.clearTimeout(groupOpenTimerRef.current);
    }

    if (openGroup !== null) {
      if (openGroup !== groupId) pinnedGroupRef.current = null;
      setOpenGroup(groupId);
      return;
    }

    groupOpenTimerRef.current = window.setTimeout(() => {
      groupOpenTimerRef.current = null;
      setOpenGroup(groupId);
    }, GROUP_OPEN_DELAY_MS);
  }

  function scheduleGroupClose(groupId: NavigationGroupId) {
    if (!desktop || !canHover()) return;
    if (groupOpenTimerRef.current) {
      window.clearTimeout(groupOpenTimerRef.current);
      groupOpenTimerRef.current = null;
    }
    if (groupCloseTimerRef.current) {
      window.clearTimeout(groupCloseTimerRef.current);
    }

    groupCloseTimerRef.current = window.setTimeout(() => {
      groupCloseTimerRef.current = null;
      if (focusedGroupRef.current === groupId) return;
      setOpenGroup((current) => (current === groupId ? null : current));
    }, GROUP_CLOSE_DELAY_MS);
  }

  return (
    <>
      <header
        className="group/header sticky top-0 z-40 w-full max-w-[100vw] bg-po-ink text-po-on-dark"
        data-desktop={desktop}
        ref={headerRef}
      >
        <div className="relative mx-auto flex min-h-18 w-full max-w-7xl items-center justify-between gap-6 px-5 py-3 sm:px-8 lg:px-12" ref={rowRef}>
          <Link
            aria-label="Presidential - home"
            ref={brandRef}
            className="inline-flex shrink-0 cursor-pointer items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-po-brand"
            href="/"
            onClick={(event) => {
              closeMenus();

              if (pathname === "/") {
                event.preventDefault();
                window.scrollTo({ top: 0, behavior: "auto" });
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
            ref={hamburgerRef}
            aria-expanded={navigationOpen}
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center border border-po-on-dark/25 bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-po-brand group-data-[desktop=true]/header:hidden"
            onClick={() => {
              clearGroupTimers();
              pinnedGroupRef.current = null;
              setOpenGroup(null);
              setNavigationOpen((open) => !open);
            }}
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
            className={`absolute inset-x-5 top-[calc(100%+0.01rem)] max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain border border-po-on-dark/15 bg-po-ink p-3 shadow-2xl [-webkit-overflow-scrolling:touch] sm:inset-x-8 group-data-[desktop=true]/header:static group-data-[desktop=true]/header:block group-data-[desktop=true]/header:max-h-none group-data-[desktop=true]/header:shrink-0 group-data-[desktop=true]/header:ml-auto group-data-[desktop=true]/header:overflow-visible group-data-[desktop=true]/header:border-0 group-data-[desktop=true]/header:bg-transparent group-data-[desktop=true]/header:p-0 group-data-[desktop=true]/header:shadow-none ${navigationOpen ? "block" : "hidden"}`}
            id="presidential-primary-navigation"
          >
            <ul className="grid group-data-[desktop=true]/header:flex group-data-[desktop=true]/header:items-center group-data-[desktop=true]/header:gap-1 group-data-[desktop=true]/header:whitespace-nowrap">
              {navigationGroups.map((group) => {
                const groupOpen = openGroup === group.id;
                const groupActive = group.items.some(
                  (item) =>
                    pathname === item.href || pathname.startsWith(`${item.href}/`),
                );

                return (
                  <li
                    className="po-primary-nav-item relative"
                    key={group.id}
                    onBlur={(event) => {
                      if (
                        event.relatedTarget instanceof Node &&
                        event.currentTarget.contains(event.relatedTarget)
                      ) {
                        return;
                      }
                      clearGroupTimers();
                      if (pinnedGroupRef.current === group.id) pinnedGroupRef.current = null;
                      focusedGroupRef.current = null;
                      setOpenGroup((current) =>
                        current === group.id ? null : current,
                      );
                    }}
                    onFocus={() => {
                      focusedGroupRef.current = group.id;
                    }}
                    onMouseEnter={() => scheduleGroupOpen(group.id)}
                    onMouseLeave={() => scheduleGroupClose(group.id)}
                  >
                    <button
                      aria-controls={`presidential-nav-${group.id}`}
                      aria-expanded={groupOpen}
                      className={`po-primary-nav-link w-full cursor-pointer items-center justify-between gap-2 border-0 bg-transparent text-left group-data-[desktop=true]/header:justify-center ${groupActive || groupOpen ? "!text-po-brand" : ""}`}
                      onClick={(event) => {
                        clearGroupTimers();
                        activeGroupTriggerRef.current = event.currentTarget;
                        const close = groupOpen && pinnedGroupRef.current === group.id;
                        pinnedGroupRef.current = close ? null : group.id;
                        setOpenGroup(close ? null : group.id);
                      }}
                      type="button"
                    >
                      {group.label}
                      <Chevron open={groupOpen} />
                    </button>

                      <div
                        hidden={!groupOpen}
                        className="relative z-50 mx-3 mb-2 border-l border-po-brand/50 bg-po-ink group-data-[desktop=true]/header:absolute group-data-[desktop=true]/header:left-1/2 group-data-[desktop=true]/header:top-[calc(100%+0.55rem)] group-data-[desktop=true]/header:mx-0 group-data-[desktop=true]/header:mb-0 group-data-[desktop=true]/header:w-56 group-data-[desktop=true]/header:-translate-x-1/2 group-data-[desktop=true]/header:border group-data-[desktop=true]/header:border-po-on-dark/20 group-data-[desktop=true]/header:p-2 group-data-[desktop=true]/header:shadow-2xl"
                        onMouseEnter={keepGroupOpen}
                        id={`presidential-nav-${group.id}`}
                      >
                        <ul aria-label={`${group.label} links`}>
                          {group.items.map((item) => (
                            <li key={item.href}>
                              <Link
                                aria-current={
                                  pathname === item.href ? "page" : undefined
                                }
                                className="block px-4 py-3 font-display text-sm font-semibold uppercase text-po-on-dark-muted transition-colors hover:bg-po-on-dark/5 hover:text-po-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-po-brand aria-[current=page]:text-po-brand"
                                href={item.href}
                                onClick={closeMenus}
                              >
                                {item.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                  </li>
                );
              })}

              <li className="po-primary-nav-item"><Link className="po-primary-nav-link" href="/partners" onClick={closeMenus}>{PARTNERS_LABEL}</Link></li>
              <li className="po-primary-nav-item group-data-[desktop=true]/header:ml-3">
                <Link
                  className="po-header-store-link"
                  href="/find-us"
                  onClick={closeMenus}
                >
                  Find a Store
                </Link>
              </li>

              <li className="po-primary-nav-item group-data-[desktop=true]/header:ml-1">
                <Link
                  aria-label="Open sales login in a new tab"
                  className="po-primary-nav-link"
                  href="/sales"
                  onClick={closeMenus}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Login
                </Link>
              </li>
            </ul>
          </nav>
          <ul aria-hidden="true" inert ref={measureRef} className="po-header-measure">
            {navigationGroups.map((group) => (
              <li key={group.id}>
                <span className="po-primary-nav-link items-center justify-center gap-2">
                  {group.label}<Chevron open={false} />
                </span>
              </li>
            ))}
            <li><span className="po-primary-nav-link">{PARTNERS_LABEL}</span></li>
            <li className="ml-3"><span className="po-header-store-link">Find a Store</span></li>
            <li className="ml-1"><span className="po-primary-nav-link">Login</span></li>
          </ul>
        </div>
        <span
          aria-hidden="true"
          className="po-gold-thread-inlay !absolute inset-x-0 bottom-0 h-0"
        />
      </header>
      {navigationOpen && !desktop ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-30 touch-pan-y bg-transparent"
          data-presidential-mobile-menu-backdrop
          onClick={closeMenus}
        />
      ) : null}
    </>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  return <HeaderNavigation key={pathname} pathname={pathname} />;
}
