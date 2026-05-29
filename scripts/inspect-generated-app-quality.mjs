#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
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

const REQUIRED_SPEC_SECTIONS = [
  "page list",
  "purpose",
  "layout structure",
  "yeeflow controls",
  "data list bindings",
  "fields displayed",
  "table columns",
  "actions",
  "style settings",
  "custom css",
  "validation checklist",
];

const VENDOR_ONBOARDING_EXPECTED_PAGES = [
  "Vendor Management Dashboard",
  "Vendor Detail View Page",
  "New Vendor Request Form",
  "Compliance Review Workspace",
  "Vendor Print Page",
];

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-generated-app-quality.mjs --package <app.yap|app.yapk|decoded-data.json> [--plan <plan.md>] [--spec <ui-implementation-spec.md>] [--strict-app-quality] [--strict-visual-app-quality] [--json-out <report.json>]",
    "",
    "Combines app-plan presence checks, UI implementation spec checks, package inventory, generated UI quality checks, and strict full-application visual quality gates.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = {
    packagePath: "",
    planPath: "",
    specPath: "",
    jsonOut: "",
    strictAppQuality: false,
    strictVisualAppQuality: false,
  };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--package") args.packagePath = argv[++index] || "";
    else if (arg === "--plan") args.planPath = argv[++index] || "";
    else if (arg === "--spec") args.specPath = argv[++index] || "";
    else if (arg === "--json-out") args.jsonOut = argv[++index] || "";
    else if (arg === "--strict-app-quality") args.strictAppQuality = true;
    else if (arg === "--strict-visual-app-quality") {
      args.strictVisualAppQuality = true;
      args.strictAppQuality = true;
    } else usage();
  }
  if (!args.packagePath) usage();
  return args;
}

function runJsonStep(name, command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
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

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value) {
  return value === undefined || value === null ? "" : String(value);
}

