import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowsClockwise,
  BatteryFull,
  Briefcase,
  CheckCircle,
  CirclesThree,
  ClipboardText,
  Clock,
  Compass,
  Crown,
  Crosshair,
  Diamond,
  Drop,
  Ear,
  Eye,
  FileText,
  Flag,
  Flower,
  Gauge,
  GraduationCap,
  Handshake,
  Leaf,
  ListChecks,
  MagnifyingGlass,
  Monitor,
  Package,
  PlayCircle,
  Question,
  SealCheck,
  ShieldCheck,
  Sparkle,
  Storefront,
  Target,
  Thermometer,
  ThumbsUp,
  Wrench,
  XCircle,
} from "@phosphor-icons/react/ssr";

import styles from "./presidential-sros-section.module.css";

type Tier = "silver" | "gold" | "rose-gold";
type IconTone = "teal" | "gold" | "red" | Tier;

const FOUNDATION = [
  {
    heading: "OUR MISSION",
    icon: Flag,
    lines: [
      "To create the highest quality cannabis experiences through precision infusion, innovative technology, and uncompromising standards.",
    ],
    wide: true,
  },
  {
    heading: "BRAND PILLARS",
    icon: ShieldCheck,
    lines: [
      "Premium Ingredients",
      "Precision Infusion",
      "Smart Technology",
      "Unmatched Experience",
    ],
    wide: false,
  },
  {
    heading: "OUR PROMISE",
    icon: Leaf,
    lines: ["Different Oils.", "Different Heat.", "Different Results."],
    wide: false,
  },
  {
    heading: "OUR STANDARD",
    icon: SealCheck,
    lines: ["Built For The Oil.", "Built To Lead.", "Built To Last."],
    wide: false,
  },
  {
    heading: "OUR PURPOSE",
    icon: Compass,
    lines: [
      "Elevate every experience.",
      "Empower every partner.",
      "Lead every market.",
    ],
    wide: false,
  },
] as const;

const TIERS = [
  {
    tier: "silver" as const,
    icon: Diamond,
    href: "/moon-rocks/silver",
    name: "SILVER",
    extract: "LIQUID DIAMONDS",
    descriptor: "MAX FLAVOR. MAX ACCESSIBILITY.",
  },
  {
    tier: "gold" as const,
    icon: Drop,
    href: "/moon-rocks/gold",
    name: "GOLD",
    extract: "LIVE RESIN",
    descriptor: "BALANCED. AUTHENTIC. TRUE-TO-PLANT.",
  },
  {
    tier: "rose-gold" as const,
    icon: Crown,
    href: "/moon-rocks/rose-gold",
    name: "ROSE GOLD",
    extract: "LIVE ROSIN",
    descriptor: "CRAFTED. PURE. PREMIUM.",
  },
] as const;

const PLATFORMS = [
  {
    href: "/moon-rocks",
    name: "MOON ROCKS™",
    descriptor: "COMBUSTION",
  },
  {
    href: "/vapes",
    name: "MOON PODS™ + ORBIT™",
    descriptor: "SMART VAPOR",
  },
] as const;

const EXPRESSIONS = [
  { href: "/moon-rocks", label: "2G MOON ROCKS" },
  { href: "/pre-rolls", label: "MOON ROCK PREROLLS" },
  { href: "/blunts", label: "MOON ROCK BLUNTS" },
  { href: "/vapes", label: "MOON PODS" },
] as const;

const INFUSION_TILES = [
  { icon: Flower, label: "PREMIUM FLOWER" },
  { icon: Drop, label: "PREMIUM OIL" },
  { icon: Crosshair, label: "PRECISION INFUSION" },
  { icon: Sparkle, label: "PREMIUM EXPERIENCE" },
] as const;

const INFUSION_SYMBOLS = ["+", "+", "="] as const;

