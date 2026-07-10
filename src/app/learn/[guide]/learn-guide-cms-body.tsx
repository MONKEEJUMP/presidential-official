import Link from "next/link";

import { CmsHomepageModuleRenderer, Scene } from "@/components/presidential";
import { SectionHeading } from "@/components/presidential/primitives/section-heading";
import type {
  SanityHomepageModule,
  SanityLinkedRecord,
  SanityPortableTextBlock,
} from "@/lib/cms/homepage";
import { sanitizePublicCmsModule } from "@/lib/cms/public-content";

type LearnGuideCmsBodyProps = {
  readonly modules: readonly SanityHomepageModule[];
};

type LearnGuideBodyModuleProps = {
  readonly module: SanityHomepageModule;
  readonly index: number;
};

const PUBLIC_PRODUCT_ROUTES = new Set(["moon-rocks", "moon-pods", "orbit"]);

function portableTextToPlainText(value?: string | readonly SanityPortableTextBlock[]): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value
    .map((block) => block.children?.map((child) => child.text || "").join("") || "")
    .filter(Boolean)
    .join("\n\n");
}

function moduleBody(module: SanityHomepageModule): string {
  return (
    portableTextToPlainText(module.body) ||
    module.description ||
    module.shortExplanation ||
    module.intro ||
    module.callout ||
    ""
  );
}

function moduleId(module: SanityHomepageModule, index: number): string {
  return `learn-guide-${module._key || module.moduleControl?.moduleKey || index + 1}`
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-");
}

function linkedRecordLabel(record: SanityLinkedRecord): string {
  return record.title || record.name || record.slug || "Related product";
}

function RelatedProductLinks({ records }: { readonly records?: readonly SanityLinkedRecord[] }) {
  if (!records?.length) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {records.map((record, index) => (
        <article className="border border-po-line bg-po-canvas p-4" key={record._id || `${record.slug || "related"}-${index}`}>
          <p className="text-xs font-semibold uppercase tracking-normal text-po-brand-ink">
            {record._type === "productPlatform" ? "Related platform" : "Related format"}
          </p>
          <h3 className="mt-2 text-base font-semibold text-po-ink">{linkedRecordLabel(record)}</h3>
          {record.positioningLine || record.shortDescription ? (
            <p className="mt-2 text-sm leading-6 text-po-body">{record.positioningLine || record.shortDescription}</p>
          ) : null}
          {record.slug && PUBLIC_PRODUCT_ROUTES.has(record.slug) ? (
            <Link
              className="mt-3 inline-flex text-sm font-semibold text-po-brand-ink underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-po-brand"
              href={`/${record.slug}`}
            >
              Explore {linkedRecordLabel(record)}
            </Link>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function LearnGuideBodyModule({ module, index }: LearnGuideBodyModuleProps) {
  const id = moduleId(module, index);
  const body = moduleBody(module);

  return (
    <Scene ariaLabelledBy={id} tone={index % 2 === 0 ? "quiet" : "default"}>
      <article className="mx-auto grid w-full max-w-5xl gap-6">
        <SectionHeading
          description={body || undefined}
          id={id}
          kicker="Guide section"
          title={module.heading || module.headline || module.title || `Guide section ${index + 1}`}
        />
        {module.callout ? (
          <div className="border-l-4 border-po-brand bg-po-brand-soft p-5 text-sm font-semibold leading-6 text-po-brand-strong">
            {module.callout}
          </div>
        ) : null}
        <RelatedProductLinks records={module.relatedProductLinks} />
      </article>
    </Scene>
  );
}

export function LearnGuideCmsBody({ modules }: LearnGuideCmsBodyProps) {
  const publicModules = modules.map(sanitizePublicCmsModule);
  const guideBodyModules = publicModules.filter((module) => module._type === "learnGuideBlock");
  const otherModules = publicModules.filter((module) => module._type !== "learnGuideBlock");

  return (
    <>
      {guideBodyModules.map((module, index) => (
        <LearnGuideBodyModule index={index} key={module._key || `${module._type}-${index}`} module={module} />
      ))}
      {otherModules.length ? (
        <CmsHomepageModuleRenderer heroHeadingLevel="h2" modules={otherModules} />
      ) : null}
    </>
  );
}
