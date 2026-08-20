import "server-only";

import type { Metadata } from "next";
import Image from "next/image";

import { PageFrame } from "@/components/presidential";
import { JsonLd, buildRouteShellJsonLd } from "@/lib/seo/schema";
import {
  buildStaticRouteMetadata,
  getStaticRouteRecord,
} from "@/lib/seo/route-page";

import { PopUpBooking, type OklahomaRetailer } from "./pop-up-booking";
import styles from "./pop-up.module.css";

export const dynamic = "force-dynamic";

const ROUTE_PATH = "/pop-up" as const;

export function generateMetadata(): Metadata {
  return buildStaticRouteMetadata(ROUTE_PATH);
}

function getSupabaseSettings() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  return url && key ? { url, key } : null;
}

function isOklahomaRetailer(value: unknown): value is OklahomaRetailer {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "number" &&
    Number.isSafeInteger(row.id) &&
    row.id > 0 &&
    typeof row.name === "string" &&
    row.name.trim().length > 0 &&
    typeof row.city === "string" &&
    row.city.trim().length > 0
  );
}

async function readOklahomaRetailers(): Promise<readonly OklahomaRetailer[]> {
  const settings = getSupabaseSettings();
  if (!settings) return [];

  const endpoint = new URL(`${settings.url}/rest/v1/retailers`);
  endpoint.searchParams.set("select", "id,name,city");
  endpoint.searchParams.set("state", "eq.OK");
  endpoint.searchParams.set("public_locator_status", "eq.approved_public_locator");
  endpoint.searchParams.set("order", "name.asc,city.asc");
  endpoint.searchParams.set("limit", "1000");

  try {
    const response = await fetch(endpoint, {
      headers: { apikey: settings.key },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      console.error("Pop-Up Oklahoma retailer read returned status", response.status);
      return [];
    }

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload) || !payload.every(isOklahomaRetailer)) {
      console.error("Pop-Up Oklahoma retailer read returned an invalid payload.");
      return [];
    }
    return payload;
  } catch {
    console.error("Pop-Up Oklahoma retailer read failed.");
    return [];
  }
}

export default async function PopUpPage() {
  const route = getStaticRouteRecord(ROUTE_PATH);
  const jsonLdEntries = buildRouteShellJsonLd(route);
  const retailers = await readOklahomaRetailers();

  return (
    <>
      {jsonLdEntries.map((entry) => (
        <JsonLd key={`${route.id}-${entry.id}`} data={entry.data} />
      ))}

      <PageFrame className={styles.page}>
        <section className={styles.hero} aria-labelledby="popup-title">
          <div className={styles.heroMedia} aria-hidden="true">
            <Image
              className={styles.heroImage}
              src="/media/presidential-pop-up-party-hero.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
            />
          </div>

          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>Presidential Pop-Up</p>
            <h1 id="popup-title">
              <span>THREE</span>
              <span>YOU&apos;RE FREE</span>
            </h1>
            <p className={styles.subtitle}>The Presidential Pop-Up Party Weekend</p>
            <div className={styles.heroDetails}>
              <p>Presidential staff, promotional products and a DJ bring the party.</p>
              <p>Thursday through Saturday is free for Presidential retailers.</p>
              <p>Choose your day, then a Presidential associate closes it by phone.</p>
            </div>
            <a className={styles.heroButton} href="#book-your-day">
              TO GET STARTED CLICK HERE
            </a>
          </div>
        </section>

        <PopUpBooking retailers={retailers} />
      </PageFrame>
    </>
  );
}
