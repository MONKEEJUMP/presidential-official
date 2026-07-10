import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import { join } from "node:path";
import ts from "typescript";

const projectRoot = process.cwd();
const seoSourceRoot = join(projectRoot, "src", "lib", "seo");
const seoOutDir = join(os.tmpdir(), `presidential-route-evidence-tracker-${process.pid}`);
const trackerPath = join(
  projectRoot,
  "..",
  "docs",
  "phase1-seo-artifacts",
  "177-step9p-response-register-template.csv",
);
const artifactPaths = [
  join(projectRoot, "..", "docs", "phase1-seo-artifacts", "176-step9p-route-evidence-intake-tracker.md"),
  trackerPath,
  join(projectRoot, "..", "docs", "phase1-seo-artifacts", "178-step9p-approval-state-machine.md"),
  join(projectRoot, "..", "docs", "phase1-seo-artifacts", "179-step9p-risk-and-qa-notes.md"),
  join(projectRoot, "..", "docs", "phase1-seo-artifacts", "180-step9p-final-verdict.md"),
  join(projectRoot, "..", "docs", "phase1-seo-artifacts", "181-step9p-created-files.csv"),
];
const standaloneWebCheckout = artifactPaths.every((artifactPath) => !existsSync(artifactPath));

const expectedRoutes = new Set([
  "/",
  "/moon-rocks",
  "/moon-pods",
  "/orbit",
  "/our-story",
  "/learn",
  "/learn/[guide]",
  "/find-us",
  "/contact",
]);
const expectedLaunchSequence = [
  "home",
  "moon-rocks",
  "our-story",
  "learn",
  "find-us",
  "contact",
];
const expectedRoutePublicationEvidenceCategories = [
  "entity",
  "source",
  "proof",
  "claim",
  "asset",
  "metadata",
  "schema",
  "content",
  "compliance",
];

const expectedOwnerLanes = new Set([
  "executive",
  "legal/compliance",
  "product/catalog",
  "creative/assets",
  "retailer operations",
  "SEO/content",
  "engineering/QA",
]);

const requiredColumns = [
  "tracker_id",
  "source_step",
  "owner_lane",
  "route",
  "route_scope",
  "owner_question",
  "evidence_needed",
  "required_artifact_names",
  "blocked_seo_surfaces",
  "client_response_received",
  "client_response_date",
  "client_response_channel",
  "client_response_owner",
  "client_response_summary",
  "raw_response_pointer",
  "attachment_pointer",
  "answer_disposition",
  "blocker_reason",
  "source_record_status",
  "source_record_id",
  "proof_record_status",
  "proof_record_id",
  "approval_owner_required",
  "approval_owner_named",
  "approval_record_status",
  "approval_record_id",
  "asset_rights_status",
  "metadata_record_required",
  "metadata_record_status",
  "metadata_record_id",
  "schema_record_required",
  "schema_record_status",
  "schema_record_id",
  "qa_evidence_required",
  "qa_evidence_status",
  "qa_evidence_id",
  "route_publication_record_required",
  "route_publication_record_status",
  "route_publication_record_id",
  "indexability_status",
  "sitemap_status",
  "publication_gate_status",
  "public_unlock",
  "public_unlock_status",
  "not_publication_approval",
  "approved_guide_record_template_status",
  "guide_static_param_source_record_status",
  "guide_static_param_source_record_id",
  "guide_slug_title_body_source_approval_status",
  "guide_claim_proof_status",
  "article_metadata_source_map_status",
  "article_schema_source_map_status",
  "guide_asset_approval_status",
  "guide_specific_compliance_review_status",
  "routeShells_learnGuide_QA_status",
  "dynamic_template_canonical_refusal_status",
  "placeholder_guide_block_status",
  "concrete_guide_publication_record_status",
  "last_reviewed_by",
  "last_reviewed_at",
  "next_action",
  "notes",
];

