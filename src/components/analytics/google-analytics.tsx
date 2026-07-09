import Script from "next/script";

import { getGoogleAnalyticsMeasurementId } from "@/lib/analytics/google";

type GoogleAnalyticsProps = {
  nonce?: string;
};

export function GoogleAnalytics({ nonce }: GoogleAnalyticsProps) {
  const measurementId = getGoogleAnalyticsMeasurementId();

  if (!measurementId) return null;

  const encodedMeasurementId = encodeURIComponent(measurementId);

  return (
    <>
      <Script
        id="presidential-ga4-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodedMeasurementId}`}
        strategy="afterInteractive"
        nonce={nonce}
      />
      <Script id="presidential-ga4-init" strategy="afterInteractive" nonce={nonce}>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