function parseMaybeJson(value) {
  if (isObject(value) || Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function quoteLargeIntegers(jsonText, largeNumbers = new Set()) {
  let out = "";
  let i = 0;
  let inString = false;
  let escaped = false;
  while (i < jsonText.length) {
    const ch = jsonText[i];
    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === "\"") inString = false;
      i += 1;
      continue;
    }
    if (ch === "\"") {
      inString = true;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === "-" || (ch >= "0" && ch <= "9")) {
      const start = i;
      let j = i;
      if (jsonText[j] === "-") j += 1;
      while (jsonText[j] >= "0" && jsonText[j] <= "9") j += 1;
      if (jsonText[j] === "." || jsonText[j] === "e" || jsonText[j] === "E") {
        while (/[0-9eE+\-.]/.test(jsonText[j] || "")) j += 1;
        out += jsonText.slice(start, j);
      } else {
        const token = jsonText.slice(start, j);
        if (LARGE_INTEGER_RE.test(token)) {
          largeNumbers.add(token);
          out += `"${token}"`;
        } else out += token;
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJson(text, largeNumbers = new Set()) {
  return JSON.parse(quoteLargeIntegers(text.replace(/^\uFEFF/, ""), largeNumbers));
}

function decodePackage(packagePath) {
  const largeNumbers = new Set();
  const parsed = parseJson(fs.readFileSync(packagePath, "utf8"), largeNumbers);
  const lower = packagePath.toLowerCase();
  if (typeof parsed?.Resource === "string" && lower.endsWith(".yapk")) {
    const decoded = parseJson(zlib.brotliDecompressSync(Buffer.from(parsed.Resource, "base64")).toString("utf8"), largeNumbers);
    return {
      packageType: "yapk",
      wrapper: parsed,
      decoded,
      data: normalizeYapkAppPackage(decoded),
      largeNumbers: Array.from(largeNumbers),
    };
  }
  if (typeof parsed?.Resource === "string") {
    if (!parsed.Resource.startsWith(GZIP_PREFIX)) {
      return { packageType: "unknown", wrapper: parsed, decoded: null, data: null, largeNumbers: Array.from(largeNumbers) };
    }
    const decoded = parseJson(zlib.gunzipSync(Buffer.from(parsed.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"), largeNumbers);
    const data = decoded && (decoded.Item || Array.isArray(decoded.Childs))
      ? decoded
      : typeof decoded?.Data === "string"
        ? parseJson(decoded.Data, largeNumbers)
        : decoded?.Data;
    return { packageType: "yap", wrapper: parsed, decoded, data, largeNumbers: Array.from(largeNumbers) };
  }
  if (typeof parsed?.Data === "string") {
    return { packageType: "decoded", wrapper: null, decoded: parsed, data: parseJson(parsed.Data, largeNumbers), largeNumbers: Array.from(largeNumbers) };
  }
  return { packageType: "decoded", wrapper: null, decoded: parsed, data: parsed, largeNumbers: Array.from(largeNumbers) };
}

function normalizeYapkAppPackage(decoded) {
  if (!isObject(decoded) || !isObject(decoded.ListSet)) return decoded;
  return {
    Item: {
      ListModel: decoded.ListSet,
      Defs: [],
      Layouts: asArray(decoded.Pages),
    },
    Childs: asArray(decoded.Childs).map((child) => ({
      ListModel: child.List,
      Defs: asArray(child.Fields),
      Layouts: asArray(child.Layouts),
    })),
  };
}

function walkControls(control, visitor, pointer = "$", depth = 0) {
  if (!isObject(control)) return;
  visitor(control, pointer, depth);
  for (const key of ["children", "columns", "controls", "items", "rows", "cells"]) {
    asArray(control[key]).forEach((child, index) => walkControls(child, visitor, `${pointer}.${key}[${index}]`, depth + 1));
  }
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

function expectedPagesFromSpec(text, specPath) {
  const expected = new Set();
  if (/vendor onboarding|compliance management/i.test(text) || /vendor-onboarding/i.test(specPath)) {
    VENDOR_ONBOARDING_EXPECTED_PAGES.forEach((page) => expected.add(page));
    return Array.from(expected);
  }
  for (const match of text.matchAll(/(?:^|\n)\s*(?:[-*]|\d+\.)\s+([A-Z][^\n]{3,80}?(?:Dashboard|Workspace|View Page|Request Form|Print Page|Form|Page))/g)) {
    expected.add(match[1].trim().replace(/\s+/g, " "));
  }
  return Array.from(expected);
}

function inspectSpec(specPath) {
  const findings = [];
  if (!specPath) {
    findings.push({
      level: "warning",
      code: "UI_IMPLEMENTATION_SPEC_NOT_SUPPLIED",
      message: "Provide --spec <ui-implementation-spec.md> to validate visual-design-to-package structural fidelity.",
    });
    return { exists: false, sections: {}, expected: {}, expectedPages: [], findings };
  }
  if (!fs.existsSync(specPath)) {
    findings.push({
      level: "error",
      code: "UI_IMPLEMENTATION_SPEC_FILE_MISSING",
      message: "The supplied UI implementation spec file does not exist.",
      path: specPath,
    });
    return { exists: false, sections: {}, expected: {}, expectedPages: [], findings };
  }
  const text = fs.readFileSync(specPath, "utf8");
  const sections = {};
  for (const section of REQUIRED_SPEC_SECTIONS) {
    sections[section] = includesSection(text, section);
    if (!sections[section]) {
      findings.push({
        level: "warning",
        code: "UI_IMPLEMENTATION_SPEC_SECTION_MISSING",
        message: "UI implementation specs should include the standard design-to-control mapping sections.",
        section,
      });
    }
  }
  const lower = text.toLowerCase();
  const expected = {
    dashboards: /\bdashboard\b/.test(lower),
    customForms: /\b(new|edit|view|print) (form|page)\b|\bcustom form\b|\bapproval form\b/.test(lower),
    dataTables: /\bdata table\b|\badmin table\b|\bdata grid\b/.test(lower),
    itemTemplates: /\bcollection\b|\bkanban\b|\btimeline\b/.test(lower),
    printPage: /\bprint page\b|\bprintable\b/.test(lower),
    documentEmbed: /\bdocument embed\b/.test(lower),
    qrBarcode: /\bqr code\b|\bbarcode\b/.test(lower),
    customCss: /\bcustom css\b/.test(lower),
    customCode: /\bcustom code\b/.test(lower),
    kpiCards: /\bkpi\b|\bmetric card\b|\bcard row\b/.test(lower),
    actions: /\baction\b|\bbutton\b|\bbulk\b|\bsubmit\b|\bsave\b|\bapprove\b/i.test(text),
  };
  if (!/mockup|screenshot|image|visual design|design reference/i.test(text)) {
    findings.push({
      level: "warning",
      code: "UI_IMPLEMENTATION_SPEC_REFERENCE_CONTEXT_MISSING",
      message: "The spec should identify the mockup/image/design reference it was extracted from when applicable.",
    });
  }
  return {
    exists: true,
    path: specPath,
    bytes: Buffer.byteLength(text),
    sections,
    expected,
    expectedPages: expectedPagesFromSpec(text, specPath),
    findings,
  };
}

function packageInventory(validationReport, decodedPackage) {
  const inventories = validationReport?.inventories || {};
  const resources = Array.isArray(inventories.resources) ? inventories.resources : [];
  const forms = Array.isArray(inventories.forms) ? inventories.forms : [];
  const fallback = decodedInventory(decodedPackage?.data);
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
    summary: Object.keys(validationReport?.summary || {}).length ? validationReport.summary : fallback.summary,
    decoded: fallback,
  };
}

function decodedInventory(data) {
  const rootLayouts = asArray(data?.Item?.Layouts);
  const childItems = asArray(data?.Childs);
  return {
    summary: {
      childResources: childItems.length,
      dataLists: childItems.length,
      dashboards: rootLayouts.filter((layout) => Number(layout.Type) === 103).length,
      forms: childItems.reduce((count, item) => count + asArray(item.Layouts).filter((layout) => Number(layout.Type) === 1).length, 0),
    },
    dashboards: rootLayouts.map((layout) => ({ title: safeString(layout.Title), type: Number(layout.Type), layoutId: safeString(layout.LayoutID) })),
    lists: childItems.map((item) => ({
      title: safeString(item.ListModel?.Title),
      listId: safeString(item.ListModel?.ListID),
      fieldCount: asArray(item.Defs).length,
      layouts: asArray(item.Layouts).map((layout) => ({ title: safeString(layout.Title), type: Number(layout.Type), layoutId: safeString(layout.LayoutID) })),
    })),
  };
}

function compareSpecToPackage(spec, inventory, uiQualityReport) {
  if (!spec.exists) return [];
  const findings = [];
  const expected = spec.expected || {};
  const summary = inventory.summary || {};
  const uiSummary = uiQualityReport?.summary || {};
  if (expected.dashboards && Number(summary.dashboards || 0) === 0) {
    findings.push({ level: "warning", code: "SPEC_EXPECTED_DASHBOARD_MISSING", message: "The UI implementation spec references dashboard pages, but package inventory found none." });
  }
  if (expected.customForms && Number(uiSummary.customForms || 0) === 0 && Number(summary.forms || 0) === 0) {
    findings.push({ level: "warning", code: "SPEC_EXPECTED_FORM_SURFACES_MISSING", message: "The UI implementation spec references form/view/print surfaces, but package inventory found no matching form surfaces." });
  }
  if (expected.dataTables && Number(uiSummary.dataTables || 0) === 0) {
    findings.push({ level: "warning", code: "SPEC_EXPECTED_DATA_TABLE_MISSING", message: "The UI implementation spec references Data table/grid surfaces, but UI inspection found no Data table controls." });
  }
  if (expected.itemTemplates && Number(uiSummary.itemTemplateControls || 0) === 0) {
    findings.push({ level: "warning", code: "SPEC_EXPECTED_COLLECTION_KANBAN_TIMELINE_MISSING", message: "The UI implementation spec references Collection/Kanban/Timeline surfaces, but UI inspection found no item-template controls." });
  }
  if (expected.printPage) {
    findings.push({ level: "warning", code: "SPEC_PRINT_PAGE_MANUAL_REVIEW", message: "The UI implementation spec references a Print Page. Verify print layout, QR/barcode, page breaks, and read-only field formatting manually." });
  }
  if (expected.documentEmbed || expected.qrBarcode || expected.customCss || expected.customCode) {
    findings.push({ level: "warning", code: "SPEC_ADVANCED_VISUAL_ELEMENTS_MANUAL_REVIEW", message: "The UI implementation spec references advanced visual elements. Verify Document embed, QR/Barcode, custom CSS, or Custom code placement manually." });
  }
  return findings;
}

function controlText(control) {
  const attrs = control?.attrs || {};
  const candidates = [
    control.label,
    control.text,
    attrs.text,
    attrs.title,
    attrs.value,
    attrs.headc?.title?.value,
    attrs.headc?.title,
    attrs.description,
    attrs.desc,
  ];
  return candidates.map(safeString).find(Boolean) || "";
}

function hasActionBinding(control) {
  const attrs = control?.attrs || {};
  const candidates = [
    attrs.control_action,
    attrs.action,
    attrs.actionId,
    attrs.action_id,
    attrs.click,
    attrs.onClick,
    control.action,
    control.actionId,
  ];
  if (candidates.some((candidate) => safeString(candidate))) return true;
  return asArray(attrs.actions).length > 0 || asArray(control.actions).length > 0;
}

function countControls(root) {
  const counts = {};
  let total = 0;
  walkControls(root, (control) => {
    total += 1;
    const type = safeString(control.type) || "<root>";
    counts[type] = (counts[type] || 0) + 1;
  });
  return { total, counts };
}

function getLayoutPage(layout) {
  for (const resource of asArray(layout.LayoutInResources)) {
    const parsed = parseMaybeJson(resource?.Resource);
    if (parsed) return parsed;
  }
  return null;
}

function collectSurfaces(data) {
  const dashboards = [];
  const customForms = [];
  for (const layout of asArray(data?.Item?.Layouts)) {
    if (Number(layout.Type) === 103) dashboards.push({ layout, page: getLayoutPage(layout), title: safeString(layout.Title), kind: "dashboard" });
  }
  for (const item of asArray(data?.Childs)) {
    const listTitle = safeString(item.ListModel?.Title);
    for (const layout of asArray(item.Layouts)) {
      if (Number(layout.Type) === 1) customForms.push({ layout, page: getLayoutPage(layout), title: safeString(layout.Title), listTitle, kind: "custom_form" });
    }
  }
  return { dashboards, customForms };
}

function strictAdd(findings, code, message, detail = {}, level = "error") {
  findings.push({ level, code, message, detail, source: "strict-visual-app-quality" });
}

function hasSafePadding(page) {
  const text = JSON.stringify(page || {});
  if (/padding/i.test(text) && /(--sp--s[3-9]|\b(1[6-9]|[2-9]\d)px\b|"left"\s*:\s*"?([2-9]\d|1[6-9])|"right"\s*:\s*"?([2-9]\d|1[6-9]))/.test(text)) return true;
  return false;
}

function hasCardStructure(page) {
  let cardLike = 0;
  walkControls(page, (control) => {
    const type = safeString(control.type);
    const label = safeString(control.label).toLowerCase();
    const styleText = JSON.stringify(control.attrs?.style || {});
    if (type === "card" || label.includes("card") || /border|shadow|radius|background/i.test(styleText)) cardLike += 1;
  });
  return cardLike >= 3;
}

function isDefaultAlert(control) {
  const values = [
    control.label,
    control.nv_label,
    control.attrs?.title,
    control.attrs?.description,
    control.attrs?.message,
    control.attrs?.text,
  ].map(safeString).filter(Boolean);
  return values.some((value) => /^alert$/i.test(value.trim()) || /Here is the description/i.test(value));
}

function styleText(control) {
  return JSON.stringify(control?.attrs || {});
}

function hasMainContentLayout(page) {
  let hasMain = false;
  let hasContent = false;
  walkControls(page, (control) => {
    const label = `${safeString(control.nv_label)} ${safeString(control.label)}`.toLowerCase();
    if (/\bmain\b/.test(label)) hasMain = true;
    if (/\bcontent\b/.test(label)) hasContent = true;
  });
  return hasMain && hasContent;
}

function hasWeakSpacingMetadata(control) {
  const gap = control?.attrs?.style?.gap;
  if (Array.isArray(gap)) return true;
  if (gap === undefined || gap === null || gap === "") return false;
  const numeric = Number(String(gap).replace(/px$/, ""));
  return Number.isFinite(numeric) && numeric < 16;
}

function countRuntimeLikelyCards(page) {
  let count = 0;
  walkControls(page, (control) => {
    if (safeString(control.type) !== "container") return;
    const attrs = control.attrs || {};
    const common = attrs.common || {};
    const padding = common.padding || {};
    const pad = Number(padding.left || 0) + Number(padding.right || 0) + Number(padding.top || 0) + Number(padding.bottom || 0);
    const background = JSON.stringify(common.background || "");
    const border = JSON.stringify(common.border || "");
    const hasVisibleSurface = /classic|color|background/i.test(background) && /width|radius|color/i.test(border);
    const label = `${safeString(control.nv_label)} ${safeString(control.label)}`.toLowerCase();
    const isStructuralShell = /padded page|dashboard header|workspace header|\bmain\b|\bcontent\b/.test(label);
    if (hasVisibleSurface && pad >= 48 && !isStructuralShell) count += 1;
  });
  return count;
}

function countGridLikeContainers(page) {
  let count = 0;
  walkControls(page, (control) => {
    if (safeString(control.type) !== "container") return;
    const columns = Number(control.attrs?.grid?.columns || 0);
    const direction = JSON.stringify(control.attrs?.style?.direction || "");
    if (columns >= 2 || /row/i.test(direction)) count += 1;
  });
  return count;
}

function hasRuntimeRenderableAlertContent(control) {
  if (safeString(control.type) !== "alert") return true;
  const text = JSON.stringify(control || {});
  const hasSpecificCopy = /risk|compliance|expired|document|review|vendor|sanction|insurance/i.test(text);
  const hasOnlyWeakAttrs = Boolean(control.attrs?.title || control.attrs?.description) && asArray(control.children).length === 0;
  return hasSpecificCopy && !hasOnlyWeakAttrs;
}

function isWeakGeneratedAction(control) {
  const attrs = control?.attrs || {};
  const action = attrs.action || control.action;
  if (isObject(action) && action.safeGeneratedAction) return true;
  if (isObject(action) && action.type === "navigate" && !action.url && !action.pageId && !action.layoutId && !action.listId && !action.steps?.length) return true;
  const localActions = asArray(attrs.actions);
  return localActions.some((item) => asArray(item.steps).some((step) => safeString(step.type) === "noop"));
}

function countWeakActions(page) {
  let count = 0;
  walkControls(page, (control) => {
    const type = safeString(control.type);
    if ((type === "button" || type === "kanban" || type === "collection" || type === "icon_list") && isWeakGeneratedAction(control)) count += 1;
    for (const item of asArray(control.attrs?.items)) {
      if (isWeakGeneratedAction(item)) count += 1;
    }
  });
  return count;
}

function hasKpiCardIssue(page) {
  let kpiRow = null;
  walkControls(page, (control) => {
    const label = `${safeString(control.nv_label)} ${safeString(control.label)}`.toLowerCase();
    if (!kpiRow && safeString(control.type) === "container" && /kpi/.test(label)) kpiRow = control;
  });
  if (!kpiRow) return true;
  const cards = asArray(kpiRow.children).filter((child) => safeString(child.type) === "container");
  if (cards.length < 4) return true;
  return cards.some((card) => {
    const text = styleText(card);
    const controlCounts = countControls(card).counts;
    const hasVisualCue = /icon|accent|badge|status|var\(--c--(primary|success|warning|danger)\)|#(?!fff|ffffff|f7fafc|e5e7eb|f3f4f6|f9fafb)[0-9a-f]{3,6}/i.test(text);
    const hasEnoughContent = (controlCounts.heading || 0) + (controlCounts["dynamic-field"] || 0) >= 3;
    return !hasVisualCue || !hasEnoughContent;
  });
}

function dashboardSpecificRequirements(title) {
  if (/Vendor Management Dashboard/i.test(title)) {
    return [
      { key: "header/action area", pattern: /header|action|new vendor|request/i },
      { key: "KPI cards row", pattern: /kpi|total vendors|pending onboarding|high risk|expiring documents/i },
      { key: "progress section", pattern: /progress|completion/i },
      { key: "alert section", pattern: /urgent|risk|alert|compliance/i },
      { key: "status board", pattern: /kanban|status board|onboarding status/i },
      { key: "data table", pattern: /data-list|vendor records/i },
      { key: "quick links", pattern: /quick links|icon_list/i },
      { key: "recent activity", pattern: /recent activity|timeline/i },
    ];
  }
  if (/Compliance Review Workspace/i.test(title)) {
    return [
      { key: "review queue controls", pattern: /queue|filter|start compliance|bulk request/i },
      { key: "risk board", pattern: /risk queue|kanban|high-risk/i },
      { key: "selected vendor summary", pattern: /selected vendor summary|vendor summary/i },
      { key: "risk progress indicator", pattern: /progress-circle|risk score|progress/i },
      { key: "issues alert", pattern: /alert|issue|missing|expired|risk/i },
      { key: "missing documents table", pattern: /missing|expired documents|data-list/i },
      { key: "review action area", pattern: /bulk operations|approve|assign|review action/i },
    ];
  }
  return [];
}

function missingDashboardRequirements(title, page) {
  const text = JSON.stringify(page || {});
  return dashboardSpecificRequirements(title).filter((requirement) => !requirement.pattern.test(text));
}

function inspectDashboardStrict(surface, spec, findings, summary) {
  const { title, page, layout } = surface;
  const ext2 = parseMaybeJson(layout.Ext2);
  if (Number(layout.Type) === 103 && !(ext2 && ext2.src === true)) {
    strictAdd(findings, "DASHBOARD_TYPE_103_SRC_REQUIRED", "Generated Type 103 dashboards must include Ext2 src=true so Yeeflow uses the current dashboard renderer.", { title });
  }
  if (layout.Ext2 === "" || layout.Ext2 === undefined || layout.Ext2 === null || !(ext2 && ext2.src === true)) {
    strictAdd(findings, "DASHBOARD_LEGACY_RENDERER_FORBIDDEN", "Generated dashboards must not use the retired legacy renderer shell.", { title });
  }
  if (!Array.isArray(layout.LayoutInResources)) {
    strictAdd(findings, "DASHBOARD_LAYOUTINRESOURCES_INVALID", "Generated current dashboards must provide LayoutInResources as an array.", { title });
  }
  if (!page) {
    strictAdd(findings, "SPEC_PAGE_UNDERBUILT", "Full application generation cannot return a blank dashboard for a planned app page.", { title });
    return;
  }
  const { counts, total } = countControls(page);
  const dataTables = counts["data-list"] || 0;
  const buttons = counts.button || 0;
  const alerts = counts.alert || 0;
  const itemTemplates = (counts.kanban || 0) + (counts.collection || 0) + (counts["timeline-v"] || 0) + (counts["timeline-h"] || 0);
  const runtimeLikelyCards = countRuntimeLikelyCards(page);
  const gridLikeContainers = countGridLikeContainers(page);
  const weakActions = countWeakActions(page);
  const hasMainContent = hasMainContentLayout(page);
  const missingRequirements = missingDashboardRequirements(title, page);
  const visualScore = [
    total >= 40,
    runtimeLikelyCards >= 6,
    gridLikeContainers >= 3,
    hasMainContent,
    weakActions === 0,
    missingRequirements.length === 0,
    !hasKpiCardIssue(page),
  ].filter(Boolean).length;
  summary.dashboards.push({
    title,
    totalControls: total,
    counts,
    dataTables,
    buttons,
    alerts,
    itemTemplates,
    runtimeLikelyCards,
    gridLikeContainers,
    weakActions,
    hasMainContent,
    visualScore,
    missingMockupSections: missingRequirements.map((item) => item.key),
  });
  if (!hasSafePadding(page)) {
    strictAdd(findings, "DASHBOARD_PADDING_MISSING", "Dashboard lacks clearly detectable safe outer padding; full UI pages must not place major content against the window edge.", { title });
  }
  if (!hasCardStructure(page)) {
    strictAdd(findings, "DASHBOARD_CARD_STRUCTURE_MISSING", "Dashboard lacks enough card/section styling for the approved modern SaaS layout.", { title });
  }
  if (total < 18 || dataTables === 1 && total < 30) {
    strictAdd(findings, "DASHBOARD_LAYOUT_TOO_PLAIN", "Dashboard is too plain for a full application proof and appears closer to an importable scaffold than a designed page.", { title, totalControls: total, dataTables });
  }
  if (!hasMainContent || runtimeLikelyCards < 6 || visualScore < 5) {
    strictAdd(findings, "DASHBOARD_VISUAL_RICHNESS_TOO_LOW", "Dashboard has controls, but the rendered-design richness is too low for the approved mockups.", { title, runtimeLikelyCards, gridLikeContainers, hasMainContent, visualScore });
  }
  let weakSpacing = 0;
  walkControls(page, (control) => {
    if (safeString(control.type) === "container" && hasWeakSpacingMetadata(control)) weakSpacing += 1;
  });
  if (!hasMainContent || weakSpacing > 0) {
    strictAdd(findings, "DASHBOARD_SECTION_SPACING_TOO_WEAK", "Dashboard spacing relies on weak or non-renderable metadata and may render as a cramped/plain page.", { title, weakSpacing, hasMainContent });
  }
  if (!hasMainContent || gridLikeContainers < 3) {
    strictAdd(findings, "DASHBOARD_GRID_STRUCTURE_MISSING", "Dashboard lacks the required Main/Content layout and robust multi-column/grid section structure.", { title, gridLikeContainers, hasMainContent });
  }
  if (hasKpiCardIssue(page) && /Vendor Management Dashboard/i.test(title)) {
    strictAdd(findings, "KPI_CARD_STRUCTURE_TOO_PLAIN", "KPI cards are present only as plain text blocks or lack visual cues such as icons, status accents, or reliable card styling.", { title });
  }
  for (const requirement of missingRequirements) {
    strictAdd(findings, "DASHBOARD_MOCKUP_SECTION_MISSING", "Dashboard is missing a required mockup/spec section.", { title, section: requirement.key });
  }
  if (visualScore < 6 || weakActions > 0 || missingRequirements.length > 0) {
    strictAdd(findings, "DASHBOARD_MOCKUP_FIDELITY_TOO_LOW", "Dashboard structure does not provide enough design fidelity to the approved mockup to be called a successful full UI.", { title, visualScore, weakActions, missingSections: missingRequirements.map((item) => item.key) });
  }
  if (/Vendor Management Dashboard/i.test(title) && spec.expected?.kpiCards && (counts.container || 0) < 8) {
    strictAdd(findings, "DASHBOARD_EXPECTED_KPI_CARDS_MISSING", "Vendor Management Dashboard should include a clear KPI card row matching the approved spec.", { title });
  }
  walkControls(page, (control, pointer) => {
    const type = safeString(control.type);
    const label = controlText(control);
    if (type === "alert" && isDefaultAlert(control)) {
      strictAdd(findings, "DASHBOARD_DEFAULT_ALERT_CONTENT", "Dashboard alert uses default placeholder content instead of meaningful compliance-risk copy.", { title, pointer, label });
      strictAdd(findings, "SPEC_CONTROL_PLACEHOLDER_ONLY", "A planned alert/control exists only as placeholder/default text.", { title, pointer, controlType: type });
    }
    if (type === "alert" && !hasRuntimeRenderableAlertContent(control)) {
      strictAdd(findings, "ALERT_CONTENT_TOO_GENERIC", "Dashboard alert content is not configured in a runtime-renderable, business-specific shape.", { title, pointer, label });
    }
    if (type === "button") {
      if (!label || /^button$/i.test(label.trim())) strictAdd(findings, "DEFAULT_BUTTON_LABEL", "Generated dashboard button has a generic/default label.", { title, pointer, label });
      if (!hasActionBinding(control)) {
        strictAdd(findings, "BUTTON_ACTION_MISSING", "Generated dashboard button has no configured action binding.", { title, pointer, label });
        strictAdd(findings, "DASHBOARD_BUTTON_ACTION_MISSING", "Dashboard contains buttons that do not expose configured actions.", { title, pointer, label });
      }
      if (isWeakGeneratedAction(control)) {
        strictAdd(findings, "BUTTON_VISUAL_OR_ACTION_TOO_WEAK", "Dashboard button has a label but only a weak generated action placeholder, not a real configured navigation/action.", { title, pointer, label });
      }
    }
    if (type === "kanban" || type === "collection") {
      const dynamicFields = [];
      walkControls(control, (node) => {
        if (safeString(node.type).startsWith("dynamic")) dynamicFields.push(node);
      });
      if (dynamicFields.length === 0) {
        strictAdd(findings, type === "kanban" ? "KANBAN_ITEM_TEMPLATE_EMPTY" : "COLLECTION_ITEM_TEMPLATE_EMPTY", "Kanban/Collection item template has no meaningful dynamic fields.", { title, pointer, controlType: type });
      } else if (dynamicFields.length < 3) {
        strictAdd(findings, "ITEM_TEMPLATE_TOO_MINIMAL", "Kanban/Collection item template is too minimal for a full application proof.", { title, pointer, controlType: type, dynamicFieldCount: dynamicFields.length });
      }
      const actionCount = asArray(control.attrs?.actions).length;
      if (actionCount === 0) strictAdd(findings, "ITEM_TEMPLATE_ACTIONS_MISSING", "Kanban/Collection item template has no configured item actions where the spec expects actionable cards.", { title, pointer, controlType: type });
      if (isWeakGeneratedAction(control)) strictAdd(findings, "ITEM_TEMPLATE_ACTIONS_MISSING", "Kanban/Collection item actions are placeholders or no-op steps rather than real actions.", { title, pointer, controlType: type });
    }
  });
  if (itemTemplates === 0 && /Compliance Review Workspace|Vendor Management Dashboard/i.test(title)) {
    strictAdd(findings, "EXPECTED_ACTION_MISSING", "Expected dashboard operations board/card actions are missing or not detectable.", { title });
  }
}

function formRequirementPatterns(title) {
  if (/Vendor Detail View Page/i.test(title)) {
    return [
      { key: "vendor header", pattern: /header|vendor name|status|risk|owner/i },
      { key: "review steps", pattern: /steps-bar|Request Submitted|Procurement Review|Compliance Review|Legal Review|Finance Review|Approved/i },
      { key: "tabs or major sections", pattern: /tabs|Overview|Documents|Compliance|Tasks|History/i },
      { key: "related documents", pattern: /document|Vendor Documents|document-embed/i },
      { key: "related reviews", pattern: /review|Compliance Reviews/i },
      { key: "related tasks", pattern: /task|Vendor Tasks/i },
      { key: "history", pattern: /history|timeline/i },
    ];
  }
  if (/New Vendor Request Form/i.test(title)) {
    return [
      { key: "vendor information", pattern: /Vendor Information|Vendor Name|Vendor Type/i },
      { key: "contact information", pattern: /Contact Information|Email|Phone/i },
      { key: "business justification", pattern: /Business Justification/i },
      { key: "payment and contract", pattern: /Payment|Contract|Annual Spend/i },
      { key: "required documents", pattern: /Required Documents|document checklist|dynamic-file|file/i },
    ];
  }
  if (/Vendor Print Page/i.test(title)) {
    return [
      { key: "printable header", pattern: /print|header|Vendor Summary/i },
      { key: "vendor summary", pattern: /Vendor Name|Vendor Type|Risk Level|Onboarding Status/i },
      { key: "compliance summary", pattern: /Compliance|Review|Risk/i },
      { key: "document checklist", pattern: /Document|Checklist/i },
      { key: "approval timeline", pattern: /timeline|approval|steps-bar/i },
      { key: "qr or barcode", pattern: /qr-code|barcode|QR|Barcode/i },
    ];
  }
  return [];
}

function inspectCustomFormStrict(surface, findings, summary) {
  const { title, listTitle, page } = surface;
  if (!page) {
    strictAdd(findings, "CUSTOM_FORM_BLANK", "Custom form layout has no parseable designed content.", { list: listTitle, title });
    return;
  }
  const { counts, total } = countControls(page);
  const fieldControls = (counts.field || 0) + (counts["dynamic-field"] || 0) + (counts["dynamic-user"] || 0) + (counts["dynamic-file"] || 0);
  const hasMainContent = hasMainContentLayout(page);
  const runtimeLikelyCards = countRuntimeLikelyCards(page);
  const formRequirements = formRequirementPatterns(title);
  const formText = JSON.stringify(page || {});
  const missingFormSections = formRequirements.filter((requirement) => !requirement.pattern.test(formText));
  summary.customForms.push({ list: listTitle, title, totalControls: total, counts, fieldControls, hasMainContent, runtimeLikelyCards, missingMockupSections: missingFormSections.map((item) => item.key) });
  if (total < 10 || fieldControls < 4) {
    strictAdd(findings, "FORM_LAYOUT_TOO_MINIMAL", "Custom form exists but is too minimal to count as a designed full-application form.", { list: listTitle, title, totalControls: total, fieldControls });
  }
  if (formRequirements.length && (!hasMainContent || runtimeLikelyCards < 4 || missingFormSections.length)) {
    const code = /Detail View/i.test(title) ? "DETAIL_VIEW_FORM_UNDERBUILT"
      : /New Vendor/i.test(title) ? "NEW_FORM_UNDERBUILT"
        : /Print Page/i.test(title) ? "PRINT_PAGE_UNDERBUILT"
          : "FORM_LAYOUT_TOO_MINIMAL";
    strictAdd(findings, code, "Custom form has controls, but does not meet the approved mockup section richness.", { list: listTitle, title, hasMainContent, runtimeLikelyCards, missingSections: missingFormSections.map((item) => item.key) });
    for (const requirement of missingFormSections) {
      strictAdd(findings, "FORM_MOCKUP_SECTION_MISSING", "Custom form is missing a required mockup/spec section.", { list: listTitle, title, section: requirement.key });
    }
  }
  if (/Safe padded generated form/i.test(JSON.stringify(page))) {
    strictAdd(findings, "SPEC_CONTROL_PLACEHOLDER_ONLY", "Custom form uses generated scaffold copy rather than the approved form design.", { list: listTitle, title });
    strictAdd(findings, "FORM_LAYOUT_TOO_MINIMAL", "Custom form is a generic generated maintenance form rather than a designed full-application form.", { list: listTitle, title });
  }
  walkControls(page, (control, pointer) => {
    const type = safeString(control.type);
    const label = controlText(control);
    if (type === "button") {
      if (!label || /^button$/i.test(label.trim())) strictAdd(findings, "DEFAULT_BUTTON_LABEL", "Generated custom-form button has a generic/default label.", { list: listTitle, title, pointer, label });
      if (!hasActionBinding(control)) strictAdd(findings, "BUTTON_ACTION_MISSING", "Generated custom-form button has no configured action binding.", { list: listTitle, title, pointer, label });
    }
  });
}

function inspectStrictVisualQuality(decodedPackage, spec) {
  const findings = [];
  const summary = { dashboards: [], customForms: [], expectedPages: spec.expectedPages || [] };
  const data = decodedPackage?.data;
  if (!data) {
    strictAdd(findings, "FULL_APP_SCOPE_NOT_MET", "Package could not be decoded into an app model for strict visual quality validation.");
    return { summary, findings };
  }
  const surfaces = collectSurfaces(data);
  const implementedTitles = new Set([
    ...surfaces.dashboards.map((surface) => surface.title),
    ...surfaces.customForms.map((surface) => surface.title),
  ].filter(Boolean));
  for (const page of spec.expectedPages || []) {
    if (!implementedTitles.has(page)) {
      const code = /Detail View/i.test(page) ? "CUSTOM_VIEW_FORM_MISSING"
        : /Request Form|New Vendor/i.test(page) ? "CUSTOM_NEW_FORM_MISSING"
          : /Print Page/i.test(page) ? "CUSTOM_PRINT_PAGE_MISSING"
            : "SPEC_PAGE_UNDERBUILT";
      strictAdd(findings, code, "Approved UI mockup/spec page is missing from the generated app package.", { page });
    }
  }
  if (surfaces.dashboards.length < 2 && spec.expected?.dashboards) {
    strictAdd(findings, "FULL_APP_SCOPE_NOT_MET", "Full app spec expects multiple dashboard/workspace surfaces, but package has too few dashboards.", { dashboardCount: surfaces.dashboards.length });
  }
  if (surfaces.customForms.length === 0 && spec.expected?.customForms) {
    strictAdd(findings, "CUSTOM_FORM_BLANK", "Full app spec expects designed forms, but no custom form layouts were detected.");
  }
  surfaces.dashboards.forEach((surface) => inspectDashboardStrict(surface, spec, findings, summary));
  surfaces.customForms.forEach((surface) => inspectCustomFormStrict(surface, findings, summary));
  const titleSet = new Set(surfaces.customForms.map((surface) => surface.title));
  if (spec.expectedPages?.some((page) => /Vendor Detail View Page/i.test(page)) && !titleSet.has("Vendor Detail View Page")) {
    strictAdd(findings, "CUSTOM_VIEW_FORM_MISSING", "Vendor Detail View Page is not present as a designed custom view form.");
  }
  if (spec.expectedPages?.some((page) => /New Vendor Request Form/i.test(page)) && !titleSet.has("New Vendor Request Form")) {
    strictAdd(findings, "CUSTOM_NEW_FORM_MISSING", "New Vendor Request Form is not present as a designed custom new/edit form.");
  }
  if (spec.expectedPages?.some((page) => /Vendor Print Page/i.test(page)) && !titleSet.has("Vendor Print Page")) {
    strictAdd(findings, "CUSTOM_PRINT_PAGE_MISSING", "Vendor Print Page is not present as a designed print layout.");
  }
  if (findings.some((finding) => finding.level === "error")) {
    strictAdd(findings, "FULL_APP_SCOPE_NOT_MET", "Generated package is importable but does not meet the approved full-application UI scope.");
  }
  return { summary, findings };
}

function packageValidatorArgs(repoRoot, packagePath) {
  return packagePath.toLowerCase().endsWith(".yapk")
    ? [path.join(repoRoot, "validate-yapk-package.js"), packagePath]
    : [path.join(repoRoot, "validate-yap-package.js"), packagePath, "--mode", "compatibility"];
}

function main() {
  const args = parseArgs(process.argv);
  const repoRoot = process.cwd();
  const packagePath = path.resolve(args.packagePath);
  const planPath = args.planPath ? path.resolve(args.planPath) : "";
  const specPath = args.specPath ? path.resolve(args.specPath) : "";
  const decodedPackage = decodePackage(packagePath);
  const plan = inspectPlan(planPath);
  const spec = inspectSpec(specPath);
  const validation = runJsonStep("package-validation", process.execPath, packageValidatorArgs(repoRoot, packagePath));
  const uiQuality = runJsonStep("generated-ui-quality", process.execPath, [path.join(repoRoot, "scripts/inspect-generated-ui-quality.mjs"), packagePath]);
  const inventory = packageInventory(validation.report, decodedPackage);
  const specPackageFindings = compareSpecToPackage(spec, inventory, uiQuality.report);
  const strictVisual = args.strictVisualAppQuality ? inspectStrictVisualQuality(decodedPackage, spec) : { summary: {}, findings: [] };
  const strictEscalatedFindings = args.strictAppQuality
    ? specPackageFindings.map((finding) => ({
      ...finding,
      level: ["SPEC_PRINT_PAGE_MANUAL_REVIEW", "SPEC_ADVANCED_VISUAL_ELEMENTS_MANUAL_REVIEW"].includes(finding.code)
        ? finding.level
        : finding.level === "warning" ? "error" : finding.level,
      source: "strict-app-quality",
    }))
    : specPackageFindings;
  const findings = [
    ...plan.findings,
    ...spec.findings,
    ...strictEscalatedFindings,
    ...((validation.report.findings || []).map((finding) => ({ ...finding, source: "package-validation" }))),
    ...((uiQuality.report.findings || []).map((finding) => ({ ...finding, source: "generated-ui-quality" }))),
    ...strictVisual.findings,
  ];
  const errors = findings.filter((finding) => finding.level === "error").length
    + (validation.exitCode && validation.errors === 0 ? 1 : 0)
    + (uiQuality.exitCode && uiQuality.errors === 0 ? 1 : 0);
  const warnings = findings.filter((finding) => finding.level === "warning").length;
  const report = {
    status: errors ? "fail" : warnings ? "pass_with_warnings" : "pass",
    package: packagePath,
    packageType: decodedPackage.packageType,
    plan,
    spec,
    inventory,
    strict: {
      strictAppQuality: args.strictAppQuality,
      strictVisualAppQuality: args.strictVisualAppQuality,
      visualSummary: strictVisual.summary,
    },
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
