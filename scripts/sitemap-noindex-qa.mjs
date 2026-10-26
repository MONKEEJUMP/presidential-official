import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const productionOrigin = "https://presidentialmoonrocks.com";
const requestOptions = { redirect: "manual", headers: { "user-agent": "Sitebulb" } };
const noindex = /(?:^|[\s,;:])(?:noindex|none)(?:$|[\s,;])/i;
const pause = (ms) => new Promise((done) => setTimeout(done, ms));

function decode(value) {
  const entities = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">" };
  return value.replace(/&(amp|quot|apos|lt|gt|#\d+|#x[0-9a-f]+);/gi, (_, key) =>
    key[0] === "#"
      ? String.fromCodePoint(key[1].toLowerCase() === "x" ? parseInt(key.slice(2), 16) : Number(key.slice(1)))
      : entities[key.toLowerCase()],
  );
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+))/g)]
    .map((match) => [match[1].toLowerCase(), decode(match[2] ?? match[3] ?? match[4])]));
}

export function inspectPage(html, headers, expectedUrl) {
  const problems = [];
  const markup = html.replace(/<!--[^]*?-->|<script\b[^>]*>[^]*?<\/script\s*>/gi, "");
  const tags = [...markup.matchAll(/<(meta|link)\b[^>]*>/gi)]
    .map((match) => ({ tag: match[1].toLowerCase(), ...attributes(match[0]) }));
  if (noindex.test(headers.get("x-robots-tag") ?? "") || tags.some((tag) =>
    tag.tag === "meta" && /^(robots|googlebot)$/i.test(tag.name ?? "") && noindex.test(tag.content ?? ""))) {
    problems.push("noindex robots directive");
  }
  const canonicals = tags.filter((tag) => tag.tag === "link" && /(?:^|\s)canonical(?:$|\s)/i.test(tag.rel ?? ""));
  if (canonicals.length !== 1 || canonicals[0].href !== expectedUrl) {
    problems.push(`canonical must be exactly ${expectedUrl}`);
  }
  return problems;
}

async function request(baseUrl, pathname) {
  return fetch(new URL(new URL(baseUrl).origin + pathname), { ...requestOptions, signal: AbortSignal.timeout(30_000) });
}

// Sitemap URLs stay on the canonical host; --base-url changes only where their
// paths are fetched, so the same guard can check a local build or production.
export async function checkSitemap(baseUrl) {
  const failures = [];
  const response = await request(baseUrl, "/sitemap.xml");
  if (response.status !== 200) throw new Error(`Sitemap returned HTTP ${response.status}`);
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((match) => decode(match[1]));
  if (!/<urlset\b/.test(xml) || urls.length === 0) throw new Error("Sitemap must contain a nonempty urlset");
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(4, urls.length) }, async () => {
    while (cursor < urls.length) {
      const entry = urls[cursor++];
      try {
        const url = new URL(entry);
        if (url.origin !== productionOrigin || url.username || url.password || url.hash) {
          throw new Error("Sitemap URL must use the canonical origin without credentials or fragments");
        }
        const page = await request(baseUrl, url.pathname + url.search);
        const problems = page.status !== 200
          ? [`HTTP ${page.status}`]
          : !page.headers.get("content-type")?.includes("text/html")
            ? ["Expected an HTML page"]
            : inspectPage(await page.text(), page.headers, entry);
        if (problems.length) failures.push({ url: entry, problems });
      } catch (error) {
        failures.push({ url: entry, problems: [error.message] });
      }
    }
  }));
  return { checked: urls.length, failures };
}

async function openPort() {
  const server = createServer();
  await new Promise((done, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", done); });
  const { port } = server.address();
  await new Promise((done) => server.close(done));
  return port;
}

async function main() {
  const { values } = parseArgs({ options: { "base-url": { type: "string" } } });
  let child;
  let exited;
  try {
    let baseUrl = values["base-url"];
    if (baseUrl) {
      const url = new URL(baseUrl);
      if (url.origin !== productionOrigin && !(url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname))) {
        throw new Error("--base-url must be production or a local HTTP server");
      }
      if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error("--base-url must be a bare origin");
    } else {
      if (!existsSync(resolve(".next/BUILD_ID"))) throw new Error("Run npm run build before sitemap QA");
      baseUrl = `http://127.0.0.1:${await openPort()}`;
      // Validate production metadata without the preview deployment's deliberate
      // X-Robots-Tag override. This changes only this local child process.
      child = spawn(process.execPath, [resolve("node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", new URL(baseUrl).port], { stdio: "ignore", windowsHide: true, env: { ...process.env, VERCEL_ENV: "production" } });
      let startupError;
      child.once("error", (error) => { startupError = error; });
      exited = new Promise((done) => { child.once("exit", done); child.once("error", done); });
      let ready = false;
      for (let attempt = 0; attempt < 60; attempt++) {
        if (startupError) throw startupError;
        if (child.exitCode !== null) throw new Error(`Local Next server exited ${child.exitCode}`);
        try {
          const probe = await fetch(`${baseUrl}/sitemap.xml`, { signal: AbortSignal.timeout(1000) });
          await probe.body?.cancel();
          ready = true;
          break;
        } catch { await pause(250); }
      }
      if (!ready) throw new Error("Local Next server did not become ready");
    }
    const result = await checkSitemap(baseUrl);
    for (const failure of result.failures) console.error(`FAIL ${failure.url}: ${failure.problems.join("; ")}`);
    console.log(`Sitemap QA: ${result.checked} URLs checked; ${result.failures.length} failed.`);
    process.exitCode = result.failures.length ? 1 : 0;
  } finally {
    if (child?.pid && child.exitCode === null) {
      child.kill();
      await exited;
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(`Sitemap QA failed: ${error.message}`); process.exitCode = 1; });
}
