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
  default: "bg-white text-zinc-950",
  quiet: "bg-zinc-50 text-zinc-950",
  contrast: "bg-zinc-950 text-white",
  internal: "bg-white text-zinc-950 outline outline-1 outline-dashed outline-zinc-300",
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
