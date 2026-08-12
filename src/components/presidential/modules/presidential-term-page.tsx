import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { buildRouteMetadata } from "@/lib/seo/metadata";
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
      alt: "The full product catalog across six groupings",
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
  const base = buildRouteMetadata({ route });

  return {
    ...base,
    openGraph: {
      ...(base.openGraph || {}),
      images: [
        {
          alt: image.alt,
          height: image.height,
          url: image.src,
          width: image.width,
        },
      ],
    },
    twitter: {
      ...(base.twitter || {}),
      card: "summary_large_image",
      images: [image.src],
    },
  };
}

function ContentImage({ image, priority = false }: { image: TermImage; priority?: boolean }) {
  return (
    <div className="overflow-hidden rounded-[20px] border-[3px] border-po-brand bg-po-ink">
      <Image
        alt={image.alt}
        className="h-auto w-full object-cover"
        height={image.height}
        sizes="(min-width: 1024px) 42vw, 100vw"
        src={image.src}
        width={image.width}
        {...(priority ? { priority: true } : { loading: "lazy" as const })}
      />
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

function TermSection({
  children,
  id,
  images = [],
  title,
  tone = "default",
}: {
  children: ReactNode;
  id: string;
  images?: readonly TermImage[];
  title: string;
  tone?: "default" | "quiet" | "contrast";
}) {
  const dark = tone === "contrast";

  return (
    <Scene
      ariaLabelledBy={id}
      className="po-gold-thread-inlay py-20 lg:py-28"
      tone={tone}
    >
      <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(360px,0.7fr)] lg:items-start lg:gap-16">
        <div className="max-w-3xl">
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
        {images.length ? <ImageGrid images={images} /> : null}
      </div>
    </Scene>
  );
}

const inlineLinkClass =
  "font-semibold text-po-brand underline decoration-po-brand/50 underline-offset-4 hover:decoration-po-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-po-brand";

const buttonLinkClass =
  "inline-flex w-fit items-center justify-center bg-po-brand px-7 py-4 font-display text-sm font-semibold uppercase text-po-ink transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-po-brand motion-reduce:transition-none motion-reduce:hover:transform-none";

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
            <h2 className="mt-10 font-display text-2xl uppercase text-po-brand">Opening</h2>
            <div className="mt-5 grid max-w-2xl gap-5 text-lg leading-8 text-po-on-dark-muted">
              <p>Every infused product answers the same three questions: what went into it, how it got in there, and how strong the result is.</p>
              <p>
                This page answers all three for{" "}
                <Link className={inlineLinkClass} href="/presidential-cannabis">
                  Presidential
                </Link>
                .
              </p>
            </div>
          </div>
          <ImageGrid images={[images[0]]} priority />
        </div>
      </Scene>

      <TermSection id="presidential-thc-ingredients" images={[images[1]]} title="What is actually in the product">
        <p>Three ingredients. Each one does a job.</p>
        <p><strong>Flower</strong> carries the strain — the genetics and the aromatic backbone. Standard cannabis flower tests between 15% and 25% THC.</p>
        <p><strong>Concentrate</strong> adds potency and acts as the adhesive for the third layer. Depending on the extract used, the coating alone can run <strong>as high as 90% THC</strong>.</p>
        <p><strong>Kief</strong> is the finish — collected trichomes, the resin glands holding most of the plant&apos;s cannabinoids and terpenes. It adds another concentrated layer on top.</p>
        <p>Stack all three and the finished product reaches <strong>as high as 70% THC</strong>, roughly three times the ceiling of top-shelf flower, in something you still smoke like flower.</p>
      </TermSection>

      <TermSection id="presidential-thc-infusion" images={[images[2], images[3]]} title="The Presidential Infusion System™" tone="contrast">
        <p>Most infused cannabis is surface-treated. Concentrate goes onto the outside of the flower, where it stays.</p>
        <p>Presidential built a different process. Distillate is carried through the flower rather than applied to the surface, and the kief coat goes on last.</p>
        <p>
          The difference is not cosmetic. Concentrate is dense and holds heat. Pooled on the outside, it smothers the airflow a{" "}
          <Link className={inlineLinkClass} href="/presidential-blunts">
            rolled product
          </Link>{" "}
          needs — the burn tunnels, canoes, or dies out. Distributed through the material, it burns evenly from the first third to the last.
        </p>
        <p>That is why the process has a name. It took years to earn one.</p>
      </TermSection>

      <TermSection id="presidential-thc-extracts" images={[images[4], images[5], images[6]]} title="Three extracts, three series">
        <p>The catalog is organized by what goes into the product, not by marketing tier.</p>
        <p><strong>Distillate</strong> is refined to near-pure cannabinoid, stripped of nearly everything else. Neutral in aroma, which makes it the base where flavor is added deliberately. This is the Silver Flavor Series.</p>
        <p><strong>Live resin</strong> comes from cannabis frozen at harvest instead of dried and cured — the freeze preserves terpenes that would otherwise evaporate over a weeks-long cure. It carries the strain&apos;s own character. This is the Gold Strain Series.</p>
        <p><strong>Live rosin</strong> is solventless. Fresh-frozen material is washed in ice water to collect trichomes, and that hash is pressed with heat and pressure into rosin. No chemical solvents at any stage. It is the most expensive way to make a concentrate and the smallest yield. This is the Rose Gold Connoisseur Series.</p>
        <p>
          That same infused framework appears in the collaboration catalog as{" "}
          <Link className={inlineLinkClass} href="/moon-rocks/thc-design-moon-rocks">Presidential x THC Design Moon Rocks</Link>,{" "}
          <Link className={inlineLinkClass} href="/moon-rocks/thc-design-prerolls">Presidential x THC Design Prerolls</Link>, and{" "}
          <Link className={inlineLinkClass} href="/moon-rocks/thc-design-blunts">Presidential x THC Design Blunts</Link>.
        </p>
      </TermSection>

      <TermSection id="presidential-thc-label" title="Reading the numbers on a label" tone="contrast">
        <p>Cannabis labels confuse people, and the confusion is chemistry.</p>
        <p>The plant does not produce THC. It produces <strong>THCa</strong> — tetrahydrocannabinolic acid, which is not intoxicating on its own. Heat converts it to THC through a reaction called decarboxylation. That is what a lighter does.</p>
        <p>The conversion is not one-for-one. THCa weighs 358.47 g/mol, THC weighs 314.46, and the difference leaves as carbon dioxide. Divide one by the other and you get <strong>0.877</strong>.</p>
        <p>Which is why every lab report in the industry uses the same formula:</p>
        <p><strong>Total THC = (THCa × 0.877) + THC</strong></p>
        <p>A concentrate testing 99% THCa carries a theoretical maximum of about 87% THC after full conversion. Two very different numbers describing the same jar. Knowing which one you are reading is the whole skill.</p>
      </TermSection>

      <TermSection id="presidential-thc-terpenes" title="Why terpenes decide the experience">
        <p>Cannabinoids set potency. Terpenes set everything else — smell, taste, and the character people describe when they say two strains at the same number feel different.</p>
        <p>Terpenes are volatile. Heat, light and time degrade them, and processing can cost 30 to 50 percent of what the plant produced. Every technique in premium cannabis exists to lose less: freezing at harvest, cold extraction, pressing at low temperature, storing dark.</p>
        <p>Nothing downstream puts terpenes back. The ceiling is set at harvest.</p>
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
        <p><strong>Presidential Blunts</strong> use a broader hemp wrap that carries more material and holds heat over a longer burn. The format suits a shared circle, a paced solo session, or any occasion that benefits from time and room for the flavor to develop.</p>
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
        <p><strong>The Presidential Line</strong> connects core house names across formats, while the Silver Flavor Series, Gold Strain Series, and Rose Gold Connoisseur Series organize products by their featured profile and extract approach.</p>
        <p>The catalog also includes <strong>Presidential House Line</strong> selections and <strong>Presidential x THC Design</strong> releases. Together, these groupings position the blunt program inside a broader 47-product system with a clear, connected presence across the Presidential catalog.</p>
        <p>Packaging carries the strain or flavor identity forward with bold color, Presidential branding, and format information that helps customers recognize the exact release they selected.</p>
      </TermSection>

      <TermSection id="presidential-blunts-strains" title="Available strains" tone="contrast">
        <p>The Presidential Blunts catalog spans strain-led and flavor-led releases. Recognizable names include Cherry Gelato, Gorilla Goo, Cap Junky, Skywalker, Crescendo, XJ-13, Garlic Cookies, Ghost Haze Train, Laura Charles, Nino Brown, Whoa Si Whoa, and Daniel LaRusso.</p>
        <p>Flavor-focused choices include Blue Raspberry, Peach Mango, Pineapple, Tropical, Grape, Strawberry, Watermelon, Orange Push Pop, Pink Cookies, Waui, <Link className={inlineLinkClass} href="/moon-rocks/xxx">XXX</Link>, and Apricotti. That range gives the format a broad shelf presence while every package remains tied to a specific named selection.</p>
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
      <Scene ariaLabelledBy="presidential-cannabis-title" className="py-20 lg:py-28" tone="contrast">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.7fr)] lg:items-center lg:gap-16">
          <div>
            <h1 className="font-display text-5xl uppercase leading-[0.9] text-po-on-dark sm:text-7xl lg:text-8xl" id="presidential-cannabis-title">{route.h1}</h1>
            <h2 className="mt-10 font-display text-2xl uppercase text-po-brand">Opening</h2>
            <div className="mt-5 grid max-w-2xl gap-5 text-lg leading-8 text-po-on-dark-muted">
              <p>Presidential was founded in Los Angeles in 2012 with a clear focus: build infused cannabis around disciplined craft, recognizable formats, and a consistent house standard.</p>
              <p>More than a decade later, that California origin connects a 47-product catalog, six organized groupings, multiple infused formats, and an expanding licensed-retail presence across the United States.</p>
            </div>
          </div>
          <ImageGrid images={[images[0]]} priority />
        </div>
      </Scene>

      <TermSection id="presidential-cannabis-argument" images={[images[1]]} title="The argument">
        <p>The company began with the belief that infused cannabis could be treated as a complete product discipline. Flower selection, extract choice, kief, airflow, packaging, and finish all contribute to what reaches the customer.</p>
        <p>That view became the foundation for the Presidential Infusion System™, a house approach that carries concentrate through the flower and finishes the material with kief. The method supports the burn, flavor, and consistency expected from the Moon Rocks, pre-rolls, blunts, and Mini Blunts that carry the name.</p>
        <p>“Cannabis Evolved,” “Expect More,” and “Presidential Doesn&apos;t Miss” express the same operating idea in brand language: every format should feel intentional, every series should be easy to understand, and every release should belong inside one coherent catalog.</p>
      </TermSection>

      <TermSection id="presidential-cannabis-wholesale" images={[images[2]]} title="Wholesale only, on purpose" tone="contrast">
        <p>Presidential operates through licensed cannabis retail. The brand supplies the regulated market, and licensed stores provide the local shelf, customer service, and current selection for adults 21+ where legal.</p>
        <p>This structure gives every customer a direct path from official brand information to an approved retail destination. The nationwide finder accepts a ZIP code, ranks nearby locations by distance, and helps people plan the shortest practical route to a store carrying Presidential.</p>
        <p>The model also keeps the website focused on education, product discovery, brand history, and retailer connection. Visitors can understand the lineup here, then confirm the products and formats currently available with their chosen licensed retailer.</p>
      </TermSection>

      <TermSection id="presidential-cannabis-catalog" images={[images[3], images[4]]} title="What the company makes">
        <p><strong>47 products. Six groupings. One standard.</strong></p>
        <p>The catalog is organized to make the relationship between extract, profile, and format visible. Each grouping has a clear role while remaining part of the same Presidential product platform.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead><tr className="border-b border-po-line"><th className="px-3 py-3 font-display uppercase">Grouping</th><th className="px-3 py-3 font-display uppercase">Products</th></tr></thead>
            <tbody>
              <tr className="border-b border-po-line"><td className="px-3 py-3">Silver Flavor Series</td><td className="px-3 py-3">7</td></tr>
              <tr className="border-b border-po-line"><td className="px-3 py-3">Gold Strain Series</td><td className="px-3 py-3">19</td></tr>
              <tr className="border-b border-po-line"><td className="px-3 py-3">Rose Gold Connoisseur Series</td><td className="px-3 py-3">5</td></tr>
              <tr className="border-b border-po-line"><td className="px-3 py-3">Presidential Line</td><td className="px-3 py-3">10</td></tr>
              <tr className="border-b border-po-line"><td className="px-3 py-3">Presidential House Line</td><td className="px-3 py-3">3</td></tr>
              <tr><td className="px-3 py-3">Presidential x THC Design</td><td className="px-3 py-3">3</td></tr>
            </tbody>
          </table>
        </div>
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
        <p>Presidential has an active licensed-retail presence in California, Oklahoma, New York, Nevada, Michigan, Arizona, Florida, and Washington.</p>
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
