import Link from "next/link";

import { PRESIDENTIAL_STATES } from "@/lib/find-us/states";

// Tile-grid map of the continental United States — 9083-CODE P4.1 (owner
// map correction, 2026-07-11): the 48 continental states only (no Alaska,
// no Hawaii, no DC, no territories). Exactly the eight PRESIDENTIAL_STATES
// markets are named and clickable; the other forty are dim, unlabeled,
// non-interactive geography that makes the eight glow harder. Data-driven:
// PAULIEWOOD's one-line config edits light states up or down.

type TilePosition = readonly [row: number, col: number];

const STATE_TILES: Record<string, TilePosition> = {
  ME: [0, 11],
  VT: [1, 10], NH: [1, 11],
  WA: [2, 1], ID: [2, 2], MT: [2, 3], ND: [2, 4], MN: [2, 5], IL: [2, 6], WI: [2, 7], MI: [2, 8], NY: [2, 9], RI: [2, 10], MA: [2, 11],
  OR: [3, 1], NV: [3, 2], WY: [3, 3], SD: [3, 4], IA: [3, 5], IN: [3, 6], OH: [3, 7], PA: [3, 8], NJ: [3, 9], CT: [3, 10],
  CA: [4, 1], UT: [4, 2], CO: [4, 3], NE: [4, 4], MO: [4, 5], KY: [4, 6], WV: [4, 7], VA: [4, 8], MD: [4, 9], DE: [4, 10],
  AZ: [5, 2], NM: [5, 3], KS: [5, 4], AR: [5, 5], TN: [5, 6], NC: [5, 7], SC: [5, 8],
  OK: [6, 4], LA: [6, 5], MS: [6, 6], AL: [6, 7], GA: [6, 8],
  TX: [7, 4], FL: [7, 9],
};

// Static class tables so Tailwind's compiler sees literal names (runtime
// interpolation never compiles, and CSP blocks inline style attributes).
const COL_START = [
  "col-start-1", "col-start-2", "col-start-3", "col-start-4",
  "col-start-5", "col-start-6", "col-start-7", "col-start-8",
  "col-start-9", "col-start-10", "col-start-11", "col-start-12",
] as const;
const ROW_START = [
  "row-start-1", "row-start-2", "row-start-3", "row-start-4",
  "row-start-5", "row-start-6", "row-start-7", "row-start-8",
] as const;

type UsMapShellProps = {
  readonly activeHref?: string;
};

export function UsMapShell({ activeHref }: UsMapShellProps = {}) {
  const activeByCode = new Map(
    PRESIDENTIAL_STATES.map((state) => [state.code, state]),
  );

  return (
    <div>
      <ul
        aria-label="Presidential priority markets across the continental United States"
        className="grid max-w-3xl grid-cols-12 gap-1.5 sm:gap-2"
      >
        {Object.entries(STATE_TILES).map(([code, [row, col]]) => {
          const active = activeByCode.get(code);

          return (
            <li
              className={`${COL_START[col]} ${ROW_START[row]} aspect-square`}
              key={code}
            >
              {active ? (
                <Link
                  className="po-map-tile po-map-tile-active"
                  href={activeHref ?? `/find-us/${active.slug}`}
                >
                  <span aria-hidden="true">{code}</span>
                  <span className="sr-only">
                    Find Presidential in {active.name}
                  </span>
                </Link>
              ) : (
                <span aria-hidden="true" className="po-map-tile" />
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-xs leading-5 text-po-on-dark-muted">
        Eight priority markets. Availability varies by licensed retailer;
        adults 21+ where legal.
      </p>
    </div>
  );
}
