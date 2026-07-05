#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const scriptArgs = process.argv.slice(2);

if (scriptArgs.length === 0) {
  console.error("Usage: node scripts/run-python.mjs <python-script> [...args]");
  process.exit(2);
}

const candidates = [
  { command: "python3", prefixArgs: [] },
  { command: "py", prefixArgs: ["-3"] },
  { command: "python", prefixArgs: [] },
];

const python3Probe = [
  "-c",
  "import sys; raise SystemExit(0 if sys.version_info[0] == 3 else 3)",
];

function redactDiagnosticArg(arg) {
  if (/password|secret|token|key|credential/i.test(arg)) {
    return "[REDACTED]";
  }

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(arg)) {
    return "[REDACTED_URL]";
  }

  return arg;
}

function formatAttempt(command, args) {
  return [command, ...args.map(redactDiagnosticArg)].join(" ");
}

const attempted = [];

for (const candidate of candidates) {
  const label = formatAttempt(candidate.command, candidate.prefixArgs);
  attempted.push(label);

  const probe = spawnSync(candidate.command, [...candidate.prefixArgs, ...python3Probe], {
    stdio: "ignore",
    shell: false,
  });

  if (probe.error) {
    if (probe.error.code === "ENOENT" || probe.error.code === "EACCES") {
      continue;
    }

    console.error(`Python runner failed while probing ${label}: ${probe.error.message}`);
    console.error(`Attempted Python candidates only; target arguments omitted:\n- ${attempted.join("\n- ")}`);
    process.exit(1);
  }

  if (probe.status !== 0) {
    continue;
  }

  const args = [...candidate.prefixArgs, ...scriptArgs];

  const result = spawnSync(candidate.command, args, {
    stdio: "inherit",
    shell: false,
  });

  if (result.error) {
    if (result.error.code === "ENOENT" || result.error.code === "EACCES") {
      continue;
    }

    console.error(`Python runner failed while invoking ${candidate.command}: ${result.error.message}`);
    console.error(`Attempted Python candidates only; target arguments omitted:\n- ${attempted.join("\n- ")}`);
    process.exit(1);
  }

  if (typeof result.status === "number") {
    process.exit(result.status);
  }

  if (result.signal) {
    console.error(`Python runner command ${candidate.command} terminated by signal ${result.signal}.`);
    process.exit(1);
  }
}

console.error("Unable to locate an executable Python 3 command for Presidential verification scripts.");
console.error(`Attempted Python candidates only; target arguments omitted:\n- ${attempted.join("\n- ")}`);
process.exit(1);
