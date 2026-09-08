const originalFetch = globalThis.fetch;

async function mockedSanityFetch(input, init) {
  const url = typeof input === "string" ? input : input?.url || "";

  if (/\.apicdn\.sanity\.io\/v\d{4}-\d{2}-\d{2}\/data\/query\//.test(url)) {
    throw new Error("Mocked Sanity read failure for CMS runtime fallback smoke.");
  }

  return originalFetch(input, init);
}

module.exports = {mockedSanityFetch};
