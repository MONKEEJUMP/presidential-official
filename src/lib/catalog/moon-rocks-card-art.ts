import type { SanityCatalogItem } from "@/lib/cms/catalog";

export type MoonRocksCardArt = {
  readonly src: string;
  readonly resolutionStep: 1 | 2 | 4 | 5;
  readonly sourceFilename: string;
};

type StaticMoonRocksArt = {
  readonly src: string;
  readonly sourceFilename: string;
};

const DRIVE_ART: Readonly<Record<string, StaticMoonRocksArt>> = {
  "cherry-gelato": {
    src: "/media/moon-rocks/cards/cherry-gelato.webp",
    sourceFilename: "Copy of Copy of cherrygelato_moonrock copy.jpg",
  },
  "gorilla-goo": {
    src: "/media/moon-rocks/cards/gorilla-goo.webp",
    sourceFilename: "Copy of Copy of gorillagoo_moonrock copy.jpg",
  },
  grape: {
    src: "/media/moon-rocks/cards/grape.webp",
    sourceFilename: "Copy of Copy of grape_moonrock.jpg",
  },
  "peach-mango": {
    src: "/media/moon-rocks/cards/peach-mango.webp",
    sourceFilename: "Copy of Copy of peachmango_moonorock3.jpg",
  },
  "pink-cookies": {
    src: "/media/moon-rocks/cards/pink-cookies.webp",
    sourceFilename: "Copy of Copy of pinkcookie_moonrock4.jpg",
  },
  "presidential-line-garlic-cookies": {
    src: "/media/moon-rocks/cards/presidential-line-garlic-cookies.webp",
    sourceFilename: "Copy of Copy of garliccookie_moonrock copy.jpg",
  },
  "presidential-line-ghost-haze-train": {
    src: "/media/moon-rocks/cards/presidential-line-ghost-haze-train.webp",
    sourceFilename: "Copy of Copy of ghosthaze_moonrock copy.jpg",
  },
  "presidential-line-nino-brown": {
    src: "/media/moon-rocks/cards/presidential-line-nino-brown.webp",
    sourceFilename: "Copy of Copy of Ninobrown-moonrock copy2.jpg",
  },
  "presidential-line-whoa-si-whoa": {
    src: "/media/moon-rocks/cards/presidential-line-whoa-si-whoa.webp",
    sourceFilename: "Copy of Copy of whoasiwhoa_moonrock copy.jpg",
  },
  "presidential-moon-rocks": {
    src: "/media/moon-rocks/cards/presidential-moon-rocks.webp",
    sourceFilename: "Copy of Copy of pres_moonrock copy.jpg",
  },
  skywalker: {
    src: "/media/moon-rocks/cards/skywalker.webp",
    sourceFilename: "Copy of Copy of skywalker_moonrock2.jpg",
  },
  strawberry: {
    src: "/media/moon-rocks/cards/strawberry.webp",
    sourceFilename: "Copy of Copy of strawberry_moonrock copy.jpg",
  },
  watermelon: {
    src: "/media/moon-rocks/cards/watermelon.webp",
    sourceFilename: "Copy of Copy of watermelon_moonrock copy.jpg",
  },
  waui: {
    src: "/media/moon-rocks/cards/waui.webp",
    sourceFilename: "Copy of Copy of waui_moonrock.jpg",
  },
  "xj-13": {
    src: "/media/moon-rocks/cards/xj-13.webp",
    sourceFilename: "Copy of Copy of xj13-moonrock copy.jpg",
  },
};

const WRONG_FORMAT = /blunts?|mini[ -]?(?:blunts?|pre[ -]?rolls?)|pre[ -]?rolls?/i;
const MOON_ROCK_FORMAT = /moon[ -]?rocks?|\bjar\b|\b2g\b/i;
const HOUSE_ART = "/media/moon-rocks/cards/presidential-moon-rocks.webp";
const HOUSE_SOURCE = "Copy of Copy of pres_moonrock copy.jpg";

export function resolveMoonRocksCardArt(
  item: SanityCatalogItem,
  slug: string,
): MoonRocksCardArt | null {
  const driveArt = DRIVE_ART[slug];
  if (driveArt) {
    return { ...driveArt, resolutionStep: 1 };
  }

  const identifiedMoonRocksAsset = item.images?.find((image) => {
    const evidence = `${image.assetUrl || ""} ${image.altText || ""}`;
    return MOON_ROCK_FORMAT.test(evidence) && !WRONG_FORMAT.test(evidence);
  });

  if (identifiedMoonRocksAsset?.assetUrl) {
    if (slug === "thc-design-moon-rocks") {
      return {
        src: "/media/moon-rocks/cards/thc-design-moon-rocks.webp",
        resolutionStep: 4,
        sourceFilename: "thc-design_moon-rocks_products-page.png",
      };
    }

    return {
      src: identifiedMoonRocksAsset.assetUrl,
      resolutionStep: 4,
      sourceFilename: identifiedMoonRocksAsset.altText || "Sanity Moon Rocks asset",
    };
  }

  return {
    src: HOUSE_ART,
    resolutionStep: 5,
    sourceFilename: HOUSE_SOURCE,
  };
}
