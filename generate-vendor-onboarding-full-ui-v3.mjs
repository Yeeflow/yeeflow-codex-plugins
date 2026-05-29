#!/usr/bin/env node

import fs from "node:fs";
import zlib from "node:zlib";
import { execFileSync } from "node:child_process";
import { fetchYeeflowUniqueIds, loadYeeflowApiEnvironment, summarizeIds } from "./scripts/yeeflow-id-api-utils.mjs";

const GZIP_PREFIX = "[______gizp______]";
const SOURCE_YAPK = "/Users/Renger/Downloads/vendor-onboarding-compliance-management.full-ui.v2-src-dashboard.yapk";
const SOURCE_YAP = "/Users/Renger/Downloads/vendor-onboarding-compliance-management.full-ui.v2-src-dashboard.yap";
const OUTPUT_YAPK = "/Users/Renger/Downloads/vendor-onboarding-compliance-management.full-ui.v3.yapk";
const OUTPUT_YAP = "/Users/Renger/Downloads/vendor-onboarding-compliance-management.full-ui.v3.yap";
const REPORT = ".tmp/vendor-onboarding-full-ui-v3/generation-report.json";
const APP_ID = 41;
const LARGE_INTEGER_RE = /^-?\d{16,}$/;

function quoteLargeIntegers(jsonText) {
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
      while (j < jsonText.length && jsonText[j] >= "0" && jsonText[j] <= "9") j += 1;
      if (jsonText[j] === "." || jsonText[j] === "e" || jsonText[j] === "E") {
        while (j < jsonText.length && /[0-9eE+\-.]/.test(jsonText[j])) j += 1;
        out += jsonText.slice(start, j);
      } else {
        const token = jsonText.slice(start, j);
        out += LARGE_INTEGER_RE.test(token) ? `"${token}"` : token;
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJson(text) {
  return JSON.parse(quoteLargeIntegers(text.replace(/^\uFEFF/, "")));
}

function stringifyWithRawIds(value, { yap = false } = {}) {
  const rawKeys = yap ? ["ListID", "FieldID", "LayoutID", "ID", "RefId"] : ["ListID", "FieldID", "ID", "RefId"];
  let text = JSON.stringify(value);
  for (const key of rawKeys) {
    text = text.replace(new RegExp(`"${key}":"(\\d{16,})"`, "g"), `"${key}":$1`);
  }
  return text;
}

function safeString(value) {
  return value === undefined || value === null ? "" : String(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
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

function slug(value) {
  return safeString(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "action";
}

function walkControls(control, visitor) {
  if (!isObject(control)) return;
  visitor(control);
  for (const key of ["children", "columns", "controls", "items", "rows", "cells"]) {
    asArray(control[key]).forEach((child) => walkControls(child, visitor));
  }
}

function loadYapk() {
  const wrapper = parseJson(fs.readFileSync(SOURCE_YAPK, "utf8"));
  const appPackage = parseJson(zlib.brotliDecompressSync(Buffer.from(wrapper.Resource, "base64")).toString("utf8"));
  return { wrapper, appPackage };
}

function loadYap() {
  const wrapper = parseJson(fs.readFileSync(SOURCE_YAP, "utf8"));
  if (!safeString(wrapper.Resource).startsWith(GZIP_PREFIX)) throw new Error("Source YAP Resource is not gzip-prefixed.");
  const listExportResult = parseJson(zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"));
  const data = typeof listExportResult.Data === "string" ? parseJson(listExportResult.Data) : listExportResult.Data;
  return { wrapper, listExportResult, data };
}

function setCardStyle(control) {
  if (!isObject(control) || control.type !== "container") return;
  control.attrs ||= {};
  control.attrs.style ||= {};
  control.attrs.style.card = {
    background: "#ffffff",
    border: "1px solid #E5E7EB",
    radius: 8,
    shadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
  };
  control.attrs.common ||= {};
  control.attrs.common.padding ||= { left: 20, right: 20, top: 20, bottom: 20 };
}

function repairButton(control) {
  if (!isObject(control) || control.type !== "button") return;
  control.attrs ||= {};
  const text = safeString(control.attrs.text || control.nv_label || control.label).trim();
  const label = text && !/^button$/i.test(text) ? text : "Open Vendor Action";
  control.label = label;
  control.nv_label = label;
  control.attrs.text = label;
  delete control.attrs.control_action;
  control.attrs.action ||= {
    type: "navigate",
    target: slug(label),
    safeGeneratedAction: true,
    note: "Generated v3 safe navigation/action binding; configure tenant-specific workflow after import if needed.",
  };
}

function repairAlert(control) {
  if (!isObject(control) || control.type !== "alert") return;
  control.attrs ||= {};
  const title = safeString(control.attrs.title);
  const description = safeString(control.attrs.description);
  if (!title || /^alert$/i.test(title) || /Here is the description/i.test(description)) {
    control.attrs.title = "Compliance attention required";
    control.attrs.description = "Review high-risk vendors, expiring documents, blocked reviews, and renewal follow-ups before approving onboarding.";
    control.attrs.type = control.attrs.type || "warning";
  }
  control.label = control.attrs.title;
  control.nv_label = control.attrs.title;
}

function repairDataTable(control) {
  if (!isObject(control) || control.type !== "data-list") return;
  for (const column of asArray(control.attrs?.listarr)) {
    if (isObject(column) && !column.Field) column.Field = column.FieldName || column.name || column.DisplayName;
    if (isObject(column) && !column.FieldName) column.FieldName = column.DisplayName || column.Field;
  }
}

function repairItemTemplate(control) {
  if (!isObject(control) || !["kanban", "collection"].includes(control.type)) return;
  control.attrs ||= {};
  if (!Array.isArray(control.attrs.actions) || control.attrs.actions.length === 0) {
    control.attrs.actions = ["Open Detail", "Update Status", "Assign Owner"].map((name) => ({
      id: `action-${slug(control.nv_label || control.label)}-${slug(name)}`,
      name,
      type: "coll",
      steps: [{ type: "navigate", attrs: { target: slug(name), safeGeneratedAction: true } }],
    }));
  }
}

function repairText(control) {
  if (!isObject(control)) return;
  const title = control.attrs?.headc?.title;
  if (isObject(title) && /Safe padded generated form/i.test(safeString(title.value))) {
    title.value = "Designed operational form for review, updates, and post-import workflow configuration.";
  }
}

function replaceScaffoldStrings(value) {
  if (typeof value === "string") {
    if (/Safe padded generated form/i.test(value)) {
      return "Designed operational form for review, updates, and post-import workflow configuration.";
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(replaceScaffoldStrings);
  if (isObject(value)) {
    for (const [key, child] of Object.entries(value)) value[key] = replaceScaffoldStrings(child);
  }
  return value;
}

function enrichPage(page, title) {
  if (!isObject(page)) return page;
  replaceScaffoldStrings(page);
  page.attrs ||= {};
  page.attrs.hideHeaderAll = true;
  page.attrs.common ||= {};
  page.attrs.common.padding ||= { left: 0, right: 0, top: 0, bottom: 0 };
  walkControls(page, (control) => {
    setCardStyle(control);
    repairButton(control);
    repairAlert(control);
    repairDataTable(control);
    repairItemTemplate(control);
    repairText(control);
  });
  if (/Vendor Management Dashboard|Compliance Review Workspace/i.test(title)) {
    page.attrs.background = { normal: { type: "classic", classic: { color: "#F7FAFC" } } };
  }
  return page;
}

function repairLayout(layout) {
  if (!isObject(layout)) return;
  if (Number(layout.Type) === 103) {
    layout.Ext2 = "{\"src\":true}";
    layout.LayoutInResources = asArray(layout.LayoutInResources);
    if (layout.LayoutView === "") layout.LayoutView = null;
  }
  for (const resource of asArray(layout.LayoutInResources)) {
    const page = parseMaybeJson(resource.Resource);
    if (!page) continue;
    enrichPage(page, safeString(layout.Title));
    resource.Resource = JSON.stringify(page);
  }
}

function repairListModel(listModel, layouts) {
  if (!isObject(listModel)) return;
  const view = parseMaybeJson(listModel.LayoutView) || {};
  const byTitle = new Map(asArray(layouts).map((layout) => [safeString(layout.Title), safeString(layout.LayoutID)]));
  if (byTitle.has("Vendor Detail View Page")) view.view = byTitle.get("Vendor Detail View Page");
  if (byTitle.has("New Vendor Request Form")) {
    view.add = byTitle.get("New Vendor Request Form");
    view.edit = byTitle.get("New Vendor Request Form");
  }
  if (byTitle.has("Vendor Print Page")) view.print = byTitle.get("Vendor Print Page");
  view.opentype ||= { add: "modal", edit: "modal", view: "slide" };
  view.modalsize ||= { add: 3, edit: 3, view: 3 };
  listModel.LayoutView = JSON.stringify(view);
}

function repairAppPackage(appPackage) {
  for (const page of asArray(appPackage.Pages)) repairLayout(page);
  for (const child of asArray(appPackage.Childs)) {
    for (const layout of asArray(child.Layouts)) repairLayout(layout);
    repairListModel(child.List, child.Layouts);
  }
  appPackage.PortalInfo = null;
  return appPackage;
}

function repairListExportInfo(data) {
  for (const layout of asArray(data?.Item?.Layouts)) repairLayout(layout);
  for (const child of asArray(data?.Childs)) {
    for (const layout of asArray(child.Layouts)) repairLayout(layout);
    repairListModel(child.ListModel, child.Layouts);
  }
  return data;
}

function appPackageFromListExportInfo(data) {
  return {
    ListSet: data.Item.ListModel,
    Pages: data.Item.Layouts,
    Forms: asArray(data.Forms),
    FormReports: asArray(data.FormReports),
    FormNewReports: asArray(data.FormNewReports),
    DataReports: asArray(data.DataReports),
    Groups: asArray(data.AppGroups),
    Tags: asArray(data.AppTags),
    Metadatas: asArray(data.AppMetadatas),
    Agents: [],
    Connections: [],
    Knowledges: [],
    Themes: asArray(data.AppThemes),
    Components: asArray(data.AppComponents),
    PortalInfo: null,
    Childs: asArray(data.Childs).map((child) => ({
      List: child.ListModel,
      Fields: asArray(child.Defs),
      Layouts: asArray(child.Layouts),
      RemindRules: asArray(child.RemindRules),
      PublicForms: asArray(child.PublicForms),
      FlowMappings: asArray(child.FlowMappings),
      ListDatas: child.ListDatas || {},
    })),
  };
}

function postJsonWithCurl(url, apiKey, body) {
  const stdout = execFileSync("curl", [
    "--silent",
    "--show-error",
    "--max-time",
    "30",
    "--request",
    "POST",
    "--header",
    `apiKey: ${apiKey}`,
    "--header",
    "Accept: application/json",
    "--header",
    "Content-Type: application/json",
    "--data-binary",
    "@-",
    "--write-out",
    "\n%{http_code}",
    url,
  ], { input: JSON.stringify(body), maxBuffer: 4 * 1024 * 1024 }).toString("utf8");
  const splitAt = stdout.lastIndexOf("\n");
  return { body: splitAt >= 0 ? stdout.slice(0, splitAt) : "", status: Number(splitAt >= 0 ? stdout.slice(splitAt + 1) : "0") };
}

function signFromResponse(text) {
  const parsed = JSON.parse(text || "{}");
  return parsed?.Data ?? parsed?.data ?? parsed?.Sign ?? parsed?.sign ?? (typeof parsed === "string" ? parsed : "");
}

async function writeYapk(appPackage, sourceWrapper) {
  const env = loadYeeflowApiEnvironment(".env.local");
  if (env.apiBaseUrl !== "https://api.yeeflow.com/v1") throw new Error(`Unexpected API base URL: ${env.apiBaseUrl}`);
  const packageIds = await fetchYeeflowUniqueIds({ apiBaseUrl: env.apiBaseUrl, apiKey: env.apiKey, count: 1 });
  const resourceText = stringifyWithRawIds(appPackage);
  const unsigned = {
    ...sourceWrapper,
    PackageId: packageIds[0],
    TenantID: env.tenantId || sourceWrapper.TenantID || "0",
    AppID: APP_ID,
    Resource: zlib.brotliCompressSync(Buffer.from(resourceText, "utf8")).toString("base64"),
    Notes: "Vendor Onboarding full UI v3 quality-proof package. Uses current dashboard src marker, configured Field/FieldName Data tables, non-default alerts, action-bound buttons, and improved form/dashboard card structure.",
    Date: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    Version: "full-ui-v3",
  };
  delete unsigned.Sign;
  const signResult = postJsonWithCurl(`${env.apiBaseUrl}/utils/apppackage/setsign`, env.apiKey, unsigned);
  if (signResult.status < 200 || signResult.status > 299) throw new Error(`setsign failed with HTTP ${signResult.status}`);
  const sign = signFromResponse(signResult.body);
  if (typeof sign !== "string" || Buffer.from(sign, "base64").length !== 32) throw new Error("setsign response did not include a 32-byte signature.");
  const signed = { ...unsigned, Sign: sign };
  const verifyResult = postJsonWithCurl(`${env.apiBaseUrl}/utils/apppackage/verifysign`, env.apiKey, signed);
  if (verifyResult.status < 200 || verifyResult.status > 299) throw new Error(`verifysign failed with HTTP ${verifyResult.status}`);
  fs.writeFileSync(OUTPUT_YAPK, `\uFEFF${JSON.stringify(signed)}\n`, "utf8");
  return {
    output: OUTPUT_YAPK,
    apiIds: summarizeIds(packageIds),
    signBytes: Buffer.from(sign, "base64").length,
    verifyStatus: verifyResult.status,
    decodedTextBytes: Buffer.byteLength(resourceText),
  };
}

function writeYap(sourceWrapper, listExportResult, data) {
  const nextResource = {
    ...listExportResult,
    MainListType: 1024,
    AppID: APP_ID,
    SimplePortal: null,
    Data: stringifyWithRawIds(data, { yap: true }),
  };
  const resourceText = stringifyWithRawIds(nextResource, { yap: true });
  const wrapper = {
    Title: sourceWrapper.Title,
    Description: sourceWrapper.Description,
    IconUrl: sourceWrapper.IconUrl,
    IsListSet: true,
    Resource: `${GZIP_PREFIX}${zlib.gzipSync(Buffer.from(resourceText, "utf8")).toString("base64")}`,
  };
  fs.writeFileSync(OUTPUT_YAP, `${JSON.stringify(wrapper)}\n`);
  return { output: OUTPUT_YAP, decodedTextBytes: Buffer.byteLength(resourceText) };
}

async function main() {
  fs.mkdirSync(".tmp/vendor-onboarding-full-ui-v3", { recursive: true });
  const { wrapper: yapkWrapper, appPackage } = loadYapk();
  const repairedYapkApp = repairAppPackage(appPackage);
  const ypkg = await writeYapk(repairedYapkApp, yapkWrapper);

  const { wrapper: yapWrapper, listExportResult, data } = loadYap();
  const repairedData = repairListExportInfo(data);
  const yap = writeYap(yapWrapper, listExportResult, repairedData);
  const comparableAppPackage = appPackageFromListExportInfo(repairedData);

  const report = {
    status: "generated",
    source: { yapk: SOURCE_YAPK, yap: SOURCE_YAP },
    outputs: { yapk: OUTPUT_YAPK, yap: OUTPUT_YAP },
    ypkg,
    yap,
    counts: {
      pages: repairedYapkApp.Pages.length,
      childs: repairedYapkApp.Childs.length,
      ypkgFields: repairedYapkApp.Childs.reduce((sum, child) => sum + asArray(child.Fields).length, 0),
      comparableFields: comparableAppPackage.Childs.reduce((sum, child) => sum + asArray(child.Fields).length, 0),
    },
    repairedV2Failures: [
      "default button labels replaced with business labels",
      "buttons now carry safe action/navigation bindings",
      "default alert content replaced with compliance-specific copy",
      "dashboard/form containers enriched with card style metadata",
      "Data table display columns include Field and FieldName",
      "generic scaffold form copy removed",
      "Vendor list add/edit/view/print layout mappings reinforced",
    ],
    proofBoundary: "Local generation and validation proof only. Manual Yeeflow install/import and visual review are still required before runtime acceptance.",
  };
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ status: "generated", outputs: report.outputs, signing: { signBytes: ypkg.signBytes, verifyStatus: ypkg.verifyStatus }, apiIds: ypkg.apiIds, counts: report.counts }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "fail", error: error.message }, null, 2));
  process.exit(1);
});
