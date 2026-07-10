import Link from "next/link";
import type { ReactNode } from "react";

import { getRouteByPath } from "@/lib/seo/route-helpers";
import type { SeoRoutePath } from "@/lib/seo/route-types";

type CtaLinkVariant = "primary" | "secondary" | "contrast" | "text";

type CtaLinkProps = {
  readonly href: SeoRoutePath;
  readonly children: ReactNode;
  readonly variant?: CtaLinkVariant;
  readonly className?: string;
  readonly "aria-label"?: string;
};

const variantClasses = {
  primary:
    "border border-po-brand bg-po-brand text-po-ink hover:bg-po-brand-hover",
  secondary:
    "border border-po-subtle text-po-ink hover:border-po-brand hover:text-po-brand-ink",
  contrast:
    "border border-po-on-dark/30 text-po-on-dark hover:border-po-gold hover:text-po-gold",
  text: "text-po-brand-ink underline-offset-4 hover:underline",
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
    "inline-flex items-center justify-center text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-po-brand",
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
