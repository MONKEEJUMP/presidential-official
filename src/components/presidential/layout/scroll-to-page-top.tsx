"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

export function ScrollToPageTop() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (window.location.hash) return;

    const previousRestoration = window.history.scrollRestoration;
    const reset = () => {
      if (!window.location.hash) window.scrollTo(0, 0);
    };

    window.history.scrollRestoration = "manual";
    reset();
    const frame = window.requestAnimationFrame(reset);
    window.addEventListener("pageshow", reset);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pageshow", reset);
      window.history.scrollRestoration = previousRestoration;
    };
  }, [pathname]);

  return null;
}
