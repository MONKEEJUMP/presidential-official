"use client";

import type { MouseEventHandler } from "react";

const STATES_MAP_ID = "presidential-states-map";

export function FindPresidentialScrollTile() {
  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const target = document.getElementById(STATES_MAP_ID);
    if (!target) {
      return;
    }

    event.preventDefault();
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    target.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    window.history.pushState(null, "", `#${STATES_MAP_ID}`);
  };

  return (
    <a
      className="po-teal-pinstripe group flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-[20px] bg-po-ink p-6 text-center text-po-on-dark [container-type:inline-size] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-po-brand lg:min-h-0"
      href={`#${STATES_MAP_ID}`}
      onClick={handleClick}
    >
      <span
        aria-hidden="true"
        className="po-brand-mark block aspect-[1200/929] w-[55cqi] max-w-full shrink-0 bg-contain bg-center bg-no-repeat"
      />
      <span className="mt-[clamp(0.25rem,1.5cqi,0.5rem)] font-display text-[clamp(1.5rem,12.5cqi,2.75rem)] uppercase leading-none text-po-brand transition-colors group-hover:text-po-on-dark">
        <span className="block">Find</span>
        <span className="block">Presidential</span>
      </span>
      <span className="mt-[clamp(0.2rem,1cqi,0.375rem)] font-display text-[clamp(0.625rem,4cqi,0.875rem)] uppercase leading-none tracking-[0.18em] text-po-on-dark">
        Click here
      </span>
    </a>
  );
}
