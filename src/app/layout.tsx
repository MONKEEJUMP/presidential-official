import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { ADULT_CONFIRMATION_COOKIE } from "@/app/age-gate-constants";
import { AgeGate } from "@/components/age-gate";
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
  robots: {
    index: false,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adultConfirmed =
    (await cookies()).get(ADULT_CONFIRMATION_COOKIE)?.value === "true";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div
          aria-hidden="true"
          id="presidential-age-gated-content"
          inert
        >
          {children}
        </div>
        <AgeGate initialConfirmed={adultConfirmed} />
      </body>
    </html>
  );
}
