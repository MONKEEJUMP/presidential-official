import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

type PageFrameProps = {
  readonly children: ReactNode;
  readonly className?: string;
} & Omit<ComponentPropsWithoutRef<"main">, "children" | "className">;

export function PageFrame({ children, className = "", ...mainProps }: PageFrameProps) {
  const classNames = [
    "min-h-screen bg-po-canvas text-po-ink",
    "selection:bg-po-brand selection:text-po-ink",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <a
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-[60] focus-visible:border focus-visible:border-po-brand focus-visible:bg-po-canvas focus-visible:px-4 focus-visible:py-3 focus-visible:text-sm focus-visible:font-semibold focus-visible:text-po-brand-strong focus-visible:shadow-lg"
        href="#presidential-main"
      >
        Skip to main content
      </a>
      <SiteHeader />
      <main {...mainProps} id="presidential-main" tabIndex={-1} className={classNames}>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
