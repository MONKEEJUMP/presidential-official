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
      <SiteHeader />
      <main {...mainProps} id="presidential-main" tabIndex={-1} className={classNames}>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
