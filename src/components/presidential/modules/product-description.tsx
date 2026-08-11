import { Fragment, type ReactNode } from "react";

// 6175-FABLE (2026-08-09): the product-page description field
// (productCatalogItem.internalDescriptionDraft) is a plain-text field. The short
// 9947 blurbs are a single paragraph; the 6175 long-form copy carries authored
// markdown structure — blank-line paragraph breaks, `**bold**` subheadings, and
// pipe tables. This renderer parses that structure for display while staying
// byte-identical for the single-paragraph blurbs (backward-compatible fallback),
// so no other catalog detail page changes its output.

type ProductDescriptionProps = {
  readonly value?: string;
};

const SUBHEAD = /^\*\*(.+)\*\*$/;

// Single-asterisk *emphasis* -> <em>. Only balanced `*pair*`s match (a lone `*`
// renders literally), and this runs on the segments left AFTER `**bold**` is
// split out in renderInline, so bold and italic never collide. Added 6188-FABLE
// (2026-08-11): the last-five product copy uses `*Indica*`, and this also fixes a
// pre-existing latent leak where `*powered by planet 13*` rendered its literal
// asterisks on the live Cap Junky page (the earlier `**`-only checks missed it).
function renderEmphasis(text: string, keyPrefix: string): ReactNode {
  return text.split(/\*([^*]+)\*/).map((segment, index) =>
    index % 2 === 1 ? (
      <em className="italic" key={`${keyPrefix}-i${index}`}>
        {segment}
      </em>
    ) : (
      <Fragment key={`${keyPrefix}-e${index}`}>{segment}</Fragment>
    ),
  );
}

function renderInline(text: string, keyPrefix: string): ReactNode {
  return text.split("**").map((segment, index) =>
    index % 2 === 1 ? (
      <strong className="font-black text-po-ink" key={`${keyPrefix}-b${index}`}>
        {renderEmphasis(segment, `${keyPrefix}-b${index}`)}
      </strong>
    ) : (
      <Fragment key={`${keyPrefix}-t${index}`}>
        {renderEmphasis(segment, `${keyPrefix}-t${index}`)}
      </Fragment>
    ),
  );
}

function splitBlocks(value: string): readonly string[] {
  return value
    .split(/\n[ \t]*\n/)
    .map((block) => block.replace(/^\n+/, "").replace(/\n+$/, ""))
    .filter((block) => block.trim().length > 0);
}

function nonEmptyLines(block: string): readonly string[] {
  return block.split("\n").filter((line) => line.trim().length > 0);
}

function isTableBlock(block: string): boolean {
  const lines = nonEmptyLines(block);
  return lines.length > 0 && lines.every((line) => line.trim().startsWith("|"));
}

function tableCells(line: string): readonly string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isSeparatorRow(cells: readonly string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-{2,}:?$/.test(cell));
}

function DescriptionTable({ block, keyPrefix }: { readonly block: string; readonly keyPrefix: string }) {
  const rows = nonEmptyLines(block)
    .map(tableCells)
    .filter((cells) => !isSeparatorRow(cells));

  if (rows.length === 0) {
    return null;
  }

  const [header, ...bodyRows] = rows;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {header.map((cell, index) => (
              <th
                className="border border-po-line px-3 py-2 text-left align-top text-xs font-black uppercase tracking-wide text-po-brand-ink"
                key={`${keyPrefix}-h${index}`}
                scope="col"
              >
                {renderInline(cell, `${keyPrefix}-h${index}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((cells, rowIndex) => (
            <tr key={`${keyPrefix}-r${rowIndex}`}>
              {cells.map((cell, cellIndex) => (
                <td
                  className="border border-po-line px-3 py-2 align-top leading-6 text-po-body [overflow-wrap:anywhere]"
                  key={`${keyPrefix}-r${rowIndex}c${cellIndex}`}
                >
                  {renderInline(cell, `${keyPrefix}-r${rowIndex}c${cellIndex}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProductDescription({ value }: ProductDescriptionProps) {
  if (!value || !value.trim()) {
    return null;
  }

  const blocks = splitBlocks(value);
  const hasStructure =
    blocks.length > 1 || value.includes("**") || blocks.some(isTableBlock);

  // Backward-compatible path: the single-paragraph 9947 blurbs render exactly as
  // before, so every catalog detail page that is not one of the 13 long-form
  // pages keeps identical output.
  if (!hasStructure) {
    return (
      <p className="mt-6 max-w-xl text-base leading-7 text-po-body [overflow-wrap:anywhere]">
        {value}
      </p>
    );
  }

  return (
    <div className="mt-6 max-w-xl space-y-4">
      {blocks.map((block, index) => {
        const key = `desc-${index}`;

        if (isTableBlock(block)) {
          return <DescriptionTable block={block} key={key} keyPrefix={key} />;
        }

        const subhead = block.match(SUBHEAD);
        if (subhead && !block.includes("\n")) {
          return (
            <h2
              className="pt-2 text-sm font-black uppercase tracking-wide text-po-brand-ink"
              key={key}
            >
              {renderInline(subhead[1], key)}
            </h2>
          );
        }

        return (
          <p
            className="text-base leading-7 text-po-body [overflow-wrap:anywhere]"
            key={key}
          >
            {renderInline(block.replace(/\n+/g, " "), key)}
          </p>
        );
      })}
    </div>
  );
}
