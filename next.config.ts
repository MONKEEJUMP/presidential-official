import type { NextConfig } from "next";

// Customizing htmlLimitedBots replaces Next's defaults, so preserve the
// 16.2.9 list and add Sitebulb's Chrome crawler to receive blocking metadata.
const htmlLimitedBots =
  /[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight|sitebulb/i;

const presidentialSecurityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: [
      "accelerometer=()",
      "camera=()",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "payment=()",
      "usb=()",
    ].join(", "),
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
];

// GSC 1012 404s: crawled element-id fragments of real pages; 301 each to its own page.
// (/find-us/fl is an intentional 410 in the proxy and is left alone.)
const gscFragmentRedirects: readonly (readonly [string, string])[] = [
  ["/find-us/wa-2-heading-text-0", "/find-us/wa"],
  ["/find-us/wa-7-paragraph-text-0", "/find-us/wa"],
  ["/find-us/wa-8", "/find-us/wa"],
  ["/find-us/wa-3-paragraph-text-0", "/find-us/wa"],
  ["/find-us/wa-7", "/find-us/wa"],
  ["/find-us/wa-5-heading-text-0", "/find-us/wa"],
  ["/find-us/wa-16", "/find-us/wa"],
  ["/find-us/wa-3", "/find-us/wa"],
  ["/find-us/wa-0", "/find-us/wa"],
  ["/find-us/wa-18-paragraph-text-0", "/find-us/wa"],
  ["/find-us/wa-18", "/find-us/wa"],
  ["/find-us/wa-4", "/find-us/wa"],
  ["/find-us/wa-17-heading-text-0", "/find-us/wa"],
  ["/find-us/ny-13-paragraph-text-0", "/find-us/ny"],
  ["/find-us/ny-2", "/find-us/ny"],
  ["/find-us/ny-1", "/find-us/ny"],
  ["/find-us/ny-11-heading-text-0", "/find-us/ny"],
  ["/find-us/ny-15", "/find-us/ny"],
  ["/find-us/ny-4", "/find-us/ny"],
  ["/find-us/ny-15-paragraph-text-130", "/find-us/ny"],
  ["/find-us/ny-15-paragraph-text-0", "/find-us/ny"],
  ["/moon-rocks/presidential-x-thc-design-6", "/moon-rocks/presidential-x-thc-design"],
  ["/moon-rocks/presidential-x-thc-design-12", "/moon-rocks/presidential-x-thc-design"],
  ["/moon-rocks/presidential-x-thc-design-3-heading-text-0", "/moon-rocks/presidential-x-thc-design"],
  ["/moon-rocks/presidential-x-thc-design-4", "/moon-rocks/presidential-x-thc-design"],
  ["/moon-rocks/presidential-x-thc-design-18", "/moon-rocks/presidential-x-thc-design"],
  ["/moon-rocks/thc-design-moon-rocks-text-0", "/moon-rocks/thc-design-moon-rocks"],
  ["/moon-rocks/wedding-cake-text-0", "/moon-rocks/wedding-cake"],
  ["/moon-rocks/presidential-og-text-0", "/moon-rocks/presidential-og"],
  ["/learn/different-extracts-need-different-heat-link-590", "/learn/different-extracts-need-different-heat"],
  ["/learn/what-is-live-resin-link-101", "/learn/what-is-live-resin"],
  ["/learn/what-is-live-resin-text-134", "/learn/what-is-live-resin"],
  ["/learn/what-is-live-resin-text-90", "/learn/what-is-live-resin"],
  ["/vapes-12-paragraph-text-0", "/vapes"],
  ["/learn-0-paragraph-text-0", "/learn"],
  ["/learn-18-paragraph-text-0", "/learn"],
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  htmlLimitedBots,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/4bl3xvem/production/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: presidentialSecurityHeaders,
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/moon-rocks/cereal-milk-cereal-milk",
        destination: "/moon-rocks/cereal-milk",
        statusCode: 301,
      },
      {
        source: "/moon-podslicensed",
        destination: "/moon-pods",
        statusCode: 301,
      },
      ...["apricotti", "daniel-larusso", "laura-charles"].flatMap((slug) => [
        {
          source: `/moon-rocks/presidential-line-${slug}`,
          destination: "/moon-rocks/presidential-line",
          permanent: true,
        },
        {
          source: `/blunts/${slug}`,
          destination: "/blunts",
          permanent: true,
        },
      ]),
      // Recover editorial backlink authority from the dead Wix homepage.
      {
        source: "/home-1",
        destination: "/",
        permanent: true,
      },
      // Recover the legacy Wix /shop backlink.
      {
        source: "/shop",
        destination: "/moon-rocks",
        permanent: true,
      },
      {
        source: "/not-old-enough",
        destination: "/",
        permanent: true,
      },
      ...gscFragmentRedirects.map(([source, destination]) => ({
        source,
        destination,
        statusCode: 301 as const,
      })),
      // Short term paths: no /thc or /cannabis route exists; send them to the owning term pages with an explicit 301.
      {
        source: "/thc",
        destination: "/presidential-thc",
        statusCode: 301,
      },
      {
        source: "/cannabis",
        destination: "/presidential-cannabis",
        statusCode: 301,
      },
    ];
  },
};

export default nextConfig;
