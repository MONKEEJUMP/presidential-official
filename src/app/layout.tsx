import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies, headers } from "next/headers";
import { ADULT_CONFIRMATION_COOKIE } from "@/app/age-gate-constants";
import { AgeGate } from "@/components/age-gate";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { getGoogleSiteVerification } from "@/lib/analytics/google";
import { METADATA_BASE } from "@/lib/seo/metadata";
import "./globals.css";

// Clash Display + Source Serif 4 (font license files live beside
// the woff2s). Semibold carries the 400-600 range so unweighted display
// headings render Semibold per the owner's font order.
const clashDisplay = localFont({
  src: [
    { path: "../fonts/clash-display-semibold.woff2", weight: "400 600" },
    { path: "../fonts/clash-display-bold.woff2", weight: "700 900" },
  ],
  variable: "--font-clash-display",
  display: "swap",
});

const sourceSerif4 = localFont({
  src: [
    {
      path: "../fonts/source-serif-4-latin-variable.woff2",
      weight: "200 900",
      style: "normal",
    },
  ],
  variable: "--font-source-serif-4",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: METADATA_BASE,
  title: {
    default: "Presidential",
    template: "%s",
  },
  description:
    "Official home of Presidential cannabis products for adults 21+ where legal.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
  ...(getGoogleSiteVerification()
    ? { verification: { google: getGoogleSiteVerification() } }
    : {}),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adultConfirmed =
    (await cookies()).get(ADULT_CONFIRMATION_COOKIE)?.value === "true";
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="en"
      className={`${clashDisplay.variable} ${sourceSerif4.variable} h-full antialiased`}
      data-presidential-adult-confirmed={adultConfirmed ? "true" : "false"}
    >
      <body className="min-h-full flex flex-col">
        <div
          aria-hidden={adultConfirmed ? undefined : "true"}
          id="presidential-age-gated-content"
          inert={adultConfirmed ? undefined : true}
        >
          {children}
        </div>
        <AgeGate initialConfirmed={adultConfirmed} />
        {adultConfirmed ? <GoogleAnalytics nonce={nonce} /> : null}
      </body>
    </html>
  );
}
