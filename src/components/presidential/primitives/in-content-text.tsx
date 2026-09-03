import { Fragment, type ReactNode } from "react";
import Link from "next/link";

import { hardcodeInContentLinks } from "@/lib/seo/in-content-links";

type InContentTextProps = {
  readonly sourcePath: string;
  readonly value: string;
};

const INTERNAL_LINK = /\[([^\]]+)\]\((\/[^)]*)\)/g;

export function InContentText({ sourcePath, value }: InContentTextProps): ReactNode {
  const linkedValue = hardcodeInContentLinks(sourcePath, value);
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of linkedValue.matchAll(INTERNAL_LINK)) {
    const index = match.index ?? 0;
    if (index > cursor) {
      nodes.push(
        <Fragment key={`${sourcePath}-text-${cursor}`}>
          {linkedValue.slice(cursor, index)}
        </Fragment>,
      );
    }

    nodes.push(
      <Link
        className="font-semibold underline decoration-current underline-offset-4 transition-opacity hover:opacity-80 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
        href={match[2]}
        key={`${sourcePath}-link-${index}`}
      >
        {match[1]}
      </Link>,
    );
    cursor = index + match[0].length;
  }

  if (cursor < linkedValue.length) {
    nodes.push(
      <Fragment key={`${sourcePath}-text-${cursor}`}>
        {linkedValue.slice(cursor)}
      </Fragment>,
    );
  }

  return nodes;
}
