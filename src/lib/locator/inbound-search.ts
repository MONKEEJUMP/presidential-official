export type LocatorInitialSearch =
  | { readonly zip: string }
  | { readonly latitude: number; readonly longitude: number };

type LocatorSearchParams = Record<string, string | readonly string[] | undefined>;

export function parseLocatorInitialSearch(
  searchParams: LocatorSearchParams,
): LocatorInitialSearch | undefined {
  const { latitude, longitude, zip } = searchParams;

  if (
    typeof zip === "string" &&
    /^\d{5}$/.test(zip) &&
    latitude === undefined &&
    longitude === undefined
  ) {
    return { zip };
  }

  if (
    zip !== undefined ||
    typeof latitude !== "string" ||
    typeof longitude !== "string"
  ) {
    return undefined;
  }

  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);
  if (
    !Number.isFinite(parsedLatitude) ||
    !Number.isFinite(parsedLongitude) ||
    parsedLatitude < -90 ||
    parsedLatitude > 90 ||
    parsedLongitude < -180 ||
    parsedLongitude > 180
  ) {
    return undefined;
  }

  return { latitude: parsedLatitude, longitude: parsedLongitude };
}
