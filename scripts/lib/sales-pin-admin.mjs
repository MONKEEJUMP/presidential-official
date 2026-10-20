import { readFileSync } from "node:fs";
import ts from "typescript";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

export async function salesPinAdmin() {
  nextEnv.loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // Run the same server helper without Next's bundler-only marker in the CLI.
  const source = readFileSync(new URL("../../src/lib/sales-pin.ts", import.meta.url), "utf8")
    .replace('import "server-only";', "");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const helper = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
  return { admin, ...helper };
}
