import "server-only";

import {
  LOCATOR_STATE_CODES,
  type LocatorStateCode,
} from "./types";

const UPSTREAM_TIMEOUT_MS = 5_000;

export type LocatorStateCounts = Readonly<
  Record<LocatorStateCode, number | null>
>;

function parseCount(value: unknown): number | null {
  const count =
    typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  return typeof count === "number" &&
    Number.isSafeInteger(count) &&
    count >= 0
    ? count
    : null;
}

export async function readLocatorStateCount(
  state: LocatorStateCode,
): Promise<number | null> {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) return null;

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/count_retailers_by_state`,
      {
        method: "POST",
        headers: {
          apikey: publishableKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state_code: state }),
        cache: "no-store",
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      },
    );
    if (!response.ok) return null;
    return parseCount((await response.json()) as unknown);
  } catch {
    return null;
  }
}

export async function readLocatorStateCounts(): Promise<LocatorStateCounts> {
  const counts = await Promise.all(
    LOCATOR_STATE_CODES.map((state) => readLocatorStateCount(state)),
  );

  return Object.fromEntries(
    LOCATOR_STATE_CODES.map((state, index) => [state, counts[index] ?? null]),
  ) as Record<LocatorStateCode, number | null>;
}
