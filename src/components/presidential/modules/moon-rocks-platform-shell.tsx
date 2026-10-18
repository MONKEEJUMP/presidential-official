import Image from "next/image";
import Link from "next/link";
import {
  ExperienceEveryMomentBand,
  MoonRocksPlatformBand,
} from "@/components/ecosystem/ecosystem-bands";

import {
  catalogItemSlug,
  readDraftCatalogItems,
  readPublicRenderableCatalogItems,
  type SanityCatalogItem,
} from "@/lib/cms/catalog";
import {
  TIER_SECTION_ORDER,
  resolveCatalogTier,
  type CatalogTierSection,
} from "@/lib/catalog/tier-map";
import { resolveMoonRocksCardArt } from "@/lib/catalog/moon-rocks-card-art";
import type { SeoRouteRecord } from "@/lib/seo/route-types";

import { TierBadge, TierSectionHeader } from "../catalog/tier-section";
import { PageFrame } from "../layout/page-frame";
import { Scene } from "../layout/scene";
import { SceneStack } from "../layout/scene-stack";
import { SiteVideo } from "../media/site-video";
import { CtaLink } from "../primitives/cta-link";
import { InContentText } from "../primitives/in-content-text";
import shared from "../prerolls/preroll-experience.module.css";
import { DispensariesStyleHero } from "./dispensaries-style-hero";
import { FindUsCtaShell } from "./find-us-cta-shell";
import { AnswerSections } from "./answer-sections";
import { ParentLearnGuideLink } from "./learn-guide-discovery";
import { MOON_ROCKS_ANSWERS } from "./salvage-content";
import { sanityImage } from "@/lib/cms/sanity-image";

type MoonRocksBreadcrumb = {
  readonly name: string;
  readonly path: string;
};

type MoonRocksPlatformShellProps = {
  readonly route: SeoRouteRecord;
  readonly breadcrumbs: readonly MoonRocksBreadcrumb[];
};

const productLanes = [
  {
    title: "Infused pre-rolls",
    body: "A clear product lane for Presidential pre-rolls, Moon Rocks education, and retailer discovery.",
  },
  {
    title: "Moon Rock blunts",
    body: "Moon Rocks rolled in a tobacco-free hemp wrap.",
  },
  {
    title: "Series architecture",
    body: "Silver, Gold, and Rose Gold lanes give the product catalog room to grow as official product details are added.",
  },
] as const;

const moonRocksCatalogPathCopy = [
  "The [Presidential Line](/moon-rocks/presidential-line) provides one route through the broader catalog.",
  "[White Walker](/moon-rocks/white-walker) has its own product entry in the lineup.",
  "[Iced Lemon](/moon-rocks/presidential-line-iced-lemon) appears among the collaboration releases.",
  "[Rainbow Belts](/moon-rocks/rainbow-belts) carries another named product path.",
  "[Guava Haze](/moon-rocks/presidential-line-guava-haze) adds another collaboration product page to explore.",
  "[Gorilla Goo Moon Rocks](/moon-rocks/gorilla-goo) sit in the Gold Strain Series.",
  "[Cherry Gelato Moon Rocks](/moon-rocks/cherry-gelato) is one of the collaboration releases.",
] as const;

const FLAVOR_SERIES_LABELS = {
  silver: "Silver Flavor Series",
  gold: "Gold Strain Series",
  "rose-gold": "Rose Gold Connoisseur Series",
  collabs: "Collaborations",
  more: "More from Presidential",
} as const;

// Every tier, including "more" (Presidential Line and House Line flavors such as Guava Haze).
const FLAVOR_LIST_SECTIONS = [...TIER_SECTION_ORDER, "more"] as const;
// Format-only rows, not named flavors: the House Line and THC Design format SKUs (and the HOLD blunts page).
const FLAVOR_LIST_EXCLUDED_SLUGS = new Set([
  "presidential-blunts",
  "presidential-moon-rocks",
  "presidential-prerolls",
  "thc-design-blunts",
  "thc-design-moon-rocks",
  "thc-design-prerolls",
]);

