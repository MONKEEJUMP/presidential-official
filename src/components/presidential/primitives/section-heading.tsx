import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type HeadingLevel = "h1" | "h2" | "h3" | "h4";

type SectionHeadingProps<THeading extends HeadingLevel = "h2"> = {
  readonly as?: THeading;
  readonly id?: string;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly kicker?: ReactNode;
  readonly className?: string;
} & Omit<ComponentPropsWithoutRef<THeading>, "as" | "children" | "className">;

const headingClasses = {
  h1: "text-4xl font-semibold leading-tight sm:text-5xl",
  h2: "text-3xl font-semibold leading-tight sm:text-4xl",
  h3: "text-2xl font-semibold leading-snug sm:text-3xl",
  h4: "text-xl font-semibold leading-snug sm:text-2xl",
} as const satisfies Record<HeadingLevel, string>;

export function SectionHeading<THeading extends HeadingLevel = "h2">({
  as,
  id,
  title,
  description,
  kicker,
  className = "",
  ...headingProps
}: SectionHeadingProps<THeading>) {
  const Heading = (as ?? "h2") as ElementType;
  const headingLevel = (as ?? "h2") as HeadingLevel;

  return (
    <header className={["max-w-3xl", className].filter(Boolean).join(" ")}>
      {kicker ? (
        <p className="mb-4 text-sm font-semibold uppercase tracking-normal text-po-brand">
          {kicker}
        </p>
      ) : null}
      <Heading
        className={headingClasses[headingLevel]}
        id={id}
        {...headingProps}
      >
        {title}
      </Heading>
      {description ? (
        <p className="mt-5 max-w-2xl text-base leading-7 text-po-body sm:text-lg sm:leading-8">
          {description}
        </p>
      ) : null}
    </header>
  );
}
