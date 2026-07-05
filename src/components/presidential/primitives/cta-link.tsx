import Link from "next/link";
import type { ReactNode } from "react";

import { getRouteByPath } from "@/lib/seo/route-helpers";
import type { SeoRoutePath } from "@/lib/seo/route-types";

type CtaLinkVariant = "primary" | "secondary" | "text";

type CtaLinkProps = {
  readonly href: SeoRoutePath;
  readonly children: ReactNode;
  readonly variant?: CtaLinkVariant;
  readonly className?: string;
  readonly "aria-label"?: string;
};

const variantClasses = {
  primary:
    "border border-emerald-900 bg-emerald-900 text-white hover:bg-emerald-800",
  secondary:
    "border border-zinc-300 text-zinc-900 hover:border-emerald-900 hover:text-emerald-900",
  text: "text-emerald-900 underline-offset-4 hover:underline",
} as const satisfies Record<CtaLinkVariant, string>;

export function CtaLink({
  href,
  children,
  variant = "secondary",
  className = "",
  "aria-label": ariaLabel,
}: CtaLinkProps) {
  const route = getRouteByPath(href);

  if (!route) {
    throw new Error(`CTA target is not represented in the Presidential route registry: ${href}`);
  }

  const classNames = [
    "inline-flex items-center justify-center text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900",
    variant === "text" ? "px-0 py-0" : "px-4 py-3",
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link aria-label={ariaLabel} className={classNames} href={href}>
      {children}
    </Link>
  );
}
