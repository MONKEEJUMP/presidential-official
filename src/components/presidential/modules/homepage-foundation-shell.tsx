import Image from "next/image";
import Link from "next/link";

import type { SeoRouteRecord } from "@/lib/seo/route-types";
import type { LocatorInitialSearch } from "@/lib/locator/inbound-search";
import {
  ExperienceEveryMomentBand,
  HomeArchitectureBand,
  HomeEcosystemBand,
  HomeExpressionsBand,
  HomePlatformsAndTiersBand,
} from "@/components/ecosystem/ecosystem-bands";

import { PageFrame } from "../layout/page-frame";
import { LocatorConsole } from "../locator/locator-console";
import { Scene } from "../layout/scene";
import { SceneStack } from "../layout/scene-stack";
import { FindUsNationwideVideo } from "../media/find-us-nationwide-video";
import { SiteVideo } from "../media/site-video";
import { CtaLink } from "../primitives/cta-link";
import { InContentText } from "../primitives/in-content-text";
import {
  BentolioHeroShell,
  HomepageSpinningCrestFold,
} from "./bentolio-hero-shell";
import { BluntsGraphicsGrid } from "./blunts-graphics-grid";
import { AnswerSections } from "./answer-sections";
import { HOME_ANSWERS } from "./final-answers";
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
    body: "Presidential Moon Rocks are an infused cannabis product format — flower coated with concentrate or resin and finished with kief or diamonds, as identified on the package — not NASA lunar samples or space rocks. That infused construction layers flower with concentrate or resin, then adds the kief or diamonds identified for the release. Reading an infused Moon Rocks package means reading those layers together, not treating the brand as a strain. Presidential is the brand; Moon Rocks describes the format, while cultivars such as Skywalker and Cherry Gelato remain distinct. Within that format, infused flower is paired with concentrate; a live resin label identifies that concentrate for the release. Labels may list terpenes and cannabinoids for the named release and batch.",
    image: {
      alt: "Skywalker Moon Rock product graphic",
      href: "/moon-rocks/skywalker",
      src: "/media/moonrock-skywalker.jpg",
    },
  },
  {
    title: "Licensed retail path",
    body: "Presidential doesn't sell here — it points you straight to the shelf. Drop your zip and the store finder maps participating licensed retailers near you across active markets. No carts, no checkout, no guesswork — just the fastest route from screen to store. Availability varies by retailer. Licensed retailers decide which releases to stock, and current stock varies by location. Confirm the store's stock before visiting. Adult use is limited to adults 21+ where legal.",
    image: {
      alt: "Cherry Gelato Moon Rock product graphic",
      href: "/moon-rocks/cherry-gelato",
      src: "/media/moonrock-cherrygelato.jpg",
    },
  },
] as const;

const homepageMoonRockProducts = [
  {
    alt: "Daniel LaRusso Moon Rocks product packaging",
    name: "Daniel LaRusso",
    src: "/media/moonrock-daniel-larusso.jpg",
  },
  {
    alt: "Gorilla Goo Moon Rocks product packaging",
    name: "Gorilla Goo",
    src: "/media/moonrock-gorilla-goo.jpg",
  },
  {
    alt: "Grape Moon Rocks product packaging",
    name: "Grape",
    src: "/media/moonrock-grape.jpg",
  },
  {
    alt: "Laura Charles Moon Rocks product packaging",
    name: "Laura Charles",
    src: "/media/moonrock-laura-charles.jpg",
  },
  {
    alt: "Nino Brown Moon Rocks product packaging",
    name: "Nino Brown",
    src: "/media/moonrock-nino-brown.jpg",
  },
  {
    alt: "Peach Mango Moon Rocks product packaging",
    name: "Peach Mango",
    src: "/media/moonrock-peach-mango.jpg",
  },
  {
    alt: "Waui Moon Rocks product packaging",
    name: "Waui",
    src: "/media/moonrock-waui.jpg",
  },
] as const;

const homepageCatalogPathCopy = [
  "The [Presidential House Line](/moon-rocks/presidential-house-line) collects original house releases under one catalog path.",
  "[God's Gift](/moon-rocks/gods-gift) sits in the Rose Gold collection.",
  "[NYC Diesel](/moon-rocks/nyc-diesel) is part of the named-strain catalog.",
  "[Cereal Milk](/moon-rocks/cereal-milk) has its own place in the wider Moon Rocks lineup. Read its package for the listed terpenes tied to that release.",
  "Label literacy keeps listed terpenes and cannabinoids tied to the named release and batch.",
] as const;

