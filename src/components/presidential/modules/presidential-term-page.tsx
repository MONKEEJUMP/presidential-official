import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ProductImageLink, ProductMentions } from "@/components/presidential/products/product-mention";
import type { ReactNode } from "react";
import type { FAQPage, WithContext } from "schema-dts";

import { buildRouteMetadata } from "@/lib/seo/metadata";
import { canonicalUrl } from "@/lib/seo/schema/constants";
import {
  buildRouteShellBreadcrumbItems,
  buildRouteShellJsonLd,
  JsonLd,
} from "@/lib/seo/schema";
import type { SeoRouteRecord } from "@/lib/seo/route-types";

import { PageFrame } from "../layout/page-frame";
import { Scene } from "../layout/scene";
import { SceneStack } from "../layout/scene-stack";

type TermPagePath =
  | "/presidential-thc"
  | "/presidential-blunts"
  | "/presidential-cannabis";

type TermImage = {
  readonly alt: string;
  readonly height: number;
  readonly src: string;
  readonly width: number;
};

const TERM_IMAGES = {
  "/presidential-thc": [
    {
      alt: "Close-up of a Moon Rock showing the kief coating over infused flower",
      height: 1200,
      src: "/media/moonrock-presidential.jpg",
      width: 1200,
    },
    {
      alt: "Gorilla Goo Moon Rock packaging with infused flower artwork",
      height: 1200,
      src: "/media/moonrock-gorilla-goo.jpg",
      width: 1200,
    },
    {
      alt: "Infused flower showing distillate carried through the material rather than coated on the surface",
      height: 1200,
      src: "/media/moonrock-pinkcookies.jpg",
      width: 1200,
    },
    {
      alt: "Skywalker Moon Rock packaging representing the infused flower format",
      height: 1200,
      src: "/media/moonrock-skywalker.jpg",
      width: 1200,
    },
    {
      alt: "Silver, Gold and Rose Gold series packaging",
      height: 1280,
      src: "/media/posters/silver-backdrop.jpg",
      width: 720,
    },
    {
      alt: "Gold Strain Series packaging against the live resin backdrop",
      height: 1080,
      src: "/media/posters/gold-backdrop.jpg",
      width: 1920,
    },
    {
      alt: "Rose Gold Connoisseur Series packaging against the live rosin backdrop",
      height: 1280,
      src: "/media/posters/rosegold-backdrop.jpg",
      width: 720,
    },
  ],
  "/presidential-blunts": [
    {
      alt: "Row of infused blunts in tobacco-free hemp wraps",
      height: 1350,
      src: "/media/blunt-gorilla-goo.jpg",
      width: 1080,
    },
    {
      alt: "Presidential pre-roll packaging shown for the format comparison",
      height: 1200,
      src: "/media/preroll-presidential.jpg",
      width: 1200,
    },
    {
      alt: "Hemp wrap construction on an infused blunt",
      height: 1200,
      src: "/media/mini-blunt-presidential.jpg",
      width: 1200,
    },
    {
      alt: "Cherry Gelato infused blunt packaging",
      height: 1200,
      src: "/media/blunt-cherry-gelato.jpg",
      width: 1200,
    },
    {
      alt: "Blue Raspberry infused blunt packaging",
      height: 1200,
      src: "/media/blunt-blue-raspberry.jpg",
      width: 1200,
    },
    {
      alt: "Even burn line on an infused blunt",
      height: 1350,
      src: "/media/blunt-orange-push-pop.jpg",
      width: 1080,
    },
  ],
  "/presidential-cannabis": [
    {
      alt: "The Presidential crest",
      height: 4896,
      src: "/media/brand/presidential-crest-master.png",
      width: 6322,
    },
    {
      alt: "Presidential banner logo",
      height: 604,
      src: "/media/brand/presidential-banner.png",
      width: 1839,
    },
    {
      alt: "Presidential brand and product platform artwork",
      height: 720,
      src: "/media/posters/crest-spinning.jpg",
      width: 1280,
    },
    {
      alt: "Presidential product catalog artwork",
      height: 720,
      src: "/media/posters/strains-horizontal.jpg",
      width: 1280,
    },
    {
      alt: "Vertical Presidential product catalog presentation",
      height: 1280,
      src: "/media/posters/strains-vertical.jpg",
      width: 720,
    },
    {
      alt: "Presidential official social brand artwork",
      height: 630,
      src: "/brand/og-social-share-image.png",
      width: 1200,
    },
  ],
} as const satisfies Record<TermPagePath, readonly TermImage[]>;

