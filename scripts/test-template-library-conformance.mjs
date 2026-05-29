#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function page(children = [], attrs = {}) {
  return { attrs: { common: { padding: { left: 24, right: 24 } }, ...attrs }, children };
}

function control(type, attrs = {}, children = [], label = "") {
  return { type, label: label || type, attrs, children };
}

function packageFixture(pageObj) {
  return {
    Item: {
      ListModel: { Title: "Template Test App", ListID: "root" },
      Defs: [],
      Layouts: [{
        Title: "Vendor Management Dashboard",
        Type: 103,
        LayoutID: "dashboard",
        LayoutView: null,
        Ext2: "{\"src\":true}",
        LayoutInResources: [{ Resource: JSON.stringify(pageObj) }],
      }],
    },
    Childs: [],
  };
}

function templateLibrary(overrides = {}) {
  return {
    library: "Template Test Library",
    version: "test",
    templates: [{
      templateId: "dashboard_header_action_bar",
      requiredControls: ["container", "grid", "text", "button"],
      requiredFields: ["Vendor Name"],
      layoutRules: ["safe_padding", "card_container"],
      actionRules: ["active_buttons_require_binding"],
      validationRules: ["section_exists", "no_placeholder_content"],
      proofStatus: "inferred",
      ...overrides,
    }],
  };
}

function checklist(sectionOverrides = {}) {
  return {
    application: "Template Test App",
    version: "test",
    pages: [{
      id: "vendor_management_dashboard",
      title: "Vendor Management Dashboard",
      type: "dashboard",
      required: true,
      sections: [{
        id: "header_action_area",
        title: "Header/action area",
        status: "required",
        templateId: "dashboard_header_action_bar",
        controls: ["container", "grid", "text", "button"],
        requiredFields: ["Vendor Name"],
        matchText: ["Vendor Management Dashboard"],
        layoutRules: ["safe_padding", "card_container"],
        actionBindings: ["New Vendor Request"],
        validationRules: ["section_exists", "no_placeholder_content"],
        ...sectionOverrides,
      }],
    }],
  };
}

function validPage() {
  return page([
    control("container", { style: { border: "1px solid #e5e7eb", radius: 8, gap: 24 } }, [
      control("grid", { style: { display: "grid", gap: 24 } }, [
        control("text", { text: "Vendor Management Dashboard Vendor Name" }, [], "Vendor Management Dashboard"),
        control("button", { text: "New Vendor Request", control_action: "open-new-vendor" }, [], "New Vendor Request"),
      ], "Header Grid"),
    ], "Header Card"),
  ]);
}

function writeJson(dir, name, obj) {
  const file = path.join(dir, `${name}.json`);
  fs.writeFileSync(file, `${JSON.stringify(obj, null, 2)}\n`);
  return file;
}

function runInspector(pkg, check, library) {
  const result = spawnSync(process.execPath, [
    "scripts/inspect-generated-app-quality.mjs",
    "--package",
    pkg,
    "--composition-checklist",
    check,
    "--template-library",
    library,
    "--strict-visual-app-quality",
  ], { encoding: "utf8", maxBuffer: 24 * 1024 * 1024 });
  try {
    return JSON.parse(result.stdout || "{}");
  } catch (error) {
    throw new Error(`Inspector did not return JSON: ${error.message}\n${result.stdout}\n${result.stderr}`);
  }
}

function templateErrors(report) {
  return (report.findings || []).filter((finding) => finding.source === "template-library" && finding.level === "error");
}

function expectCode(name, report, code) {
  if (!templateErrors(report).some((finding) => finding.code === code)) {
    throw new Error(`${name} did not report ${code}. Template findings: ${JSON.stringify(templateErrors(report), null, 2)}`);
  }
}

function expectNoTemplateErrors(name, report) {
  const errors = templateErrors(report);
  if (errors.length) throw new Error(`${name} reported template errors: ${JSON.stringify(errors, null, 2)}`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "template-library-conformance-"));
const cases = [];

try {
  const library = writeJson(tempDir, "template-library", templateLibrary());
  const pkg = writeJson(tempDir, "valid-pkg", packageFixture(validPage()));

  expectCode(
    "missing templateId",
    runInspector(pkg, writeJson(tempDir, "missing-template-id-checklist", checklist({ templateId: "" })), library),
    "TEMPLATE_ID_MISSING",
  );
  cases.push({ case: "missing templateId fails", expected: "TEMPLATE_ID_MISSING", status: "pass" });

  expectCode(
    "unknown templateId",
    runInspector(pkg, writeJson(tempDir, "unknown-template-id-checklist", checklist({ templateId: "unknown_template" })), library),
    "TEMPLATE_ID_UNKNOWN",
  );
  cases.push({ case: "unknown templateId fails", expected: "TEMPLATE_ID_UNKNOWN", status: "pass" });

  const missingGridPage = page([
    control("container", { style: { border: "1px solid #e5e7eb", radius: 8 } }, [
      control("text", { text: "Vendor Management Dashboard Vendor Name" }, [], "Vendor Management Dashboard"),
      control("button", { text: "New Vendor Request", control_action: "open-new-vendor" }, [], "New Vendor Request"),
    ], "Header Card"),
  ]);
  expectCode(
    "required control missing",
    runInspector(writeJson(tempDir, "missing-control-pkg", packageFixture(missingGridPage)), writeJson(tempDir, "missing-control-checklist", checklist()), library),
    "TEMPLATE_REQUIRED_CONTROL_MISSING",
  );
  cases.push({ case: "required control missing fails", expected: "TEMPLATE_REQUIRED_CONTROL_MISSING", status: "pass" });

  const placeholderPage = page([
    control("container", { style: { border: "1px solid #e5e7eb", radius: 8 } }, [
      control("grid", { style: { display: "grid", gap: 24 } }, [
        control("text", { text: "Vendor Management Dashboard Vendor Name Alert Here is the description" }, [], "Vendor Management Dashboard"),
        control("button", { text: "New Vendor Request", control_action: "open-new-vendor" }, [], "New Vendor Request"),
      ], "Header Grid"),
    ], "Header Card"),
  ]);
  expectCode(
    "placeholder implementation",
    runInspector(writeJson(tempDir, "placeholder-pkg", packageFixture(placeholderPage)), writeJson(tempDir, "placeholder-checklist", checklist()), library),
    "TEMPLATE_PLACEHOLDER_IMPLEMENTATION",
  );
  cases.push({ case: "placeholder implementation fails", expected: "TEMPLATE_PLACEHOLDER_IMPLEMENTATION", status: "pass" });

  expectNoTemplateErrors(
    "valid simplified template fixture",
    runInspector(pkg, writeJson(tempDir, "valid-checklist", checklist()), library),
  );
  cases.push({ case: "valid simplified template fixture passes", expected: "no template errors", status: "pass" });

  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
