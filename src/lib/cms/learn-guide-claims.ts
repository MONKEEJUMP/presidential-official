// Softens the CMS potency figure on /learn/what-are-moon-rocks to a non-numeric statement.
// No lab result on the site backs the number, and the no-potency rule applies.
const POTENCY_CLAIM =
  /reach(?:es)? as high as 70\s*%\s*(?:[\u2014\u2013-]+|,)?\s*roughly three times the ceiling of top-shelf flower/gi;
const POTENCY_FIGURE = /\bas high as 70\s*%/gi;

function soften(text: string): string {
  return text
    .replace(POTENCY_CLAIM, "carry concentrate and kief on top of the flower")
    .replace(POTENCY_FIGURE, "higher than flower alone");
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
