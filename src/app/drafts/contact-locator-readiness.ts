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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalRecord(value: Record<string, unknown>, key: string) {
  return value[key] === undefined || isRecord(value[key]);
}

function isOptionalArray(value: Record<string, unknown>, key: string) {
  return value[key] === undefined || Array.isArray(value[key]);
}

function isSourceIntakeSummary(value: unknown): value is SourceIntakeSummary {
  if (!isRecord(value)) return false;

  for (const key of ["asset_lane", "retailer_lane"] as const) {
    const lane = value[key];
    if (lane !== undefined && (!isRecord(lane) || !isOptionalRecord(lane, "checks"))) {
      return false;
    }
  }

  return true;
}

function isRetailerWorkflowSummary(
  value: unknown,
): value is RetailerWorkflowSummary {
  if (!isRecord(value)) return false;

  return (
    ["state_counts", "source_file_counts", "service_zone_counts", "checks"].every(
      (key) => isOptionalRecord(value, key),
    ) &&
    ["duplicate_review_rows", "out_of_state_rows"].every((key) =>
      isOptionalArray(value, key),
    )
  );
}

function isDryRunImportSummary(value: unknown): value is DryRunImportSummary {
  return isRecord(value);
}

function isContactSubmissionSummary(
  value: unknown,
): value is ContactSubmissionSummary {
  if (!isRecord(value) || !isOptionalRecord(value, "checks")) return false;

  return [
    "routeHandlers",
    "apiRoutes",
    "sourceFormMatches",
    "sourceFieldMatches",
    "sourceSubmissionMatches",
  ].every((key) => isOptionalArray(value, key));
}

function readJsonFile<T>(
  filePath: string,
  validate: (value: unknown) => value is T,
): T | undefined {
  if (!existsSync(filePath)) {
    return undefined;
  }

  try {
    const value: unknown = JSON.parse(readFileSync(filePath, "utf8"));
    return validate(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

export function readContactLocatorReadiness(slug: string): ContactLocatorReadiness {
  if (slug !== "find-us" && slug !== "contact") {
    return {
      kind: "none",
      status: "not_contact_locator",
      summaries: {},
    };
  }

  const sourceIntake = readJsonFile(SUMMARY_PATHS.sourceIntake, isSourceIntakeSummary);
  const retailerWorkflow = readJsonFile(
    SUMMARY_PATHS.retailerWorkflow,
    isRetailerWorkflowSummary,
  );
  const dryRunImport = readJsonFile(
    SUMMARY_PATHS.dryRunImport,
    isDryRunImportSummary,
  );
  const contactSubmission = readJsonFile(
    SUMMARY_PATHS.contactSubmission,
    isContactSubmissionSummary,
  );
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
