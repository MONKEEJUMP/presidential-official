// Softens the CMS potency figure on /learn/what-are-moon-rocks to a non-numeric statement.
// No lab result on the site backs the number, and the no-potency rule applies.
const POTENCY_CLAIM =
  /reach(es)? as high as 70\s*(?:%|percent)\s*(?:[\u2014\u2013-]+|,)?\s*roughly three times the ceiling of top-shelf flower/gi;
// Keeps a leading reach verb so "can reach 70%" becomes "can reach higher than flower alone".
const POTENCY_FIGURE = /\b(?:(reach(?:es|ing)?)\s+(?:as high as\s+|up to\s+)?|as high as\s+|up to\s+)70\s*(?:%|percent)/gi;

function soften(text: string): string {
  return text
    .replace(POTENCY_CLAIM, (_match, es?: string) => `${es ? "carries" : "carry"} concentrate and kief on top of the flower`)
    .replace(POTENCY_FIGURE, (_match, verb?: string) => (verb ? `${verb} higher than flower alone` : "higher than flower alone"));
}

// Text-level entry point for render paths that build strings themselves: the body
// renderer joins Portable Text spans before rendering (a figure split across spans,
// e.g. a bold "70%", never matches span by span), and the record intro feeds the
// guide header and the Learn discovery cards.
export function softenLearnGuideText(slug: string, text: string): string {
  return slug === "what-are-moon-rocks" ? soften(text) : text;
}

export function softenLearnGuideClaims<T>(slug: string, value: T): T {
  if (slug !== "what-are-moon-rocks") return value;
  const walk = (node: unknown): unknown => {
    if (typeof node === "string") return soften(node);
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === "object") {
      return Object.fromEntries(Object.entries(node).map(([key, child]) => [key, walk(child)]));
    }
    return node;
  };
  return walk(value) as T;
}
