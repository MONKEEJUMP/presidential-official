import Link from "next/link";
import type { ReactNode } from "react";

import type { SeoRoutePath } from "@/lib/seo/route-types";

import { CtaLink } from "../primitives/cta-link";

type HeroBreadcrumb = {
  readonly name: string;
  readonly path: string;
};

type HeroCta = {
  readonly href: SeoRoutePath;
  readonly label: ReactNode;
  readonly tone: "primary" | "secondary";
};

type DispensariesStyleHeroProps = {
  readonly afterContent?: ReactNode;
  readonly ariaLabelledBy: string;
  readonly breadcrumbs: readonly HeroBreadcrumb[];
  readonly eyebrow: ReactNode;
  readonly leadMedia?: ReactNode;
  readonly title: ReactNode;
  readonly supportingText: readonly ReactNode[];
  readonly ctas?: readonly HeroCta[];
  readonly fitLongTitle?: boolean;
  readonly mediaOnly?: boolean;
};

export function DispensariesStyleHero({
  afterContent,
  ariaLabelledBy,
  breadcrumbs,
  eyebrow,
  leadMedia,
  title,
  supportingText,
  ctas = [],
  fitLongTitle = false,
  mediaOnly = false,
}: DispensariesStyleHeroProps) {
  return (
    <section
      aria-labelledby={ariaLabelledBy}
      className="relative isolate overflow-hidden bg-po-ink text-po-on-dark [container-type:inline-size]"
    >
      <div
        className={`mx-auto w-full max-w-[80rem] px-[clamp(1.25rem,4vw,4rem)] pt-[clamp(3rem,8vw,7rem)] ${mediaOnly ? "pb-[clamp(2rem,4vw,3rem)]" : "pb-[clamp(3rem,7vw,6rem)]"}`}
      >
        <nav
          aria-label="Breadcrumb"
          className={`${mediaOnly ? "mb-[clamp(2rem,4vw,3rem)]" : "mb-16"} font-display text-[0.78rem] uppercase text-po-on-dark-muted`}
        >
          <ol className="flex flex-wrap items-center gap-2.5">
            {breadcrumbs.map((breadcrumb, index) => {
              const isCurrent = index === breadcrumbs.length - 1;

              return (
                <li className="flex items-center gap-2.5" key={breadcrumb.path}>
                  {index > 0 ? (
                    <span aria-hidden="true" className="text-po-on-dark-muted">
                      /
                    </span>
                  ) : null}
                  {isCurrent ? (
                    <span aria-current="page" className="font-semibold text-po-on-dark">
                      {breadcrumb.name}
                    </span>
                  ) : (
                    <Link
                      className="font-semibold text-po-brand underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-po-brand"
                      href={breadcrumb.path}
                    >
                      {breadcrumb.name}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {leadMedia ? (
          <div className={mediaOnly ? "w-full" : "mb-16 w-full"}>{leadMedia}</div>
        ) : null}

        {mediaOnly ? (
          <h1 className="sr-only" id={ariaLabelledBy}>
            {title}
          </h1>
        ) : (
          <>
            <p className="mb-4 font-display text-[0.85rem] font-bold uppercase text-po-brand">
              {eyebrow}
            </p>
            <h1
              className={
                fitLongTitle
                  ? "max-w-[12ch] font-display text-[clamp(2.25rem,10cqi,8.5rem)] font-bold uppercase leading-[0.82] text-po-on-dark"
                  : "max-w-[12ch] font-display text-[clamp(3.25rem,10cqi,8.5rem)] font-bold uppercase leading-[0.82] text-po-on-dark"
              }
              id={ariaLabelledBy}
            >
              {title}
            </h1>

            <div className="mt-8 max-w-[46rem] space-y-4 font-sans text-[clamp(1.05rem,2vw,1.35rem)] leading-[1.55] text-po-on-dark-muted">
              {supportingText.map((content, index) => (
                <p key={index}>{content}</p>
              ))}
            </div>

            {ctas.length > 0 ? (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {ctas.map((cta) => (
                  <CtaLink
                    className={
                      cta.tone === "primary"
                        ? "border-po-brand bg-po-brand text-po-ink hover:bg-po-brand-hover hover:text-po-ink"
                        : "!border-po-brand !bg-transparent !text-po-brand hover:!bg-po-brand hover:!text-po-ink"
                    }
                    href={cta.href}
                    key={cta.href}
                    variant={cta.tone}
                  >
                    {cta.label}
                  </CtaLink>
                ))}
              </div>
            ) : null}

            {afterContent ? <div className="mt-8">{afterContent}</div> : null}
          </>
        )}
      </div>

      <span
        aria-hidden="true"
        className="po-gold-thread-inlay absolute inset-x-0 bottom-0 h-0"
      />
    </section>
  );
}
