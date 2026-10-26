// PW7404-1048: rendered title, anchor and canonical-product inlink checks.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { computeBuildInputFingerprint } from "./lib/build-input-fingerprint.mjs";

const require = createRequire(import.meta.url);
const { parse } = require("next/dist/compiled/node-html-parser");
const origin = "https://presidentialmoonrocks.com";
const ghostPath = "/moon-rocks/presidential-line-ghost-haze-train";
const ghostTitle = "Ghost Train Haze Moon Rocks | Presidential Line";
const { values } = parseArgs({ options: {
  baseline: { type: "boolean", default: false },
  evidence: { type: "string" },
  "output-dir": { type: "string" },
} });
const pause = (ms) => new Promise((done) => setTimeout(done, ms));

function publicPath(value, source = "/") {
  let url;
  try { url = new URL(value, origin + source); } catch { return; }
  if (url.origin !== origin || /^\/(?:api|sales|drafts|admin|_next)(?:\/|$)/i.test(url.pathname)) return;
  if (/\.(?:avif|gif|ico|jpe?g|json|mp4|pdf|png|svg|txt|web[mp]|woff2?|xml)$/i.test(url.pathname)) return;
  // Viewer query variants retain their room canonical and are not new pages.
  return url.pathname;
}

function directives(document, headers) {
  return [headers.get("x-robots-tag") ?? "", ...document.querySelectorAll("meta")
    .filter((node) => /^(?:robots|googlebot)$/i.test(node.getAttribute("name") ?? ""))
    .map((node) => node.getAttribute("content") ?? "")].join(", ");
}

function anchorName(anchor) {
  return anchor.text.trim() || anchor.querySelectorAll("img")
    .map((image) => image.getAttribute("alt")?.trim() ?? "").filter(Boolean).join(" ") ||
    anchor.getAttribute("aria-label")?.trim() || anchor.getAttribute("title")?.trim() || "";
}

async function openPort() {
  const socket = createServer();
  await new Promise((done, reject) => { socket.once("error", reject); socket.listen(0, "127.0.0.1", done); });
  const { port } = socket.address();
  await new Promise((done) => socket.close(done));
  return port;
}

if (!existsSync(resolve(".next/BUILD_ID"))) throw new Error("Run npm run build first");
const built = JSON.parse(readFileSync(".next/presidential-build-fingerprint.json", "utf8"));
if (built.sha256 !== computeBuildInputFingerprint(process.cwd()).sha256) throw new Error("Build is stale; run npm run build first");
const port = await openPort();
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, [resolve("node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  stdio: "ignore", windowsHide: true, env: { ...process.env, VERCEL_ENV: "production" },
});
const exited = new Promise((done) => { child.once("exit", done); child.once("error", done); });
let startupError;
child.once("error", (error) => { startupError = error; });

