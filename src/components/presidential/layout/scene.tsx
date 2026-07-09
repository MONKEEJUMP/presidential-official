import type { ReactNode } from "react";

export type SceneTone = "default" | "quiet" | "contrast" | "internal";

type SceneProps = {
  readonly children: ReactNode;
  readonly id?: string;
  readonly tone?: SceneTone;
  readonly ariaLabel?: string;
  readonly ariaLabelledBy?: string;
  readonly className?: string;
};

const toneClasses = {
  default: "bg-po-canvas text-po-ink",
  quiet: "bg-po-soft text-po-ink",
  contrast: "bg-po-ink text-white",
  internal: "bg-po-canvas text-po-ink outline outline-1 outline-dashed outline-po-subtle",
} as const satisfies Record<SceneTone, string>;

export function Scene({
  children,
  id,
  tone = "default",
  ariaLabel,
  ariaLabelledBy,
  className = "",
}: SceneProps) {
  const classNames = [
    "relative isolate scroll-mt-24 px-6 py-16 sm:px-10 lg:px-16",
    "motion-reduce:scroll-auto",
    toneClasses[tone],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={classNames}
      id={id}
    >
      {children}
    </section>
  );
}
