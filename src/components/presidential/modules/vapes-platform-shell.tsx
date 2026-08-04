import Link from "next/link";

import type { SeoRouteRecord } from "@/lib/seo/route-types";

import { PageFrame } from "../layout/page-frame";
import { Scene } from "../layout/scene";
import { SceneStack } from "../layout/scene-stack";
import { CtaLink } from "../primitives/cta-link";
import { DispensariesStyleHero } from "./dispensaries-style-hero";

type VapesBreadcrumb = {
  readonly name: string;
  readonly path: string;
};

type VapesPlatformShellProps = {
  readonly route: SeoRouteRecord;
  readonly breadcrumbs: readonly VapesBreadcrumb[];
};

const platforms = [
  {
    href: "/moon-pods",
    title: "MOON PODS™",
    tagline: '"The Strongest Flavor Experience."',
    body: "The vape expression of everything Presidential has spent a decade proving. Built around flavor rather than around a spec sheet — because a number on a label has never once tasted like anything. Moon Pods carry the house standard into a format made for the pocket.",
  },
  {
    href: "/orbit",
    title: "ORBIT™",
    tagline: '"Designed For Flavor."',
    body: "Orbit is the technology that makes Moon Pods perform. Hardware is not an accessory to the oil — it is half the experience. Heat the material wrong and the best extract in the room tastes like nothing. Orbit exists so that never happens.",
  },
] as const;

const cartridgeStandards = [
  {
    title: "THE HARDWARE",
    body: "A cartridge is a heating system, not a container. Ceramic heating elements have replaced the old metal-coil-and-wick design for a reason: ceramic heats evenly, resists cracking under repeated use, and vaporizes oil without scorching it. Cheap hardware burns terpenes, clogs in cold weather, and shortens the life of the cart. Glass tanks and ceramic elements are the baseline — anything less is a compromise you can taste.",
  },
  {
    title: "THE EXTRACT",
    body: "Live resin is made from fresh-frozen flower, which preserves the terpene profile the plant actually produced. Distillate is stripped and rebuilt — cleaner and more consistent, but flatter. Neither is wrong; they're different tools. What matters is knowing which one you're holding and why. A cartridge that won't tell you is telling you something.",
  },
  {
    title: "THE TERPENES",
    body: "Terpenes are why a Blue Dream cart should not taste like a Wedding Cake cart. Strain character lives in the terpene profile, not the potency percentage. When a cartridge tastes like candy instead of cannabis, that's usually botanical flavoring standing in for the real thing. The plant is more interesting than the substitute.",
  },
  {
    title: "THE TESTING",
    body: "Full-panel lab results are non-negotiable: potency, pesticides, heavy metals, and residual solvents, tested per batch. A brand that publishes a potency graph but not a complete certificate of analysis is showing you the flattering half. Consistency is the tell — good brands don't have good batches and bad batches.",
  },
] as const;

const useDetails = [
  {
    title: "MIND THE VOLTAGE",
    body: "Higher is not better. Live resin and terpene-rich oils want a lower setting; run them hot and you burn off the exact compounds you paid for. Distillate tolerates more heat. If a cartridge tastes scorched, the battery is usually the culprit, not the oil.",
  },
  {
    title: "STORE IT UPRIGHT",
    body: "Left on its side, oil migrates into the mouthpiece and the airway floods. Upright, at room temperature, is the whole maintenance routine.",
  },
  {
    title: "WARM IT FIRST",
    body: "Thick oil in a cold cartridge is the most common cause of a clog and a weak first pull. Most batteries have a preheat function. Ten seconds solves a problem people usually blame on the cart.",
  },
] as const;

