import Image from "next/image";
import Link from "next/link";

import type { SeoRouteRecord } from "@/lib/seo/route-types";
import type { LocatorInitialSearch } from "@/lib/locator/inbound-search";

import { PageFrame } from "../layout/page-frame";
import { LocatorConsole } from "../locator/locator-console";
import { Scene } from "../layout/scene";
import { SceneStack } from "../layout/scene-stack";
import { FindUsNationwideVideo } from "../media/find-us-nationwide-video";
import { SiteVideo } from "../media/site-video";
import { CtaLink } from "../primitives/cta-link";
import {
  BentolioHeroShell,
  HomepageSpinningCrestFold,
} from "./bentolio-hero-shell";
import { BluntsGraphicsGrid } from "./blunts-graphics-grid";
import { FindUsCtaShell } from "./find-us-cta-shell";
import { UsMapShell } from "./us-map-shell";

type HomepageFoundationShellProps = {
  readonly locatorInitialSearch?: LocatorInitialSearch;
  readonly route: SeoRouteRecord;
};

const HOMEPAGE_CANVAS_TONE: "dark" | "light" = "dark";

const proofPoints = [
  {
    title: "Official source",
    body: "This is the one official home of Presidential — the real brand, straight from the people who make it. Every product, every image, every word here traces back to Presidential itself. What you see is exactly what reaches the shelf: authentic Presidential, verified at the source. If it's here, it's real.",
    image: {
      alt: "Pink Cookies Moon Rock product graphic",
      href: "/moon-rocks/pink-cookies",
      src: "/media/moonrock-pinkcookies.jpg",
    },
  },
  {
    title: "Product clarity",
    body: "Three platforms, one standard. Moon Rocks is the flagship — The Highest Form Of Cannabis, where premium flower, resin, and kief come together as one. Moon Pods and Orbit come next, engineered around flavor. And every platform runs the same three series — Silver, Gold, and Rose Gold — from approachable and flavor-first to solventless connoisseur craft. Whatever you pick up, you'll know exactly what's inside and exactly why it's built that way.",
    image: {
      alt: "Skywalker Moon Rock product graphic",
      href: "/moon-rocks/skywalker",
      src: "/media/moonrock-skywalker.jpg",
    },
  },
  {
    title: "Licensed retail path",
    body: "Presidential doesn't sell here — it points you straight to the shelf. Drop your zip and the store finder maps authentic Presidential at licensed retailers near you, across eight priority markets. No carts, no checkout, no guesswork — just the fastest route from screen to store. Availability varies by retailer. Adults 21+ where legal.",
    image: {
      alt: "Cherry Gelato Moon Rock product graphic",
      href: "/moon-rocks/cherry-gelato",
      src: "/media/moonrock-cherrygelato.jpg",
    },
  },
] as const;

const brandChapters = [
  {
    title: "Then",
    body: "It started in 2012, in Los Angeles. Founders Everett Smith and John Zapp set out to build the best product they could — and ended up helping invent a category. Presidential became one of the founding fathers of the infused-product market: the house behind the World's Strongest pre-rolls and the moon rock blunt the whole industry chased. Moon Rocks made the name, and the name built a generation of cannabis culture.",
  },
  {
    title: "Now",
    body: "That obsession is a full platform today — Moon Rocks, Moon Pods, and Orbit — carried in 1,000+ licensed dispensaries across eight states. The brand, the products, and the learning all live in one official home, straight from the source. Same standard as day one: better flavor, greater consistency, no misses. Because Presidential Doesn't Miss.",
  },
  {
    title: "Next",
    body: "The mission from here is simple — get people from 'I want it' to 'here's where to buy it.' Every path connects: discover the product, learn the craft, land at a licensed retailer near you. More states. More doors. The same standard, everywhere. Then. Now. & Next.",
  },
] as const;

const secondaryPlatforms = [
  {
    title: "Moon Pods",
    href: "/moon-pods",
    body: "A dedicated lane for product information, approved visual storytelling, and connected learning.",
    action: "Explore Moon Pods",
    tone: "brand",
  },
  {
    title: "Orbit",
    href: "/orbit",
    body: "A supporting product and technology lane within the broader Presidential ecosystem.",
    action: "Explore Orbit",
    tone: "silver",
  },
] as const;