const forbiddenPhrases = [
  "public seo unlocked",
  "route publication approved",
  "sitemap inclusion approved",
  "robots indexability approved",
  "index, follow",
  "safe to publish",
  "approved for publication",
  "guaranteed ranking",
  "guaranteed number one",
  "order now",
  "ships to",
  "buy online",
  "medical benefits",
  "cures",
  "treats anxiety",
  "fake company",
  "imposter company",
];

const failures = [];
const passes = [];

function isStandaloneWebContractCheck(check) {
  return (
    check === "tracker.workspaceEvidence.notBundled" ||
    (check.startsWith("tracker.routePublicationScaffolds.") &&
      check !== "tracker.routePublicationScaffolds.trackerRoutesCovered")
  );
}

function pass(check, details = "") {
  if (standaloneWebCheckout && !isStandaloneWebContractCheck(check)) {
    return;
  }
  passes.push({ check, details });
}

function fail(check, details) {
  if (standaloneWebCheckout && !isStandaloneWebContractCheck(check)) {
    return;
  }
  failures.push({ check, details });
}

if (standaloneWebCheckout) {
  pass(
    "tracker.workspaceEvidence.notBundled",
    "External Step 9P tracker artifacts are not bundled in the standalone web repository; route-publication source scaffolds remain fully verified.",
  );
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        field += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(field);
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((cell) => cell.length > 0)) {
    rows.push(row);
  }

  const [headers, ...dataRows] = rows;
  if (!headers) {
    return { headers: [], records: [] };
  }

  return {
    headers,
    records: dataRows.map((cells, rowIndex) => {
      const record = { __rowNumber: rowIndex + 2 };
      headers.forEach((header, cellIndex) => {
        record[header] = cells[cellIndex] ?? "";
      });
      return record;
    }),
  };
}

function uniqueValues(records, key) {
  return new Set(records.map((record) => record[key]).filter(Boolean));
}

function setDifference(expected, actual) {
  return [...expected].filter((item) => !actual.has(item));
}

function assertEvery(records, check, predicate) {
  const badRows = records.filter((record) => !predicate(record)).map((record) => record.__rowNumber);
  if (badRows.length > 0) {
    fail(check, `Bad rows: ${badRows.join(", ")}`);
  } else {
    pass(check, `${records.length} rows checked`);
  }
}

function collectTypeScriptFiles(directory) {
  const files = [];

  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith(".ts")) {
        files.push(fullPath);
      }
    }
  }

  walk(directory);
  return files;
}

function compileSeoLibrary() {
  rmSync(seoOutDir, { recursive: true, force: true });
  mkdirSync(seoOutDir, { recursive: true });

  const program = ts.createProgram(collectTypeScriptFiles(seoSourceRoot), {
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    noEmitOnError: true,
    outDir: seoOutDir,
    rootDir: join(projectRoot, "src"),
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ES2022,
  });

  const emitResult = program.emit();
  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .concat(emitResult.diagnostics)
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);

  if (diagnostics.length > 0) {
    const formatted = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => projectRoot,
      getNewLine: () => "\n",
    });
    throw new Error(`Route evidence tracker compile failed:\n${formatted}`);
  }
}

function readRoutePublicationScaffoldState() {
  compileSeoLibrary();

  const require = createRequire(import.meta.url);
  const publicationPath = join(
    seoOutDir,
    "lib",
    "seo",
    "source-records",
    "route-publication.js",
  );

  if (!existsSync(publicationPath)) {
    throw new Error(`Compiled route publication module missing: ${publicationPath}`);
  }

  const {
    APPROVED_ROUTE_PUBLICATIONS,
    ROUTE_PUBLICATION_APPROVAL_SEQUENCE,
    ROUTE_PUBLICATION_EVIDENCE_CATEGORIES,
    ROUTE_PUBLICATION_EVIDENCE_SCAFFOLDS,
    getNextRoutePublicationCandidate,
    getRoutePublicationEvidenceScaffolds,
  } = require(publicationPath);

  return {
    approvedRoutePublicationCount: APPROVED_ROUTE_PUBLICATIONS.length,
    categories: [...ROUTE_PUBLICATION_EVIDENCE_CATEGORIES],
    sequence: [...ROUTE_PUBLICATION_APPROVAL_SEQUENCE],
    staticScaffolds: ROUTE_PUBLICATION_EVIDENCE_SCAFFOLDS,
    scaffolds: getRoutePublicationEvidenceScaffolds(),
    nextCandidate: getNextRoutePublicationCandidate(),
  };
}

