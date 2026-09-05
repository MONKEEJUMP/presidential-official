import Image from "next/image";
import Link from "next/link";

import { PageFrame } from "../layout/page-frame";
import { Scene } from "../layout/scene";
import { SceneStack } from "../layout/scene-stack";
import { CtaLink } from "../primitives/cta-link";
import { InContentText } from "../primitives/in-content-text";
import { ParentLearnGuideLink } from "./learn-guide-discovery";

const platforms = [
  {
    title: "MOON ROCKS™",
    tagline: '"The Highest Form Of Cannabis."',
    body: "The flagship, and the reason the name travels. Premium flower, rich resin, and a coat of the finest kief fused into one complete product — built to be experienced as a single thing rather than three. Available as moon rocks, blunts, pre-rolls, and mini blunts.",
    image: "/media/moonrock-cherrygelato.jpg" as const,
    imageAlt: "Cherry Gelato Presidential Moon Rocks package artwork",
    href: "/moon-rocks" as const,
  },
  {
    title: "PRESIDENTIAL BLUNTS",
    tagline: '"The format that built the reputation."',
    body: "A Presidential Blunt is the house method in its most complete form: flower, concentrate, and kief brought together in a single wrap, rolled to burn evenly and finish clean. The original argument — still winning it.",
    image: "/media/blunt-nino-brown.jpg" as const,
    imageAlt: "Nino Brown Presidential Moon Rock Blunt package artwork",
    href: "/moon-rocks/presidential-line-nino-brown" as const,
  },
  {
    title: "PRESIDENTIAL PRE-ROLLS",
    tagline: '"Everything the house does, ready when you are."',
    body: "The full method, packed and finished by hand — no compromise made for convenience, no step skipped for speed. The easy choice that gave up nothing.",
    image: "/media/preroll-cherry-gelato.jpg" as const,
    imageAlt: "Cherry Gelato Presidential Moon Rock Pre-roll package artwork",
    href: "/moon-rocks/cherry-gelato" as const,
  },
] as const;

const series = [
  {
    title: "SILVER FLAVOR SERIES",
    body: "Flavor-first and unapologetically fun. Bright, vivid, approachable — the easiest door into the house, and the hardest kind of flavor to get right.",
  },
  {
    title: "GOLD STRAIN SERIES",
    body: "Balanced. Authentic. Full-spectrum. Cannabis-forward. The strains people ask for by name, treated with the seriousness they stopped receiving years ago.",
  },
  {
    title: "ROSE GOLD CONNOISSEUR SERIES",
    body: "Solventless craft for people who taste everything. The most exacting work Presidential does, made for the ones who notice.",
  },
] as const;

const aboutCatalogPathCopy = [
  "[Head Cheese](/moon-rocks/presidential-line-head-cheese) appears in the collaboration roster with Polaris Cannabis.",
  "[Galactic Gas](/moon-rocks/galactic-gas) is one of the named-strain releases in the catalog.",
  "[Blue Dream](/moon-rocks/blue-dream) is treated as a cultivar, while Presidential remains the brand.",
  "[Wedding Cake](/moon-rocks/wedding-cake) sits in the Rose Gold collection.",
  "[King Louis](/moon-rocks/king-louis) carries another familiar cultivar name into the lineup.",
] as const;

