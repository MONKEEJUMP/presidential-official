import type { SanityCatalogItem } from "@/lib/cms/catalog";

export type MoonRocksCardArt = {
  readonly src: string;
  readonly fit: "cover" | "contain";
  readonly resolutionStep: 1 | 5 | 6;
};

const DRIVE_ART: Readonly<Record<string, string>> = {
  "cherry-gelato": "/media/moon-rocks/cards/cherry-gelato.webp",
  "gorilla-goo": "/media/moon-rocks/cards/gorilla-goo.webp",
  grape: "/media/moon-rocks/cards/grape.webp",
  "peach-mango": "/media/moon-rocks/cards/peach-mango.webp",
  "pink-cookies": "/media/moon-rocks/cards/pink-cookies.webp",
  "presidential-line-garlic-cookies":
    "/media/moon-rocks/cards/presidential-line-garlic-cookies.webp",
  "presidential-line-ghost-haze-train":
    "/media/moon-rocks/cards/presidential-line-ghost-haze-train.webp",
  "presidential-line-nino-brown":
    "/media/moon-rocks/cards/presidential-line-nino-brown.webp",
  "presidential-line-whoa-si-whoa":
    "/media/moon-rocks/cards/presidential-line-whoa-si-whoa.webp",
  "presidential-moon-rocks":
    "/media/moon-rocks/cards/presidential-moon-rocks.webp",
  skywalker: "/media/moon-rocks/cards/skywalker.webp",
  strawberry: "/media/moon-rocks/cards/strawberry.webp",
  watermelon: "/media/moon-rocks/cards/watermelon.webp",
  waui: "/media/moon-rocks/cards/waui.webp",
  "xj-13": "/media/moon-rocks/cards/xj-13.webp",
};

const WRONG_FORMAT = /blunts?|mini[ -]?(?:blunts?|pre[ -]?rolls?)|pre[ -]?rolls?/i;
const MOON_ROCK_FORMAT = /moon[ -]?rocks?|\bjar\b|\b(?:1|2|3\.5|7)g\b/i;

export function resolveMoonRocksCardArt(
  item: SanityCatalogItem,
  slug: string,
): MoonRocksCardArt | null {
  const driveArt = DRIVE_ART[slug];
  if (driveArt) {
    return { src: driveArt, fit: "cover", resolutionStep: 1 };
  }

  const identifiedMoonRocksAsset = item.images?.find((image) => {
    const evidence = `${image.assetUrl || ""} ${image.altText || ""}`;
    return MOON_ROCK_FORMAT.test(evidence) && !WRONG_FORMAT.test(evidence);
  });

  if (identifiedMoonRocksAsset?.assetUrl) {
    return {
      src: identifiedMoonRocksAsset.assetUrl,
      fit: "contain",
      resolutionStep: 5,
    };
  }

  const fallback = item.images?.[0];
  if (!fallback?.assetUrl) return null;

  return {
    src: fallback.assetUrl,
    fit: "contain",
    resolutionStep: 6,
  };
}
