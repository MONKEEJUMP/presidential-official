import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies, headers } from "next/headers";
import { ADULT_CONFIRMATION_COOKIE } from "@/app/age-gate-constants";
import { AgeGate } from "@/components/age-gate";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { getGoogleSiteVerification } from "@/lib/analytics/google";
import { METADATA_BASE } from "@/lib/seo/metadata";
import "./globals.css";

const archivoBlack = localFont({
  src: "../fonts/archivo-black-latin.woff2",
  variable: "--font-archivo-black",
  weight: "400",
  display: "swap",
});

const inter = localFont({
  src: "../fonts/inter-latin-variable.woff2",
  variable: "--font-inter",
  weight: "100 900",
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
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: false,
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
      className={`${archivoBlack.variable} ${inter.variable} h-full antialiased`}
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