export function HomepageFoundationShell({
  locatorInitialSearch,
  route,
}: HomepageFoundationShellProps) {
  if (route.id !== "home" || route.path !== "/") {
    throw new Error("HomepageFoundationShell requires the home route record.");
  }

  return (
    <PageFrame className={`po-home-canvas-${HOMEPAGE_CANVAS_TONE}`}>
      <SceneStack>
        <HomepageSpinningCrestFold />

        <Scene
          ariaLabelledBy="presidential-homepage-map"
          className="po-gold-thread-inlay !py-3"
          id="presidential-states-map"
          tone="contrast"
        >
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 text-center">
            <div className="flex w-full flex-col items-center">
              <p className="text-xs font-black uppercase text-po-brand">
                Coast to coast
              </p>
              <h1
                className="mt-2 font-display text-4xl uppercase leading-[0.92] text-po-on-dark sm:text-5xl 2xl:text-6xl"
                id="presidential-homepage-map"
              >
                Find Presidential near you
              </h1>
              <p className="mt-2 max-w-xl text-base leading-7 text-po-on-dark-muted">
                Eight priority markets, each with its own Presidential
                experience. Choose a state to step inside.
              </p>
            </div>

            <div className="w-full max-w-sm xl:max-w-md 2xl:max-w-xl">
              <FindUsNationwideVideo />
            </div>

            <div className="w-full max-w-sm xl:max-w-md 2xl:max-w-xl [&_p]:!mt-2 [&_p]:text-center [&_ul]:mx-auto">
              <UsMapShell activeHref="#presidential-homepage-locator" />
            </div>
          </div>
        </Scene>

        <section
          aria-label="Find a dispensary"
          className="po-gold-thread-inlay scroll-mt-24 bg-po-ink text-po-on-dark"
          id="presidential-homepage-locator"
        >
          <div className="mx-auto w-full max-w-7xl px-[clamp(1.25rem,4vw,4rem)] py-[clamp(1rem,2vw,1.75rem)]">
            <LocatorConsole
              initialSearch={locatorInitialSearch}
              layout="stacked"
            />
          </div>
        </section>

        <BentolioHeroShell route={route} />

        <Scene
          ariaLabelledBy="presidential-expect-more"
          className="po-gold-thread-inlay po-home-canvas-surface !py-12 lg:!py-16"
          tone="default"
        >
          <div className="mx-auto w-full max-w-7xl">
            <div className="grid gap-6 lg:grid-cols-[minmax(260px,0.55fr)_1fr] lg:gap-10">
              <div>
                <h2
                  className="po-home-canvas-copy font-display text-4xl uppercase leading-[0.92] sm:text-6xl"
                  id="presidential-expect-more"
                >
                  Expect more.
                </h2>
                <p className="po-home-canvas-muted mt-3 max-w-md text-base leading-7">
                  Cannabis Deserves Better — so we built it. For over a decade,
                  Presidential has created cannabis engineered for better flavor,
                  greater consistency, and premium experiences. More flavor. More
                  consistency. More innovation. More experience. Every product,
                  every proof, and every place to find it — all in one official
                  home.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                {proofPoints.map((point, index) => (
                  <article
                    className="po-home-canvas-rule flex h-full flex-col border-t pt-5"
                    key={point.title}
                  >
                    <p className="po-home-canvas-accent text-xs font-black">
                      0{index + 1}
                    </p>
                    <h3 className="po-home-canvas-copy mt-5 text-xl font-semibold leading-snug">
                      {point.title}
                    </h3>
                    <p className="po-home-canvas-muted mt-3 text-sm leading-6">
                      {point.body}
                    </p>
                    <div className="mt-auto pt-3">
                      <Link
                        aria-label={`View ${point.image.alt.replace(" product graphic", "")}`}
                        className="relative block aspect-square cursor-pointer overflow-hidden rounded-[20px] transition-transform duration-200 hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-po-brand motion-reduce:transition-none motion-reduce:hover:transform-none motion-reduce:focus-visible:transform-none"
                        href={point.image.href}
                      >
                        <Image
                          alt={point.image.alt}
                          className="object-contain"
                          fill
                          sizes="(min-width: 640px) 33vw, 100vw"
                          src={point.image.src}
                        />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </Scene>

        <Scene
          ariaLabelledBy="presidential-then-now-next"
          className="po-gold-thread-inlay !py-12 lg:!py-16"
          tone="contrast"
        >
          <div className="mx-auto w-full max-w-7xl">
            <h2
              className="max-w-5xl font-display text-4xl uppercase leading-[0.92] text-po-on-dark sm:text-6xl lg:text-7xl"
              id="presidential-then-now-next"
            >
              <span className="block text-po-brand">World&#39;s Strongest</span>
              <span className="mt-2 block">Then. Now. &amp; Next.</span>
            </h2>
            <div className="po-gold-thread-inlay mt-8 grid md:grid-cols-3">
              {brandChapters.map((chapter, index) => (
                <article
                  className={[
                    "py-4 md:px-8 md:first:pl-0 md:last:pr-0",
                    index > 0 ? "po-gold-thread-inlay-vertical" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={chapter.title}
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-display text-3xl uppercase text-po-on-dark">
                      {chapter.title}
                    </h3>
                    <span className="text-xs font-black text-po-brand">0{index + 1}</span>
                  </div>
                  <p className="mt-4 max-w-sm text-sm leading-6 text-po-on-dark-muted">
                    {chapter.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </Scene>

        <div className="[&>section]:!pb-8 lg:[&>section]:!pb-10">
          <BluntsGraphicsGrid />
        </div>

        <Scene
          ariaLabelledBy="presidential-act-moon-rocks"
          className="po-gold-thread-inlay po-home-canvas-surface !py-12 lg:!py-16"
          tone="default"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[minmax(0,0.78fr)_minmax(420px,1fr)] lg:items-center lg:gap-10">
            <div className="max-w-xl">
              <p className="po-home-canvas-accent text-sm font-bold">Moon Rocks™</p>
              <h2
                className="po-home-canvas-copy mt-3 font-display text-4xl uppercase leading-[0.92] sm:text-6xl"
                id="presidential-act-moon-rocks"
              >
                The Highest Form Of Cannabis.
              </h2>
              <p className="po-home-canvas-muted mt-3 text-base leading-7">
                The flagship Presidential platform for Moon Rocks, infused
                pre-rolls, blunts, education, and retail discovery.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <CtaLink href="/moon-rocks" variant="primary">
                  Explore Moon Rocks
                </CtaLink>
                <CtaLink className="po-home-canvas-accent" href="/learn" variant="text">
                  Learn about Moon Rocks
                </CtaLink>
              </div>
            </div>
            <figure className="po-home-canvas-rule relative overflow-hidden border bg-po-brand">
              <SiteVideo
                className="aspect-[1200/630] w-full object-cover"
                label="Presidential Moon Rocks film loop"
                slug="moon-rocks-film"
              />
            </figure>
          </div>
        </Scene>

        <section
          aria-label="Presidential product platforms"
          className="po-gold-thread-inlay grid lg:grid-cols-2"
        >
          {secondaryPlatforms.map((platform, index) => (
            <article
              className={[
                "flex min-h-[20rem] flex-col justify-between gap-8 px-6 py-8 sm:px-10 lg:px-16 lg:py-10",
                index > 0 ? "po-gold-thread-inlay-vertical" : "",
                platform.tone === "brand"
                  ? "bg-po-brand text-po-ink"
                  : "bg-po-silver text-po-ink",
              ].join(" ")}
              key={platform.title}
            >
              <p className="text-sm font-bold uppercase">Presidential platform</p>
              <div className="max-w-xl">
                <h2 className="font-display text-5xl uppercase leading-[0.9] sm:text-6xl">
                  {platform.title}
                </h2>
                <p className="mt-3 max-w-md text-base leading-7 text-po-body">
                  {platform.body}
                </p>
                <div className="mt-4">
                  <CtaLink
                    className="border-po-ink text-po-ink hover:border-po-ink hover:bg-po-ink hover:text-po-on-dark"
                    href={platform.href}
                    variant="secondary"
                  >
                    {platform.action}
                  </CtaLink>
                </div>
              </div>
            </article>
          ))}
        </section>

        <div className="po-gold-thread-inlay">
          <FindUsCtaShell className="!py-12 lg:!py-16" />
        </div>
      </SceneStack>
    </PageFrame>
  );
}
