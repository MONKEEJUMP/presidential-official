import type { NextConfig } from "next";

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
      {
        source: "/sales/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet, noimageindex",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
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
    ];
  },
};

export default nextConfig;
