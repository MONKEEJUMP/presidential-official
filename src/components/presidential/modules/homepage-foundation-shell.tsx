import type { SeoRouteRecord } from "@/lib/seo/route-types";

import { PageFrame } from "../layout/page-frame";
import { Scene } from "../layout/scene";
import { SceneStack } from "../layout/scene-stack";
import { MediaSlot } from "../media/media-slot";
import { CtaLink } from "../primitives/cta-link";
import { SectionHeading } from "../primitives/section-heading";
import { FindUsCtaShell } from "./find-us-cta-shell";
import { HomepageActShell } from "./homepage-act-shell";
import { PlatformPreviewShell } from "./platform-preview-shell";

const homepageFoundationActs = [
  {
    actNumber: 1,
    title: "Presidential as the parent brand",
    purpose:
      "The site opens with one clear signal: Presidential is the official home for Moon Rocks, pre-rolls, blunts, Moon Pods, and Orbit.",
    mediaLabel: "Official brand presence",
  },
  {
    actNumber: 2,
    title: "A first-party product ecosystem",
    purpose:
      "Every path points back to the official Presidential experience instead of sending visitors through scattered third-party results.",
    mediaLabel: "Product ecosystem",
  },
  {
    actNumber: 3,
    title: "Story, product, and retail working together",
    purpose:
      "Brand story, product education, and the retail path move as one connected customer journey.",
    mediaLabel: "Connected journey",
  },
  {
    actNumber: 4,
    title: "Moon Rocks at the center",
    purpose:
      "Moon Rocks anchors the flagship product platform with clean navigation into infused pre-rolls, blunts, learning, and retail.",
    mediaLabel: "Moon Rocks media",
  },
  {
    actNumber: 5,
    title: "Moon Pods get their own lane",
    purpose:
      "Moon Pods become a dedicated product pillar inside the official Presidential architecture.",
    mediaLabel: "Moon Pods media",
  },
  {
    actNumber: 6,
    title: "Orbit supports the next product story",
    purpose:
      "Orbit gives the site a clear technology and product-support lane without confusing the core Moon Rocks story.",
    mediaLabel: "Orbit media",
  },
  {
    actNumber: 7,
    title: "Retail search becomes first-party",
    purpose:
      "The Find Us path turns product interest into licensed retailer discovery inside the official Presidential site.",
    mediaLabel: "Retail path",
  },
] as const;

type HomepageFoundationShellProps = {
  readonly route: SeoRouteRecord;
};

export function HomepageFoundationShell({ route }: HomepageFoundationShellProps) {
  if (route.id !== "home" || route.path !== "/") {
    throw new Error("HomepageFoundationShell requires the home route record.");
  }

  return (
    <PageFrame>
      <SceneStack>
        <Scene ariaLabelledBy="presidential-homepage-primary" tone="default">
          <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.78fr)] lg:items-center">
            <div className="flex flex-col gap-6">
              <SectionHeading
                as="h1"
                description={route.description}
                id="presidential-homepage-primary"
                kicker="Official Presidential"
                title={route.h1}
              />
              <p className="max-w-2xl text-sm leading-6 text-zinc-600">
                Presidential now has a first-party digital home for the brand,
                the product platforms, the learning path, and the retail path.
                Built for adults 21+ where legal.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <CtaLink href="/moon-rocks" variant="primary">
                  Explore Moon Rocks
                </CtaLink>
                <CtaLink href="/find-us" variant="secondary">
                  Find Presidential products
                </CtaLink>
              </div>
            </div>

            <MediaSlot
              aspectClassName="aspect-[5/4]"
              kind="wireframe_media_block"
              label="Homepage media"
              note="Official Presidential brand stage"
            />
          </div>
        </Scene>

        <Scene ariaLabelledBy="presidential-platforms" tone="quiet">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
            <SectionHeading
              as="h2"
              description="Moon Rocks, Moon Pods, and Orbit each get a clean product lane inside one official Presidential experience."
              id="presidential-platforms"
              title="Presidential platforms"
            />
            <div className="grid gap-4 md:grid-cols-3">
              <PlatformPreviewShell
                ctaLabel="View Moon Rocks platform"
                description="The flagship Presidential product platform for Moon Rocks, infused pre-rolls, blunts, education, and retail discovery."
                href="/moon-rocks"
                title="Moon Rocks"
              />
              <PlatformPreviewShell
                ctaLabel="View Moon Pods platform"
                description="A dedicated lane for Moon Pods product information, visual storytelling, and connected learning paths."
                href="/moon-pods"
                title="Moon Pods"
              />
              <PlatformPreviewShell
                ctaLabel="View Orbit platform"
                description="A supporting product and technology lane that keeps Orbit connected to the broader Presidential ecosystem."
                href="/orbit"
                title="Orbit"
              />
            </div>
          </div>
        </Scene>

        <Scene ariaLabelledBy="presidential-official-sections" tone="default">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
            <SectionHeading
              as="h2"
              description="Move from brand story to product platforms, learning, retail, and contact without leaving the official Presidential experience."
              id="presidential-official-sections"
              title="Official Presidential sections"
            />
            <ul className="grid gap-3 sm:grid-cols-3">
              <li>
                <CtaLink href="/our-story" variant="secondary">
                  Our Story
                </CtaLink>
              </li>
              <li>
                <CtaLink href="/learn" variant="secondary">
                  Learn Presidential
                </CtaLink>
              </li>
              <li>
                <CtaLink href="/contact" variant="secondary">
                  Contact Presidential
                </CtaLink>
              </li>
            </ul>
          </div>
        </Scene>

        {homepageFoundationActs.map((act) => (
          <HomepageActShell
            actNumber={act.actNumber}
            key={act.actNumber}
            mediaLabel={act.mediaLabel}
            purpose={act.purpose}
            title={act.title}
            tone={act.actNumber % 2 === 0 ? "quiet" : "default"}
          />
        ))}

        <FindUsCtaShell />
      </SceneStack>
    </PageFrame>
  );
}
