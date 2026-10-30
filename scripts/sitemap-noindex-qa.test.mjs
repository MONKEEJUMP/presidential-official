import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { test } from "node:test";
import { checkSitemap, inspectPage } from "./sitemap-noindex-qa.mjs";

const origin = "https://presidentialmoonrocks.com";
const canonical = `<link rel="canonical" href="${origin}/product">`;

test("checks rendered robots and canonical tags without mistaking script content for tags", () => {
  const headers = new Headers();
  assert.deepEqual(inspectPage(`<script>'<meta name="robots" content="noindex">'</script>${canonical}`, headers, `${origin}/product`), []);
  for (const tag of [
    '<meta name="robots" content="noindex, follow">',
    "<META CONTENT='NOINDEX, FOLLOW' NAME='ROBOTS'>",
    '<meta name="googlebot" content="none">',
  ]) assert.match(inspectPage(canonical + tag, headers, `${origin}/product`).join(), /noindex/);
  assert.match(inspectPage(canonical, new Headers({ "x-robots-tag": "googlebot: noindex" }), `${origin}/product`).join(), /noindex/);
  assert.match(inspectPage(canonical, headers, `${origin}/other`).join(), /canonical/);
  assert.match(inspectPage(canonical + canonical, headers, `${origin}/product`).join(), /canonical/);
  assert.match(inspectPage("<html></html>", headers, `${origin}/product`).join(), /canonical/);
});

test("crawls every sitemap entry and rejects noindex, redirects, errors and wrong canonicals", async () => {
  const paths = ["/good", "/blocked", "/redirect", "/missing", "/wrong", "/header"];
  const server = createServer((req, res) => {
    if (req.url === "/sitemap.xml") {
      res.setHeader("content-type", "application/xml");
      res.end(`<urlset>${paths.map((path) => `<url><loc>${origin}${path}</loc></url>`).join("")}</urlset>`);
      return;
    }
    res.setHeader("content-type", "text/html");
    if (req.url === "/redirect") { res.writeHead(301, { location: "/good" }); res.end(); return; }
    if (req.url === "/missing") res.statusCode = 404;
    if (req.url === "/header") res.setHeader("x-robots-tag", "noindex");
    res.end(`<link href="${origin}${req.url === "/wrong" ? "/good" : req.url}" rel="canonical"><meta name="robots" content="${req.url === "/blocked" ? "noindex" : "index"}, follow">`);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const result = await checkSitemap(`http://127.0.0.1:${server.address().port}`);
    assert.equal(result.checked, paths.length);
    assert.deepEqual(result.failures.map((failure) => new URL(failure.url).pathname).sort(), paths.filter((path) => path !== "/good").sort());
    paths.splice(0, paths.length, "/good");
    assert.deepEqual(await checkSitemap(`http://127.0.0.1:${server.address().port}`), { checked: 1, linksChecked: 0, failures: [] });
  } finally {
    await new Promise((done) => server.close(done));
  }
});

test("rejects internal links to noindex pages, redirects and errors without following redirects", async () => {
  const requests = [];
  const targets = ["/blocked", "/header", "/redirect", "/missing", "/error"];
  const server = createServer((req, res) => {
    requests.push(req.url);
    if (req.url === "/sitemap.xml") {
      res.setHeader("content-type", "application/xml");
      res.end(`<urlset><url><loc>${origin}/room</loc></url></urlset>`);
      return;
    }
    res.setHeader("content-type", "text/html");
    if (req.url === "/redirect") { res.writeHead(301, { location: "/redirect-destination" }); res.end(); return; }
    if (req.url === "/missing") res.statusCode = 404;
    if (req.url === "/error") res.statusCode = 500;
    if (req.url === "/header") res.setHeader("x-robots-tag", "googlebot: noindex");
    const links = req.url === "/room" ? `
      <a href="/blocked">Noindex product</a><a href="${origin}/blocked">Duplicate target</a>
      <a href='/header'>Header noindex</a><a href=./redirect>Redirect</a>
      <a href="/missing">Missing</a><a href="/error">Server error</a>
      <a href="/good?view=full&amp;sort=name#details">Good target with fragment</a>
      <a href="/sales">CRM</a><a href="/loyalty">Loyalty</a>
      <a href="/wholesale/apply">Apply</a><a href="/partners/wa">Washington</a>
      <a href="/room?piece=example&amp;view=full">Art viewer</a><a href="#details">Fragment</a>
      <a href="mailto:sales@presidentialmoonrocks.com">Email</a>
      <script>const fake = '<a href="/script-only">';</script>
      <!-- <a href="/comment-only"> -->` : "";
    res.end(`<link rel="canonical" href="${origin}${req.url}"><meta name="robots" content="${req.url === "/blocked" ? "noindex" : "index"}, follow">${links}`);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const result = await checkSitemap(`http://127.0.0.1:${server.address().port}`);
    assert.equal(result.checked, 1);
    assert.equal(result.linksChecked, 6);
    assert.deepEqual(result.failures.map(({ url }) => new URL(url).pathname).sort(), targets.sort());
    for (const failure of result.failures) {
      assert.match(failure.problems.join(), /internal link to noindex\/redirect/);
      assert.match(failure.problems.join(), /from https:\/\/presidentialmoonrocks\.com\/room/);
    }
    assert.equal(requests.filter((path) => path === "/blocked").length, 1);
    assert.ok(requests.includes("/good?view=full&sort=name"));
    assert.ok(!requests.includes("/redirect-destination"));
    for (const path of ["/sales", "/loyalty", "/wholesale/apply", "/partners/wa", "/room?piece=example&view=full", "/script-only", "/comment-only"]) {
      assert.ok(!requests.includes(path), `must ignore ${path}`);
    }
  } finally {
    await new Promise((done) => server.close(done));
  }
});
