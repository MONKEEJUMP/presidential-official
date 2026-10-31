import Link from "next/link";
import type { Article, FAQPage, WithContext } from "schema-dts";

import { MOONROCKS_GUIDE, MOONROCKS_QUESTIONS } from "@/lib/learn/moonrocks-guide";
import { JsonLd, ORGANIZATION_ID, canonicalUrl, SCHEMA_CONTEXT } from "@/lib/seo/schema";

import { Scene } from "../layout/scene";

export function MoonrocksGuideJsonLd() {
  const url = canonicalUrl(MOONROCKS_GUIDE.path);
  const article: WithContext<Article> = {
    "@context": SCHEMA_CONTEXT,
    "@type": "Article",
    "@id": `${url}#article`,
    url,
    headline: MOONROCKS_GUIDE.h1,
    description: MOONROCKS_GUIDE.description,
    mainEntityOfPage: { "@id": `${url}#webpage` },
    author: { "@type": "Organization", "@id": ORGANIZATION_ID, name: "Presidential", url: canonicalUrl("/about") },
    publisher: { "@id": ORGANIZATION_ID },
    datePublished: MOONROCKS_GUIDE.datePublished,
    dateModified: MOONROCKS_GUIDE.dateModified,
  };
  const faq: WithContext<FAQPage> = {
    "@context": SCHEMA_CONTEXT,
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: MOONROCKS_QUESTIONS.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
  return <><JsonLd data={article} /><JsonLd data={faq} /></>;
}

export function MoonrocksGuideSections() {
  return (
    <Scene ariaLabel="Moon Rocks questions and answers" className="po-gold-thread-inlay py-20 lg:py-28" tone="default">
      <div className="mx-auto w-full max-w-4xl space-y-12">
        {MOONROCKS_QUESTIONS.map((item) => (
          <section aria-labelledby={`moonrocks-${item.id}`} key={item.id}>
            <h2 className="font-display text-3xl uppercase leading-tight text-po-ink sm:text-4xl" id={`moonrocks-${item.id}`}>
              {item.question}
            </h2>
            <p className="mt-5 text-base leading-8 text-po-body sm:text-lg">{item.answer}</p>
            {"source" in item ? (
              <p className="mt-3 text-sm leading-6 text-po-body">
                <a className="font-semibold underline underline-offset-4" href={item.source.href}>{item.source.label}</a>
              </p>
            ) : null}
          </section>
        ))}
        <section aria-labelledby="moonrocks-shop" className="border-t border-po-line pt-8">
          <h2 className="font-display text-3xl text-po-ink" id="moonrocks-shop">Shop Presidential Moon Rocks</h2>
          <p className="mt-5 text-base leading-8 text-po-body">
            Explore <Link className="font-semibold underline underline-offset-4" href="/moon-rocks">Presidential Moon Rocks</Link>,{" "}
            <Link className="font-semibold underline underline-offset-4" href="/pre-rolls">pre-rolls</Link> and{" "}
            <Link className="font-semibold underline underline-offset-4" href="/blunts">blunts</Link> before visiting a licensed retailer.
            Availability varies by retailer. For adults 21+ where legal; this site does not sell cannabis directly.
          </p>
        </section>
      </div>
    </Scene>
  );
}