function getTermPath(route: SeoRouteRecord): TermPagePath {
  if (
    route.path !== "/presidential-thc" &&
    route.path !== "/presidential-blunts" &&
    route.path !== "/presidential-cannabis"
  ) {
    throw new Error(`Unsupported Presidential term page: ${route.path}`);
  }

  return route.path;
}

export function buildTermPageMetadata(route: SeoRouteRecord): Metadata {
  const path = getTermPath(route);
  const image = TERM_IMAGES[path][0];
  const dimensions = path === "/presidential-cannabis"
    ? { width: 6322, height: 4896 }
    : path === "/presidential-blunts"
      ? { width: 1080, height: 1350 }
      : { width: 1200, height: 1200 };

  return buildRouteMetadata({
    route,
    socialImage: { url: canonicalUrl(image.src), ...dimensions, alt: image.alt },
  });
}

function ContentImage({ image, priority = false }: { image: TermImage; priority?: boolean }) {
  return (
    <div className="overflow-hidden rounded-[20px] border-[3px] border-po-brand bg-po-ink">
      <ProductImageLink src={image.src} className="block"><Image
        alt={image.alt}
        className="h-auto w-full object-cover"
        height={image.height}
        sizes="(min-width: 1024px) 42vw, 100vw"
        src={image.src}
        width={image.width}
        {...(priority ? { priority: true } : { loading: "lazy" as const })}
      /></ProductImageLink>
    </div>
  );
}

function ImageGrid({
  images,
  priority = false,
}: {
  images: readonly TermImage[];
  priority?: boolean;
}) {
  return (
    <div className={images.length > 1 ? "grid gap-6 sm:grid-cols-2" : "grid gap-6"}>
      {images.map((image, index) => (
        <ContentImage image={image} key={image.src} priority={priority && index === 0} />
      ))}
    </div>
  );
}

function ProductCollage() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="relative isolate aspect-[3/4] overflow-hidden rounded-[20px] border-[3px] border-po-brand bg-po-ink shadow-[0_28px_60px_rgba(0,0,0,0.28)]">
        <Image
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          fill
          sizes="(min-width: 1024px) 21vw, 48vw"
          src="/media/blunts/hero-studio-v2.webp"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-po-ink/20 via-transparent to-po-ink/80" />
        <div className="absolute left-[8%] top-[8%] w-[55%] -rotate-[8deg] overflow-hidden rounded-[12px] border border-po-on-dark/35 bg-po-ink shadow-[0_18px_32px_rgba(0,0,0,0.42)]">
          <ProductImageLink src="/media/blunts/pink-cookies-title.webp" className="block"><Image
            alt="Pink Cookies Presidential Moon Rock Blunt packaging"
            className="h-full w-full object-cover"
            height={1350}
            sizes="(min-width: 1024px) 12vw, 27vw"
            src="/media/blunts/pink-cookies-title.webp"
            width={1080}
          /></ProductImageLink>
        </div>
        <div className="absolute bottom-[7%] right-[7%] w-[49%] rotate-[7deg] overflow-hidden rounded-[12px] border border-po-on-dark/35 bg-po-ink shadow-[0_18px_32px_rgba(0,0,0,0.42)]">
          <ProductImageLink src="/media/blunts/cherry-gelato.webp" className="block"><Image
            alt="Cherry Gelato Presidential Moon Rock Blunt packaging"
            className="h-full w-full object-cover"
            height={1350}
            sizes="(min-width: 1024px) 11vw, 24vw"
            src="/media/blunts/cherry-gelato.webp"
            width={1080}
          /></ProductImageLink>
        </div>
        <p className="absolute bottom-5 left-5 m-0 font-display text-xs font-semibold uppercase tracking-[0.14em] text-po-on-dark">
          Moon Rock Blunts
        </p>
      </div>

      <div className="relative isolate aspect-[3/4] overflow-hidden rounded-[20px] border-[3px] border-po-brand bg-po-ink shadow-[0_28px_60px_rgba(0,0,0,0.28)]">
        <Image
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-75"
          fill
          sizes="(min-width: 1024px) 21vw, 48vw"
          src="/media/moon-rocks/cards/gorilla-goo.webp"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-po-ink/15 via-transparent to-po-ink/85" />
        <div className="absolute left-[7%] top-[8%] w-[57%] rotate-[6deg] overflow-hidden rounded-[12px] border border-po-on-dark/35 bg-po-ink shadow-[0_18px_32px_rgba(0,0,0,0.42)]">
          <ProductImageLink src="/media/blunts/blue-dream.webp" className="block"><Image
            alt="Blue Dream Presidential Moon Rock Blunt packaging"
            className="h-full w-full object-cover"
            height={1350}
            sizes="(min-width: 1024px) 12vw, 27vw"
            src="/media/blunts/blue-dream.webp"
            width={1080}
          /></ProductImageLink>
        </div>
        <div className="absolute bottom-[7%] right-[7%] w-[52%] -rotate-[7deg] overflow-hidden rounded-[12px] border border-po-on-dark/35 bg-po-ink shadow-[0_18px_32px_rgba(0,0,0,0.42)]">
          <Image
            alt="Gorilla Goo Presidential Moon Rocks packaging"
            className="h-full w-full object-cover"
            height={1200}
            sizes="(min-width: 1024px) 12vw, 26vw"
            src="/media/moon-rocks/cards/gorilla-goo.webp"
            width={1200}
          />
        </div>
        <p className="absolute bottom-5 left-5 m-0 font-display text-xs font-semibold uppercase tracking-[0.14em] text-po-on-dark">
          Built for the shelf
        </p>
      </div>
    </div>
  );
}