function scaffoldHasAllBlockedCategories(scaffold, categories) {
  return categories.every((category) =>
    scaffold.requirements.some(
      (requirement) =>
        requirement.category === category &&
        requirement.required &&
        requirement.status === "blocked" &&
        requirement.reasons.includes("source_record:route_publication_missing"),
    ),
  );
}

let scaffoldState = null;

try {
  scaffoldState = readRoutePublicationScaffoldState();
} catch (error) {
  fail("tracker.routePublicationScaffolds.readable", error.message);
}

if (!existsSync(trackerPath)) {
  fail("tracker.exists", `Missing tracker: ${trackerPath}`);
} else {
  pass("tracker.exists", trackerPath);
}

const trackerText = existsSync(trackerPath) ? readFileSync(trackerPath, "utf8") : "";
const { headers, records } = parseCsv(trackerText);

if (records.length === 45) {
  pass("tracker.rowCount", "45 rows");
} else {
  fail("tracker.rowCount", `Expected 45 rows, found ${records.length}`);
}

const missingColumns = requiredColumns.filter((column) => !headers.includes(column));
if (missingColumns.length > 0) {
  fail("tracker.requiredColumns", `Missing columns: ${missingColumns.join(", ")}`);
} else {
  pass("tracker.requiredColumns", `${requiredColumns.length} required columns present`);
}

const routeSet = uniqueValues(records, "route");
const ownerLaneSet = uniqueValues(records, "owner_lane");
const missingRoutes = setDifference(expectedRoutes, routeSet);
const missingOwnerLanes = setDifference(expectedOwnerLanes, ownerLaneSet);

if (missingRoutes.length > 0) {
  fail("tracker.routes", `Missing routes: ${missingRoutes.join(", ")}`);
} else {
  pass("tracker.routes", "All 9 routes present");
}

if (missingOwnerLanes.length > 0) {
  fail("tracker.ownerLanes", `Missing owner lanes: ${missingOwnerLanes.join(", ")}`);
} else {
  pass("tracker.ownerLanes", "All 7 owner lanes present");
}

assertEvery(records, "tracker.clientResponsesQuarantined", (record) => record.client_response_received === "no");
assertEvery(records, "tracker.sourceRecordsBlocked", (record) => record.source_record_status === "blocked_pending_source_record");
assertEvery(records, "tracker.proofRecordsBlocked", (record) => record.proof_record_status === "blocked_pending_proof_record");
assertEvery(records, "tracker.approvalsBlocked", (record) => record.approval_record_status === "blocked_pending_approval_record");
assertEvery(records, "tracker.metadataBlocked", (record) => record.metadata_record_status === "blocked_pending_metadata_record");
assertEvery(records, "tracker.schemaBlocked", (record) => record.schema_record_status === "blocked_pending_schema_record");
assertEvery(records, "tracker.qaBlocked", (record) => record.qa_evidence_status === "blocked_pending_qa_evidence");
assertEvery(
  records,
  "tracker.routePublicationBlocked",
  (record) => record.route_publication_record_status === "blocked_pending_route_publication_record",
);
assertEvery(records, "tracker.indexabilityNoindex", (record) => record.indexability_status === "noindex");
assertEvery(records, "tracker.sitemapExcluded", (record) => record.sitemap_status === "sitemap-excluded");
assertEvery(records, "tracker.publicationGated", (record) => record.publication_gate_status === "publication-gated");
assertEvery(records, "tracker.publicUnlockNo", (record) => record.public_unlock === "no");
assertEvery(
  records,
  "tracker.publicUnlockStatusBlocked",
  (record) => record.public_unlock_status === "BLOCKED_NO_PUBLIC_UNLOCK",
);
assertEvery(records, "tracker.notPublicationApproval", (record) => record.not_publication_approval === "yes");

