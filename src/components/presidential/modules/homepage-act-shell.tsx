import { MediaSlot } from "../media/media-slot";
import { SectionHeading } from "../primitives/section-heading";
import { Scene, type SceneTone } from "../layout/scene";

export type HomepageActShellProps = {
  readonly actNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  readonly title: string;
  readonly purpose: string;
  readonly mediaLabel?: string;
  readonly tone?: SceneTone;
};

export function HomepageActShell({
  actNumber,
  title,
  purpose,
  mediaLabel = "Media slot",
  tone = "default",
}: HomepageActShellProps) {
  const headingId = `presidential-homepage-act-${actNumber}`;

  return (
    <Scene ariaLabelledBy={headingId} tone={tone}>
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(320px,0.72fr)] lg:items-center">
        <div className="flex flex-col gap-6">
          <SectionHeading
            as="h2"
            description={purpose}
            id={headingId}
            kicker={`Act ${actNumber}`}
            title={title}
          />
          <p className="max-w-2xl text-sm leading-6 text-zinc-600">
            A direct path into the official Presidential experience for adults
            21+ where legal.
          </p>
        </div>

        <MediaSlot
          aspectClassName="aspect-[4/3]"
          kind="wireframe_media_block"
          label={mediaLabel}
        />
      </div>
    </Scene>
  );
}