function TermSection({
  children,
  id,
  images = [],
  title,
  tone = "default",
  wideMedia,
}: {
  children: ReactNode;
  id: string;
  images?: readonly TermImage[];
  title: string;
  tone?: "default" | "quiet" | "contrast";
  wideMedia?: ReactNode;
}) {
  const dark = tone === "contrast";
  const copy = (
    <div className={wideMedia ? "max-w-5xl" : "max-w-3xl"}>
      <h2
        className={`font-display text-3xl uppercase leading-[0.95] sm:text-5xl ${dark ? "text-po-on-dark" : "text-po-ink"}`}
        id={id}
      >
        {title}
      </h2>
      <div
        className={`mt-8 grid gap-5 text-base leading-8 ${dark ? "text-po-on-dark-muted" : "text-po-body"}`}
      >
        {children}
      </div>
    </div>
  );

  return (
    <Scene
      ariaLabelledBy={id}
      className="po-gold-thread-inlay py-20 lg:py-28"
      tone={tone}
    >
      {wideMedia ? (
        <div className="mx-auto w-full max-w-7xl">
          {copy}
          <div className="mt-12">{wideMedia}</div>
        </div>
      ) : (
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(360px,0.7fr)] lg:items-start lg:gap-16">
          {copy}
          {images.length ? <ImageGrid images={images} /> : null}
        </div>
      )}
    </Scene>
  );
}

const inlineLinkClass =
  "font-semibold text-po-brand underline decoration-po-brand/50 underline-offset-4 hover:decoration-po-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-po-brand";

const buttonLinkClass =
  "inline-flex w-fit items-center justify-center bg-po-brand px-7 py-4 font-display text-sm font-semibold uppercase text-po-ink transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-po-brand motion-reduce:transition-none motion-reduce:hover:transform-none";

// Single source for the visible FAQ copy and the FAQPage JSON-LD so the two
// can never drift apart.
const PRESIDENTIAL_CANNABIS_FAQ = [
  {
    question: "What is Presidential Cannabis?",
    answer:
      "Presidential Cannabis is the official brand behind Presidential Moon Rocks, infused pre-rolls, tobacco-free blunts, and minis. Its official company home is presidentialmoonrocks.com.",
  },
  {
    question: "What products does Presidential make?",
    answer:
      "Presidential makes infused Moon Rocks, pre-rolls, tobacco-free blunts, and minis. The catalog is organized through the Silver Flavor Series, Gold Strain Series, Rose Gold Connoisseur Series, Presidential Line, Presidential House Line, and Presidential x THC Design.",
  },
  {
    question: "Where can I buy Presidential Cannabis?",
    answer:
      "Presidential Cannabis is sold through licensed retailers. Use the official Find Us path to locate participating stores, then confirm current product availability with the retailer. Adults 21+ where legal.",
  },
] as const;

function buildPresidentialCannabisFaqSchema(): WithContext<FAQPage> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PRESIDENTIAL_CANNABIS_FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

