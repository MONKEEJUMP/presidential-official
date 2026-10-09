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
      // Short term paths: no /thc or /cannabis route exists; send them to the owning term pages.
      {
        source: "/thc",
        destination: "/presidential-thc",
        permanent: true,
      },
      {
        source: "/cannabis",
        destination: "/presidential-cannabis",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
