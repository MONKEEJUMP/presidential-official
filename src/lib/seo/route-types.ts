export type RouteKind =
  | "brand_home"
  | "product_platform"
  | "product_series"
  | "product_detail"
  | "technology_platform"
  | "brand_story"
  | "learn_hub"
  | "learn_article"
  | "store_locator"
  | "state_locator"
  | "city_locator"
  | "retailer_detail"
  | "contact"
  | "future_module"
  | "private_system";

export type RouteStatus =
  | "planned"
  | "approved"
  | "conditional"
  | "private"
  | "blocked"
  | "future";

export type Indexability =
  | "index_follow"
  | "noindex"
  | "conditional_index"
  | "not_published";

export type SitemapPolicy = "include" | "exclude" | "conditional";

export type SeoSchemaType =
  | "Organization"
  | "WebSite"
  | "WebPage"
  | "BreadcrumbList"
  | "Article"
  | "ItemList"
  | "Product"
  | "AboutPage"
  | "ContactPage"
  | "LocalBusiness";

export type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export type RouteBlock =
  | "canonical_host_lock"
  | "scaffold_replacement"
  | "metadata_approval"
  | "content_approval"
  | "schema_approval"
  | "product_catalog"
  | "product_assets"
  | "product_claims"
  | "compliance_review"
  | "founder_company_proof"
  | "learn_content_approval"
  | "verified_store_data"
  | "state_legal_review"
  | "retailer_authorization"
  | "legal_presidential_thc"
  | "official_contact_details"
  | "future_module_approval"
  | "private_internal"
  | "not_phase_1"
  | "age_gate_policy";

export type RoutePriority = 0 | 1 | 2 | 3 | 4 | 5;

export type SeoRoutePath = "/" | `/${string}`;

export type SeoRouteRecord = {
  id: string;
  path: SeoRoutePath;
  kind: RouteKind;
  status: RouteStatus;
  indexability: Indexability;
  sitemap: SitemapPolicy;
  priority: RoutePriority;
  changeFrequency?: ChangeFrequency;
  canonicalPath: SeoRoutePath;
  title: string;
  description: string;
  h1: string;
  keywords: readonly string[];
  schema: readonly SeoSchemaType[];
  requiredData: readonly string[];
  requiredApprovals: readonly string[];
  blocks: readonly RouteBlock[];
  linksTo: readonly SeoRoutePath[];
  sourceArtifact: string;
  notes?: string;
  isMandatory?: boolean;
  isPublicPillar?: boolean;
};