function PresidentialThcPage({ images, route }: { images: readonly TermImage[]; route: SeoRouteRecord }) {
  return (
    <>
      <Scene ariaLabelledBy="presidential-thc-title" className="py-20 lg:py-28" tone="contrast">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.7fr)] lg:items-center lg:gap-16">
          <div>
            <h1
              className="font-display text-5xl uppercase leading-[0.9] text-po-on-dark sm:text-7xl lg:text-8xl"
              id="presidential-thc-title"
            >
              {route.h1}
            </h1>
            <h2 className="mt-10 font-display text-2xl uppercase text-po-brand">What Presidential THC covers</h2>
            <div className="mt-5 grid max-w-2xl gap-5 text-lg leading-8 text-po-on-dark-muted">
              <p>
                &ldquo;Presidential THC&rdquo; is a common way to search for Presidential, the cannabis brand behind{" "}
                <Link className={inlineLinkClass} href="/moon-rocks">Moon Rocks</Link>, <Link className={inlineLinkClass} href="/pre-rolls">pre-rolls</Link>, and{" "}
                <Link className={inlineLinkClass} href="/blunts">blunts</Link>. This page is the official guide to Presidential&apos;s infused product system, its three extract-led series, and the numbers printed on a cannabis label.
              </p>
              <p>
                It explains flower, concentrate, kief, distillate, live resin, live rosin, THCa, and total THC for{" "}
                <Link className={inlineLinkClass} href="/presidential-cannabis">
                  Presidential
                </Link>
                , then points readers to the detailed guides and the{" "}
                <Link className={inlineLinkClass} href="/find-us">licensed-retailer locator</Link>.
              </p>
            </div>
          </div>
          <ImageGrid images={[images[0]]} priority />
        </div>
      </Scene>

      <TermSection id="presidential-thc-ingredients" images={[images[1]]} title="Flower, concentrate, and kief">
        <p>Presidential brand materials describe the flagship Moon Rocks format through three visible roles: flower as the base, cannabis concentrate as the infused component, and kief as the finish.</p>
        <p><strong>Flower</strong> supplies the plant material and the named product identity. <strong>Concentrate</strong> supplies the extract component. <strong>Kief</strong> is the collected trichome material used for the exterior finish.</p>
        <p>Potency is batch-specific. Read the current package label and its associated test results rather than inferring a fixed percentage from a format, series, or product name.</p>
      </TermSection>

      <TermSection id="presidential-thc-infusion" images={[images[2], images[3]]} title="The Presidential Infusion System™" tone="contrast">
        <p>
          Presidential uses <strong>Presidential Infusion System™</strong> as the name for its product framework: flower and cannabis extracts working together in a finished format. The{" "}
          <Link className={inlineLinkClass} href="/learn/infusion-science">Infusion Science guide</Link> explains the distinction between concentrate placed on a surface and concentrate{" "}
          carried through the flower.
        </p>
        <p>The system name identifies Presidential&apos;s brand architecture. It does not establish a universal potency, burn, or performance result; the specific package and batch record control those facts.</p>
      </TermSection>

      <TermSection id="presidential-thc-extracts" images={[images[4], images[5], images[6]]} title="Three extracts, three series">
        <p>The catalog is organized by what goes into the product, not by marketing tier.</p>
        <p><strong>Distillate</strong> is the extract identified with the <Link className={inlineLinkClass} href="/moon-rocks/silver">Silver Flavor Series</Link>.</p>
        <p><strong>Live resin</strong> is the extract identified with the <Link className={inlineLinkClass} href="/moon-rocks/gold">Gold Strain Series</Link> and is made from cannabis frozen at harvest rather than first dried and cured.</p>
        <p><strong>Live rosin</strong> is the solventless extract identified with the <Link className={inlineLinkClass} href="/moon-rocks/rose-gold">Rose Gold Connoisseur Series</Link>. Ice water, heat, and pressure are used instead of chemical solvents.</p>
        <p>These series descriptions explain the catalog structure. The current package label and batch documentation remain authoritative for a specific product.</p>
        <p>
          That same infused framework appears in the collaboration catalog as{" "}
          <Link className={inlineLinkClass} href="/moon-rocks/thc-design-moon-rocks">Presidential x THC Design Moon Rocks</Link>,{" "}
          <Link className={inlineLinkClass} href="/moon-rocks/thc-design-prerolls">Presidential x THC Design Prerolls</Link>, and{" "}
          <Link className={inlineLinkClass} href="/moon-rocks/thc-design-blunts">Presidential x THC Design Blunts</Link>.
        </p>
      </TermSection>

      <TermSection id="presidential-thc-label" title="Reading the numbers on a label" tone="contrast">
        <p>A cannabis label may show delta-9 THC, THCa, and a calculated total THC value. Those numbers describe different measurements and should be read with their units and the batch&apos;s testing record.</p>
        <p>Heat can convert THCa into delta-9 THC through decarboxylation. The conventional total-THC calculation applies a <strong>0.877</strong> conversion factor based on the compounds&apos; molar-mass ratio.</p>
        <p><strong>Total THC = (THCa × 0.877) + THC</strong></p>
        <p>This formula is documented in NIST&apos;s hemp reference-material guidance. It explains the calculation; it does not supply the potency of any Presidential product. Use the product&apos;s current label and test record for that.</p>
      </TermSection>

      <TermSection id="presidential-thc-terpenes" title="What terpenes contribute to aroma">
        <p>Terpenes are volatile aromatic compounds that contribute to how cannabis smells and tastes. Their presence does not support a medical, therapeutic, or guaranteed experience claim.</p>
        <p>Heat, light, air, and time can change an aromatic profile. Read product-specific descriptions as sensory information and use the package or approved product record for the current batch.</p>
      </TermSection>

      <TermSection id="presidential-thc-learn" title="Learn more" tone="contrast">
        <p>The guides go deeper on each of these.</p>
        <nav aria-label="Presidential extract science guides" className="flex flex-wrap gap-x-6 gap-y-3">
          <Link className={inlineLinkClass} href="/learn/what-are-moon-rocks">What Are Moon Rocks</Link>
          <Link className={inlineLinkClass} href="/learn/what-is-live-resin">What Is Live Resin</Link>
          <Link className={inlineLinkClass} href="/learn/what-is-live-rosin">What Is Live Rosin</Link>
          <Link className={inlineLinkClass} href="/learn/what-are-liquid-diamonds">What Are Liquid Diamonds</Link>
          <Link className={inlineLinkClass} href="/learn/infusion-science">Infusion Science</Link>
          <Link className={inlineLinkClass} href="/learn/flavor-science">Flavor Science</Link>
        </nav>
      </TermSection>
    </>
  );
}

