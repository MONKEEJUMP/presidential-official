import Image from "next/image";
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
  readonly backgroundImagePath?: `/${string}`;
  readonly backgroundPosition?: string;
  readonly note?: string;
};

const backgroundPositionClasses: Readonly<Record<string, string>> = {
  bottom: "object-bottom",
  center: "object-center",
  "center bottom": "object-bottom",
  "center top": "object-top",
  left: "object-left",
  "left bottom": "object-left-bottom",
  "left center": "object-left",
  "left top": "object-left-top",
  right: "object-right",
  "right bottom": "object-right-bottom",
  "right center": "object-right",
  "right top": "object-right-top",
  top: "object-top",
  "top center": "object-top",
  "top left": "object-left-top",
  "top right": "object-right-top",
  "bottom center": "object-bottom",
  "bottom left": "object-left-bottom",
  "bottom right": "object-right-bottom",
};

export function MediaSlot({
  kind = "neutral_aspect_ratio_box",
  label,
  children,
  aspectClassName = "aspect-video",
  className = "",
  backgroundImagePath,
  backgroundPosition = "center",
  note = "Presidential product and campaign media.",
}: MediaSlotProps) {
  const policy = getPlaceholderPolicy(kind);

  if (!policy.allowedNow) {
    throw new Error(`Placeholder kind is not allowed for internal Step 9F use: ${kind}`);
  }

  const classNames = [
    "relative overflow-hidden border border-po-line bg-po-ink text-po-on-dark",
    aspectClassName,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const backgroundPositionClass =
    backgroundPositionClasses[backgroundPosition.trim().toLowerCase()] ||
    "object-center";

  return (
    <figure className={classNames}>
      <div
        aria-hidden="true"
        className="absolute inset-0"
      >
        {backgroundImagePath ? (
          <>
            <Image
              alt=""
              aria-hidden="true"
              className={`object-cover ${backgroundPositionClass}`}
              fill
              sizes="100vw"
              src={backgroundImagePath}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--po-color-ink)_16%,transparent),color-mix(in_srgb,var(--po-color-ink)_72%,transparent))]" />
            <div className="absolute inset-0 bg-po-brand-strong/20" />
          </>
        ) : (
          <>
            <div className="absolute inset-x-0 top-0 h-1 bg-po-gold" />
            <div className="absolute left-8 top-8 h-28 w-20 border border-po-gold bg-po-canvas/10" />
            <div className="absolute bottom-8 right-8 h-32 w-24 border border-po-brand-line bg-po-brand-soft" />
            <div className="absolute left-1/3 top-1/4 h-40 w-px rotate-12 bg-po-canvas/20" />
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-po-canvas/10" />
          </>
        )}
      </div>
      <div className="relative z-10 flex h-full min-h-48 items-end p-6 text-left">
        <figcaption className="max-w-sm text-sm leading-6">
          <span className="block text-xs font-semibold uppercase tracking-normal text-po-gold">
            {label}
          </span>
          <span className="mt-2 block text-base font-semibold text-po-on-dark">
            {note}
          </span>
          {children ? <span className="mt-3 block text-po-on-dark-muted">{children}</span> : null}
        </figcaption>
      </div>
    </figure>
  );
}
