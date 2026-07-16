export const LOCATOR_STATE_CODES = [
  "AZ",
  "CA",
  "FL",
  "MI",
  "NV",
  "NY",
  "OK",
  "WA",
] as const;

export type LocatorStateCode = (typeof LOCATOR_STATE_CODES)[number];

export function isLocatorStateCode(value: unknown): value is LocatorStateCode {
  return (
    typeof value === "string" &&
    LOCATOR_STATE_CODES.includes(value as LocatorStateCode)
  );
}

export type LocatorResult = Readonly<{
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string | null;
  website: string | null;
  distance_miles: number;
}>;

export type LocatorApiResponse = Readonly<{
  results: readonly LocatorResult[];
}>;

export type LocatorApiError = Readonly<{
  error: string;
}>;

export type LocatorCountApiResponse = Readonly<{
  state: LocatorStateCode;
  count: number;
}>;
