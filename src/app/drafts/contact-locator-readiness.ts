import "server-only";

import {existsSync, readFileSync} from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(process.cwd(), "..");

const SUMMARY_PATHS = {
  sourceIntake: path.join(
    REPO_ROOT,
    "sources",
    "spud",
    "work",
    "step8l-source-intake-integration",
    "step8l-source-intake-status.json",
  ),
  retailerWorkflow: path.join(
    REPO_ROOT,
    "sources",
    "spud",
    "work",
    "step8t-retailer-verification-workflow",
    "retailer-verification-workflow-summary.json",
  ),
  dryRunImport: path.join(
    REPO_ROOT,
    "sources",
    "spud",
    "work",
    "step8q-candidate-import-dry-run",
    "dry-run-summary.json",
  ),
  contactSubmission: path.join(
    REPO_ROOT,
    "sources",
    "spud",
    "work",
    "step10m-contact-form-submission-readiness",
    "step10m-contact-form-submission-readiness-status.json",
  ),
} as const;

type BooleanChecks = Record<string, boolean | number | string | undefined>;
type CountMap = Record<string, number | undefined>;

type SourceIntakeSummary = {
  readonly overall_status?: string;
  readonly asset_lane?: {
    readonly status?: string;
    readonly checks?: BooleanChecks;
  };
  readonly retailer_lane?: {
    readonly status?: string;
    readonly checks?: BooleanChecks;
  };
};

type RetailerWorkflowSummary = {
  readonly verdict?: string;
  readonly retailer_rows_expected?: number;
  readonly retailer_rows_read?: number;
  readonly state_counts?: CountMap;
  readonly source_file_counts?: CountMap;
  readonly service_zone_counts?: CountMap;
  readonly duplicate_review_rows?: readonly unknown[];
  readonly out_of_state_rows?: readonly unknown[];
  readonly checks?: BooleanChecks;
  readonly database_written?: boolean;
  readonly client_data_imported?: boolean;
  readonly public_seo_unlocked?: boolean;
  readonly locator_unlocked?: boolean;
  readonly localbusiness_schema_unlocked?: boolean;
  readonly sitemap_unlocked?: boolean;
  readonly indexability_unlocked?: boolean;
  readonly guardrail?: string;
};

type DryRunImportSummary = {
  readonly verdict?: string;
  readonly asset_rows_read?: number;
  readonly retailer_rows_read?: number;
  readonly retailer_warning_rows?: number;
  readonly duplicate_risk_rows?: number;
  readonly approval_firewall_risk_rows?: number;
  readonly import_ready?: boolean;
  readonly requires_review_before_import?: boolean;
  readonly database_written?: boolean;
  readonly client_data_imported?: boolean;
  readonly public_seo_unlocked?: boolean;
  readonly guardrail?: string;
};

type ContactSubmissionSummary = {
  readonly verdict?: string;
  readonly routeHandlers?: readonly unknown[];
  readonly apiRoutes?: readonly unknown[];
  readonly sourceFormMatches?: readonly unknown[];
  readonly sourceFieldMatches?: readonly unknown[];
  readonly sourceSubmissionMatches?: readonly unknown[];
  readonly checks?: BooleanChecks;
  readonly contactFormApproved?: boolean;
  readonly formSubmissionApproved?: boolean;
  readonly crmApproved?: boolean;
  readonly leadCaptureApproved?: boolean;
  readonly contactDataCollectionApproved?: boolean;
  readonly officialContactDetailsApproved?: boolean;
  readonly publicSeoUnlocked?: boolean;
  readonly routePublicationApproved?: boolean;
  readonly guardrail?: string;
};

export type ContactLocatorReadiness = {
  readonly kind: "locator" | "contact" | "none";
  readonly status: "available" | "missing_summary" | "not_contact_locator";
  readonly summaries: {
    readonly sourceIntake?: SourceIntakeSummary;
    readonly retailerWorkflow?: RetailerWorkflowSummary;
    readonly dryRunImport?: DryRunImportSummary;
    readonly contactSubmission?: ContactSubmissionSummary;
  };
};

function readJsonFile<T>(filePath: string): T | undefined {
  if (!existsSync(filePath)) {
    return undefined;
  }

  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

export function readContactLocatorReadiness(slug: string): ContactLocatorReadiness {
  if (slug !== "find-us" && slug !== "contact") {
    return {
      kind: "none",
      status: "not_contact_locator",
      summaries: {},
    };
  }

  const sourceIntake = readJsonFile<SourceIntakeSummary>(SUMMARY_PATHS.sourceIntake);
  const retailerWorkflow = readJsonFile<RetailerWorkflowSummary>(SUMMARY_PATHS.retailerWorkflow);
  const dryRunImport = readJsonFile<DryRunImportSummary>(SUMMARY_PATHS.dryRunImport);
  const contactSubmission = readJsonFile<ContactSubmissionSummary>(SUMMARY_PATHS.contactSubmission);
  const summaries = {
    sourceIntake,
    retailerWorkflow,
    dryRunImport,
    contactSubmission,
  };

  const hasRequiredSummaries = slug === "find-us"
    ? Boolean(sourceIntake && retailerWorkflow && dryRunImport)
    : Boolean(contactSubmission);

  return {
    kind: slug === "find-us" ? "locator" : "contact",
    status: hasRequiredSummaries ? "available" : "missing_summary",
    summaries,
  };
}
