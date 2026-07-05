import { buildRouteCanonicalUrl, isRouteTemplate } from "./route-helpers";
import { PRODUCTION_ORIGIN, canonicalUrl } from "./schema/constants";
import type {
  BuildRouteMetadataInput,
  MetadataTextField,
  RouteMetadataUrlFields,
} from "./metadata-types";
import type { SeoRoutePath } from "./route-types";

const UNSAFE_METADATA_TEXT_PATTERNS = [
  /\bfake\b/i,
  /\bimpost(?:e|o)r\b/i,
  /\bstolen\b/i,
  /\bhijack(?:ed|ing)?\b/i,
  /\bscam\b/i,
  /\bcounterfeit\b/i,
  /\bknockoff\b/i,
  /\bfraud\b/i,
  /\b(cure|cures|treat|treats|treatment|therapeutic)\b/i,
  /\b(pain|anxiety|sleep|cancer|depression|ptsd|inflammation)\b/i,
  /\b(ship|ships|shipping|delivery|deliver|buy online|order online|checkout|cart)\b/i,
  /\b(price|pricing|inventory|in stock|available now)\b/i,
  /\b(candy|cartoon|kids?|minor|teen|giveaway|free product)\b/i,
  /\b(get high|highest high|over[- ]?intoxication)\b/i,
  /\b(strongest|most potent|world[''`]?s strongest)\b/i,
  /\bbest\b/i,
  /#1\b|\bnumber[- ]one\b|\btop[- ]?ranked\b/i,
  /\b(euphoric|euphoria|relax(?:ing|ed|ation)?|cerebral|uplifting|sedating)\b/i,
  /\b(founding father|founders?)\b/i,
] as const;

function hasTemplateToken(path: SeoRoutePath): boolean {
  return path.includes("[") || path.includes("]");
}

export function assertConcreteMetadataPath(path: SeoRoutePath): SeoRoutePath {
  if (hasTemplateToken(path)) {
    throw new Error(`Cannot build metadata for unresolved route template: ${path}`);
  }

  return path;
}

export function assertMetadataTextSafe(
  value: string,
  field: MetadataTextField,
): string {
  const match = UNSAFE_METADATA_TEXT_PATTERNS.find((pattern) =>
    pattern.test(value),
  );

  if (match) {
    throw new Error(`Unsafe ${field} metadata text is blocked: ${value}`);
  }

  return value;
}

export function assertProductionMetadataUrl(url: string): string {
  const parsed = new URL(url);

  if (parsed.origin !== PRODUCTION_ORIGIN) {
    throw new Error(`Non-production metadata URL is blocked: ${url}`);
  }

  return parsed.toString();
}

export function resolveRouteMetadataCanonicalUrl(
  input: BuildRouteMetadataInput,
): string {
  if (input.canonicalPath) {
    const concretePath = assertConcreteMetadataPath(input.canonicalPath);
    return assertProductionMetadataUrl(canonicalUrl(concretePath));
  }

  if (isRouteTemplate(input.route)) {
    throw new Error(
      `Cannot build metadata for unresolved route template: ${input.route.path}`,
    );
  }

  return assertProductionMetadataUrl(buildRouteCanonicalUrl(input.route));
}

export function buildRouteMetadataUrlFields(
  input: BuildRouteMetadataInput,
): RouteMetadataUrlFields {
  const canonical = resolveRouteMetadataCanonicalUrl(input);

  return {
    canonical,
    openGraphUrl: canonical,
  };
}