const INFUSION_CHECKLIST = [
  "Slow Infusion for Maximum Absorption",
  "Lab Tested for Consistency & Purity",
  "Proprietary Process for Superior Potency",
  "Crafted in Small Batches",
  "Experience You Can Trust. Every Time.",
] as const;

const ORBIT_FEATURES = [
  { icon: CirclesThree, label: "3 OIL MODES", line: "LD • LR • LRO" },
  { icon: Thermometer, label: "SMART HEATING", line: "Optimizes for each oil" },
  {
    icon: Gauge,
    label: "PRECISION TEMP CONTROL",
    line: "Every oil has a sweet spot",
  },
  { icon: Monitor, label: "DIGITAL DISPLAY", line: "Real-time session feedback" },
  { icon: BatteryFull, label: "LONG-LASTING BATTERY", line: "All-day performance" },
  { icon: Drop, label: "BUILT FOR EVERY OIL", line: "Engineered for maximum flavor" },
] as const;

const RECOMMENDATIONS = [
  {
    experience: "MAX FLAVOR",
    second: "FUN & FRUITY",
    tier: "SILVER",
    tierTone: "silver" as const,
    extract: "LIQUID DIAMONDS",
    formats: "Moon Rocks • Prerolls • Blunts • Moon Pods",
  },
  {
    experience: "BALANCED",
    second: "AUTHENTIC",
    tier: "GOLD",
    tierTone: "gold" as const,
    extract: "LIVE RESIN",
    formats: "Moon Rocks • Prerolls • Blunts • Moon Pods",
  },
  {
    experience: "PREMIUM",
    second: "CONNOISSEUR",
    tier: "ROSE GOLD",
    tierTone: "rose-gold" as const,
    extract: "LIVE ROSIN",
    formats: "Moon Rocks • Prerolls • Blunts • Moon Pods",
  },
] as const;

const SELLING_POINTS = [
  {
    tier: "silver" as const,
    name: "SILVER",
    extract: "LIQUID DIAMONDS",
    points: [
      "Bold, Fruity Flavors",
      "High Potency",
      "Smooth, Consistent Hit",
      "Perfect for Flavor Chasers",
      "Best Entry Experience",
    ],
  },
  {
    tier: "gold" as const,
    name: "GOLD",
    extract: "LIVE RESIN",
    points: [
      "True-to-Strain Flavor",
      "Full Spectrum Experience",
      "Balanced High",
      "Everyday Favorite",
      "Most Versatile Tier",
    ],
  },
  {
    tier: "rose-gold" as const,
    name: "ROSE GOLD",
    extract: "LIVE ROSIN",
    points: [
      "Top-Shelf Flower",
      "Solventless Extraction",
      "Purest Expression",
      "Connoisseur Quality",
      "Ultimate Experience",
    ],
  },
] as const;

const DONT_LINES = [
  "Don't compete on price",
  "Don't make medical claims",
  "Don't promise effects",
  "Don't badmouth competitors",
  "Don't guess",
  "Don't overpromise",
  "Don't ignore compliance",
  "Don't pressure the budtender",
] as const;

const DO_LINES = [
  "Educate, don't sell",
  "Listen more than you talk",
  "Ask great questions",
  "Solve problems",
  "Be a trusted partner",
  "Follow up",
  "Support the retailer",
  "Build long-term relationships",
] as const;

const SUCCESS_STEPS = [
  { icon: Ear, label: "LISTEN", line: "Understand their business" },
  { icon: MagnifyingGlass, label: "DIAGNOSE", line: "Identify needs & opportunities" },
  { icon: Target, label: "RECOMMEND", line: "Match the right experience" },
  { icon: GraduationCap, label: "EDUCATE", line: "Empower their team" },
  { icon: Handshake, label: "SUPPORT", line: "Provide tools & training" },
  { icon: ArrowsClockwise, label: "FOLLOW UP", line: "Ensure success & re-order" },
] as const;

