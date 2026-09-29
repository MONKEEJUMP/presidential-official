"use client";

import { usePathname } from "next/navigation";
import styles from "./sales-email.module.css";

export const SALES_EMAIL = "sales@presidentialmoonrocks.com";

type SalesEmailProps = {
  variant: "band" | "strip" | "inline";
  copy?: "partner" | "connect";
  prefix?: string;
  align?: "left" | "center";
  className?: string;
  onlyOn?: readonly string[];
};

const bandCopy = {
  partner: {
    eyebrow: "JOIN THE PRESIDENTIAL TEAM",
    headline: "Carry Presidential in your store.",
    support: "Licensed dispensaries and retailers: email our wholesale team and we'll get you set up.",
  },
  connect: {
    eyebrow: "CONNECT WITH PRESIDENTIAL",
    headline: "Let's talk.",
    support: "Wholesale, retail partnerships and questions for the Presidential team.",
  },
} as const;

export function SalesEmail({ variant, copy = "partner", prefix, align = "center", className = "", onlyOn }: SalesEmailProps) {
  const pathname = usePathname();
  if (pathname === "/pop-up" || pathname === "/loyalty") return null;
  if (onlyOn && !onlyOn.includes(pathname)) return null;

  const email = <a className={styles.email} href={`mailto:${SALES_EMAIL}`}>{SALES_EMAIL}</a>;
  if (variant === "inline") {
    return <span className={`${styles.inline} ${className}`}>{prefix ? `${prefix} ` : null}{email}</span>;
  }
  if (variant === "strip") {
    return <div className={`${styles.strip} ${align === "left" ? styles.left : ""} ${className}`}><p>{prefix ? `${prefix} ` : null}{email}</p></div>;
  }
  const content = bandCopy[copy];
  return (
    <section className={`${styles.band} po-gold-thread-inlay ${className}`} aria-label={content.eyebrow}>
      <div className="mx-auto w-full min-w-0 max-w-7xl">
        <p className="font-display text-xl font-semibold uppercase tracking-[0.08em] text-po-brand sm:text-2xl">{content.eyebrow}</p>
        <h2 className="mt-5 font-display text-4xl uppercase leading-[0.92] text-po-on-dark sm:text-6xl lg:text-7xl">{content.headline}</h2>
        <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-po-on-dark-muted sm:text-lg sm:leading-8">{content.support}</p>
        <p className="mt-8 font-display text-2xl font-semibold leading-tight sm:text-4xl lg:text-5xl">{email}</p>
      </div>
    </section>
  );
}

const hubPaths = new Set([
  "/moon-rocks", "/moon-rocks/silver", "/moon-rocks/gold", "/moon-rocks/rose-gold",
  "/moon-rocks/presidential-line", "/moon-rocks/presidential-house-line", "/moon-rocks/presidential-x-thc-design",
  "/pre-rolls", "/blunts", "/vapes", "/moon-pods", "/orbit",
]);
const brandPaths = new Set(["/about", "/our-story", "/presidential-cannabis", "/presidential-thc", "/presidential-blunts", "/learn"]);
const partnerStatePaths = new Set(["/partners/ca", "/partners/ok", "/partners/ny", "/partners/nv", "/partners/mi", "/partners/az", "/partners/wa"]);

/** Route endings live inside PageFrame's main, above the shared footer. */
export function PageSalesEmail() {
  const pathname = usePathname();
  if (brandPaths.has(pathname) || pathname.startsWith("/learn/")) return <SalesEmail variant="band" copy="connect" />;
  if (hubPaths.has(pathname)) return <SalesEmail variant="strip" prefix="Carry this product in your store:" className={styles.pageStrip} />;
  if (partnerStatePaths.has(pathname)) return <SalesEmail variant="strip" prefix="Want to update your store's listing? Email" className={styles.pageStrip} />;
  return null;
}