function SectionHeader({
  eyebrow,
  id,
  intro,
  title,
  contrast = false,
}: {
  readonly eyebrow: string;
  readonly id: string;
  readonly intro?: string;
  readonly title: string;
  readonly contrast?: boolean;
}) {
  return (
    <header className="max-w-5xl">
      <p
        className={`text-xs font-black uppercase ${contrast ? "text-po-brand" : "text-po-brand-ink"}`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-5 max-w-[15ch] font-display text-4xl uppercase leading-[0.9] sm:text-6xl lg:text-8xl ${contrast ? "text-po-on-dark" : "text-po-ink"}`}
        id={id}
      >
        {title}
      </h2>
      {intro ? (
        <p
          className={`mt-7 max-w-4xl text-lg leading-8 sm:text-xl sm:leading-9 ${contrast ? "text-po-on-dark-muted" : "text-po-body"}`}
        >
          {intro}
        </p>
      ) : null}
    </header>
  );
}

export function VapesPlatformShell({
  breadcrumbs,
  route,
}: VapesPlatformShellProps) {
  return (
    <PageFrame>
      <SceneStack>
        <DispensariesStyleHero
          ariaLabelledBy="vapes-platform-title"
          breadcrumbs={breadcrumbs}
          ctas={[
            {
              href: "/find-us",
              label: "Find Presidential products",
              tone: "primary",
            },
            {
              href: "/learn",
              label: "Learn Presidential",
              tone: "secondary",
            },
          ]}
          eyebrow="PRESIDENTIAL PRODUCT PLATFORM"
          supportingText={[
            "Presidential built its name on making cannabis better than it had to be. The vape platform carries the same assignment: real extract, real flavor, and hardware that does the material justice. Two platforms, one standard — engineered for the way people actually move.",
          ]}
          title={route.h1}
        />

        <Scene
          ariaLabelledBy="vapes-platforms-title"
          className="po-gold-thread-inlay py-24 lg:py-32"
          tone="default"
        >
          <div className="mx-auto w-full max-w-7xl">
            <SectionHeader
              eyebrow="THE LINEUP"
              id="vapes-platforms-title"
              title="TWO PLATFORMS. ONE STANDARD."
            />
            <div className="mt-14 grid gap-6 lg:grid-cols-2">
              {platforms.map((platform, index) => (
                <Link
                  aria-label={`Explore ${platform.title}`}
                  className="group block rounded-md border border-po-brand bg-po-ink p-7 transition-transform duration-200 hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-po-brand motion-reduce:transition-none motion-reduce:hover:transform-none motion-reduce:focus-visible:transform-none sm:p-10"
                  href={platform.href}
                  key={platform.href}
                >
                  <p className="text-xs font-black text-po-brand">
                    0{index + 1}
                  </p>
                  <h3 className="mt-12 font-display text-4xl uppercase leading-[0.9] text-po-on-dark transition-colors group-hover:text-po-brand sm:text-6xl">
                    {platform.title}
                  </h3>
                  <p className="mt-5 text-lg font-semibold text-po-brand">
                    {platform.tagline}
                  </p>
                  <p className="mt-7 max-w-2xl text-base leading-7 text-po-on-dark-muted sm:text-lg sm:leading-8">
                    {platform.body}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </Scene>

        <Scene
          ariaLabelledBy="vapes-standard-title"
          className="po-gold-thread-inlay py-24 lg:py-32"
          tone="contrast"
        >
          <div className="mx-auto w-full max-w-7xl">
            <SectionHeader
              contrast
              eyebrow="WHAT ACTUALLY MATTERS"
              id="vapes-standard-title"
              intro="Most cartridge marketing points at one number. Potency is the easiest thing to print and the least useful thing to know. Here is what separates a cartridge worth owning from one that disappoints on the third pull."
              title="HOW TO JUDGE A VAPE CARTRIDGE."
            />
            <div className="mt-16 grid gap-x-10 gap-y-14 md:grid-cols-2">
              {cartridgeStandards.map((standard, index) => (
                <article
                  className="border-t border-po-brand pt-5"
                  key={standard.title}
                >
                  <p className="text-xs font-black text-po-brand">
                    0{index + 1}
                  </p>
                  <h3 className="mt-10 font-display text-3xl uppercase leading-none text-po-on-dark sm:text-4xl">
                    {standard.title}
                  </h3>
                  <p className="mt-6 text-base leading-7 text-po-on-dark-muted sm:text-lg sm:leading-8">
                    {standard.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </Scene>

        <Scene
          ariaLabelledBy="vapes-details-title"
          className="po-gold-thread-inlay py-24 lg:py-32"
          tone="default"
        >
          <div className="mx-auto w-full max-w-7xl">
            <SectionHeader
              eyebrow="THE DETAILS"
              id="vapes-details-title"
              title="SMALL THINGS THAT CHANGE EVERYTHING."
            />
            <div className="mt-16 grid gap-10 lg:grid-cols-3">
              {useDetails.map((detail, index) => (
                <article className="border-t border-po-ink pt-5" key={detail.title}>
                  <p className="text-xs font-black text-po-brand-ink">
                    0{index + 1}
                  </p>
                  <h3 className="mt-10 font-display text-3xl uppercase leading-none text-po-ink sm:text-4xl">
                    {detail.title}
                  </h3>
                  <p className="mt-6 text-base leading-7 text-po-body">
                    {detail.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </Scene>

        <Scene
          ariaLabelledBy="vapes-find-title"
          className="po-gold-thread-inlay py-24 lg:py-32"
          tone="contrast"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[minmax(260px,0.7fr)_minmax(0,1fr)] lg:items-end lg:gap-20">
            <SectionHeader
              contrast
              eyebrow="OFFICIAL RETAIL"
              id="vapes-find-title"
              title="FIND PRESIDENTIAL NEAR YOU."
            />
            <div>
              <p className="max-w-3xl text-lg leading-8 text-po-on-dark-muted sm:text-xl sm:leading-9">
                Presidential doesn't sell here — it points you to the shelf. Drop your zip code and the store finder maps the nearest licensed retailers carrying authentic product, coast to coast. Availability varies by retailer.
              </p>
              <CtaLink className="mt-8" href="/find-us" variant="primary">
                Find Presidential near you
              </CtaLink>
            </div>
          </div>
        </Scene>

        <Scene
          ariaLabelledBy="vapes-closing-title"
          className="po-gold-thread-inlay py-24 lg:py-32"
          tone="contrast"
        >
          <div className="mx-auto w-full max-w-7xl">
            <h2
              className="font-display text-6xl uppercase leading-[0.86] text-po-brand sm:text-8xl lg:text-9xl"
              id="vapes-closing-title"
            >
              EXPECT MORE.
            </h2>
            <p className="mt-7 text-xl text-po-on-dark sm:text-2xl">
              Presidential Doesn't Miss.
            </p>
          </div>
        </Scene>
      </SceneStack>
    </PageFrame>
  );
}