try {
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    if (startupError) throw startupError;
    if (child.exitCode !== null) throw new Error(`Next server exited ${child.exitCode}`);
    try {
      const response = await fetch(base + "/sitemap.xml", { signal: AbortSignal.timeout(1000) });
      await response.body?.cancel(); ready = true; break;
    } catch { await pause(250); }
  }
  if (!ready) throw new Error("Local server did not become ready");
  const options = { redirect: "manual", headers: { "user-agent": "Sitebulb" } };
  const sitemapResponse = await fetch(base + "/sitemap.xml", { ...options, signal: AbortSignal.timeout(30_000) });
  if (sitemapResponse.status !== 200) throw new Error(`Sitemap HTTP ${sitemapResponse.status}`);
  const sitemap = await sitemapResponse.text();
  const sitemapPaths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
  const evidence = values.evidence ? JSON.parse(readFileSync(values.evidence, "utf8")) : null;
  const pending = [];
  const seen = new Set();
  const enqueue = (value, source) => {
    const path = publicPath(value, source);
    if (path && !seen.has(path)) {
      if (seen.size >= 350) throw new Error("Crawl exceeded 350 public HTML paths; inspect scope");
      seen.add(path); pending.push(path);
    }
  };
  [...sitemapPaths, ...Object.values(evidence?.samples ?? {}).flat()].forEach((url) => enqueue(url));
  const pages = [];
  while (pending.length) {
    const batch = pending.splice(0, 4);
    await Promise.all(batch.map(async (path) => {
      const response = await fetch(base + path, { ...options, signal: AbortSignal.timeout(30_000) });
      if (response.status !== 200) {
        const location = response.headers.get("location");
        if (location) enqueue(location, path);
        pages.push({ path, status: response.status, indexable: false, links: [], emptyAnchors: [] });
        return;
      }
      const html = await response.text();
      const document = parse(html);
      document.querySelectorAll("script, style").forEach((node) => node.remove());
      const title = document.querySelector("title")?.text.trim() ?? "";
      const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href");
      const robots = directives(document, response.headers);
      const indexable = !/\b(?:noindex|none)\b/i.test(robots) && canonical === origin + path;
      const follow = !/\b(?:nofollow|none)\b/i.test(robots);
      const links = new Set();
      const emptyAnchors = [];
      for (const anchor of document.querySelectorAll("a[href]")) {
        const target = publicPath(anchor.getAttribute("href"), path);
        if (!target) continue;
        enqueue(target, path);
        if (target !== path && follow && !/\bnofollow\b/i.test(anchor.getAttribute("rel") ?? "")) links.add(target);
        if (!anchorName(anchor)) emptyAnchors.push({ target, html: anchor.toString().slice(0, 600) });
      }
      pages.push({ path, status: response.status, title, titleLength: [...title].length, canonical, robots, indexable, links: [...links], emptyAnchors });
    }));
  }
  pages.sort((a, b) => a.path.localeCompare(b.path));
  for (const page of pages) page.indexableInlinkSources = pages.filter((source) => source.indexable && source.links.includes(page.path)).map((source) => source.path);
  const shortTitles = pages.filter((page) => page.status === 200 && page.path !== ghostPath && page.path !== "/loyalty" && page.titleLength < 50);
  const longTitles = pages.filter((page) => page.status === 200 && page.titleLength > 60);
  const weakProducts = pages.filter((page) => page.indexable && /^\/(?:moon-rocks|blunts|pre-rolls|mini-blunts|mini-pre-rolls)\//.test(page.path) && page.indexableInlinkSources.length < 3);
  const emptyAnchors = pages.filter((page) => page.indexable && page.emptyAnchors.length).map((page) => ({ path: page.path, anchors: page.emptyAnchors }));
  const ghost = pages.find((page) => page.path === ghostPath);
  const protectedGhostUnchanged = ghost?.title === ghostTitle && ghost.indexable;
  const result = { mode: values.baseline ? "baseline" : "verification", checkedAt: new Date().toISOString(), pageCount: pages.length, indexableCount: pages.filter((page) => page.indexable).length, sitemapUrls: sitemapPaths.length, protectedGhostUnchanged,
    shortTitles: shortTitles.map(({ path, title, titleLength }) => ({ path, title, titleLength })),
    longTitles: longTitles.map(({ path, title, titleLength }) => ({ path, title, titleLength })),
    weakProducts: weakProducts.map(({ path, indexableInlinkSources }) => ({ path, indexableInlinkSources })), emptyAnchors, pages };
  if (values["output-dir"]) {
    mkdirSync(values["output-dir"], { recursive: true });
    const file = resolve(values["output-dir"], `PW7404-1048-${result.mode}-${Date.now()}.json`);
    writeFileSync(file, JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
    console.log(`Evidence: ${file}`);
  }
  console.log(JSON.stringify({ mode: result.mode, pageCount: result.pageCount, indexableCount: result.indexableCount, sitemapUrls: result.sitemapUrls, protectedGhostUnchanged,
    shortTitleCount: shortTitles.length, shortTitles: result.shortTitles.slice(0, 18), weakProducts: result.weakProducts, emptyAnchors: result.emptyAnchors }, null, 2));
  if (!values.baseline && (shortTitles.length || weakProducts.length || emptyAnchors.length || !protectedGhostUnchanged)) process.exitCode = 1;
} finally {
  if (child.pid && child.exitCode === null) { child.kill(); await exited; }
}
