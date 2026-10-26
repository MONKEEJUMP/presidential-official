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
    assert.deepEqual(await checkSitemap(`http://127.0.0.1:${server.address().port}`), { checked: 1, failures: [] });
  } finally {
    await new Promise((done) => server.close(done));
  }
});
