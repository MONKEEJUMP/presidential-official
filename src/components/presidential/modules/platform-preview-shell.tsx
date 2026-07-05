import type { SeoRoutePath } from "@/lib/seo/route-types";

import { MediaSlot } from "../media/media-slot";
import { CtaLink } from "../primitives/cta-link";

export type PlatformPreviewShellProps = {
  readonly title: string;
  readonly description: string;
  readonly href: SeoRoutePath;
  readonly ctaLabel?: string;
};

export function PlatformPreviewShell({
  title,
  description,
  href,
  ctaLabel,
}: PlatformPreviewShellProps) {
  return (
    <article className="grid gap-5 border border-zinc-200 bg-white p-5 shadow-sm">
      <MediaSlot
        aspectClassName="aspect-[16/10]"
        kind="product_visual_placeholder"
        label={`${title} platform`}
        note="Official Presidential product lane"
      />
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-xl font-semibold leading-snug text-zinc-950">
            {title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-zinc-700">{description}</p>
        </div>
        <p className="text-xs font-medium uppercase tracking-normal text-zinc-500">
          For adults 21+ where legal
        </p>
        <CtaLink href={href} variant="secondary">
          {ctaLabel ?? `Explore ${title}`}
        </CtaLink>
      </div>
    </article>
  );
}