function PresidentialBluntsPage({ images, route }: { images: readonly TermImage[]; route: SeoRouteRecord }) {
  return (
    <>
      <Scene ariaLabelledBy="presidential-blunts-title" className="py-20 lg:py-28" tone="contrast">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.7fr)] lg:items-center lg:gap-16">
          <div>
            <h1 className="font-display text-5xl uppercase leading-[0.9] text-po-on-dark sm:text-7xl lg:text-8xl" id="presidential-blunts-title">{route.h1}</h1>
            <h2 className="mt-10 font-display text-2xl uppercase text-po-brand">Opening</h2>
            <div className="mt-5 grid max-w-2xl gap-5 text-lg leading-8 text-po-on-dark-muted">
              <p>Presidential Blunts bring the house infusion method into a slow-burning hemp wrap built for a longer session.</p>
              <p>
                Flower, concentrate, kief, format, and finish work together here. The result is a distinctly Presidential way to enjoy{" "}
                <Link className={inlineLinkClass} href="/presidential-thc">infused cannabis</Link>.
              </p>
            </div>
          </div>
          <ImageGrid images={[images[0]]} priority />
        </div>
      </Scene>

      <TermSection id="presidential-blunts-differences" images={[images[1]]} title="Blunt, pre-roll, mini — the actual differences">
        <p><strong><Link className={inlineLinkClass} href="/moon-rocks/presidential-prerolls">Presidential pre-rolls</Link></strong> place infused material inside a slim rolling paper. Their familiar shape makes them an easy entry into the lineup, while the measured build supports an even, approachable session.</p>
        <p>
          <strong>Presidential Blunts</strong> use a broader hemp wrap that carries more material and{" "}
          holds heat over a longer burn. The format suits a shared circle, a paced solo session, or any occasion that benefits from time and room for the flavor to develop.
        </p>
        <p><strong>Presidential Mini Blunts</strong> translate that construction into a compact size. They keep the hemp-wrap character and infused composition while matching a shorter occasion.</p>
        <p>Each format begins with the same focus on construction. Size, wrap, airflow, and burn rate shape the experience, giving people a clear way to choose the Presidential format that fits the moment.</p>
      </TermSection>

      <TermSection id="presidential-blunts-tobacco-free" images={[images[2]]} title="Tobacco-free, and why that matters" tone="contrast">
        <p>The hemp wrap is central to the Presidential Blunt identity. Hemp gives the format its substantial feel and measured pace while allowing the infused cannabis inside to lead the aroma and taste.</p>
        <p>
          <Link className={inlineLinkClass} href="/presidential-cannabis">Presidential</Link>{" "}
          rolls its blunts in <strong>hemp wraps that are one hundred percent tobacco free.</strong>
        </p>
        <p>That material choice keeps the focus on the flower, concentrate, kief, and strain or flavor profile selected for the package. It also creates a consistent physical foundation across the house blunt and Mini Blunt families.</p>
        <p>The wrap, fill, and infusion are treated as one system. Balanced airflow supports the light, the infused material carries the profile, and the finished roll gives the blend enough space to burn at its intended rhythm.</p>
      </TermSection>

      <TermSection id="presidential-blunts-lineup" images={[images[3], images[4]]} title="The lineup">
        <p><strong>The Presidential Blunt</strong> is the flagship wrapped format. It carries recognizable strain and flavor names in a full-size presentation designed around a steady burn and a complete session.</p>
        <p><strong>Mini Blunts</strong> provide the same family character in a smaller package. Their compact scale broadens the ways licensed retailers can present Presidential infused cannabis and gives customers another practical format choice.</p>
        <p><strong>The Presidential Line</strong> connects core house names across formats, while the <Link className={inlineLinkClass} href="/moon-rocks/silver">Silver Flavor Series</Link>, <Link className={inlineLinkClass} href="/moon-rocks/gold">Gold Strain Series</Link>, and <Link className={inlineLinkClass} href="/moon-rocks/rose-gold">Rose Gold Connoisseur Series</Link> organize products by their featured profile and extract approach.</p>
        <p>The catalog also includes <strong>Presidential House Line</strong> selections and <strong>Presidential x THC Design</strong> releases. Together, these groupings position the blunt program inside a broader 47-product system with a clear, connected presence across the Presidential catalog.</p>
        <p>Packaging carries the strain or flavor identity forward with bold color, Presidential branding, and format information that helps customers recognize the exact release they selected.</p>
      </TermSection>

      <TermSection id="presidential-blunts-strains" title="Available strains" tone="contrast">
        <p><ProductMentions format="Blunt">The Presidential Blunts catalog spans strain-led and flavor-led releases. Recognizable names include Cherry Gelato, Gorilla Goo, Cap Junky, Skywalker, Crescendo, XJ-13, Garlic Cookies, Ghost Haze Train, Laura Charles, Nino Brown, Whoa Si Whoa, and Daniel LaRusso.</ProductMentions></p>
        <p><ProductMentions format="Blunt">Flavor-focused choices include Blue Raspberry, Peach Mango, Pineapple, Tropical, Grape, Strawberry, Watermelon, Orange Push Pop, Pink Cookies, Waui, <Link className={inlineLinkClass} href="/blunts/xxx">XXX</Link>, and Apricotti. That range gives the format a broad shelf presence while every package remains tied to a specific named selection.</ProductMentions></p>
        <p>Availability varies by licensed retailer.</p>
      </TermSection>

      <TermSection id="presidential-blunts-smoking" images={[images[5]]} title="How to smoke an infused blunt">
        <p>An infused blunt rewards a measured approach. Concentrate and kief add density to the flower, while the hemp wrap creates a slower pace than a thin-paper pre-roll.</p>
        <p><strong>Start with an even light.</strong> Rotate the end near the flame so the full edge catches together. A balanced ember establishes the airflow that guides the rest of the session.</p>
        <p><strong>Use a relaxed draw.</strong> Steady pulls support the burn line and give the infused material time to warm through the wrap.</p>
        <p><strong>Set the pace early.</strong> The opening third establishes the rhythm. Allowing the ember to move naturally helps the blunt express its strain or flavor profile from start to finish.</p>
        <p><strong>Keep the package cool and dark.</strong> Thoughtful storage protects aroma, texture, and presentation until the session begins.</p>
        <p>Adults 21+ where legal can explore the lineup, choose a preferred format, and confirm local selection through the official retailer path.</p>
      </TermSection>

      <TermSection id="presidential-blunts-retail" title="Where they are sold" tone="contrast">
        <p>Presidential Blunts reach customers through licensed retailers. The official finder connects a ZIP code with nearby stores and displays distance so each visit can begin with a clear local route.</p>
        <Link className={buttonLinkClass} href="/find-us">Find a licensed retailer</Link>
        <p>Retailer selection changes by market and by day. Availability varies by retailer. Adults 21+ where legal.</p>
      </TermSection>
    </>
  );
}