const ecosystemSteps = [
  "Learn what Moon Rocks are",
  "Explore related Presidential platforms",
  "Find licensed retailers",
] as const;

function productSpec(productType: string | undefined) {
  if (!productType || /multi[ -]?format|reviewer/i.test(productType)) return null;
  if (/pre[ -]?roll.*blunt.*moon rocks?/i.test(productType)) return null;
  return productType;
}

function descriptionExcerpt(description: string | undefined) {
  if (!description) return null;

  const clean = description
    .split(/\bSOURCE:/i)[0]
    .replace(/\*\*|__|`|#{1,6}\s*/g, "")
    .replace(/^\s*\|.*\|\s*$/gm, "")
    .replace(/\s+/g, " ")
    .trim();

  if (clean.length <= 300) return clean;
  const clipped = clean.slice(0, 300);
  return `${clipped.slice(0, clipped.lastIndexOf(" "))}…`;
}

async function readCatalogForShell(): Promise<readonly SanityCatalogItem[]> {
  const publicCatalog = await readPublicRenderableCatalogItems("/moon-rocks", {
    next: { tags: ["sanity-catalog-moon-rocks"] },
  });
  if (publicCatalog.items.length > 0) {
    return publicCatalog.items;
  }

  const draftCatalog = await readDraftCatalogItems("/moon-rocks", {
    next: { tags: ["sanity-catalog-moon-rocks-drafts"] },
  });
  if (draftCatalog.ok && draftCatalog.items.length > 0) {
    return draftCatalog.items;
  }

  return [];
}

export async function MoonRocksPlatformShell({
  route,
  breadcrumbs,
}: MoonRocksPlatformShellProps) {
  if (route.id !== "moon-rocks") {
    throw new Error("MoonRocksPlatformShell requires the Moon Rocks route record.");
  }

  const catalogItems = await readCatalogForShell();
  const placements = catalogItems.map((item) => ({
    item,
    resolution: resolveCatalogTier({
      line: "moon-rocks",
      series: item.series,
      slug: catalogItemSlug(item),
    }),
  }));
  const activeItems = placements.filter(
    ({ resolution }) => !resolution.entry.retired && resolution.entry.hasArt,
  );
  const activeItemsWithoutArt = placements.filter(
    ({ resolution }) => !resolution.entry.retired && !resolution.entry.hasArt,
  );
  const itemsFor = (section: CatalogTierSection) =>
    activeItems
      .filter(({ resolution }) => resolution.entry.section === section);
  const tierLinks = {
    silver: ["/moon-rocks/silver", "Explore Silver Moon Rocks"],
    gold: ["/moon-rocks/gold", "Explore Gold Moon Rocks"],
    "rose-gold": ["/moon-rocks/rose-gold", "Explore Rose Gold Moon Rocks"],
    collabs: ["/moon-rocks/presidential-x-thc-design", "Explore the Collaboration"],
  } as const;

  return (
    <PageFrame>
      <SceneStack>
        <DispensariesStyleHero
          ariaLabelledBy="presidential-moon-rocks-title"
          breadcrumbs={breadcrumbs}
          ctas={[
            {
              href: "/find-us",
              label: "Find Presidential products",
              tone: "primary",
            },
            {
              href: "/learn",
              label: "Learn about Moon Rocks",
              tone: "secondary",
            },
          ]}
          eyebrow="Presidential product platform"
          supportingText={[
            "The Highest Form Of Cannabis.",
            <InContentText
              key="moon-rocks-description"
              sourcePath="/moon-rocks"
              value="Explore the Presidential Moon Rocks product platform. Availability varies by state and licensed retailer."
            />,
            "Moon Rocks is the flagship Presidential product platform for pre-rolls, blunts, learning, and licensed retailer discovery.",
          ]}
          title={route.h1}
        />

        <MoonRocksPlatformBand />

        <div className={`${shared.page} po-gold-thread-inlay`}>
          <section
            aria-labelledby="presidential-moon-rocks-catalog"
            className={shared.artIndex}
          >
            <div className={shared.indexIntro}>
              <div>
                <p>The catalog</p>
                <h2
                  className={shared.moonRocksCatalogTitle}
                  id="presidential-moon-rocks-catalog"
                >
                  Every<br />Presidential strain.
                </h2>
              </div>
              <p>
                Presidential Moon Rock flavors and strains in the Silver, Gold,
                and Rose Gold series — one official catalog. Choose a series to
                explore every strain. Availability varies
                by licensed retailer.
              </p>
              {/* INLINKS-COPY-R12: build and where-to-buy sections (facts from series data, /about, the 2G MOON ROCKS label and /find-us). */}
              <h3 className="mt-8 text-2xl font-semibold leading-snug">How Presidential Moon Rocks are made</h3>
              <p className="mt-3">
                Every Presidential Moon Rock starts with flower. Concentrate is added, then a kief finish. What separates the
                series is the concentrate: Silver is the Flavor Series built on distillate, Gold is the Strain Series built on
                live resin, and Rose Gold is the Connoisseur Series built on live rosin. Each guide explains its concentrate:{" "}
                <Link className="font-semibold underline underline-offset-4" href="/learn/what-is-thc-distillate">what is THC distillate</Link>,{" "}
                <Link className="font-semibold underline underline-offset-4" href="/learn/what-is-live-resin">what is live resin</Link> and{" "}
                <Link className="font-semibold underline underline-offset-4" href="/learn/what-is-live-rosin">what is live rosin</Link>.{" "}
                <Link className="font-semibold underline underline-offset-4" href="/learn/what-are-moon-rocks">What are moon rocks</Link> covers the format from the beginning.
              </p>
              <p className="mt-3">
                The same build carries across the formats, from the 2G Moon Rock to the Moon Rock Preroll and the Moon
                Rock Blunt, and each one comes in Silver, Gold and Rose Gold. Read why{" "}
                <Link className="font-semibold underline underline-offset-4" href="/learn/different-extracts-need-different-heat">different extracts need different heat</Link>.
                Cannabinoid and THC figures come from the current package and its batch test record, not from this page.
              </p>
              {/* SURFER-R19: recognizing the series on a pack, from /moon-rocks/rose-gold, /about and /moon-rocks. */}
              <h3 className="mt-8 text-2xl font-semibold leading-snug">How do you recognize the series on a pack?</h3>
              <p className="mt-3">
                Every Presidential pack carries the same architecture regardless of series: the silver crown crest with the
                PRESIDENTIAL banner, the strain type in script, the product name, and the format and weight. The series shows in
                the name and the art. The{" "}
                <Link className="font-semibold underline underline-offset-4" href="/moon-rocks/silver">Silver Flavor Series moon rocks</Link>{" "}
                name a flavor, Gold names a strain, and the{" "}
                <Link className="font-semibold underline underline-offset-4" href="/moon-rocks/rose-gold">Rose Gold Connoisseur Series</Link>{" "}
                carries the connoisseur names, built on live rosin; see{" "}
                <Link className="font-semibold underline underline-offset-4" href="/learn/what-is-live-rosin">what live rosin is</Link>. Gold
                packs such as 24K and Blue Dream print FLOWER · LIVE RESIN · DIAMONDS.
              </p>
              <h3 className="mt-8 text-2xl font-semibold leading-snug">Where to buy, and what it costs</h3>
              <p className="mt-3">
                Presidential Moon Rocks are sold only at licensed retailers, in person, to adults 21+ where it&apos;s legal.
                There&apos;s no online checkout on this site. Prices are set by each retailer, so the price and the stock on
                hand vary from store to store and state to state. To find a store near you, including in California and Los
                Angeles, use <Link className="font-semibold underline underline-offset-4" href="/find-us">Find a Store</Link>. Retail partners can email
                sales@presidentialmoonrocks.com or start on the <Link className="font-semibold underline underline-offset-4" href="/wholesale">Wholesale</Link> page.
              </p>
              {/* SURFER-R25: /moon-rocks menu-name H3 (facts from the home "Retail menus often list it as Presidential THC" line and this page's pack/series answers). One full-width grid item (indexIntroQa) keeps the question with its answer; its paragraph gets the same body styling as .indexIntro > p. */}
              <section className={shared.indexIntroQa}>
                <h3 className="mt-8 text-2xl font-semibold leading-snug">What are Presidential Moon Rocks called on a dispensary menu?</h3>
                <p className="mt-3">
                  Retail menus often list them as{" "}
                  <Link className="font-semibold underline underline-offset-4" href="/presidential-thc">Presidential THC</Link>, under the product name and the series.
                  Look for the strain or flavor name, the tier (Silver is distillate, Gold is live resin, Rose Gold is live rosin) and
                  the format, such as the 2G Moon Rocks jar. Some menus file moon rocks under infused flower; read{" "}
                  <Link className="font-semibold underline underline-offset-4" href="/learn/what-are-moon-rocks">what moon rocks are</Link> for the build. The pack confirms it: the
                  crown crest, the PRESIDENTIAL banner and the product name. Presidential is carried by licensed retailers in{" "}
                  <Link className="font-semibold underline underline-offset-4" href="/find-us">select state markets</Link>.
                </p>
              </section>
            </div>

            <div className={shared.tierSections}>
              {TIER_SECTION_ORDER.map((section) => {
                const entries = itemsFor(section);
                return (
                  <section className={shared.tierSection} key={section}>
                    <TierSectionHeader
                      buttonLabel={tierLinks[section][1]}
                      href={tierLinks[section][0]}
                      section={section}
                    />
                    {entries.length > 0 ? (
                      <div className={`${shared.artGrid} ${shared.tierGrid}`}>
                        {entries.map(({ item, resolution }) => {
                          const slug = catalogItemSlug(item);
                          const art = resolveMoonRocksCardArt(slug);
                          if (!art) return null;
                          const spec = productSpec(item.productType);
                          const description = descriptionExcerpt(item.description);
                          return (
                            <article className={shared.artCardSquare} key={item._id}>
                              {/* InLinks MR1: the tier badge sits outside the link, so "gold" is not anchor text for SKU pages. */}
                              <div className="relative">
                              {section === "collabs" ? (
                                <span className="pointer-events-none">
                                  <TierBadge tier={resolution.entry.tierBadge} />
                                </span>
                              ) : null}
                              <Link
                                aria-label={`View ${resolution.entry.displayName || item.name || slug} product page`}
                                className={`${shared.artCardImage} ${shared.moonRocksCardImage}`}
                                href={`/moon-rocks/${slug}`}
                              >
                                <Image
                                  alt={`${resolution.entry.displayName || item.name || slug} Moon Rocks packaging`}
                                  className={shared.moonRocksCardArt}
                                  fill
                                  sizes="(max-width: 700px) 46vw, (max-width: 1100px) 44vw, 29vw"
                                  {...sanityImage(art.src)}
                                />
                              </Link>
                              </div>
                              <div className={shared.artCardCopy}>
                                <p>Presidential Moon Rocks</p>
                                <h3>{resolution.entry.displayName || item.name || slug}</h3>
                                {resolution.entry.collabPartner ? (
                                  <strong className={shared.collabPartner}>
                                    with {resolution.entry.collabPartner}
                                  </strong>
                                ) : null}
                                {spec ? <span>{spec}</span> : null}
                                {description ? <p>{description}</p> : null}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ) : null}
                  </section>
                );
              })}

              {itemsFor("more").length > 0 ? (
                <section className={shared.tierSection}>
                  <header className={shared.moreHeader}>
                    <h2>More from Presidential</h2>
                  </header>
                  <div className={`${shared.artGrid} ${shared.tierGrid}`}>
                    {itemsFor("more").map(({ item, resolution }) => {
                      const slug = catalogItemSlug(item);
                      const art = resolveMoonRocksCardArt(slug);
                      if (!art) return null;
                      const spec = productSpec(item.productType);
                      const description = descriptionExcerpt(item.description);
                      return (
                        <article className={shared.artCardSquare} key={item._id}>
                          <Link
                            aria-label={`View ${resolution.entry.displayName || item.name || slug} product page`}
                            className={`${shared.artCardImage} ${shared.moonRocksCardImage}`}
                            href={`/moon-rocks/${slug}`}
                          >
                            <Image
                              alt={`${resolution.entry.displayName || item.name || slug} Moon Rocks packaging`}
                              className={shared.moonRocksCardArt}
                              fill
                              sizes="(max-width: 700px) 46vw, (max-width: 1100px) 44vw, 29vw"
                              {...sanityImage(art.src)}
                            />
                          </Link>
                          <div className={shared.artCardCopy}>
                            <p>Presidential Moon Rocks</p>
                            <h3>{resolution.entry.displayName || item.name || slug}</h3>
                            {spec ? <span>{spec}</span> : null}
                            {description ? <p>{description}</p> : null}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  <div className="mt-10 flex flex-wrap gap-6 text-xs font-black uppercase tracking-[0.08em] text-po-brand">
                    <Link className="underline underline-offset-8" href="/moon-rocks/presidential-line">Explore the Presidential Line</Link>
                    <Link className="underline underline-offset-8" href="/moon-rocks/presidential-house-line">Explore the Presidential House Line</Link>
                    {activeItemsWithoutArt.map(({ item, resolution }) => (
                      <Link className="underline underline-offset-8" href={`/moon-rocks/${catalogItemSlug(item)}`} key={item._id}>
                        {/* MR-TOP50 A4: the bare "Presidential Prerolls" anchor belongs to /pre-rolls queries. */}
                        {catalogItemSlug(item) === "presidential-prerolls"
                          ? "Presidential Prerolls Moon Rocks"
                          : resolution.entry.displayName || item.name || catalogItemSlug(item)}
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {moonRocksCatalogPathCopy.map((copy) => (
                <p
                  className="border-l border-po-brand pl-4 text-sm leading-6 text-po-on-dark-muted"
                  key={copy}
                >
                  <InContentText sourcePath="/moon-rocks" value={copy} />
                </p>
              ))}
            </div>
          </section>
        </div>

        <Scene
          ariaLabelledBy="presidential-moon-rocks-packaging"
          className="po-gold-thread-inlay py-24 lg:py-32"
          tone="contrast"
        >
          <div className="mx-auto w-full max-w-7xl">
            <p className="text-xs font-black uppercase text-po-brand">
              The packaging
            </p>
            <h2
              className="mt-5 max-w-3xl font-display text-4xl uppercase leading-[0.92] text-po-on-dark sm:text-6xl"
              id="presidential-moon-rocks-packaging"
            >
              Built to be seen
            </h2>
            <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,0.6fr)]">
              <div className="overflow-hidden border border-po-on-dark/20">
                <SiteVideo
                  className="aspect-video h-full w-full object-cover"
                  label="Presidential strain packaging film, widescreen loop"
                  slug="strains-horizontal"
                />
              </div>
              <div className="overflow-hidden border border-po-on-dark/20">
                <SiteVideo
                  className="aspect-[9/16] h-full w-full object-cover"
                  label="Presidential strain packaging film, portrait loop"
                  slug="strains-vertical"
                />
              </div>
            </div>
          </div>
        </Scene>

        <Scene
          ariaLabelledBy="presidential-moon-rocks-lanes"
          className="po-gold-thread-inlay py-24 lg:py-32"
          tone="contrast"
        >
          <div className="mx-auto w-full max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[minmax(260px,0.55fr)_1fr] lg:gap-20">
              <div>
                <p className="text-xs font-black uppercase text-po-brand">
                  Product architecture
                </p>
                <h2
                  className="mt-5 font-display text-4xl uppercase leading-[0.92] text-po-on-dark sm:text-6xl"
                  id="presidential-moon-rocks-lanes"
                >
                  Inside the Moon Rocks platform
                </h2>
                <p className="mt-6 max-w-md text-base leading-7 text-po-on-dark-muted">
                  Product education, format clarity, related platforms, and
                  retail discovery live here without turning the page into a
                  transaction surface. Read more{" "}
                  <Link className="font-semibold text-po-brand underline underline-offset-4" href="/about">
                    about the Presidential cannabis brand
                  </Link>
                  .
                </p>
              </div>
              <div className="grid gap-10 sm:grid-cols-3">
                {productLanes.map((lane, index) => (
                  <article
                    className="border-t border-po-on-dark/20 pt-5"
                    key={lane.title}
                  >
                    <p className="text-xs font-black text-po-brand">
                      0{index + 1}
                    </p>
                    <h3 className="mt-10 text-xl font-semibold leading-snug text-po-on-dark">
                      {lane.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-po-on-dark-muted">
                      {lane.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </Scene>

        {/* MR-ABOUT-MOONROCKS: the flavor pages by series, from the same live catalog as the cards above. */}
        <Scene
          ariaLabelledBy="presidential-moon-rock-flavors"
          className="po-gold-thread-inlay py-24 lg:py-32"
          tone="default"
        >
          <div className="mx-auto w-full max-w-4xl">
            <h2
              className="font-display text-3xl uppercase leading-[0.95] text-po-ink sm:text-4xl"
              id="presidential-moon-rock-flavors"
            >
              Presidential Moon Rock Flavors
            </h2>
            <p className="mt-5 text-base leading-7 text-po-body">
              What flavors do Presidential Moon Rocks come in? Each Presidential moonrock carries one named flavor or strain,
              listed here by series.
            </p>
            <dl className="mt-8 grid gap-6 text-base leading-7 text-po-body">
              {FLAVOR_LIST_SECTIONS.map((section) => {
                // Every non-retired catalog entry, with or without card art.
                const entries = placements.filter(
                  ({ item, resolution }) =>
                    !resolution.entry.retired &&
                    resolution.entry.section === section &&
                    !FLAVOR_LIST_EXCLUDED_SLUGS.has(catalogItemSlug(item)),
                );
                if (entries.length === 0) return null;
                return (
                  <div key={section}>
                    <dt className="font-semibold text-po-ink">{FLAVOR_SERIES_LABELS[section]}</dt>
                    <dd className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                      {entries.map(({ item, resolution }) => (
                        <Link
                          className="font-semibold text-po-ink underline decoration-po-brand underline-offset-4"
                          href={`/moon-rocks/${catalogItemSlug(item)}`}
                          key={item._id}
                        >
                          {resolution.entry.displayName || item.name || catalogItemSlug(item)}
                        </Link>
                      ))}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        </Scene>

        <AnswerSections eyebrow="Presidential Moon Rocks questions" id="moon-rocks-answers" items={MOON_ROCKS_ANSWERS} />

        <ParentLearnGuideLink parentPath="/moon-rocks" />

        <Scene
          ariaLabelledBy="presidential-moon-rocks-journey"
          className="po-gold-thread-inlay py-24 lg:py-32"
          tone="contrast"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(360px,0.65fr)] lg:items-end lg:gap-24">
            <div>
              <p className="text-xs font-black uppercase text-po-brand">
                Explore Presidential
              </p>
              <h2
                className="mt-5 font-display text-4xl uppercase leading-[0.92] text-po-on-dark sm:text-6xl lg:text-7xl"
                id="presidential-moon-rocks-journey"
              >
                A cleaner customer path
              </h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-po-on-dark-muted">
                Move from product understanding to related Presidential
                platforms and licensed retail discovery through one official
                source.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <CtaLink href="/moon-pods" variant="contrast">
                  Explore Moon Pods
                </CtaLink>
                <CtaLink href="/orbit" variant="contrast">
                  Explore Orbit
                </CtaLink>
              </div>
            </div>

            <ol className="border-t border-po-on-dark/20">
              {ecosystemSteps.map((step, index) => (
                <li
                  className="flex items-center gap-5 border-b border-po-on-dark/20 py-6 text-sm font-semibold text-po-on-dark"
                  key={step}
                >
                  <span
                    aria-hidden="true"
                    className="text-xs font-black text-po-brand"
                  >
                    0{index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </Scene>

        <ExperienceEveryMomentBand scope="moon-rocks" />

        <FindUsCtaShell className="po-gold-thread-inlay" compact />
      </SceneStack>
    </PageFrame>
  );
}