function SectionIntro({
  eyebrow,
  title,
  intro,
  id,
  contrast = false,
  titleSize = "default",
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly intro?: string;
  readonly id: string;
  readonly contrast?: boolean;
  readonly titleSize?: "default" | "balanced" | "compact";
}) {
  const titleSizeClass =
    titleSize === "compact"
      ? "text-4xl sm:text-6xl lg:text-5xl xl:text-6xl"
      : titleSize === "balanced"
        ? "text-4xl sm:text-6xl lg:text-6xl xl:text-7xl"
        : "text-4xl sm:text-6xl lg:text-7xl";

  return (
    <div className="min-w-0 max-w-4xl">
      <p
        className={`text-xs font-black uppercase ${contrast ? "text-po-brand" : "text-po-brand-ink"}`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-5 font-display uppercase leading-[0.92] ${titleSizeClass} ${contrast ? "text-po-on-dark" : "text-po-ink"}`}
        id={id}
      >
        {title}
      </h2>
      {intro ? (
        <p
          className={`mt-7 max-w-3xl text-lg leading-8 ${contrast ? "text-po-on-dark-muted" : "text-po-body"}`}
        >
          {intro}
        </p>
      ) : null}
    </div>
  );
}

function AboutImage({
  alt,
  src,
  aspectClassName,
  className = "",
  contain = false,
}: {
  readonly alt: string;
  readonly src: `/${string}`;
  readonly aspectClassName: string;
  readonly className?: string;
  readonly contain?: boolean;
}) {
  return (
    <figure
      className={`relative overflow-hidden rounded-[20px] border border-po-brand bg-po-ink ${aspectClassName} ${className}`}
    >
      <Image
        alt={alt}
        className={contain ? "object-contain p-8 sm:p-12" : "object-contain"}
        fill
        sizes="(min-width: 1024px) 42vw, 100vw"
        src={src}
      />
    </figure>
  );
}

export function AboutCompanyShell() {
  return (
    <PageFrame>
      <SceneStack>
        <Scene
          ariaLabelledBy="about-company-title"
          className="py-20 sm:py-24 lg:py-32"
          tone="contrast"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.75fr)] lg:items-center lg:gap-20">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase text-po-brand">
                OFFICIAL PRESIDENTIAL
              </p>
              <h1
                className="mt-6 max-w-5xl font-display text-5xl uppercase leading-[0.88] text-po-on-dark sm:text-7xl lg:text-7xl xl:text-9xl"
                id="about-company-title"
              >
                BUILT BETTER. ON PURPOSE.
              </h1>
              <h2 className="mt-6 font-display text-xl uppercase tracking-wide text-po-brand">
                About the Presidential Cannabis Brand
              </h2>
              <p className="mt-8 max-w-3xl text-lg leading-8 text-po-on-dark-muted sm:text-xl sm:leading-9">
                Presidential exists because someone refused to accept what the market called good enough. Not better marketing — better cannabis. That standard has governed every decision since the first batch, and it still does: obsess over the material, engineer the experience, and never ship something that misses. Cannabis Deserves Better. That's not a tagline. It's the assignment. The full story — Los Angeles, 2012, and everything since — lives on the{" "}
                <Link
                  className="font-semibold text-po-brand underline decoration-po-brand/50 underline-offset-4 hover:decoration-po-brand"
                  href="/presidential-cannabis"
                >
                  Presidential Cannabis company page
                </Link>
                .
              </p>
            </div>

            <AboutImage
              alt="Presidential cannabis company crest logo"
              aspectClassName="aspect-[4/5]"
              contain
              src="/media/brand/presidential-crest-master.png"
            />
          </div>
        </Scene>

        <Scene
          ariaLabel="Presidential standard"
          className="po-gold-thread-inlay py-20 sm:py-24 lg:py-28"
          tone="contrast"
        >
          <blockquote className="mx-auto max-w-7xl font-display text-5xl uppercase leading-[0.9] text-po-brand sm:text-7xl lg:text-8xl">
            "Cannabis Deserves Better. Expect More."
          </blockquote>
        </Scene>

        <Scene
          ariaLabelledBy="about-platforms-title"
          className="po-gold-thread-inlay py-24 lg:py-32"
          tone="default"
        >
          <div className="mx-auto w-full max-w-7xl">
            <SectionIntro
              eyebrow="THE PLATFORMS"
              id="about-platforms-title"
              intro="Presidential doesn't make a catalog. It builds formats — each one engineered around a different way to experience the same obsession."
              title="THREE FORMATS. ONE STANDARD."
            />
            <div className="mt-14 grid gap-8 lg:grid-cols-3">
              {platforms.map((platform, index) => (
                <article className="border-t border-po-ink pt-5" key={platform.title}>
                  <p className="text-xs font-black text-po-brand-ink">
                    0{index + 1}
                  </p>
                  <Link
                    aria-label={`Explore ${platform.title}`}
                    className="group mt-6 block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-po-brand"
                    href={platform.href}
                  >
                    <AboutImage
                      alt={platform.imageAlt}
                      aspectClassName="aspect-square"
                      className="transition-transform duration-200 group-hover:-translate-y-1 motion-reduce:transition-none motion-reduce:group-hover:transform-none"
                      src={platform.image}
                    />
                    <h3 className="mt-7 font-display text-3xl uppercase leading-none text-po-ink transition-colors group-hover:text-po-brand-ink sm:text-4xl">
                      {platform.title}
                    </h3>
                    <p className="mt-3 text-lg font-semibold text-po-brand-ink">
                      {platform.tagline}
                    </p>
                    <p className="mt-5 text-base leading-7 text-po-body">
                      {platform.body}
                    </p>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </Scene>

        <Scene
          ariaLabelledBy="about-series-title"
          className="po-gold-thread-inlay py-24 lg:py-32"
          tone="contrast"
        >
          <div className="mx-auto w-full max-w-7xl">
            <SectionIntro
              contrast
              eyebrow="THE SERIES"
              id="about-series-title"
              intro="Every platform runs the same three series, so you always know what you're holding and why it's built that way."
              title="THREE SERIES. NO WEAK LINK."
            />
            <div className="mt-14 grid gap-10 lg:grid-cols-3">
              {series.map((item, index) => (
                <article className="border-t border-po-on-dark/30 pt-5" key={item.title}>
                  <p className="text-xs font-black text-po-brand">0{index + 1}</p>
                  <h3 className="mt-10 font-display text-3xl uppercase leading-none text-po-on-dark sm:text-4xl">
                    {item.title}
                  </h3>
                  <p className="mt-5 text-base leading-7 text-po-on-dark-muted">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {aboutCatalogPathCopy.map((copy) => (
                <p
                  className="border-l border-po-brand/60 pl-4 text-sm leading-6 text-po-on-dark-muted"
                  key={copy}
                >
                  <InContentText sourcePath="/about" value={copy} />
                </p>
              ))}
            </div>
          </div>
        </Scene>

        <Scene
          ariaLabelledBy="about-craft-title"
          className="po-gold-thread-inlay py-24 lg:py-32"
          tone="default"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.7fr)] lg:items-center lg:gap-20">
            <div>
              <SectionIntro
                eyebrow="HOW IT'S BUILT"
                id="about-craft-title"
                title="THE PRESIDENTIAL INFUSION SYSTEM™"
                titleSize="balanced"
              />
              <p className="mt-7 max-w-3xl text-lg leading-8 text-po-body">
                <InContentText
                  sourcePath="/about"
                  value="A Presidential Moon Rock isn't flower with something dusted on top. It's a system: premium flower, rich resin, and the finest kief brought together so the layers stop behaving like layers. Three components, one product, engineered to burn evenly and finish clean. That process has a name because it took years to earn one. Cannabis Evolved."
                />
              </p>
            </div>
            <AboutImage
              alt="Whoa Si Whoa Presidential Moon Rocks package artwork"
              aspectClassName="aspect-[4/3]"
              src="/media/moonrock-whoa-si-whoa.jpg"
            />
          </div>
        </Scene>

        <ParentLearnGuideLink parentPath="/about" />

        <Scene
          ariaLabel="Presidential promise"
          className="po-gold-thread-inlay py-20 sm:py-24 lg:py-28"
          tone="contrast"
        >
          <blockquote className="mx-auto max-w-7xl font-display text-5xl uppercase leading-[0.9] text-po-brand sm:text-7xl lg:text-8xl">
            "Presidential Doesn't Miss."
          </blockquote>
        </Scene>

        <Scene
          ariaLabelledBy="about-heritage-title"
          className="po-gold-thread-inlay py-24 lg:py-32"
          tone="default"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[minmax(260px,0.55fr)_1fr] lg:gap-20">
            <SectionIntro
              eyebrow="THE HERITAGE"
              id="about-heritage-title"
              title="TEN YEARS OF NOT SETTLING."
              titleSize="balanced"
            />
            <div className="lg:pt-8">
              <p className="max-w-3xl text-lg leading-8 text-po-body">
                It started in Los Angeles, and it started early — early enough to help shape what infused cannabis became. Presidential built a reputation the slow way: one pack at a time, in a market that rewarded shortcuts. The full story is worth reading on its own.
              </p>
              <CtaLink className="mt-8" href="/our-story" variant="secondary">
                Read the Presidential story
              </CtaLink>
            </div>
          </div>
        </Scene>

        <Scene
          ariaLabelledBy="about-culture-title"
          className="po-gold-thread-inlay py-24 lg:py-32"
          tone="contrast"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.7fr)] lg:items-center lg:gap-20">
            <div>
              <SectionIntro
                contrast
                eyebrow="BEYOND THE PRODUCT"
                id="about-culture-title"
                title="A BRAND THAT NEVER STAYED IN ITS LANE."
              />
              <p className="mt-7 max-w-3xl text-lg leading-8 text-po-on-dark-muted">
                Presidential has always treated experience as part of the product. In West Hollywood that meant Esco's, a New York–style pizzeria, and the Presidential Suite — a speakeasy-style lounge entered through an NYC subway car built inside the restaurant. A house this obsessed with how something feels was never going to stop at what's in the package.
              </p>
            </div>
            <AboutImage
              alt="Presidential pre-roll package artwork featuring the Los Angeles skyline"
              aspectClassName="aspect-[4/3]"
              src="/media/preroll-presidential.jpg"
            />
          </div>
        </Scene>

        <Scene
          ariaLabelledBy="about-retail-title"
          className="po-gold-thread-inlay py-24 lg:py-32"
          tone="default"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] lg:gap-20">
            <SectionIntro
              eyebrow="OFFICIAL RETAIL"
              id="about-retail-title"
              title="FIND PRESIDENTIAL NEAR YOU."
              titleSize="compact"
            />
            <div className="lg:pt-8">
              <p className="max-w-3xl text-lg leading-8 text-po-body">
                <InContentText
                  sourcePath="/about"
                  value="Presidential doesn't sell here — it points you to the shelf. Drop your zip code and the store finder maps the nearest licensed retailers carrying authentic product, coast to coast. No carts, no checkout, no guesswork. Availability varies by retailer."
                />
              </p>
              <CtaLink className="mt-8" href="/find-us" variant="primary">
                Find Presidential near you
              </CtaLink>
            </div>
          </div>
        </Scene>

        <Scene
          ariaLabelledBy="about-closing-title"
          className="po-gold-thread-inlay py-24 lg:py-32"
          tone="contrast"
        >
          <div className="mx-auto w-full max-w-7xl">
            <h2
              className="font-display text-6xl uppercase leading-[0.86] text-po-brand sm:text-8xl lg:text-9xl"
              id="about-closing-title"
            >
              EXPECT MORE.
            </h2>
            <p className="mt-7 text-xl text-po-on-dark sm:text-2xl">
              Then. Now. &amp; Next.
            </p>
          </div>
        </Scene>
      </SceneStack>
    </PageFrame>
  );
}
