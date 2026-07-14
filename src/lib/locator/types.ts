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
