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
  note = "Visual asset will appear as materials are finalized.",
}: MediaSlotProps) {
  const policy = getPlaceholderPolicy(kind);

  if (!policy.allowedNow) {
    throw new Error(`Placeholder kind is not allowed for internal Step 9F use: ${kind}`);
  }

  const classNames = [
    "relative overflow-hidden border border-dashed border-zinc-300 bg-zinc-50 text-zinc-700",
    aspectClassName,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <figure className={classNames}>
      <div className="flex h-full min-h-48 items-center justify-center p-6 text-center">
        <figcaption className="max-w-sm text-sm leading-6">
          <span className="block font-semibold text-zinc-900">{label}</span>
          <span className="mt-2 block">{note}</span>
          {children ? <span className="mt-3 block">{children}</span> : null}
        </figcaption>
      </div>
    </figure>
  );
}
