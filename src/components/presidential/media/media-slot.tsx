import type { ReactNode } from "react";

import {
  getPlaceholderPolicy,
  type PlaceholderKind,
} from "@/lib/design-system/placeholder-policy";

type MediaSlotProps = {
  readonly kind?: PlaceholderKind;
  readonly label: string;
  readonly children?: ReactNode;
  readonly aspectClassName?: string;
  readonly className?: string;
  readonly note?: string;
};

export function MediaSlot({
  kind = "neutral_aspect_ratio_box",
  label,
  children,
  aspectClassName = "aspect-video",
  className = "",
  note = "Presidential product and campaign media.",
}: MediaSlotProps) {
  const policy = getPlaceholderPolicy(kind);

  if (!policy.allowedNow) {
    throw new Error(`Placeholder kind is not allowed for internal Step 9F use: ${kind}`);
  }

  const classNames = [
    "relative overflow-hidden border border-po-line bg-po-ink text-white",
    aspectClassName,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <figure className={classNames}>
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-1 bg-po-gold" />
        <div className="absolute left-8 top-8 h-28 w-20 border border-po-gold bg-po-canvas/10" />
        <div className="absolute bottom-8 right-8 h-32 w-24 border border-po-brand-line bg-po-brand-soft" />
        <div className="absolute left-1/3 top-1/4 h-40 w-px rotate-12 bg-po-canvas/20" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-po-canvas/10" />
      </div>
      <div className="relative z-10 flex h-full min-h-48 items-end p-6 text-left">
        <figcaption className="max-w-sm text-sm leading-6">
          <span className="block text-xs font-semibold uppercase tracking-normal text-po-gold">
            {label}
          </span>
          <span className="mt-2 block text-base font-semibold text-white">
            {note}
          </span>
          {children ? <span className="mt-3 block text-po-on-dark-muted">{children}</span> : null}
        </figcaption>
      </div>
    </figure>
  );
}