const guideRows = records.filter((record) => record.route === "/learn/[guide]");
if (guideRows.length === 0) {
  fail("tracker.learnGuideRows", "Missing /learn/[guide] rows");
} else {
  pass("tracker.learnGuideRows", `${guideRows.length} /learn/[guide] rows`);
}

const guideBlockedColumns = [
  "approved_guide_record_template_status",
  "guide_static_param_source_record_status",
  "guide_slug_title_body_source_approval_status",
  "guide_claim_proof_status",
  "article_metadata_source_map_status",
  "article_schema_source_map_status",
  "guide_asset_approval_status",
  "guide_specific_compliance_review_status",
  "routeShells_learnGuide_QA_status",
  "dynamic_template_canonical_refusal_status",
  "placeholder_guide_block_status",
  "concrete_guide_publication_record_status",
];

const badGuideRows = guideRows.filter((record) =>
  guideBlockedColumns.some((column) => !String(record[column] ?? "").startsWith("blocked")),
);
if (badGuideRows.length > 0) {
  fail("tracker.learnGuideBlockedFields", `Bad guide rows: ${badGuideRows.map((record) => record.__rowNumber).join(", ")}`);
} else {
  pass("tracker.learnGuideBlockedFields", `${guideBlockedColumns.length} guide-specific fields blocked`);
}

const nonGuideRows = records.filter((record) => record.route !== "/learn/[guide]");
const badNonGuideRows = nonGuideRows.filter((record) =>
  guideBlockedColumns.some((column) => record[column] !== "not_applicable"),
);
if (badNonGuideRows.length > 0) {
  fail(
    "tracker.nonGuideFieldsNotApplicable",
    `Bad non-guide rows: ${badNonGuideRows.map((record) => record.__rowNumber).join(", ")}`,
  );
} else {
  pass("tracker.nonGuideFieldsNotApplicable", "Non-guide rows do not carry guide-only approvals");
}