const OBJECTIONS = [
  {
    question: "Why are you more expensive?",
    answer:
      "Because we use premium ingredients, precision infusion, and smart technology to deliver unmatched experiences.",
  },
  {
    question: "Why use Orbit?",
    answer:
      "Different oils need different heat. Orbit™ automatically optimizes the experience for the perfect hit.",
  },
  {
    question: "Why Moon Pods?",
    answer:
      "Purpose-built pods designed to work seamlessly with Orbit™ for maximum performance.",
  },
  {
    question: "Why more space?",
    answer:
      "Presidential is an ecosystem that drives traffic, grows basket size, and builds loyalty.",
  },
] as const;

const RETAIL_EXECUTION = [
  { icon: Eye, label: "VISIBLE", line: "Use premium displays & signage" },
  { icon: GraduationCap, label: "EDUCATED", line: "Budtenders trained & confident" },
  { icon: Package, label: "AVAILABLE", line: "Stock the full ecosystem" },
  { icon: ThumbsUp, label: "RECOMMENDED", line: "Easy for budtenders to recommend" },
  { icon: ArrowsClockwise, label: "REORDERED", line: "Consistent sell-through & reorders" },
] as const;

const FIELD_BEHAVIORS = [
  { icon: Briefcase, label: "BE PROFESSIONAL" },
  { icon: ClipboardText, label: "BE PREPARED" },
  { icon: Clock, label: "BE RELIABLE" },
  { icon: Wrench, label: "BE A PROBLEM SOLVER" },
  { icon: Crown, label: "BE A BRAND BUILDER" },
] as const;

const TOOLS = [
  { icon: FileText, label: "SALES SHEETS", line: "Product info & sell sheets" },
  {
    icon: ListChecks,
    label: "BUDTENDER CHEAT SHEETS",
    line: "Quick education guides",
  },
  { icon: Storefront, label: "DISPLAY KITS", line: "Merchandising materials" },
  { icon: PlayCircle, label: "TRAINING VIDEOS", line: null },
  { icon: Question, label: "FAQ LIBRARY", line: "Objections & answers" },
] as const;

const MANTRA_LIGHT = [
  "KNOW THE BRAND.",
  "KNOW THE CONSUMER.",
  "KNOW THE PRODUCT.",
  "KNOW THE SYSTEM.",
] as const;

const MANTRA_GOLD = [
  "WIN THE SHELF.",
  "WIN THE BUDTENDER.",
  "WIN THE CONSUMER.",
  "WIN THE MARKET.",
] as const;

function SrosIcon({
  Icon,
  tone = "teal",
}: {
  readonly Icon: typeof Crown;
  readonly tone?: IconTone;
}) {
  return (
    <span className={styles.iconRing} data-tone={tone}>
      <Icon aria-hidden="true" size={28} weight="regular" />
    </span>
  );
}

function BandHeading({ children, id }: { readonly children: string; readonly id: string }) {
  return (
    <h3 className={styles.bandHeading} data-sros-line id={id}>
      {children}
    </h3>
  );
}

function Arrow({ step }: { readonly step?: number }) {
  return (
    <ArrowRight
      aria-hidden="true"
      className={styles.arrow}
      data-step-arrow={step}
      size={28}
      weight="regular"
    />
  );
}

