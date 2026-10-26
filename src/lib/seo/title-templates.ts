// PW7404-1048: descriptive titles assembled from existing product facts.
function length(value: string): number {
  return [...value].length;
}

export function selectSeoTitle(existing: string, candidates: readonly string[]): string {
  if (length(existing) >= 50) return existing;
  const unique = [...new Set(candidates.map((title) => title.replace(/\s+/g, " ").trim()))];
  return unique.find((title) => length(title) >= 50 && length(title) <= 60) ??
    unique.filter((title) => length(title) >= 50).sort((a, b) => length(a) - length(b))[0] ?? existing;
}

export function buildMoonRocksProductTitle({
  name, series, existing, slug,
}: { readonly name: string; readonly series?: string; readonly existing: string; readonly slug: string }): string {
  if (slug === "presidential-line-ghost-haze-train") return existing;
  const subject = /moon rocks?|blunts?|pre-?rolls?/i.test(name) ? name : `${name} Moon Rocks`;
  const fullSeries = series?.startsWith("Presidential") ? series : series ? `Presidential ${series}` : "Presidential";
  const shortSeries = fullSeries.replace("Silver Flavor Series", "Silver Series")
    .replace("Gold Strain Series", "Gold Series")
    .replace("Rose Gold Connoisseur Series", "Rose Gold Series");
  const houseFormat = /pre-?roll/i.test(name) ? "Pre-Rolls" : /blunt/i.test(name) ? "Blunts" : "Moon Rocks";
  const house = series === "Presidential House Line" ? `Presidential House Line ${houseFormat} | Infused Cannabis` : "";
  const cannabisSubject = subject.replace(/moon rocks/i, "Cannabis Moon Rocks");
  return selectSeoTitle(existing, [house, `${subject} | ${fullSeries}`, `${subject} | ${shortSeries}`, `${cannabisSubject} | ${fullSeries}`]);
}

export function buildLearnGuideTitle(name: string): string {
  return selectSeoTitle(`${name} | Presidential Learn`, [
    `${name} | Presidential Moon Rocks Guide`,
    `${name} | Presidential Moon Rocks Cannabis Guide`,
  ]);
}

export function buildFormatProductTitle({
  name, format, existing, weight, extract, infused,
}: { readonly name: string; readonly format: string; readonly existing: string; readonly weight?: string; readonly extract?: string; readonly infused: boolean }): string {
  const label = format.replace(/pre-roll/i, "Pre-Roll");
  const pack = weight ? /^(\d+) × \S+ \((\S+) total\)$/.exec(weight) : null;
  const plural = pack ? `${label}s` : label;
  const brand = "Presidential Moon Rocks";
  const material = extract?.replace(/\b\w/g, (letter) => letter.toUpperCase());
  const factual = (parts: readonly (string | undefined)[]) => `${parts.filter(Boolean).join(" ")} | ${brand}`;
  return selectSeoTitle(existing, [
    ...(pack ? [factual([name, `${pack[1]}-Pack`, plural]), factual([name, `${pack[1]}-Pack`, pack[2], plural])] : []),
    factual([name, weight, material, label]),
    factual([name, material, label]),
    ...(infused ? [factual([name, weight, "Infused", label]), factual([name, "Infused", label])] : []),
    factual([name, label]),
    `${[name, weight, "Moon Rock", label].filter(Boolean).join(" ")} | Presidential`,
  ]);
}

export function buildArtRoomTitle(name: string): string {
  const label = name.replace("Pre-rolls", "Pre-Rolls");
  return selectSeoTitle(`${label} — The Presidential Vault`, [
    `${label} Moon Rock Pack Art | The Presidential Vault`,
    `${label} Moon Rock Pack Art | Presidential Vault`,
  ]);
}
