import type { CSSProperties, ReactNode } from "react";

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
  const backgroundStyle = backgroundImagePath
    ? ({
        backgroundImage: `linear-gradient(180deg, color-mix(in srgb, var(--po-color-ink) 16%, transparent), color-mix(in srgb, var(--po-color-ink) 72%, transparent)), url("${backgroundImagePath}")`,
        backgroundPosition,
      } satisfies CSSProperties)
    : undefined;

  return (
    <figure className={classNames}>
      <div
        aria-hidden="true"
        className={[
          "absolute inset-0",
          backgroundImagePath ? "bg-cover bg-no-repeat" : "",
        ].filter(Boolean).join(" ")}
        style={backgroundStyle}
      >
        {backgroundImagePath ? (
          <div className="absolute inset-0 bg-po-brand-strong/20" />
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
