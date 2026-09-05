import Image from "next/image";
import Link from "next/link";

import type { LocatorStateCode } from "@/lib/locator/types";

export type CinematicStateWallState = {
  readonly code: LocatorStateCode;
  readonly name: string;
  readonly tagline: string;
  readonly path: string;
  readonly imageSrc: string;
  readonly doorCount: number | null;
};

export type CinematicStateWallProps = {
  readonly states: readonly CinematicStateWallState[];
};

export function CinematicStateWall({ states }: CinematicStateWallProps) {
  return (
    <section
      aria-label="Presidential state destinations"
      className="relative w-full bg-po-ink"
    >
      {states.map((state, index) => {
        const isLive = state.doorCount !== null && state.doorCount > 0;
        const titleId = `cinematic-state-${state.code.toLowerCase()}-${index}`;

        return (
          <article
            aria-labelledby={titleId}
            className="po-gold-thread-inlay relative isolate flex min-h-[32rem] w-full overflow-hidden bg-po-ink text-po-on-dark sm:min-h-[38rem] lg:min-h-[44rem]"
            key={`${state.code}-${state.path}`}
          >
            <Image
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-center"
              fill
              priority={index === 0}
              sizes="100vw"
              src={state.imageSrc}
            />

            <div
              aria-hidden="true"
              className="po-cinematic-state-scrim absolute inset-0"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-3/5 bg-[linear-gradient(0deg,rgba(0,0,0,0.94)_0%,rgba(0,0,0,0.68)_42%,transparent_100%)]"
            />

            <div className="relative z-10 mx-auto flex w-full max-w-[80rem] items-end px-5 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-16">
              <div className="w-full max-w-4xl">
                <p className="font-display text-sm font-bold uppercase text-po-gold">
                  Presidential / {state.code}
                </p>
                <h2
                  className="mt-3 break-words font-display text-5xl font-bold uppercase leading-none text-po-on-dark sm:text-7xl lg:text-8xl"
                  id={titleId}
                >
                  {state.name}
                </h2>
                <p className="mt-5 max-w-2xl font-display text-lg uppercase leading-tight text-po-on-dark sm:text-2xl">
                  {state.tagline}
                </p>

                <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
                  <p className="font-display text-base font-bold uppercase text-po-gold">
                    {isLive
                      ? `${state.doorCount} DOORS`
                      : state.doorCount === 0
                        ? "LANDING SOON"
                        : "STATUS UNAVAILABLE"}
                  </p>

                  {isLive ? (
                    <Link
                      aria-label={`Explore Presidential in ${state.name}`}
                      className="inline-flex min-h-11 items-center justify-center border border-po-gold bg-po-ink/90 px-5 py-3 font-display text-sm font-bold uppercase text-po-on-dark hover:bg-po-gold hover:text-po-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-po-gold"
                      href={state.path}
                    >
                      Explore {state.name}
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </article>
        );
      })}

      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 z-20 h-[3px] bg-[var(--po-gold-thread-inlay)]"
      />
    </section>
  );
}
