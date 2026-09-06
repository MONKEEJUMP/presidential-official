import Image from "next/image";
import Link from "next/link";

import { Scene } from "../layout/scene";

type VapeVisualRoute = "vapes" | "moon-pods" | "orbit";

type ModelVisual = {
  readonly extract: "Liquid Diamonds" | "Live Resin" | "Live Rosin";
  readonly finish: "Black" | "Silver" | "Teal" | "White";
  readonly src: string;
};

const modelVisuals: readonly ModelVisual[] = [
  { extract: "Liquid Diamonds", finish: "Black", src: "/media/vapes/orbit-model-ld-black.webp" },
  { extract: "Liquid Diamonds", finish: "Silver", src: "/media/vapes/orbit-model-ld-silver.webp" },
  { extract: "Liquid Diamonds", finish: "Teal", src: "/media/vapes/orbit-model-ld-teal.webp" },
  { extract: "Liquid Diamonds", finish: "White", src: "/media/vapes/orbit-model-ld-white.webp" },
  { extract: "Live Resin", finish: "Black", src: "/media/vapes/orbit-model-lre-black.webp" },
  { extract: "Live Resin", finish: "Silver", src: "/media/vapes/orbit-model-lre-silver.webp" },
  { extract: "Live Resin", finish: "Teal", src: "/media/vapes/orbit-model-lre-teal.webp" },
  { extract: "Live Resin", finish: "White", src: "/media/vapes/orbit-model-lre-white.webp" },
  { extract: "Live Rosin", finish: "Black", src: "/media/vapes/orbit-model-lro-black.webp" },
  { extract: "Live Rosin", finish: "Silver", src: "/media/vapes/orbit-model-lro-silver.webp" },
  { extract: "Live Rosin", finish: "Teal", src: "/media/vapes/orbit-model-lro-teal.webp" },
  { extract: "Live Rosin", finish: "White", src: "/media/vapes/orbit-model-lro-white.webp" },
] as const;

const frontVisuals = [
  { finish: "Black", src: "/media/vapes/orbit-photo-black-front.webp" },
  { finish: "Silver", src: "/media/vapes/orbit-photo-silver-front.webp" },
  { finish: "Teal", src: "/media/vapes/orbit-photo-teal-front.webp" },
  { finish: "White", src: "/media/vapes/orbit-photo-white-front.webp" },
] as const;

const detailVisuals = [
  {
    label: "Front",
    src: "/media/vapes/orbit-photo-black-front.webp",
    alt: "Front view of a black Presidential Orbit device",
  },
  {
    label: "Back",
    src: "/media/vapes/orbit-photo-teal-back.webp",
    alt: "Back view of a teal Presidential Orbit device",
  },
  {
    label: "Left profile",
    src: "/media/vapes/orbit-photo-teal-left.webp",
    alt: "Left profile of a teal Presidential Orbit device",
  },
  {
    label: "Right profile",
    src: "/media/vapes/orbit-photo-silver-right.webp",
    alt: "Right profile of a silver Presidential Orbit device",
  },
  {
    label: "Back angle",
    src: "/media/vapes/orbit-photo-black-back-angle.webp",
    alt: "Angled back view of a black Presidential Orbit device",
  },
] as const;

const heroVisualByRoute: Record<VapeVisualRoute, ModelVisual> = {
  vapes: modelVisuals[6],
  "moon-pods": modelVisuals[2],
  orbit: modelVisuals[8],
};

const heroLabelByRoute: Record<VapeVisualRoute, string> = {
  vapes: "Moon Pods × Orbit",
  "moon-pods": "The Moon Pods Line",
  orbit: "The Orbit Device",
};

export function VapeCampaignMedia({ route }: { readonly route: VapeVisualRoute }) {
  const visual = heroVisualByRoute[route];

  return (
    <figure className="group relative isolate overflow-hidden border border-po-brand/45 bg-black shadow-[0_28px_90px_rgba(0,0,0,0.4)]">
      <div className="relative aspect-[3/2] w-full">
        <Image
          alt={`${visual.finish} Presidential Orbit device shown from multiple angles with the ${visual.extract} selection`}
          className="object-contain transition-transform duration-700 group-hover:scale-[1.015] motion-reduce:transition-none motion-reduce:group-hover:transform-none"
          fetchPriority="high"
          fill
          loading="eager"
          sizes="(min-width: 1280px) 1152px, (min-width: 768px) 88vw, 100vw"
          src={visual.src}
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(0,0,0,0.8)_100%)]"
        />
      </div>
      <figcaption className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-5 sm:p-8">
        <div>
          <p className="font-display text-xs font-black uppercase tracking-[0.2em] text-po-brand">
            {heroLabelByRoute[route]}
          </p>
          <p className="mt-2 font-display text-xl uppercase text-white sm:text-3xl">
            Designed for the Presidential vape experience
          </p>
        </div>
        <p className="font-display text-xs uppercase tracking-[0.18em] text-white/70">
          Liquid Diamonds · Live Resin · Live Rosin
        </p>
      </figcaption>
    </figure>
  );
}

