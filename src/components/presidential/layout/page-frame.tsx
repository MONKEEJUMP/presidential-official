import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { SiteHeader } from "./site-header";

type PageFrameProps = {
  readonly children: ReactNode;
  readonly className?: string;
} & Omit<ComponentPropsWithoutRef<"main">, "children" | "className">;

export function PageFrame({ children, className = "", ...mainProps }: PageFrameProps) {
  const classNames = [
    "min-h-screen bg-white text-zinc-950",
    "selection:bg-emerald-900 selection:text-white",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <SiteHeader />
      <main className={classNames} {...mainProps}>
        {children}
      </main>
    </>
  );
}