const brandChapters = [
  {
    title: "Then",
    body: (
      <>
        Presidential launched in 2012 and established its brand in Los Angeles,
        building an identity around infused cannabis and Moon Rocks. The{" "}
        <Link
          className="font-semibold text-po-brand underline decoration-po-brand/50 underline-offset-4 hover:decoration-po-brand"
          href="/presidential-cannabis"
        >
          official company overview
        </Link>
        {" "}connects that history to today&apos;s product system. World&apos;s
        Strongest remains the signature brand motto; current product facts stay
        tied to the package and batch.
      </>
    ),
  },
  {
    title: "Now",
    body: "That focus is a full platform today — Moon Rocks, Moon Pods, and Orbit — connected to participating licensed retailers across multiple states. The brand, products, and learning live in one official home, straight from the source. The standard remains: Presidential Doesn't Miss.",
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
          className="po-gold-thread-inlay !py-2"
          id="presidential-states-map"
          tone="contrast"
        >
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 text-center">
            <div className="flex w-full flex-col items-center">
              <p className="text-xs font-black uppercase text-po-brand">
                Coast to coast
              </p>
              <h2
                className="mt-2 font-display text-4xl uppercase leading-[0.92] text-po-on-dark sm:text-5xl 2xl:text-6xl"
                id="presidential-homepage-map"
              >
                Find Presidential near you
              </h2>
            </div>

            <section
              aria-label="Find a dispensary"
              className="scroll-mt-24 w-full py-4 text-left"
              id="presidential-homepage-locator"
            >
              <LocatorConsole
                initialSearch={locatorInitialSearch}
                layout="stacked"
              />
            </section>

            <p className="max-w-xl text-base leading-7 text-po-on-dark-muted">
              Active markets, each with its own Presidential experience.
              Choose a state to step inside.
            </p>

            <div className="w-full max-w-sm xl:max-w-md 2xl:max-w-xl">
              <FindUsNationwideVideo />
            </div>

            <div className="w-full max-w-sm xl:max-w-md 2xl:max-w-xl [&_p]:!mt-2 [&_p]:text-center [&_ul]:mx-auto">
              <UsMapShell />
            </div>
          </div>
        </Scene>

        <HomeEcosystemBand />

        <BentolioHeroShell
          afterProductCarousel={<HomeArchitectureBand />}
          route={route}
        />

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
                  greater consistency, and premium experiences. Its infused
                  construction starts with flower, adds concentrate or resin, and
                  finishes with the dry material named on the package. That infused
                  build keeps flower, concentrate, and the finishing layer together
                  as one Moon Rocks format. Each infused layer should match the
                  flower, concentrate, and finish named on the package. More flavor.
                  More consistency. More innovation. More experience. Every product,
                  every proof, and every place to find it — all in one official home.
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
                      <InContentText sourcePath="/" value={point.body} />
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

            <div className="mt-10 border-t border-po-brand/45 pt-8">
              <p className="po-home-canvas-accent text-xs font-black uppercase tracking-[0.12em]">
                <InContentText
                  sourcePath="/"
                  value="Official [Presidential Moon Rocks](/moon-rocks/presidential-moon-rocks)"
                />
              </p>
              <ul
                aria-label="Official Presidential Moon Rocks product images"
                className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4"
              >
                {homepageMoonRockProducts.map((product) => (
                  <li key={product.src}>
                    <figure>
                      <div className="relative aspect-square overflow-hidden rounded-[20px] border border-po-brand/55 bg-po-ink">
                        <Image
                          alt={product.alt}
                          className="object-contain"
                          fill
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                          src={product.src}
                        />
                      </div>
                      <figcaption className="po-home-canvas-muted mt-2 text-sm">
                        {product.name}
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {homepageCatalogPathCopy.map((copy) => (
                  <p
                    className="po-home-canvas-muted border-l border-po-brand/45 pl-4 text-sm leading-6"
                    key={copy}
                  >
                    <InContentText sourcePath="/" value={copy} />
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Scene>

        <HomePlatformsAndTiersBand />

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

        <HomeExpressionsBand />

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

        <AnswerSections eyebrow="Presidential Moon Rocks questions" id="home-answers" items={HOME_ANSWERS} />

        <ExperienceEveryMomentBand scope="home" />

        <div className="po-gold-thread-inlay">
          <FindUsCtaShell className="!py-12 lg:!py-16" />
        </div>
      </SceneStack>
    </PageFrame>
  );
}
