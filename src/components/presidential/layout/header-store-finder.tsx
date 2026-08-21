"use client";

import { useEffect, useId, useRef, useState } from "react";

import {
  CompactStoreFinderPanel,
  LocationPin,
} from "../locator/compact-store-finder-panel";

type HeaderStoreFinderProps = {
  readonly onRoute?: () => void;
};

const HOVER_INTENT_MS = 150;
const HOVER_CLOSE_DELAY_MS = 180;

export function HeaderStoreFinder({ onRoute }: HeaderStoreFinderProps) {
  const panelId = useId();
  const rootRef = useRef<HTMLLIElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const focusInputOnOpenRef = useRef(false);
  const panelOwnsFocusRef = useRef(false);
  const hoverOpenTimer = useRef<number | null>(null);
  const hoverCloseTimer = useRef<number | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const focusFrame = focusInputOnOpenRef.current
      ? window.requestAnimationFrame(() =>
          panelRef.current?.querySelector<HTMLInputElement>("input")?.focus(),
        )
      : null;
    const dismissOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        panelOwnsFocusRef.current = false;
        setOpen(false);
      }
    };
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      panelOwnsFocusRef.current = false;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", dismissOutside);
    window.addEventListener("keydown", dismissOnEscape);
    return () => {
      if (focusFrame !== null) window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("pointerdown", dismissOutside);
      window.removeEventListener("keydown", dismissOnEscape);
    };
  }, [open]);

  useEffect(
    () => () => {
      if (hoverOpenTimer.current) window.clearTimeout(hoverOpenTimer.current);
      if (hoverCloseTimer.current) window.clearTimeout(hoverCloseTimer.current);
    },
    [],
  );

  function canHover() {
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }

  function keepHoverOpen() {
    if (hoverCloseTimer.current) {
      window.clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = null;
    }
  }

  function scheduleHoverOpen() {
    if (!canHover()) return;
    keepHoverOpen();
    if (hoverOpenTimer.current) window.clearTimeout(hoverOpenTimer.current);
    hoverOpenTimer.current = window.setTimeout(() => {
      hoverOpenTimer.current = null;
      focusInputOnOpenRef.current = false;
      setOpen(true);
    }, HOVER_INTENT_MS);
  }

  function scheduleHoverClose() {
    if (!canHover()) return;
    if (panelOwnsFocusRef.current) return;
    if (hoverOpenTimer.current) {
      window.clearTimeout(hoverOpenTimer.current);
      hoverOpenTimer.current = null;
    }
    if (hoverCloseTimer.current) window.clearTimeout(hoverCloseTimer.current);
    hoverCloseTimer.current = window.setTimeout(() => {
      hoverCloseTimer.current = null;
      if (panelOwnsFocusRef.current) return;
      setOpen(false);
    }, HOVER_CLOSE_DELAY_MS);
  }

  function closeForRoute() {
    panelOwnsFocusRef.current = false;
    setOpen(false);
    onRoute?.();
  }

  return (
    <li
      className="po-primary-nav-item relative z-30 min-[1100px]:ml-6"
      onMouseEnter={keepHoverOpen}
      onMouseLeave={scheduleHoverClose}
      ref={rootRef}
    >
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-po-brand px-3 py-2 font-display text-[0.75rem] font-semibold uppercase text-[#04342c] transition-colors hover:bg-po-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-po-brand min-[1100px]:h-[2.3125rem] min-[1100px]:w-auto min-[1100px]:px-[clamp(0.65rem,0.8vw,0.85rem)] min-[1100px]:py-0"
        onMouseEnter={scheduleHoverOpen}
        onClick={() => {
          if (hoverOpenTimer.current) {
            window.clearTimeout(hoverOpenTimer.current);
            hoverOpenTimer.current = null;
          }
          keepHoverOpen();
          panelOwnsFocusRef.current = false;
          focusInputOnOpenRef.current = !open;
          setOpen((current) => !current);
        }}
        ref={triggerRef}
        type="button"
      >
        <LocationPin className="h-4 w-4 shrink-0" />
        Find a Store
      </button>

      {open ? (
        <div
          className="absolute inset-x-0 top-[calc(100%+0.25rem)] z-50 before:absolute before:-top-1 before:inset-x-0 before:h-1 before:content-[''] min-[1100px]:left-auto min-[1100px]:right-0 min-[1100px]:w-96"
          onMouseEnter={keepHoverOpen}
          id={panelId}
          role="dialog"
        >
          <div
            onFocus={() => {
              panelOwnsFocusRef.current = true;
              keepHoverOpen();
            }}
            ref={panelRef}
          >
            <CompactStoreFinderPanel onRoute={closeForRoute} />
          </div>
        </div>
      ) : null}
    </li>
  );
}
