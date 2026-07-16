"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import type { GemProduct } from "@/lib/gems/gems-manifest";

// 6617-CODE — the product gem ticker: contained black tile under the
// sticky header carrying the 32 catalog brand coins, each linking to its
// product page. Every coin uses the same master-logo P and brand-teal fill.
// Motion is transform-only on a duplicated track for a seamless loop;
// reduced-motion renders a static scrollable row (styles in globals.css).

export type GemTickerProduct = GemProduct & {
  readonly imageAlt?: string;
  readonly imageUrl?: string;
};

type ActivePreview = {
  readonly anchor: HTMLAnchorElement;
  readonly instanceId: string;
  readonly product: GemTickerProduct;
};

const HOVER_INTENT_MS = 150;
const PREVIEW_TRANSITION_MS = 120;
const PREVIEW_GAP_PX = 14;
const VIEWPORT_MARGIN_PX = 12;

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const update = () => setMatches(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export function GemTicker({
  products,
}: {
  readonly products: readonly GemTickerProduct[];
}) {
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [activePreview, setActivePreview] = useState<ActivePreview | null>(null);
  const [positioned, setPositioned] = useState(false);
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLAnchorElement>(null);
  const hoverIntentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = (timer: typeof hoverIntentTimer) => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const closePreview = useCallback(() => {
    clearTimer(hoverIntentTimer);
    clearTimer(closeTimer);
    setVisible(false);
    closeTimer.current = setTimeout(
      () => {
        setActivePreview(null);
        setPositioned(false);
      },
      reducedMotion ? 0 : PREVIEW_TRANSITION_MS,
    );
  }, [reducedMotion]);

  const openPreview = useCallback((preview: ActivePreview) => {
    clearTimer(hoverIntentTimer);
    clearTimer(closeTimer);
    setVisible(false);
    setPositioned(false);
    setActivePreview(preview);
  }, []);

  const schedulePreview = useCallback(
    (preview: ActivePreview) => {
      if (!canHover) return;
      clearTimer(hoverIntentTimer);
      clearTimer(closeTimer);
      hoverIntentTimer.current = setTimeout(
        () => openPreview(preview),
        HOVER_INTENT_MS,
      );
    },
    [canHover, openPreview],
  );

  const keepPreviewOpen = useCallback(() => {
    clearTimer(closeTimer);
    setVisible(true);
  }, []);

  const updatePlacement = useCallback(() => {
    if (!activePreview || !cardRef.current) return;

    const anchorRect = activePreview.anchor.getBoundingClientRect();
    const cardRect = cardRef.current.getBoundingClientRect();
    const preferredTop = anchorRect.top - cardRect.height - PREVIEW_GAP_PX;
    const side = preferredTop >= VIEWPORT_MARGIN_PX ? "above" : "below";
    const top =
      side === "above"
        ? preferredTop
        : anchorRect.bottom + PREVIEW_GAP_PX;
    const idealLeft = anchorRect.left + anchorRect.width / 2 - cardRect.width / 2;
    const left = Math.min(
      Math.max(VIEWPORT_MARGIN_PX, idealLeft),
      window.innerWidth - cardRect.width - VIEWPORT_MARGIN_PX,
    );
    const arrowLeft = Math.min(
      Math.max(20, anchorRect.left + anchorRect.width / 2 - left),
      cardRect.width - 20,
    );

    cardRef.current.style.left = `${left}px`;
    cardRef.current.style.top = `${top}px`;
    cardRef.current.style.visibility = "visible";
    cardRef.current.style.setProperty(
      "--po-gem-preview-arrow-left",
      `${arrowLeft}px`,
    );
    cardRef.current.dataset.side = side;
    setPositioned(true);
  }, [activePreview]);

  useLayoutEffect(() => {
    if (!activePreview) return;
    updatePlacement();
  }, [activePreview, updatePlacement]);

  useEffect(() => {
    if (!positioned) return;
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [positioned]);

  useEffect(() => {
    if (!activePreview) return;
    const reposition = () => updatePlacement();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [activePreview, updatePlacement]);

  useEffect(() => {
    if (!activePreview) return;
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePreview();
    };
    window.addEventListener("keydown", dismissOnEscape);
    return () => window.removeEventListener("keydown", dismissOnEscape);
  }, [activePreview, closePreview]);

  useEffect(
    () => () => {
      clearTimer(hoverIntentTimer);
      clearTimer(closeTimer);
    },
    [],
  );

  return (
    <div className="po-home-canvas-surface px-6 pt-10">
      <div className="po-gem-band mx-auto flex h-[101px] w-full max-w-[1392px] items-center overflow-hidden rounded-[20px] bg-[#0A0A0A]">
        <div className="po-gem-track flex w-max items-center">
          {[false, true].map((clone) => (
            <ul
              aria-hidden={clone || undefined}
              className={`flex items-center gap-[28px] pr-[28px] ${clone ? "po-gem-clone" : ""}`}
              key={String(clone)}
            >
              {products.map((gem) => {
                const instanceId = `${clone ? "clone" : "primary"}-${gem.slug}`;
                const previewId = `gem-preview-${instanceId}`;

                return (
                <li className="shrink-0" key={gem.slug}>
                  <Link
                    aria-describedby={
                      activePreview?.instanceId === instanceId
                        ? previewId
                        : undefined
                    }
                    className="po-gem flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-[12px] border-2 border-po-on-dark/[0.92] transition-transform duration-200 hover:scale-[1.15] focus-visible:scale-[1.15] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-po-brand motion-reduce:transition-none motion-reduce:hover:transform-none motion-reduce:focus-visible:transform-none"
                    href={gem.href}
                    onBlur={closePreview}
                    onFocus={(event) => {
                      if (
                        canHover &&
                        event.currentTarget.matches(":focus-visible")
                      ) {
                        openPreview({
                          anchor: event.currentTarget,
                          instanceId,
                          product: gem,
                        });
                      }
                    }}
                    onMouseEnter={(event) =>
                      schedulePreview({
                        anchor: event.currentTarget,
                        instanceId,
                        product: gem,
                      })
                    }
                    onMouseLeave={closePreview}
                    prefetch={false}
                    tabIndex={clone ? -1 : undefined}
                  >
                    <Image
                      alt=""
                      aria-hidden="true"
                      className="po-gem-mark h-[55%] w-[55%] object-contain"
                      height={747}
                      src="/media/gems/presidential-p.png"
                      width={422}
                    />
                    <span className="sr-only">{gem.name}</span>
                  </Link>
                </li>
                );
              })}
            </ul>
          ))}
        </div>
      </div>
      {activePreview && canHover
        ? createPortal(
            <Link
              aria-hidden={!visible}
              aria-label={`View ${activePreview.product.name}`}
              className={`po-gem-preview fixed z-[100] w-[min(300px,calc(100vw-24px))] rounded-[16px] border border-po-brand bg-po-ink p-3 text-po-on-dark shadow-[0_18px_45px_rgba(0,0,0,0.36)] ${visible ? "po-gem-preview-visible" : ""}`}
              href={activePreview.product.href}
              id={`gem-preview-${activePreview.instanceId}`}
              onBlur={closePreview}
              onFocus={keepPreviewOpen}
              onMouseEnter={keepPreviewOpen}
              onMouseLeave={closePreview}
              prefetch={false}
              ref={cardRef}
              tabIndex={visible ? 0 : -1}
            >
              <span
                aria-hidden="true"
                className="po-gem-preview-arrow absolute h-3 w-3 rotate-45 border-po-brand bg-po-ink"
              />
              <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] bg-white">
                {activePreview.product.imageUrl ? (
                  <Image
                    alt={
                      activePreview.product.imageAlt ||
                      `${activePreview.product.name} product packaging`
                    }
                    className="object-contain p-3"
                    fill
                    loading="lazy"
                    sizes="300px"
                    src={activePreview.product.imageUrl}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-po-canvas">
                    <Image
                      alt=""
                      aria-hidden="true"
                      className="h-auto w-2/3 object-contain opacity-15 grayscale"
                      height={502}
                      loading="lazy"
                      src="/brand/presidential-logo.webp"
                      width={797}
                    />
                  </div>
                )}
              </div>
              <p className="mt-3 font-display text-lg font-bold uppercase leading-tight">
                {activePreview.product.name}
              </p>
            </Link>,
            document.body,
          )
        : null}
    </div>
  );
}
