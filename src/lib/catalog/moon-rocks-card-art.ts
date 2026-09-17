export type MoonRocksCardArt = {
  readonly src: string;
  readonly sourceFilename: string;
};

type StaticMoonRocksArt = {
  readonly src: string;
  readonly sourceFilename: string;
};

const DRIVE_ART: Readonly<Record<string, StaticMoonRocksArt>> = {
  "cherry-gelato": {
    src: "/media/moon-rocks/cards/cherry-gelato.webp",
    sourceFilename: "Copy of cherrygelato_moonrock copy.jpg",
  },
  "gorilla-goo": {
    src: "/media/moon-rocks/cards/gorilla-goo.webp",
    sourceFilename: "Copy of gorillagoo_moonrock copy.jpg",
  },
  grape: {
    src: "/media/moon-rocks/cards/grape.webp",
    sourceFilename: "Copy of grape_moonrock.jpg",
  },
  "peach-mango": {
    src: "/media/moon-rocks/cards/peach-mango.webp",
    sourceFilename: "Copy of peachmango_moonorock3.jpg",
  },
  "pink-cookies": {
    src: "/media/moon-rocks/cards/pink-cookies.webp",
    sourceFilename: "Copy of pinkcookie_moonrock4.jpg",
  },
  "presidential-line-garlic-cookies": {
    src: "/media/moon-rocks/cards/presidential-line-garlic-cookies.webp",
    sourceFilename: "Copy of garliccookie_moonrock copy.jpg",
  },
  "presidential-line-ghost-haze-train": {
    src: "/media/moon-rocks/cards/presidential-line-ghost-haze-train.webp",
    sourceFilename: "Copy of ghosthaze_moonrock copy.jpg",
  },
  "presidential-line-nino-brown": {
    src: "/media/moon-rocks/cards/presidential-line-nino-brown.webp",
    sourceFilename: "Copy of Ninobrown-moonrock copy2.jpg",
  },
  "presidential-line-whoa-si-whoa": {
    src: "/media/moon-rocks/cards/presidential-line-whoa-si-whoa.webp",
    sourceFilename: "Copy of whoasiwhoa_moonrock copy.jpg",
  },
  "presidential-moon-rocks": {
    src: "/media/moon-rocks/cards/presidential-moon-rocks.webp",
    sourceFilename: "Copy of pres_moonrock copy.jpg",
  },
  skywalker: {
    src: "/media/moon-rocks/cards/skywalker.webp",
    sourceFilename: "Copy of skywalker_moonrock2.jpg",
  },
  strawberry: {
    src: "/media/moon-rocks/cards/strawberry.webp",
    sourceFilename: "Copy of strawberry_moonrock copy.jpg",
  },
  watermelon: {
    src: "/media/moon-rocks/cards/watermelon.webp",
    sourceFilename: "Copy of watermelon_moonrock copy.jpg",
  },
  waui: {
    src: "/media/moon-rocks/cards/waui.webp",
    sourceFilename: "Copy of waui_moonrock.jpg",
  },
  "xj-13": {
    src: "/media/moon-rocks/cards/xj-13.webp",
    sourceFilename: "Copy of xj13-moonrock copy.jpg",
  },
};

export function resolveMoonRocksCardArt(slug: string): MoonRocksCardArt | null {
  const driveArt = DRIVE_ART[slug];
  return driveArt ?? null;
}
