export const LEAFLINK_LOGIN_URL = "https://secureaccounts.leaflink.com/login" as const;
export const DISTRU_LOGIN_URL = "https://app.distru.com/" as const;

export const WHOLESALE_STATE_CODES = ["AZ", "CA", "MI", "NV", "NY", "OK", "WA"] as const;
export type WholesaleStateCode = (typeof WHOLESALE_STATE_CODES)[number];
export type WholesalePlatform = "leaflink" | "distru";
export type WholesaleMarket = Readonly<{
  code: WholesaleStateCode;
  name: string;
  platform: WholesalePlatform;
  distruMenuUrl: string | null;
}>;

export const WHOLESALE_MARKETS: readonly WholesaleMarket[] = [
  { code: "AZ", name: "Arizona", platform: "distru", distruMenuUrl: DISTRU_LOGIN_URL },
  { code: "CA", name: "California", platform: "leaflink", distruMenuUrl: null },
  { code: "MI", name: "Michigan", platform: "leaflink", distruMenuUrl: null },
  { code: "NV", name: "Nevada", platform: "leaflink", distruMenuUrl: null },
  { code: "NY", name: "New York", platform: "distru", distruMenuUrl: DISTRU_LOGIN_URL },
  { code: "OK", name: "Oklahoma", platform: "leaflink", distruMenuUrl: null },
  { code: "WA", name: "Washington", platform: "leaflink", distruMenuUrl: null },
];

export function isWholesaleStateCode(value: unknown): value is WholesaleStateCode {
  return typeof value === "string" && WHOLESALE_MARKETS.some((market) => market.code === value);
}

export function getWholesaleMarket(value: unknown): WholesaleMarket | null {
  if (!isWholesaleStateCode(value)) return null;
  return WHOLESALE_MARKETS.find((market) => market.code === value) ?? null;
}

export function getWholesaleDestination(market: WholesaleMarket) {
  if (market.platform === "leaflink") {
    return {
      cta: "Open LeafLink",
      external: true,
      href: LEAFLINK_LOGIN_URL,
    } as const;
  }

  if (market.distruMenuUrl) {
    return {
      cta: "Open Distru",
      external: true,
      href: market.distruMenuUrl,
    } as const;
  }

  return {
    cta: "Request ordering access",
    external: false,
    href: `/wholesale/apply?request=ordering-access&state=${market.code}`,
  } as const;
}
