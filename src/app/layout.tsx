import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies, headers } from "next/headers";
import { ADULT_CONFIRMATION_COOKIE } from "@/app/age-gate-constants";
import { AgeGate } from "@/components/age-gate";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { getGoogleSiteVerification } from "@/lib/analytics/google";
import { METADATA_BASE } from "@/lib/seo/metadata";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    icon: "/favicon.png",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
        <GoogleAnalytics nonce={nonce} />
      </body>
    </html>
  );
}