if (scaffoldState) {
  const scaffoldRoutes = new Set(scaffoldState.scaffolds.map((scaffold) => scaffold.path));

  if (JSON.stringify(scaffoldState.sequence) === JSON.stringify(expectedLaunchSequence)) {
    pass("tracker.routePublicationScaffolds.sequence", scaffoldState.sequence.join(" -> "));
  } else {
    fail(
      "tracker.routePublicationScaffolds.sequence",
      `Expected ${expectedLaunchSequence.join(" -> ")}, got ${scaffoldState.sequence.join(" -> ")}`,
    );
  }

  if (JSON.stringify(scaffoldState.staticScaffolds) === JSON.stringify(scaffoldState.scaffolds)) {
    pass("tracker.routePublicationScaffolds.staticMatchesRuntime", "static scaffold export matches runtime helper");
  } else {
    fail("tracker.routePublicationScaffolds.staticMatchesRuntime", "static scaffold export drifted from runtime helper");
  }

  if (
    JSON.stringify(scaffoldState.categories) ===
    JSON.stringify(expectedRoutePublicationEvidenceCategories)
  ) {
    pass(
      "tracker.routePublicationScaffolds.categoriesExact",
      scaffoldState.categories.join(", "),
    );
  } else {
    fail(
      "tracker.routePublicationScaffolds.categoriesExact",
      `Expected ${expectedRoutePublicationEvidenceCategories.join(", ")}, got ${scaffoldState.categories.join(", ")}`,
    );
  }

  if (
    scaffoldState.scaffolds.length === expectedLaunchSequence.length &&
    scaffoldState.scaffolds.every((scaffold) =>
      scaffoldHasAllBlockedCategories(scaffold, scaffoldState.categories),
    )
  ) {
    pass(
      "tracker.routePublicationScaffolds.blockedCategories",
      `${scaffoldState.scaffolds.length} launch routes carry ${scaffoldState.categories.length} blocked evidence categories`,
    );
  } else {
    fail(
      "tracker.routePublicationScaffolds.blockedCategories",
      "One or more launch route evidence scaffolds is missing blocked categories",
    );
  }

  if (
    scaffoldState.approvedRoutePublicationCount === 0 &&
    scaffoldState.scaffolds.every((scaffold) => scaffold.canUnlock === false) &&
    scaffoldState.nextCandidate?.route.id === "home"
  ) {
    pass("tracker.routePublicationScaffolds.noUnlock", "0 approved records; scaffolds cannot unlock; next candidate remains home");
  } else {
    fail(
      "tracker.routePublicationScaffolds.noUnlock",
      `approved records=${scaffoldState.approvedRoutePublicationCount}; next=${scaffoldState.nextCandidate?.route.id ?? "none"}`,
    );
  }

  const missingScaffoldRoutes = [...scaffoldRoutes].filter((route) => !routeSet.has(route));
  if (missingScaffoldRoutes.length === 0) {
    pass("tracker.routePublicationScaffolds.trackerRoutesCovered", "Every launch scaffold route exists in the evidence tracker");
  } else {
    fail(
      "tracker.routePublicationScaffolds.trackerRoutesCovered",
      `Tracker missing scaffold routes: ${missingScaffoldRoutes.join(", ")}`,
    );
  }
}

const artifactText = artifactPaths
  .filter((path) => existsSync(path))
  .map((path) => readFileSync(path, "utf8"))
  .join("\n")
  .toLowerCase();
const missingArtifactPaths = artifactPaths.filter((path) => !existsSync(path));

if (missingArtifactPaths.length > 0) {
  fail(
    "tracker.requiredArtifactsExist",
    `Missing artifacts: ${missingArtifactPaths.join(", ")}`,
  );
} else {
  pass("tracker.requiredArtifactsExist", `${artifactPaths.length} required artifacts present`);
}

const unsafeHits = forbiddenPhrases.filter((phrase) => artifactText.includes(phrase));
if (unsafeHits.length > 0) {
  fail("tracker.unsafeLanguage", `Unsafe phrases: ${unsafeHits.join(", ")}`);
} else {
  pass("tracker.unsafeLanguage", "No unsafe publication/claim phrases found");
}

const summary = {
  verdict: failures.length > 0 ? "FAIL" : "PASS",
  generated_at: new Date().toISOString(),
  workspace_evidence_mode: standaloneWebCheckout ? "standalone_web_contract" : "full_workspace_tracker",
  workspace_evidence_available: !standaloneWebCheckout,
  tracker_path: trackerPath,
  route_count: routeSet.size,
  owner_lane_count: ownerLaneSet.size,
  row_count: records.length,
  column_count: headers.length,
  launch_scaffold_count: scaffoldState?.scaffolds.length ?? 0,
  launch_scaffold_categories: scaffoldState?.categories ?? [],
  passes: passes.length,
  failures: failures.length,
  failed_checks: failures,
  public_seo_unlocked: false,
  route_publication_approved: false,
  sitemap_unlocked: false,
  indexability_unlocked: false,
  database_written: false,
  client_data_imported: false,
  guardrail: "Step 9Q validates route-publication source scaffolds in every checkout and validates the external Step 9P tracker when the full workspace artifacts are available. It does not approve, publish, import, index, or unlock anything.",
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
