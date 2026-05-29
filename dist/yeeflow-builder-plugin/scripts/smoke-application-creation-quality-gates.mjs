#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const GZIP_PREFIX = "[______gizp______]";
const TMP_DIR = ".tmp/application-creation-quality-gates";
const SPEC = "docs/generated-app-plans/vendor-onboarding-compliance-ui-implementation-spec.md";
const YAP = "/Users/Renger/Downloads/vendor-onboarding-compliance-management.full-ui.v2-src-dashboard.yap";
const YAPK = "/Users/Renger/Downloads/vendor-onboarding-compliance-management.full-ui.v2-src-dashboard.yapk";

function ensureInputs() {
  const missing = [YAP, YAPK, SPEC].filter((file) => !fs.existsSync(file));
  if (missing.length) {
    console.log(JSON.stringify({ status: "skip", reason: "required local proof files are missing", missing }, null, 2));
    process.exit(0);
  }
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

function decodeYap(file) {
  const wrapper = JSON.parse(fs.readFileSync(file, "utf8"));
  const resource = JSON.parse(zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"));
  return { wrapper, resource };
}

function writeYap(wrapper, resource, out) {
  wrapper.Resource = `${GZIP_PREFIX}${zlib.gzipSync(Buffer.from(JSON.stringify(resource), "utf8")).toString("base64")}`;
  fs.writeFileSync(out, `${JSON.stringify(wrapper, null, 2)}\n`);
  return out;
}

function decodeYapk(file) {
  const wrapper = JSON.parse(fs.readFileSync(file, "utf8"));
  const app = JSON.parse(zlib.brotliDecompressSync(Buffer.from(wrapper.Resource, "base64")).toString("utf8"));
  return { wrapper, app };
}

function writeYapk(wrapper, app, out) {
  wrapper.Resource = zlib.brotliCompressSync(Buffer.from(JSON.stringify(app), "utf8")).toString("base64");
  fs.writeFileSync(out, `${JSON.stringify(wrapper, null, 2)}\n`);
  return out;
}

function run(name, command, args, expectedCode = null) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  const passed = expectedCode ? result.status !== 0 && output.includes(expectedCode) : result.status === 0;
  return {
    name,
    status: passed ? "pass" : "fail",
    exitCode: result.status,
    expectedCode,
    outputSnippet: output.slice(0, 600),
  };
}

function mutateYapSimplePortal(value, suffix) {
  const { wrapper, resource } = decodeYap(YAP);
  resource.SimplePortal = value;
  return writeYap(wrapper, resource, path.join(TMP_DIR, `simpleportal-${suffix}.yap`));
}

function mutateYapkPortalInfo(value, suffix) {
  const { wrapper, app } = decodeYapk(YAPK);
  app.PortalInfo = value;
  return writeYapk(wrapper, app, path.join(TMP_DIR, `portalinfo-${suffix}.yapk`));
}

function mutateYapkFirstPage(mutator, suffix) {
  const { wrapper, app } = decodeYapk(YAPK);
  const page = app.Pages.find((candidate) => Number(candidate.Type) === 103);
  if (!page) throw new Error("No Type 103 page found in YAPK fixture.");
  mutator(page);
  return writeYapk(wrapper, app, path.join(TMP_DIR, `${suffix}.yapk`));
}

function removeFirstDataTableField(control) {
  if (!control || typeof control !== "object") return false;
  if (control.type === "data-list" && Array.isArray(control.attrs?.listarr) && control.attrs.listarr[0]) {
    delete control.attrs.listarr[0].Field;
    return true;
  }
  for (const child of control.children || []) {
    if (removeFirstDataTableField(child)) return true;
  }
  return false;
}

function main() {
  ensureInputs();
  const results = [];
  results.push(run("current-yap-simpleportal-null-passes", process.execPath, ["scripts/validate-standard-package-schema.mjs", YAP, "--yap-schema", "/Users/Renger/Downloads/yap-v1-schema.json"]));
  results.push(run("current-yapk-portalinfo-null-passes", process.execPath, ["validate-yapk-package.js", YAPK]));
  results.push(run("current-strict-app-quality-passes", process.execPath, ["scripts/inspect-generated-app-quality.mjs", "--package", YAPK, "--spec", SPEC, "--strict-app-quality"]));

  results.push(run("yap-simpleportal-object-fails", process.execPath, ["scripts/validate-standard-package-schema.mjs", mutateYapSimplePortal({}, "object"), "--yap-schema", "/Users/Renger/Downloads/yap-v1-schema.json"], "YAP_SIMPLEPORTAL_EMPTY_OBJECT_INVALID"));
  results.push(run("yap-simpleportal-array-fails", process.execPath, ["scripts/validate-standard-package-schema.mjs", mutateYapSimplePortal([], "array"), "--yap-schema", "/Users/Renger/Downloads/yap-v1-schema.json"], "YAP_SIMPLEPORTAL_ARRAY_INVALID"));
  results.push(run("yapk-portalinfo-object-fails", process.execPath, ["validate-yapk-package.js", mutateYapkPortalInfo({}, "object")], "YAPK_PORTALINFO_EMPTY_OBJECT_INVALID"));
  results.push(run("yapk-portalinfo-array-fails", process.execPath, ["validate-yapk-package.js", mutateYapkPortalInfo([], "array")], "YAPK_PORTALINFO_ARRAY_INVALID"));
  results.push(run("dashboard-without-src-fails", process.execPath, ["validate-yapk-package.js", mutateYapkFirstPage((page) => { page.Ext2 = ""; }, "dashboard-no-src")], "DASHBOARD_TYPE_103_SRC_REQUIRED"));
  results.push(run("legacy-dashboard-shell-fails", process.execPath, ["validate-yapk-package.js", mutateYapkFirstPage((page) => { page.Ext2 = ""; page.LayoutView = ""; page.LayoutInResources = null; }, "legacy-dashboard-shell")], "DASHBOARD_LEGACY_RENDERER_FORBIDDEN"));
  results.push(run("data-table-missing-field-fails", process.execPath, ["validate-yapk-package.js", mutateYapkFirstPage((page) => {
    const resource = page.LayoutInResources?.[0];
    const parsed = JSON.parse(resource.Resource);
    removeFirstDataTableField(parsed);
    resource.Resource = JSON.stringify(parsed);
  }, "data-table-missing-field")], "DASHBOARD_DATA_TABLE_DISPLAY_FIELD_BINDING_MISSING"));
  results.push(run("strict-quality-missing-pages-fails", process.execPath, ["scripts/inspect-generated-app-quality.mjs", "--package", mutateYapkFirstPage((page) => { page.Title = "Only One Dashboard"; }, "missing-planned-pages"), "--spec", SPEC, "--strict-app-quality"], "SPEC_PLANNED_APP_AREA_MISSING"));
  results.push(run("strict-quality-blank-dashboard-fails", process.execPath, ["scripts/inspect-generated-app-quality.mjs", "--package", mutateYapkFirstPage((page) => { page.LayoutInResources = []; }, "blank-dashboard"), "--spec", SPEC, "--strict-app-quality"], "STRICT_APP_BLANK_DASHBOARD_FORBIDDEN"));

  const failed = results.filter((result) => result.status !== "pass");
  console.log(JSON.stringify({ status: failed.length ? "fail" : "pass", results }, null, 2));
  if (failed.length) process.exit(1);
}

main();
