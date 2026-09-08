import { APPROVED_SAME_AS } from "@/lib/seo/schema/constants";

import { Scene } from "../layout/scene";

const OUR_STORY_INDEPENDENT_COVERAGE = [
  {
    href: "https://cannabisindustryjournal.com/feature_article/a-qa-with-everett-smith-co-founder-ceo-of-presidential/",
    label: "A Q&A with Everett Smith, Co-Founder & CEO of Presidential",
    publisher: "Cannabis Industry Journal",
  },
  {
    href: "https://www.newcannabisventures.com/this-california-cannabis-brand-is-headed-to-three-new-markets/",
    label: "This California Cannabis Brand Is Headed to Three New Markets",
    publisher: "New Cannabis Ventures",
  },
] as const;

const OFFICIAL_PROFILE_LABELS: Record<(typeof APPROVED_SAME_AS)[number], string> = {
  "https://www.instagram.com/presidentialofficial_/": "Instagram — Presidential Official",
  "https://www.instagram.com/presidential_medss/": "Instagram — Presidential Meds",
  "https://www.facebook.com/p/Presidential-RX-100069511874496/": "Facebook — Presidential RX",
  "https://www.linkedin.com/in/everett-smith-presidential/": "LinkedIn — Everett Smith / Presidential",
};

export function OurStoryAuthoritySources() {
  return (
    <Scene ariaLabelledBy="presidential-independent-coverage" className="po-gold-thread-inlay py-20 lg:py-28" tone="quiet">
      <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-xs font-black uppercase text-po-brand-ink">Source trail</p>
          <h2 className="mt-5 font-display text-4xl uppercase leading-[0.92] text-po-ink sm:text-5xl" id="presidential-independent-coverage">Independent coverage</h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-po-body">Third-party interviews document Presidential&apos;s 2012 start, its founders, product focus, and early market expansion. External links remain withheld until their publication approval is recorded.</p>
          <ul className="mt-8 border-t border-po-line">
            {OUR_STORY_INDEPENDENT_COVERAGE.map((source) => (
              <li className="border-b border-po-line py-5" key={source.href}>
                <p className="font-semibold text-po-ink">{source.label}</p>
                <p className="mt-2 text-sm text-po-muted">{source.publisher}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-black uppercase text-po-brand-ink">Verified identity</p>
          <h2 className="mt-5 font-display text-4xl uppercase leading-[0.92] text-po-ink sm:text-5xl">Official profiles</h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-po-body">These are the same owner-approved profiles connected to the Presidential Organization entity in structured data.</p>
          <ul className="mt-8 border-t border-po-line">
            {APPROVED_SAME_AS.map((href) => (
              <li className="border-b border-po-line py-5" key={href}>
                <a className="font-semibold text-po-ink underline decoration-po-brand underline-offset-4 transition-colors hover:text-po-brand-ink focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-po-brand" href={href} rel="external">{OFFICIAL_PROFILE_LABELS[href]}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Scene>
  );
}
