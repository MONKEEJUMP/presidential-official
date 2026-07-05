import type { SeoRouteRecord } from "@/lib/seo/route-types";

import { PageFrame } from "../layout/page-frame";
import { Scene } from "../layout/scene";
import { SceneStack } from "../layout/scene-stack";
import { MediaSlot } from "../media/media-slot";
import { CtaLink } from "../primitives/cta-link";
import { SectionHeading } from "../primitives/section-heading";
import { FindUsCtaShell } from "./find-us-cta-shell";
import { PlatformPreviewShell } from "./platform-preview-shell";

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
                  Enter Moon Rocks
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

        <FindUsCtaShell />
      </SceneStack>
    </PageFrame>
  );
}
