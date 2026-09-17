import Image from "next/image";
import Link from "next/link";

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
import { ParentLearnGuideLink } from "./learn-guide-discovery";
import { MoonRocksGraphicsGrid } from "./moon-rocks-graphics-grid";

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
    body: "A focused path for blunt-format interest without sending visitors away from the official Presidential site.",
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
] as const;

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
  const activeItems = placements.filter(({ resolution }) => !resolution.entry.retired);
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
              value={route.description}
            />,
            "Moon Rocks is the flagship Presidential product platform for pre-rolls, blunts, learning, and licensed retailer discovery.",
          ]}
          title={route.h1}
        />

        <MoonRocksGraphicsGrid />

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
                Silver, Gold, and Rose Gold series — one official catalog.
                Choose a series to explore every strain. Availability varies
                by licensed retailer.
              </p>
            </div>

            <div className={shared.tierSections}>
              {TIER_SECTION_ORDER.map((section) => {
                const entries = itemsFor(section);
                if (entries.length === 0) return null;
                return (
                  <section className={shared.tierSection} key={section}>
                    <TierSectionHeader
                      buttonLabel={tierLinks[section][1]}
                      href={tierLinks[section][0]}
                      section={section}
                    />
                    <div className={`${shared.artGrid} ${shared.tierGrid}`}>
                      {entries.map(({ item, resolution }) => {
                        const slug = catalogItemSlug(item);
                        const art = resolveMoonRocksCardArt(item, slug);
                        const spec = productSpec(item.productType);
                        const description = descriptionExcerpt(item.description);
                        return (
                          <article className={shared.artCardSquare} key={item._id}>
                            <Link
                              aria-label={`View ${resolution.entry.displayName || item.name || slug} product page`}
                              className={shared.artCardImage}
                              href={`/moon-rocks/${slug}`}
                            >
                              {section === "collabs" ? (
                                <TierBadge tier={resolution.entry.tierBadge} />
                              ) : null}
                              {art ? (
                                <Image
                                  alt={`${resolution.entry.displayName || item.name || slug} Moon Rocks packaging`}
                                  fill
                                  sizes="(max-width: 700px) 46vw, (max-width: 1100px) 44vw, 29vw"
                                  src={art.src}
                                />
                              ) : null}
                            </Link>
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
                      const art = resolveMoonRocksCardArt(item, slug);
                      const spec = productSpec(item.productType);
                      const description = descriptionExcerpt(item.description);
                      return (
                        <article className={shared.artCardSquare} key={item._id}>
                          <Link
                            aria-label={`View ${resolution.entry.displayName || item.name || slug} product page`}
                            className={shared.artCardImage}
                            href={`/moon-rocks/${slug}`}
                          >
                            {art ? (
                              <Image
                                alt={`${resolution.entry.displayName || item.name || slug} Moon Rocks packaging`}
                                fill
                                sizes="(max-width: 700px) 46vw, (max-width: 1100px) 44vw, 29vw"
                                src={art.src}
                              />
                            ) : null}
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
                  transaction surface.
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

        <FindUsCtaShell className="po-gold-thread-inlay" compact />
      </SceneStack>
    </PageFrame>
  );
}
