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
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:border focus:border-po-brand focus:bg-po-canvas focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-po-brand-strong focus:shadow-lg"
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