function PresidentialCannabisPage({ images, route }: { images: readonly TermImage[]; route: SeoRouteRecord }) {
  return (
    <>
      <JsonLd data={buildPresidentialCannabisFaqSchema()} />
      <Scene ariaLabelledBy="presidential-cannabis-title" className="py-20 lg:py-28" tone="contrast">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.7fr)] lg:items-center lg:gap-16">
          <div>
            <h1 className="font-display text-5xl uppercase leading-[0.9] text-po-on-dark sm:text-7xl lg:text-8xl" id="presidential-cannabis-title">{route.h1}</h1>
            <h2 className="mt-10 font-display text-2xl uppercase text-po-brand">Opening</h2>
            <div className="mt-5 grid max-w-2xl gap-5 text-lg leading-8 text-po-on-dark-muted">
              <p>Presidential Cannabis builds infused products around disciplined craft, recognizable formats, and a consistent house standard.</p>
              <p>The official product system connects Moon Rocks, pre-rolls, tobacco-free blunts, and minis with organized collections and a licensed-retailer path.</p>
            </div>
          </div>
          <ImageGrid images={[images[0]]} priority />
        </div>
      </Scene>

      <TermSection id="presidential-cannabis-argument" images={[images[1]]} title="The argument">
        <p>
          The company began with the belief that infused cannabis could be treated as a complete product discipline.{" "}
          Flower selection, extract choice, kief, airflow, packaging, and finish all contribute to what reaches the customer.
        </p>
        <p>That view became the foundation for the Presidential Infusion System™, a house approach that carries concentrate through the flower and finishes the material with kief. The method supports the burn, flavor, and consistency expected from the Moon Rocks, pre-rolls, blunts, and Mini Blunts that carry the name.</p>
        <p>“Cannabis Evolved,” “Expect More,” and “Presidential Doesn&apos;t Miss” express the same operating idea in brand language: every format should feel intentional, every series should be easy to understand, and every release should belong inside one coherent catalog.</p>
      </TermSection>

      <TermSection id="presidential-cannabis-wholesale" images={[images[2]]} title="Wholesale only, on purpose" tone="contrast">
        <p>Presidential operates through licensed cannabis retail. The brand supplies the regulated market, and licensed stores provide the local shelf, customer service, and current selection for adults 21+ where legal.</p>
        <p>This structure gives every customer a direct path from official brand information to an approved retail destination. The nationwide finder accepts a ZIP code, ranks nearby locations by distance, and helps people plan the shortest practical route to a store carrying Presidential.</p>
        <p>The model also keeps the website focused on education, product discovery, brand history, and retailer connection. Visitors can understand the lineup here, then confirm the products and formats currently available with their chosen licensed retailer.</p>
      </TermSection>

      <TermSection id="presidential-cannabis-catalog" title="What the company makes" wideMedia={<ProductCollage />}>
        <p><strong>Official products. Organized collections. One standard.</strong></p>
        <p>The catalog is organized to make the relationship between extract, profile, and format visible. Each grouping has a clear role while remaining part of the same Presidential product platform.</p>
        <p>Collections include the Silver Flavor Series, Gold Strain Series, Rose Gold Connoisseur Series, Presidential Line, Presidential House Line, and Presidential x THC Design. Current product records—not fixed counts in evergreen copy—define the catalog.</p>
        <p>
          Formats:{" "}
          <Link className={inlineLinkClass} href="/presidential-thc">Moon Rocks</Link>,{" "}
          <Link className={inlineLinkClass} href="/moon-rocks/presidential-prerolls">Presidential pre-rolls</Link>,{" "}
          <Link className={inlineLinkClass} href="/presidential-blunts">blunts</Link>, minis.
        </p>
        <p>
          The Silver Flavor Series centers deliberate flavor profiles. The Gold Strain Series organizes strain-led releases around live resin. The Rose Gold Connoisseur Series features live rosin. The Presidential Line and Presidential House Line extend the catalog through named house releases, while the collaboration is represented by{" "}
          <Link className={inlineLinkClass} href="/moon-rocks/thc-design-moon-rocks">Presidential x THC Design Moon Rocks</Link>,{" "}
          <Link className={inlineLinkClass} href="/moon-rocks/thc-design-prerolls">Presidential x THC Design Prerolls</Link>, and{" "}
          <Link className={inlineLinkClass} href="/moon-rocks/thc-design-blunts">Presidential x THC Design Blunts</Link>.
        </p>
        <p>Across those groupings, Moon Rocks remain the flagship infused format. Pre-rolls make the method ready to enjoy in a familiar paper form. Blunts bring the material into a tobacco-free hemp wrap, while Mini Blunts offer a compact expression of the same wrapped format.</p>
      </TermSection>

      <TermSection id="presidential-cannabis-markets" images={[images[5]]} title="Where it is carried" tone="contrast">
        <p>Presidential has an active licensed-retail presence in California, Oklahoma, New York, Nevada, Michigan, Arizona, and Washington.</p>
        <p>Each state market has its own retailer network and product mix. California connects directly to the company&apos;s Los Angeles roots, while the other markets extend Presidential formats to customers through state-regulated cannabis programs.</p>
        <p>The store finder turns that geographic footprint into a useful customer tool. Entering a ZIP code returns the nearest listed retailers with real mileage, allowing people anywhere in the country to see the most practical path toward an official store.</p>
        <Link className={buttonLinkClass} href="/find-us">Find a licensed retailer</Link>
        <p>Licensed-retailer availability varies by market, location, and timing.</p>
      </TermSection>

      <TermSection id="presidential-cannabis-authenticity" title="How to know you have the real thing">
        <p>Three positive signals connect the brand, the package, and the shelf.</p>
        <p><strong>Choose a licensed retailer.</strong> The official locator identifies stores operating inside the regulated cannabis market and provides the nearest route based on the ZIP code entered.</p>
        <p><strong>Match the package to the catalog.</strong> Product pages show the named releases, series, formats, and packaging artwork associated with the Presidential lineup. That reference makes it easier to recognize the selection before visiting a store.</p>
        <p><strong>Confirm local selection.</strong> Retail teams hold the current details for stock, formats, and fresh arrivals. A quick check with the chosen store completes the path from product research to an informed visit.</p>
        <p>Together, those steps make this website the official starting point for learning the company&apos;s history, exploring its infused cannabis, and finding licensed Presidential retail.</p>
      </TermSection>

      <TermSection id="presidential-cannabis-faq" title="Presidential Cannabis FAQ">
        {PRESIDENTIAL_CANNABIS_FAQ.map((item) => (
          <div key={item.question}>
            <h3 className="text-xl font-semibold leading-snug text-po-ink">{item.question}</h3>
            <p className="mt-3">{item.answer}</p>
          </div>
        ))}
      </TermSection>

      <TermSection id="presidential-cannabis-contact" title="Contact" tone="contrast">
        <p>Wholesale, press, and brand enquiries move through the official contact channel. The Our Story and About pages provide additional context on the company, its craft, and the standards connecting the full platform. That path keeps every conversation connected to current Presidential company information.</p>
        <nav aria-label="Presidential company links" className="flex flex-wrap gap-x-6 gap-y-3">
          <Link className={inlineLinkClass} href="/contact">Contact</Link>
          <Link className={inlineLinkClass} href="/our-story">Our Story</Link>
          <Link className={inlineLinkClass} href="/about">About</Link>
        </nav>
      </TermSection>
    </>
  );
}

