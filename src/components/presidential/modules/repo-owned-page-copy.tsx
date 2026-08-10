import { Fragment, type ReactNode } from "react";
import Link from "next/link";

import {
  getRepoOwnedPageCopy,
  type RepoOwnedPagePath,
} from "@/lib/repo-owned-page-copy";

import { Scene } from "../layout/scene";

type RepoOwnedPageCopyProps = {
  readonly path: RepoOwnedPagePath;
};

const SUBHEAD = /^\*\*(.+)\*\*$/;
const INLINE_MARKUP = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(\/[^)]+\))/g;

function renderInline(text: string, keyPrefix: string): ReactNode {
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(INLINE_MARKUP)) {
    const index = match.index ?? 0;
    if (index > cursor) {
      nodes.push(
        <Fragment key={`${keyPrefix}-text-${cursor}`}>
          {text.slice(cursor, index)}
        </Fragment>,
      );
    }

    const token = match[0];
    const key = `${keyPrefix}-token-${index}`;
    const link = token.match(/^\[([^\]]+)\]\((\/[^)]+)\)$/);

    if (link) {
      nodes.push(
        <Link
          className="font-semibold text-po-brand-ink underline decoration-po-brand underline-offset-4 transition-colors hover:text-po-ink focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-po-brand"
          href={link[2]}
          key={key}
        >
          {link[1]}
        </Link>,
      );
    } else if (token.startsWith("**")) {
      nodes.push(
        <strong className="font-black text-po-ink" key={key}>
          {renderInline(token.slice(2, -2), `${key}-strong`)}
        </strong>,
      );
    } else {
      nodes.push(
        <em key={key}>
          {renderInline(token.slice(1, -1), `${key}-em`)}
        </em>,
      );
    }

    cursor = index + token.length;
  }

  if (cursor < text.length) {
    nodes.push(
      <Fragment key={`${keyPrefix}-text-${cursor}`}>
        {text.slice(cursor)}
      </Fragment>,
    );
  }

  return nodes;
}

function splitBlocks(value: string): readonly string[] {
  return value
    .split(/\n[ \t]*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function lines(block: string): readonly string[] {
  return block.split("\n").filter((line) => line.trim().length > 0);
}

function isTable(block: string): boolean {
  const blockLines = lines(block);
  return blockLines.length > 0 && blockLines.every((line) => line.startsWith("|"));
}

function cells(line: string): readonly string[] {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isSeparator(row: readonly string[]): boolean {
  return row.length > 0 && row.every((cell) => /^:?-{2,}:?$/.test(cell));
}

function CopyTable({ block, keyPrefix }: { readonly block: string; readonly keyPrefix: string }) {
  const rows = lines(block).map(cells).filter((row) => !isSeparator(row));
  const [header, ...body] = rows;

  return (
    <div className="overflow-x-auto rounded-sm border border-po-line">
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <thead className="bg-po-ink text-po-on-dark">
          <tr>
            {header.map((cell, index) => (
              <th className="border border-po-line px-4 py-3 font-black uppercase" key={`${keyPrefix}-h-${index}`} scope="col">
                {renderInline(cell, `${keyPrefix}-h-${index}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, rowIndex) => (
            <tr className="even:bg-po-soft" key={`${keyPrefix}-r-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td className="border border-po-line px-4 py-3 align-top leading-6 text-po-body" key={`${keyPrefix}-r-${rowIndex}-c-${cellIndex}`}>
                  {renderInline(cell, `${keyPrefix}-r-${rowIndex}-c-${cellIndex}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RepoOwnedPageCopy({ path }: RepoOwnedPageCopyProps) {
  const content = getRepoOwnedPageCopy(path);
  if (!content) return null;

  return (
    <Scene
      ariaLabel={`${content.label} body copy`}
      className="po-gold-thread-inlay py-20 lg:py-28"
      tone="default"
    >
      <article className="mx-auto w-full max-w-4xl space-y-6">
        {splitBlocks(content.markdown).map((block, index) => {
          const key = `${path}-${index}`;

          if (isTable(block)) {
            return <CopyTable block={block} key={key} keyPrefix={key} />;
          }

          const subhead = block.match(SUBHEAD);
          if (subhead && !block.includes("\n")) {
            return (
              <h2
                className="pt-4 font-display text-3xl uppercase leading-[0.95] text-po-ink sm:text-4xl"
                key={key}
              >
                {renderInline(subhead[1], `${key}-heading`)}
              </h2>
            );
          }

          return (
            <p
              className={`${index === 0 ? "text-xl leading-9" : "text-base leading-8 sm:text-lg"} text-po-body [overflow-wrap:anywhere]`}
              key={key}
            >
              {renderInline(block.replace(/\n+/g, " "), `${key}-paragraph`)}
            </p>
          );
        })}
      </article>
    </Scene>
  );
}
