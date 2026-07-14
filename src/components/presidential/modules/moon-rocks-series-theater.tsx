"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

type MoonRocksTheaterProduct = {
  readonly id: string;
  readonly name: string;
  readonly href: string;
};

export type MoonRocksTheaterSeries = {
  readonly id: "silver" | "gold" | "rose-gold";
  readonly label: "Silver" | "Gold" | "Rose Gold";
  readonly products: readonly MoonRocksTheaterProduct[];
};

function motionIsReduced(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function MoonRocksSeriesTheater({
  series,
}: {
  readonly series: readonly MoonRocksTheaterSeries[];
}) {
  const initialSeries = series.find((item) => item.id === "silver") || series[0];
  const [selectedId, setSelectedId] = useState(initialSeries?.id || "silver");
  const [displayedSeries, setDisplayedSeries] =
    useState<MoonRocksTheaterSeries | undefined>(initialSeries);
  const [screenVisible, setScreenVisible] = useState(true);
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(
    () => () => {
      if (swapTimer.current) clearTimeout(swapTimer.current);
    },
    [],
  );

  const selectSeries = (nextSeries: MoonRocksTheaterSeries) => {
    if (nextSeries.id === selectedId) return;
    setSelectedId(nextSeries.id);

    if (swapTimer.current) clearTimeout(swapTimer.current);
    if (motionIsReduced()) {
      setDisplayedSeries(nextSeries);
      setScreenVisible(true);
      return;
    }

    setScreenVisible(false);
    swapTimer.current = setTimeout(() => {
      setDisplayedSeries(nextSeries);
      requestAnimationFrame(() => setScreenVisible(true));
    }, 75);
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    let nextIndex: number | undefined;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % series.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + series.length) % series.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = series.length - 1;
    }

    if (nextIndex === undefined) {
      return;
    }

    const nextSeries = series[nextIndex];

    if (!nextSeries) {
      return;
    }

    event.preventDefault();
    tabRefs.current[nextIndex]?.focus();
    selectSeries(nextSeries);
  };

  return (
    <>
      <div className="flex flex-col rounded-[20px] bg-po-brand p-6 text-po-ink lg:col-start-3 lg:row-span-3 lg:row-start-2">
        <div className="flex items-start justify-between">
          <Link
            className="font-display text-[25px] uppercase leading-none transition-colors hover:text-po-canvas"
            href="/moon-rocks"
          >
            Moon Rocks
          </Link>
        </div>

        <div
          aria-labelledby={`moon-rocks-series-tab-${selectedId}`}
          aria-live="polite"
          className={`relative mt-5 h-[clamp(22rem,100vw,38rem)] flex-none overflow-hidden rounded-[16px] bg-po-ink [container-type:inline-size] transition-opacity duration-150 motion-reduce:transition-none lg:h-auto lg:min-h-0 lg:flex-1 ${
            screenVisible ? "opacity-100" : "opacity-0"
          }`}
          id="moon-rocks-series-screen"
          role="tabpanel"
        >
          <nav
            aria-label={`${displayedSeries?.label || "Moon Rocks"} products`}
            className="absolute inset-0 z-20 overflow-y-auto p-[clamp(0.75rem,4cqi,1.5rem)] [mask-image:linear-gradient(to_bottom,black_0%,black_calc(100%_-_40px),transparent_100%)] [scrollbar-width:none] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_calc(100%_-_40px),transparent_100%)] [&::-webkit-scrollbar]:hidden"
            data-moon-rocks-product-scroll
          >
            <ul className="pb-10">
              {(displayedSeries?.products || []).map((product) => (
                <li
                  className="border-t border-po-on-dark/20 first:border-t-0"
                  key={product.id}
                >
                  <Link
                    className="block min-h-11 py-[clamp(0.625rem,3cqi,0.875rem)] font-display text-[clamp(0.8125rem,3.7cqi,1rem)] uppercase leading-tight text-po-on-dark transition-colors hover:text-po-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-po-brand"
                    href={product.href}
                    onFocus={(event) => {
                      const scroller = event.currentTarget.closest<HTMLElement>(
                        "[data-moon-rocks-product-scroll]",
                      );
                      if (!scroller) return;

                      const scrollerRect = scroller.getBoundingClientRect();
                      const linkRect = event.currentTarget.getBoundingClientRect();
                      const fadeBoundary = scrollerRect.bottom - 40;

                      if (linkRect.bottom > fadeBoundary) {
                        scroller.scrollTop += linkRect.bottom - fadeBoundary;
                      } else if (linkRect.top < scrollerRect.top) {
                        scroller.scrollTop -= scrollerRect.top - linkRect.top;
                      }
                    }}
                  >
                    {product.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <div className="flex items-center rounded-[20px] bg-po-brand px-6 py-6 [container-type:inline-size] lg:col-start-3 lg:row-start-1 lg:py-0">
        <div
          aria-label="Moon Rocks series"
          className="grid w-full grid-cols-3 gap-[4cqi]"
          role="tablist"
        >
          {series.map((item, index) => {
            const active = selectedId === item.id;
            return (
              <button
                aria-controls="moon-rocks-series-screen"
                aria-selected={active}
                className={`flex h-[16cqi] items-center justify-center rounded-[12px] border font-display text-[clamp(0.75rem,4cqi,1rem)] uppercase transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-po-ink ${
                  active
                    ? "border-po-ink/20 bg-po-brand text-po-ink"
                    : "border-transparent bg-po-ink text-po-on-dark"
                }`}
                id={`moon-rocks-series-tab-${item.id}`}
                key={item.id}
                onClick={() => selectSeries(item)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                ref={(button) => {
                  tabRefs.current[index] = button;
                }}
                role="tab"
                tabIndex={active ? 0 : -1}
                type="button"
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
