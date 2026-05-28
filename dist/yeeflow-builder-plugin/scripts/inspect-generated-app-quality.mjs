#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const REQUIRED_PLAN_SECTIONS = [
  "application purpose",
  "target users",
  "business process",
  "data lists",
  "forms",
  "dashboards",
  "controls",
  "actions",
  "workflows",
  "layout",
  "validation",
  "proof boundary",
];

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-generated-app-quality.mjs --package <app.yap|decoded-data.json> [--plan <plan.md>] [--json-out <report.json>]",
    "",
    "Combines app-plan presence checks, package inventory, and generated UI quality checks.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { packagePath: "", planPath: "", jsonOut: "" };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--package") args.packagePath = argv[++index] || "";
    else if (arg === "--plan") args.planPath = argv[++index] || "";
    else if (arg === "--json-out") args.jsonOut = argv[++index] || "";
    else usage();
  }
  if (!args.packagePath) usage();
  return args;
}

function runJsonStep(name, command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout || "{}");
  } catch {
    parsed = {
      status: "fail",
      errors: 1,
      warnings: 0,
      findings: [{
        level: "error",
        code: `${name.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_OUTPUT_INVALID`,
        message: "Step did not return JSON output.",
      }],
    };
  }
  return {
    name,
    exitCode: result.status,
    status: parsed.status || (result.status ? "fail" : "pass"),
    errors: countFindings(parsed.errors),
    warnings: countFindings(parsed.warnings),
    report: parsed,
  };
}

function countFindings(value) {
  if (Array.isArray(value)) return value.length;
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function includesSection(text, section) {
  const normalized = text.toLowerCase();
  if (normalized.includes(section)) return true;
  const compact = section.replace(/\s+/g, "[- ]+");
  return new RegExp(`^#{1,4}\\s+.*${compact}`, "im").test(text);
}

function inspectPlan(planPath) {
  const findings = [];
  if (!planPath) {
    findings.push({
      level: "warning",
      code: "APP_PLAN_NOT_SUPPLIED",
      message: "Provide --plan <plan.md> to validate plan-to-package coverage for generated applications.",
    });
    return { exists: false, sections: {}, findings };
  }
  if (!fs.existsSync(planPath)) {
    findings.push({
      level: "error",
      code: "APP_PLAN_FILE_MISSING",
      message: "The supplied app plan file does not exist.",
      path: planPath,
    });
    return { exists: false, sections: {}, findings };
  }
  const text = fs.readFileSync(planPath, "utf8");
  const sections = {};
  for (const section of REQUIRED_PLAN_SECTIONS) {
    sections[section] = includesSection(text, section);
    if (!sections[section]) {
      findings.push({
        level: "warning",
        code: "APP_PLAN_SECTION_MISSING",
        message: "Generated app plans should include the standard planning sections before package generation.",
        section,
      });
    }
  }
  const hasExplicitScope = /full[- ]scope|complete functional|not (a )?(simple|mvp)|mvp|deferred|excluded|assumption/i.test(text);
  if (!hasExplicitScope) {
    findings.push({
      level: "warning",
      code: "APP_PLAN_SCOPE_BOUNDARY_MISSING",
      message: "The plan should state full-scope expectations, assumptions, exclusions, or deferred items.",
    });
  }
  return { exists: true, path: planPath, bytes: Buffer.byteLength(text), sections, findings };
}

function packageInventory(validationReport) {
  const inventories = validationReport?.inventories || {};
  const resources = Array.isArray(inventories.resources) ? inventories.resources : [];
  const forms = Array.isArray(inventories.forms) ? inventories.forms : [];
  return {
    resources: resources.map((resource) => ({
      title: resource.title,
      resourceType: resource.resourceType,
      fields: resource.fields,
      layouts: resource.layouts,
      sampleRecords: resource.sampleRecords,
    })),
    forms: forms.map((form) => ({
      name: form.name,
      kind: form.kind,
      pages: form.pages,
      nodeTypes: form.nodeTypes,
    })),
    summary: validationReport?.summary || {},
  };
}

function main() {
  const args = parseArgs(process.argv);
  const repoRoot = process.cwd();
  const packagePath = path.resolve(args.packagePath);
  const planPath = args.planPath ? path.resolve(args.planPath) : "";
  const plan = inspectPlan(planPath);
  const validation = runJsonStep("package-validation", process.execPath, [path.join(repoRoot, "validate-yap-package.js"), packagePath, "--mode", "compatibility"]);
  const uiQuality = runJsonStep("generated-ui-quality", process.execPath, [path.join(repoRoot, "scripts/inspect-generated-ui-quality.mjs"), packagePath]);
  const findings = [
    ...plan.findings,
    ...((validation.report.findings || validation.report.errors || []).map((finding) => ({ ...finding, source: "package-validation" }))),
    ...((uiQuality.report.findings || []).map((finding) => ({ ...finding, source: "generated-ui-quality" }))),
  ];
  const errors = findings.filter((finding) => finding.level === "error").length + (validation.exitCode && validation.errors === 0 ? 1 : 0) + (uiQuality.exitCode && uiQuality.errors === 0 ? 1 : 0);
  const warnings = findings.filter((finding) => finding.level === "warning").length;
  const report = {
    status: errors ? "fail" : warnings ? "pass_with_warnings" : "pass",
    package: packagePath,
    plan,
    inventory: packageInventory(validation.report),
    steps: [
      { name: validation.name, status: validation.status, errors: validation.errors, warnings: validation.warnings },
      { name: uiQuality.name, status: uiQuality.status, errors: uiQuality.errors, warnings: uiQuality.warnings },
    ],
    errors,
    warnings,
    findings,
  };
  const output = JSON.stringify(report, null, 2);
  if (args.jsonOut) fs.writeFileSync(args.jsonOut, `${output}\n`);
  console.log(output);
  if (errors) process.exitCode = 1;
}

try {
  main();
} catch (error) {
  console.log(JSON.stringify({ status: "fail", errors: 1, warnings: 0, findings: [{ level: "error", code: "GENERATED_APP_QUALITY_INSPECTION_FAILED", message: error.message }] }, null, 2));
  process.exit(1);
}
