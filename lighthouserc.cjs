module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      startServerCommand: "npm run start -- -p 3000",
      startServerReadyPattern: "Ready",
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/moon-rocks",
        "http://localhost:3000/moon-rocks/silver",
        "http://localhost:3000/moon-rocks/gold",
        "http://localhost:3000/moon-rocks/rose-gold",
        "http://localhost:3000/moon-rocks/presidential-line",
        "http://localhost:3000/moon-rocks/presidential-house-line",
        "http://localhost:3000/moon-rocks/presidential-x-thc-design",
        "http://localhost:3000/loyalty",
        "http://localhost:3000/find-us",
        "http://localhost:3000/dispensaries",
      ],
      settings: {
        chromeFlags:
          "--no-sandbox --disable-dev-shm-usage --disable-gpu --disable-extensions --disable-background-networking",
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.7 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        // Locked prelaunch builds intentionally fail Lighthouse's is-crawlable audit via noindex.
        "categories:seo": ["warn", { minScore: 0.6 }],
        "document-title": ["error", { minScore: 1 }],
        "meta-description": ["error", { minScore: 1 }],
        "http-status-code": ["error", { minScore: 1 }],
        "link-text": ["error", { minScore: 1 }],
        "crawlable-anchors": ["error", { minScore: 1 }],
        "robots-txt": ["error", { minScore: 1 }],
        "image-alt": ["error", { minScore: 1 }],
        "hreflang": ["error", { minScore: 1 }],
        "canonical": ["error", { minScore: 1 }],
        "resource-summary:stylesheet:size": ["warn", { maxNumericValue: 110000 }],
        "resource-summary:font:size": ["warn", { maxNumericValue: 350000 }],
        "resource-summary:image:size": ["warn", { maxNumericValue: 6000000 }],
        "resource-summary:media:size": ["warn", { maxNumericValue: 265000000 }],
        "resource-summary:total:size": ["warn", { maxNumericValue: 275000000 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