export function VapeCollectionStory() {
  const featureVisuals = [modelVisuals[2], modelVisuals[5], modelVisuals[8]] as const;

  return (
    <>
      <Scene
        ariaLabelledBy="vapes-extracts-title"
        className="po-gold-thread-inlay overflow-hidden py-24 lg:py-32"
        tone="contrast"
      >
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1fr] lg:items-end">
            <div>
              <p className="font-display text-xs font-black uppercase tracking-[0.2em] text-po-brand">
                The complete vape system
              </p>
              <h2
                className="mt-5 max-w-[11ch] font-display text-5xl uppercase leading-[0.86] text-white sm:text-7xl lg:text-8xl"
                id="vapes-extracts-title"
              >
                Three extracts. Four finishes.
              </h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-po-on-dark-muted sm:text-xl sm:leading-9">
              Official product imagery presents the Moon Pods and Orbit family across Liquid Diamonds, Live Resin, and Live Rosin selections in black, silver, teal, and white.
            </p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {featureVisuals.map((visual, index) => (
              <figure
                className={`${index === 1 ? "lg:translate-y-10" : ""} overflow-hidden border border-white/15 bg-black`}
                key={visual.extract}
              >
                <div className="relative aspect-[3/2]">
                  <Image
                    alt={`${visual.finish} Presidential Orbit device model with ${visual.extract} selected`}
                    className="object-contain transition-transform duration-500 hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:transform-none"
                    fill
                    sizes="(min-width: 1024px) 30vw, 100vw"
                    src={visual.src}
                  />
                </div>
                <figcaption className="border-t border-white/15 p-5">
                  <p className="font-display text-xs uppercase tracking-[0.18em] text-po-brand">
                    0{index + 1}
                  </p>
                  <p className="mt-3 font-display text-2xl uppercase text-white">
                    {visual.extract}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </Scene>

      <Scene
        ariaLabelledBy="vapes-finishes-title"
        className="po-gold-thread-inlay py-24 lg:py-32"
        tone="default"
      >
        <div className="mx-auto w-full max-w-7xl">
          <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
            <div>
              <p className="font-display text-xs font-black uppercase tracking-[0.2em] text-po-brand-ink">
                The finishes
              </p>
              <h2
                className="mt-5 font-display text-5xl uppercase leading-[0.88] text-po-ink sm:text-7xl"
                id="vapes-finishes-title"
              >
                Pick your color.
              </h2>
            </div>
            <Link
              className="font-display text-sm font-black uppercase text-po-brand-ink underline decoration-po-brand decoration-2 underline-offset-8 transition-colors hover:text-po-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-po-brand"
              href="/orbit"
            >
              Explore Orbit hardware
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-2 border-l border-t border-po-line lg:grid-cols-4">
            {frontVisuals.map((visual) => (
              <figure className="border-b border-r border-po-line bg-[#f4f6f7]" key={visual.finish}>
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    alt={`Front view of the ${visual.finish.toLowerCase()} Presidential Orbit device`}
                    className="object-cover transition-transform duration-500 hover:scale-[1.035] motion-reduce:transition-none motion-reduce:hover:transform-none"
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    src={visual.src}
                  />
                </div>
                <figcaption className="border-t border-po-line bg-white px-5 py-4 font-display text-sm font-black uppercase tracking-[0.16em] text-po-ink">
                  {visual.finish}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </Scene>
    </>
  );
}

function MoonPodsVisualStory() {
  const finishes = ["Black", "Silver", "Teal", "White"] as const;

  return (
    <Scene
      ariaLabelledBy="moon-pods-visual-title"
      className="po-gold-thread-inlay overflow-hidden py-24 lg:py-32"
      tone="contrast"
    >
      <div className="mx-auto w-full max-w-7xl">
        <p className="font-display text-xs font-black uppercase tracking-[0.2em] text-po-brand">
          The Moon Pods line
        </p>
        <h2
          className="mt-5 max-w-[12ch] font-display text-5xl uppercase leading-[0.86] text-white sm:text-7xl lg:text-8xl"
          id="moon-pods-visual-title"
        >
          Every expression. Every finish.
        </h2>
        <p className="mt-7 max-w-3xl text-lg leading-8 text-po-on-dark-muted sm:text-xl sm:leading-9">
          Explore the official Moon Pods product models across Liquid Diamonds, Live Resin, and Live Rosin presentations.
        </p>

        <div className="mt-14 space-y-14">
          {finishes.map((finish) => {
            const finishVisuals = modelVisuals.filter((visual) => visual.finish === finish);
            return (
              <section aria-label={`${finish} finish`} key={finish}>
                <div className="mb-5 flex items-center gap-5">
                  <h3 className="font-display text-2xl uppercase text-white sm:text-3xl">{finish}</h3>
                  <span aria-hidden="true" className="h-px flex-1 bg-white/20" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {finishVisuals.map((visual) => (
                    <figure className="overflow-hidden border border-white/15 bg-black" key={visual.src}>
                      <div className="relative aspect-[3/2]">
                        <Image
                          alt={`${finish} Presidential Orbit device model showing the ${visual.extract} selection`}
                          className="object-contain transition-transform duration-500 hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:transform-none"
                          fill
                          sizes="(min-width: 768px) 32vw, 100vw"
                          src={visual.src}
                        />
                      </div>
                      <figcaption className="border-t border-white/15 px-4 py-3 font-display text-xs uppercase tracking-[0.15em] text-po-brand">
                        {visual.extract}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </Scene>
  );
}

function OrbitVisualStory() {
  return (
    <>
      <Scene
        ariaLabelledBy="orbit-visual-title"
        className="po-gold-thread-inlay py-24 lg:py-32"
        tone="default"
      >
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1fr] lg:items-end">
            <div>
              <p className="font-display text-xs font-black uppercase tracking-[0.2em] text-po-brand-ink">
                The Orbit device
              </p>
              <h2
                className="mt-5 max-w-[10ch] font-display text-5xl uppercase leading-[0.86] text-po-ink sm:text-7xl lg:text-8xl"
                id="orbit-visual-title"
              >
                See every angle.
              </h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-po-body sm:text-xl sm:leading-9">
              Front, back, and profile views reveal the shape, finish, display, pod connection, side control, and charging port shown in the official Orbit photography.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-2 border-l border-t border-po-line lg:grid-cols-5">
            {detailVisuals.map((visual) => (
              <figure className="border-b border-r border-po-line bg-[#f4f6f7]" key={visual.label}>
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    alt={visual.alt}
                    className="object-cover transition-transform duration-500 hover:scale-[1.04] motion-reduce:transition-none motion-reduce:hover:transform-none"
                    fill
                    sizes="(min-width: 1024px) 20vw, 50vw"
                    src={visual.src}
                  />
                </div>
                <figcaption className="border-t border-po-line bg-white px-4 py-4 font-display text-xs font-black uppercase tracking-[0.14em] text-po-ink">
                  {visual.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </Scene>

      <Scene
        ariaLabelledBy="orbit-finishes-title"
        className="po-gold-thread-inlay py-24 lg:py-32"
        tone="contrast"
      >
        <div className="mx-auto w-full max-w-7xl">
          <p className="font-display text-xs font-black uppercase tracking-[0.2em] text-po-brand">
            Four official finishes
          </p>
          <h2
            className="mt-5 font-display text-5xl uppercase leading-[0.88] text-white sm:text-7xl"
            id="orbit-finishes-title"
          >
            Black. Silver. Teal. White.
          </h2>
          <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {frontVisuals.map((visual) => (
              <figure className="overflow-hidden bg-[#f4f6f7]" key={visual.finish}>
                <div className="relative aspect-square">
                  <Image
                    alt={`Front product view of the ${visual.finish.toLowerCase()} Presidential Orbit finish`}
                    className="object-cover"
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    src={visual.src}
                  />
                </div>
                <figcaption className="bg-po-brand px-5 py-4 font-display text-sm font-black uppercase tracking-[0.16em] text-po-ink">
                  {visual.finish}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </Scene>
    </>
  );
}

export function VapePillarVisualStory({ route }: { readonly route: "moon-pods" | "orbit" }) {
  return route === "moon-pods" ? <MoonPodsVisualStory /> : <OrbitVisualStory />;
}
