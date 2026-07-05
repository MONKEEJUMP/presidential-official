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
    title: "Parent brand opening",
    purpose: "Official Presidential brand language and hero media will appear here.",
    status: "blocked_pending_copy_approval",
    mediaLabel: "Hero media",
  },
  {
    actNumber: 2,
    title: "Brand expectation",
    purpose: "Source-backed proof and brand standards will appear here.",
    status: "blocked_pending_copy_approval",
    mediaLabel: "Supporting proof",
  },
  {
    actNumber: 3,
    title: "Proof path",
    purpose: "Approved heritage and company facts will appear here.",
    status: "internal_foundation",
    mediaLabel: "Proof record",
  },
  {
    actNumber: 4,
    title: "Moon Rocks platform",
    purpose: "Moon Rocks product material will appear here.",
    status: "blocked_pending_asset_approval",
    mediaLabel: "Moon Rocks media",
  },
  {
    actNumber: 5,
    title: "Moon Pods platform",
    purpose: "Moon Pods product material will appear here.",
    status: "blocked_pending_catalog",
    mediaLabel: "Moon Pods media",
  },
  {
    actNumber: 6,
    title: "Orbit support",
    purpose: "Orbit technology material will appear here.",
    status: "blocked_pending_copy_approval",
    mediaLabel: "Orbit media",
  },
  {
    actNumber: 7,
    title: "Retail path",
    purpose: "Verified location information will appear here.",
    status: "blocked_pending_verification",
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
                Official Presidential brand language, product facts, and visual
                assets will appear as materials are finalized.
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
            >
              <span>Materials are being finalized.</span>
            </MediaSlot>
          </div>
        </Scene>

        <Scene ariaLabelledBy="presidential-platforms" tone="quiet">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
            <SectionHeading
              as="h2"
              description="Product information and visuals will appear as materials are finalized."
              id="presidential-platforms"
              title="Presidential platforms"
            />
            <div className="grid gap-4 md:grid-cols-3">
              <PlatformPreviewShell
                description="Product information for Moon Rocks will appear as materials are finalized."
                href="/moon-rocks"
                status="blocked_pending_asset_approval"
                title="Moon Rocks"
              />
              <PlatformPreviewShell
                description="Product information for Moon Pods will appear as materials are finalized."
                href="/moon-pods"
                status="blocked_pending_product_facts"
                title="Moon Pods"
              />
              <PlatformPreviewShell
                description="Product information for Orbit will appear as materials are finalized."
                href="/orbit"
                status="blocked_pending_compliance_review"
                title="Orbit"
              />
            </div>
          </div>
        </Scene>

        <Scene ariaLabelledBy="presidential-official-sections" tone="default">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
            <SectionHeading
              as="h2"
              description="Continue through source-backed Presidential sections as materials are finalized."
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
            status={act.status}
            title={act.title}
            tone={act.actNumber % 2 === 0 ? "quiet" : "default"}
          />
        ))}

        <FindUsCtaShell />
      </SceneStack>
    </PageFrame>
  );
}