export function PresidentialTermPage({ route }: { route: SeoRouteRecord }) {
  const path = getTermPath(route);
  const jsonLdEntries = buildRouteShellJsonLd(route);
  const breadcrumbs = buildRouteShellBreadcrumbItems(route);

  return (
    <>
      {jsonLdEntries.map((entry) => (
        <JsonLd data={entry.data} key={`${route.id}-${entry.id}`} />
      ))}
      <PageFrame>
        <nav
          aria-label="Breadcrumb"
          className="bg-po-ink px-6 pt-8 text-xs font-semibold uppercase text-po-on-dark sm:px-10 lg:px-16"
        >
          <ol className="mx-auto flex w-full max-w-7xl gap-3">
            {breadcrumbs.map((item, index) => (
              <li className="flex items-center gap-3" key={item.path}>
                {index ? <span aria-hidden="true">/</span> : null}
                <Link className="text-po-brand hover:text-po-on-dark" href={item.path}>{item.name}</Link>
              </li>
            ))}
          </ol>
        </nav>
        <SceneStack>
          {path === "/presidential-thc" ? <PresidentialThcPage images={TERM_IMAGES[path]} route={route} /> : null}
          {path === "/presidential-blunts" ? <PresidentialBluntsPage images={TERM_IMAGES[path]} route={route} /> : null}
          {path === "/presidential-cannabis" ? <PresidentialCannabisPage images={TERM_IMAGES[path]} route={route} /> : null}
        </SceneStack>
      </PageFrame>
    </>
  );
}
