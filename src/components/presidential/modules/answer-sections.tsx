import { isValidElement, type ReactNode } from "react";
import type { FAQPage, WithContext } from "schema-dts";

import { JsonLd } from "@/lib/seo/schema";

import { Scene } from "../layout/scene";

// Question-led content sections (SALVAGE 1006). Each answer uses only facts that
// already appear on the site or in the repo's product data.

export type AnswerItem = {
  readonly id: string;
  readonly question: string;
  readonly answer: ReactNode;
};

export const answerLinkClass =
  "font-semibold text-po-ink underline decoration-po-brand underline-offset-4 transition-colors hover:text-po-brand-ink";

// Plain text of a rendered answer, so FAQPage JSON-LD repeats the visible copy word for word.
function answerText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(answerText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    const text = answerText(node.props.children);
    return node.type === "p" || node.type === "li" ? ` ${text} ` : text;
  }
  return "";
}

function buildAnswerFaqSchema(items: readonly AnswerItem[]): WithContext<FAQPage> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items
      .filter((item) => item.question.trim().endsWith("?"))
      .map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: answerText(item.answer).replace(/\s+/g, " ").trim() },
      })),
  };
}

export function AnswerSections({
  id,
  eyebrow,
  items,
  faqSchema = false,
}: {
  readonly id: string;
  readonly eyebrow: string;
  readonly items: readonly AnswerItem[];
  /** Emit FAQPage JSON-LD for the question items. Pass isRouteFaqSchemaEnabled(route), never a bare true. */
  readonly faqSchema?: boolean;
}) {
  return (
    <>
    {faqSchema ? <JsonLd data={buildAnswerFaqSchema(items)} /> : null}
    <Scene ariaLabelledBy={`${id}-title`} className="po-gold-thread-inlay py-20 lg:py-28" tone="default">
      <div className="mx-auto w-full max-w-4xl">
        <p className="text-xs font-black uppercase text-po-brand-ink" id={`${id}-title`}>
          {eyebrow}
        </p>
        {items.map((item) => (
          <section aria-labelledby={item.id} className="mt-10 border-t border-po-line pt-8" key={item.id}>
            <h2 className="font-display text-3xl uppercase leading-[0.95] text-po-ink sm:text-4xl" id={item.id}>
              {item.question}
            </h2>
            <div className="mt-5 grid gap-4 text-base leading-7 text-po-body">{item.answer}</div>
          </section>
        ))}
      </div>
    </Scene>
    </>
  );
}
