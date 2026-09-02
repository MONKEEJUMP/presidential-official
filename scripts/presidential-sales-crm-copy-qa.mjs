import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = [
  "src/app/sales/sales-dashboard.tsx",
  "src/app/sales/sales-row.tsx",
  "src/app/api/sales/route.ts",
  "src/lib/sales.ts",
];
const source = files
  .map((file) => `${file}\n${readFileSync(path.join(root, file), "utf8")}`)
  .join("\n");

const forbidden = [
  "VERIFIED CUSTOMERS NEED LICENSE MATCH",
  "NO LICENSE MATCH",
  "unlinkedCustomerCount",
  "linkedCustomerCount",
  "totalSalesRows",
];
const required = [
  "PURCHASING PRESIDENTIAL",
  "SALES OPPORTUNITIES",
  "ACTIVE {STATE_NAMES[snapshot.selectedState]",
];

const failures = [
  ...forbidden.filter((value) => source.includes(value)).map((value) => `Rep-facing reconciliation artifact remains: ${value}`),
  ...required.filter((value) => !source.includes(value)).map((value) => `Required sales metric disappeared: ${value}`),
];

console.log(JSON.stringify({ checkedFiles: files, forbidden, failures }, null, 2));
if (failures.length) process.exitCode = 1;