export function PresidentialSrosSection() {
  return (
    <section aria-labelledby="sros-heading" className={styles.sros} id="sros">
      <header className={`${styles.band} ${styles.titleBand}`} data-sros-band="1">
        <div className={`${styles.inner} ${styles.centered}`}>
          <div className={styles.brandLockup}>
            <Image
              alt="Presidential crest"
              height={72}
              sizes="93px"
              src="/media/brand/presidential-crest-master.png"
              width={93}
            />
            <p data-sros-line>BUILT FOR THE OIL.</p>
          </div>
          <p className={styles.eyebrow} data-sros-line>
            THE PRESIDENTIAL SROS
          </p>
          <h2 className={styles.sectionHeading} id="sros-heading">
            <span data-sros-line>PRESIDENTIAL</span>
            <span data-sros-line>SALES REP OPERATING SYSTEM™</span>
          </h2>
          <p className={styles.goldLead} data-sros-line>
            THE SYSTEM. THE STANDARD. THE DIFFERENCE.
          </p>
        </div>
      </header>

      <section className={styles.band} data-sros-band="2">
        <div className={styles.inner}>
          <div className={styles.foundationGrid}>
            {FOUNDATION.map(({ heading, icon: Icon, lines, wide }) => (
              <article data-wide={wide || undefined} key={heading}>
                <SrosIcon Icon={Icon} />
                <h3 data-sros-line>{heading}</h3>
                <div className={styles.copyStack}>
                  {lines.map((line) => (
                    <p data-sros-line key={line}>
                      {line}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.band} data-sros-band="3">
        <div className={styles.inner}>
          <BandHeading id="sros-ecosystem-heading">THE PRESIDENTIAL ECOSYSTEM™</BandHeading>
          <p className={styles.goldLead} data-sros-line>
            3 EXPERIENCES. 2 PLATFORMS. 4 EXPRESSIONS. 1 STANDARD.
          </p>

          <p className={styles.rowLabel} data-sros-line>
            3 EXPERIENCE TIERS
          </p>
          <div className={styles.tierGrid}>
            {TIERS.map(({ tier, icon: Icon, href, name, extract, descriptor }) => {
              const nameId = `sros-${tier}-tier`;
              return (
                <Link
                  aria-labelledby={nameId}
                  className={`${styles.card} ${styles.tierCard} ${styles.linked}`}
                  data-tier={tier}
                  href={href}
                  key={tier}
                >
                  <SrosIcon Icon={Icon} tone={tier} />
                  <p className={styles.cardLabel} data-sros-line id={nameId}>
                    {name}
                  </p>
                  <p className={styles.extract} data-sros-line>
                    {extract}
                  </p>
                  <p className={styles.descriptor} data-sros-line>
                    {descriptor}
                  </p>
                </Link>
              );
            })}
          </div>

          <p className={styles.rowLabel} data-sros-line>
            2 PLATFORMS
          </p>
          <div className={styles.platformGrid}>
            {PLATFORMS.map(({ href, name, descriptor }, index) => {
              const nameId = `sros-platform-${index + 1}`;
              return (
                <Link
                  aria-labelledby={nameId}
                  className={`${styles.card} ${styles.platformCard} ${styles.linked}`}
                  href={href}
                  key={name}
                >
                  <p className={styles.cardLabel} data-sros-line id={nameId}>
                    {name}
                  </p>
                  <p data-sros-line>{descriptor}</p>
                </Link>
              );
            })}
          </div>

          <p className={styles.rowLabel} data-sros-line>
            4 EXPRESSIONS
          </p>
          <div className={styles.expressionLinks}>
            {EXPRESSIONS.map(({ href, label }) => (
              <Link className={styles.expressionLink} href={href} key={label}>
                <span data-sros-line>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.band} data-sros-band="4">
        <div className={styles.inner}>
          <BandHeading id="sros-infusion-heading">THE PRESIDENTIAL INFUSION PROCESS™</BandHeading>
          <p className={styles.goldLead} data-sros-line>
            PRECISION. PATIENCE. PERFECTION.
          </p>
          <div className={styles.equationRow}>
            {INFUSION_TILES.map(({ icon: Icon, label }, index) => (
              <div className={styles.equationFragment} key={label}>
                <article className={`${styles.card} ${styles.equationTile}`}>
                  <SrosIcon Icon={Icon} />
                  <p data-sros-line>{label}</p>
                </article>
                {index < INFUSION_SYMBOLS.length ? (
                  <span className={styles.equationSymbol} data-sros-line>
                    {INFUSION_SYMBOLS[index]}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          <div className={styles.checkGrid}>
            {INFUSION_CHECKLIST.map((line) => (
              <p data-sros-line key={line}>
                <CheckCircle aria-hidden="true" size={20} weight="regular" />
                <span>{line}</span>
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.band} data-sros-band="5">
        <div className={styles.inner}>
          <BandHeading id="sros-orbit-heading">THE ORBIT™ ADVANTAGE</BandHeading>
          <p className={styles.goldLead} data-sros-line>
            DIFFERENT OILS NEED DIFFERENT HEAT.
          </p>
          <div className={styles.featureGrid}>
            {ORBIT_FEATURES.map(({ icon: Icon, label, line }) => (
              <article className={styles.card} key={label}>
                <SrosIcon Icon={Icon} />
                <p className={styles.cardLabel} data-sros-line>{label}</p>
                <p data-sros-line>{line}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.band} data-sros-band="6">
        <div className={styles.inner}>
          <BandHeading id="sros-recommendation-heading">CONSUMER RECOMMENDATION GUIDE</BandHeading>
          <p className={styles.goldLead} data-sros-line>
            START WITH THE EXPERIENCE THEY WANT.
          </p>
          <div className={styles.recommendationGrid}>
            {RECOMMENDATIONS.map((row) => (
              <article className={`${styles.card} ${styles.recommendationRow}`} key={row.tier}>
                <div className={styles.recommendationExperience}>
                  <p className={styles.cardLabel} data-sros-line>{row.experience}</p>
                  <p data-sros-line>{row.second}</p>
                </div>
                <Arrow />
                <div className={styles.recommendationTier} data-tier={row.tierTone}>
                  <p className={styles.cardLabel} data-sros-line>{row.tier}</p>
                  <p data-sros-line>{row.extract}</p>
                </div>
                <Arrow />
                <p className={styles.recommendationFormats} data-sros-line>
                  {row.formats}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.band} data-sros-band="7">
        <div className={styles.inner}>
          <BandHeading id="sros-selling-points-heading">KEY SELLING POINTS</BandHeading>
          <div className={styles.sellingGrid}>
            {SELLING_POINTS.map(({ tier, name, extract, points }) => (
              <article className={`${styles.card} ${styles.sellingColumn}`} data-tier={tier} key={tier}>
                <h4 data-sros-line>{name}</h4>
                <p className={styles.extract} data-sros-line>
                  {extract}
                </p>
                <ul>
                  {points.map((point) => (
                    <li data-sros-line key={point}>
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.band} data-sros-band="8">
        <div className={styles.inner}>
          <BandHeading id="sros-do-dont-heading">WHAT WE DON&apos;T SAY / WHAT WE DO SAY</BandHeading>
          <div className={styles.behaviorColumns}>
            <article className={`${styles.card} ${styles.dontColumn}`}>
              <h4 data-sros-line>DON&apos;T</h4>
              <ul>
                {DONT_LINES.map((line) => (
                  <li data-sros-line key={line}>
                    <XCircle aria-hidden="true" size={20} weight="regular" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className={`${styles.card} ${styles.doColumn}`}>
              <h4 data-sros-line>DO</h4>
              <ul>
                {DO_LINES.map((line) => (
                  <li data-sros-line key={line}>
                    <CheckCircle aria-hidden="true" size={20} weight="regular" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.band} data-sros-band="9">
        <div className={styles.inner}>
          <BandHeading id="sros-success-heading">THE RETAIL SUCCESS FORMULA</BandHeading>
          <div className={styles.successFlow}>
            {SUCCESS_STEPS.map(({ icon: Icon, label, line }, index) => (
              <div className={styles.successFragment} key={label}>
                <article>
                  <SrosIcon Icon={Icon} />
                  <p className={styles.cardLabel} data-sros-line>{label}</p>
                  <p data-sros-line>{line}</p>
                </article>
                {index < SUCCESS_STEPS.length - 1 ? <Arrow step={index + 1} /> : null}
              </div>
            ))}
          </div>
          <blockquote className={styles.pullQuote} data-sros-line>
            &quot;EVERY RETAILER SHOULD FEEL THAT PRESIDENTIAL IMPROVED THEIR BUSINESS — WHETHER THEY PURCHASED TODAY OR NOT.&quot;
          </blockquote>
        </div>
      </section>

      <section className={styles.band} data-sros-band="10">
        <div className={styles.inner}>
          <BandHeading id="sros-objections-heading">Q&amp;A</BandHeading>
          <div className={styles.objectionGrid}>
            {OBJECTIONS.map(({ question, answer }) => (
              <article className={`${styles.card} ${styles.objectionCard}`} key={question}>
                <p className={styles.questionLine}>
                  <span className={styles.qMarker} data-sros-line>
                    Q:
                  </span>
                  <span data-sros-line>{question}</span>
                </p>
                <p className={styles.answerLine}>
                  <span className={styles.aMarker} data-sros-line>
                    A:
                  </span>
                  <span data-sros-line>{answer}</span>
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.band} data-sros-band="11">
        <div className={styles.inner}>
          <BandHeading id="sros-execution-heading">RETAIL EXECUTION</BandHeading>
          <div className={styles.executionList}>
            {RETAIL_EXECUTION.map(({ icon: Icon, label, line }) => (
              <article className={styles.card} key={label}>
                <SrosIcon Icon={Icon} />
                <div>
                  <p className={styles.cardLabel} data-sros-line>{label}</p>
                  <p data-sros-line>{line}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.band} data-sros-band="12">
        <div className={`${styles.inner} ${styles.fieldToolsGrid}`}>
          <section className={styles.fieldBlock} aria-labelledby="sros-field-heading">
            <h3 data-sros-line id="sros-field-heading">
              FIELD BEHAVIORS
            </h3>
            <div className={styles.fieldList}>
              {FIELD_BEHAVIORS.map(({ icon: Icon, label }) => (
                <p data-sros-line key={label}>
                  <SrosIcon Icon={Icon} />
                  <span>{label}</span>
                </p>
              ))}
            </div>
          </section>
          <section className={styles.toolsBlock} aria-labelledby="sros-tools-heading">
            <h3 data-sros-line id="sros-tools-heading">
              TOOLS &amp; RESOURCES
            </h3>
            <div className={styles.toolsGrid}>
              {TOOLS.map(({ icon: Icon, label, line }) => (
                <article className={styles.card} key={label}>
                  <SrosIcon Icon={Icon} />
                  <p className={styles.cardLabel} data-sros-line>{label}</p>
                  {line ? <p data-sros-line>{line}</p> : null}
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className={styles.band} data-sros-band="13">
        <div className={styles.inner}>
          <div className={styles.mantraGrid}>
            <div>
              <BandHeading id="sros-mantra-heading">OUR MANTRA</BandHeading>
              <div className={styles.mantraLight}>
                {MANTRA_LIGHT.map((line) => (
                  <p data-sros-line key={line}>
                    {line}
                  </p>
                ))}
              </div>
              <div className={styles.mantraGold}>
                {MANTRA_GOLD.map((line) => (
                  <p data-sros-line key={line}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
            <div className={styles.wordmarkLockup}>
              <Image
                alt="Presidential"
                height={48}
                sizes="146px"
                src="/media/brand/presidential-banner.png"
                width={146}
              />
              <p data-sros-line>BUILT FOR THE OIL.</p>
            </div>
          </div>
          <div className={styles.finalClose}>
            <p data-sros-line>DIFFERENT OILS. DIFFERENT HEAT. DIFFERENT RESULTS.</p>
            <p data-sros-line>BUILT FOR THE OIL. BUILT TO LEAD. BUILT TO LAST.</p>
          </div>
        </div>
      </section>
    </section>
  );
}
