import type { ReactNode } from "react";

type SceneStackProps = {
  readonly children: ReactNode;
  readonly className?: string;
};

export function SceneStack({ children, className = "" }: SceneStackProps) {
  const classNames = ["flex flex-col", className].filter(Boolean).join(" ");

  return <div className={classNames}>{children}</div>;
}
