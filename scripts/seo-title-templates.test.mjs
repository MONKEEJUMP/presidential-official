import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  buildArtRoomTitle, buildFormatProductTitle, buildLearnGuideTitle,
  buildMoonRocksProductTitle, selectSeoTitle,
} from "../src/lib/seo/title-templates.ts";
import { BLUNT_ARTWORKS } from "../src/content/blunts-catalog.ts";
import { PRE_ROLL_ARTWORKS } from "../src/lib/prerolls/catalog.ts";

const json = (file) => JSON.parse(readFileSync(new URL(file, import.meta.url), "utf8"));
const artwork = json("../src/content/vault/artwork.json");
const specs = json("../src/content/vault/specs.json");
const fitting = (title) => assert([...title].length >= 50 && [...title].length <= 60, `${[...title].length}: ${title}`);

test("keeps the protected Ghost Train Haze title and existing descriptive titles", () => {
  const existing = "Ghost Train Haze Moon Rocks | Presidential Line";
  assert.equal(buildMoonRocksProductTitle({ name: "Ghost Train Haze", series: "Presidential Line", slug: "presidential-line-ghost-haze-train", existing }), existing);
  const long = "Presidential Partners | Licensed Retailers in Select State Markets";
  assert.equal(selectSeoTitle(long, ["Replacement title"]), long);
});

test("uses recorded pack/ingredient facts across the published vault product pages", () => {
  for (const product of artwork.filter((item) => item.productUrl === null)) {
    const spec = specs[product.slug];
    const title = buildFormatProductTitle({ name: product.strain, format: product.format,
      existing: `${product.strain} Moon Rock ${product.format} | Presidential`, weight: spec?.weight,
      extract: spec?.madeWith.find((part) => !/^(flower|kief|diamonds)$/i.test(part)),
      infused: Boolean(spec?.madeWith.some((part) => /resin|rosin|distillate/i.test(part))),
    });
    fitting(title);
    assert(title.includes(product.strain));
    if (title.includes("3-Pack")) assert.match(spec.weight, /^3 ×/);
  }
});

test("fits the existing legacy format catalogs without inventing missing facts", () => {
  for (const [format, products] of [["Blunt", BLUNT_ARTWORKS], ["Pre-Roll", PRE_ROLL_ARTWORKS]]) {
    for (const product of products) {
      const title = buildFormatProductTitle({ name: product.name, format, existing: `${product.name} ${format} | Presidential`,
        weight: product.edition.match(/^\d+(?:\.\d+)?g\b/)?.[0], extract: product.edition.split("·")[2]?.trim(), infused: /infused/i.test(product.edition) });
      fitting(title);
      assert(title.includes(product.name));
    }
  }
  const existing = "Unknown Blunt | Presidential";
  assert.equal(buildFormatProductTitle({ name: "Unknown", format: "Blunt", existing, infused: false }), existing);
});

test("fits short and long Moon Rocks names using their existing series", () => {
  for (const [name, series, existing, slug] of [
    ["24K", "Gold Strain Series", "24K Moon Rocks | Presidential Gold", "24k"],
    ["Blue Raspberry", "Silver Flavor Series", "Blue Raspberry Moon Rocks | Presidential Silver", "blue-raspberry"],
    ["God's Gift", "Rose Gold Connoisseur Series", "God's Gift Moon Rocks | Presidential Rose Gold", "gods-gift"],
    ["Guava Haze", "Presidential Line", "Guava Haze Moon Rocks | Presidential Line", "presidential-line-guava-haze"],
    ["Presidential Moon Rocks", "Presidential House Line", "Presidential Moon Rocks | Presidential House Line", "presidential-moon-rocks"],
    ["Presidential Prerolls", "Presidential House Line", "Presidential Prerolls | Infused Pre-Rolls", "presidential-prerolls"],
  ]) fitting(buildMoonRocksProductTitle({ name, series, existing, slug }));
});

test("fits the guide and gallery families without changing their subjects", () => {
  for (const name of ["Flavor Science", "Infusion Science", "What Are Liquid Diamonds", "What Are Moon Rocks", "What Is Live Resin", "What Is Live Rosin", "What Is THC Distillate"]) {
    const title = buildLearnGuideTitle(name); fitting(title); assert(title.startsWith(name));
  }
  for (const name of ["Blunts", "Pre-rolls", "Mini Blunts", "Mini Pre-rolls"]) fitting(buildArtRoomTitle(name));
});
