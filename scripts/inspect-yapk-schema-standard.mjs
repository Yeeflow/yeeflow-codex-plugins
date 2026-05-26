#!/usr/bin/env node

import fs from "node:fs/promises";
import zlib from "node:zlib";

const WRAPPER_REQUIRED = [
  "PackageId",
  "TenantID",
  "AppID",
  "ListID",
  "Title",
  "Description",
  "IconUrl",
  "Resource",
  "Notes",
  "Author",
  "Date",
  "Version",
  "Sign",
];
const APP_PACKAGE_REQUIRED = [
  "ListSet",
  "Pages",
  "Forms",
  "FormReports",
  "FormNewReports",
  "DataReports",
  "Groups",
  "Tags",
  "Metadatas",
  "Agents",
  "Connections",
  "Knowledges",
  "Themes",
  "Components",
  "PortalInfo",
  "Childs",
];
const LIST_PACKAGE_REQUIRED = ["List", "Fields", "Layouts", "RemindRules", "PublicForms", "FlowMappings"];
const LIST_TYPE_ENUM = new Set([1, 16, 32, 64, 128, 1024]);
const LIST_FLAGS_SHOW = 1;
const FIELD_TYPE_ENUM = new Set(["Text", "Bit", "Decimal", "DateTime"]);
const FIELD_CONTROL_TYPES = new Set([
  "input",
  "textarea",
  "richtext",
  "hyperlink",
  "input_number",
  "currency",
  "percent",
  "calculated-column",
  "rate",
  "switch",
  "checkbox",
  "radio",
  "select",
  "tag",
  "datepicker",
  "time",
  "identity-picker",
  "organization-picker",
  "cost-center-picker",
  "signer",
  "file-upload",
  "icon-upload",
  "lookup",
  "mutiple-metadata",
  "location-picker",
  "flowstatus",
  "autonumber",
  "list",
]);
const INTERNAL_NAME_RE = /^[A-Za-z0-9_]+$/;
const FIELD_NAME_SUFFIX_RE = /(\d+)$/;
const UTC_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const NUMERIC_STRING_RE = /^\d+$/;

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-yapk-schema-standard.mjs <package.yapk> [more.yapk ...]",
    "",
    "Prints redacted schema-standard inspection summaries for Yeeflow .yapk packages.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function add(findings, level, code, message, detail = {}) {
  findings.push({ level, code, message, detail });
}

async function readFileWithTimeout(file, timeoutMs = 2000) {
  let timeout;
  try {
    return await Promise.race([
      fs.readFile(file),
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error(`read timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

function parseWrapper(bytes, findings) {
  const text = bytes.toString("utf8").replace(/^\uFEFF/, "");
  try {
    return JSON.parse(text);
  } catch (error) {
    add(findings, "error", "YAPK_WRAPPER_JSON_INVALID", "Top-level .yapk JSON parse failed.", { error: error.message });
    return null;
  }
}

function decodeResource(resource, findings) {
  const attempts = [];
  if (typeof resource !== "string" || !resource) {
    add(findings, "error", "YAPK_RESOURCE_INVALID", "Resource must be a non-empty string.");
    return { attempts, decoded: null, decodedTextBytes: 0, resourceDecodedBytes: 0 };
  }

  const variants = [
    ["base64Bytes", Buffer.from(resource, "base64")],
    ["rawResourceUtf8Bytes", Buffer.from(resource, "utf8")],
    ["base64urlBytes", Buffer.from(resource.replace(/-/g, "+").replace(/_/g, "/"), "base64")],
  ];

  for (const [name, bytes] of variants) {
    try {
      const decompressed = zlib.brotliDecompressSync(bytes);
      const decoded = JSON.parse(decompressed.toString("utf8"));
      attempts.push({ name, brotli: true, json: true, inputBytes: bytes.length, decodedTextBytes: decompressed.length });
      return { attempts, decoded, decodedTextBytes: decompressed.length, resourceDecodedBytes: variants[0][1].length };
    } catch (error) {
      attempts.push({ name, brotli: false, inputBytes: bytes.length, errorClass: error.code || error.name || "DECODE_ERROR" });
    }
  }

  add(findings, "error", "YAPK_RESOURCE_BROTLI_DECODE_FAILED", "Resource did not Brotli-decompress to JSON with tested schema variants.");
  return { attempts, decoded: null, decodedTextBytes: 0, resourceDecodedBytes: variants[0][1].length };
}

function inspectWrapper(wrapper, findings) {
  if (!isObject(wrapper)) {
    add(findings, "error", "YAPK_WRAPPER_NOT_OBJECT", "Top-level .yapk value must be an object.");
    return;
  }
  for (const key of WRAPPER_REQUIRED) {
    if (!(key in wrapper)) add(findings, "error", "YAPK_REQUIRED_KEY_MISSING", "Top-level .yapk wrapper is missing a schema-required key.", { key });
  }
  if (typeof wrapper.TenantID !== "string" || !NUMERIC_STRING_RE.test(wrapper.TenantID)) {
    add(findings, "error", "YAPK_TENANT_ID_INVALID", "TenantID should be a numeric string.");
  }
  if (typeof wrapper.ListID !== "string" || !NUMERIC_STRING_RE.test(wrapper.ListID)) {
    add(findings, "error", "YAPK_LIST_ID_INVALID", "ListID should be a numeric string.");
  }
  if (typeof wrapper.Date !== "string" || !UTC_DATE_RE.test(wrapper.Date)) {
    add(findings, "error", "YAPK_DATE_FORMAT_INVALID", "Date should be UTC yyyy-MM-ddTHH:mm:ssZ.");
  }
  if (String(wrapper.Resource || "").startsWith("[______gizp______]")) {
    add(findings, "error", "YAPK_RESOURCE_USES_YAP_GZIP_PREFIX", ".yapk Resource must not use .yap gzip prefix.");
  }
}

function inspectField(field, path, findings, summary) {
  if (!isObject(field)) {
    add(findings, "error", "YAPK_FIELD_NOT_OBJECT", "List field entry must be an object.", { path });
    return;
  }
  summary.fieldCount += 1;
  const fieldName = String(field.FieldName || "");
  const match = fieldName.match(FIELD_NAME_SUFFIX_RE);
  if (!match) add(findings, "error", "YAPK_FIELD_NAME_SUFFIX_MISSING", "FieldName must end with digits.", { path: `${path}.FieldName` });
  else if (String(field.FieldIndex ?? "") !== match[1]) {
    add(findings, "error", "YAPK_FIELD_NAME_SUFFIX_INDEX_MISMATCH", "FieldName trailing digits must equal FieldIndex.", { path: `${path}.FieldName` });
  }
  if (typeof field.InternalName !== "string" || !INTERNAL_NAME_RE.test(field.InternalName)) {
    add(findings, "error", "YAPK_FIELD_INTERNAL_NAME_INVALID", "InternalName must match ^[a-zA-Z0-9_]+$.", { path: `${path}.InternalName` });
  }
  if (field.FieldType !== undefined && !FIELD_TYPE_ENUM.has(field.FieldType)) {
    add(findings, "error", "YAPK_FIELD_TYPE_INVALID", "FieldType is outside product schema enum.", { path: `${path}.FieldType` });
  }
  if (field.Type !== undefined && !FIELD_CONTROL_TYPES.has(field.Type)) {
    add(findings, "warning", "YAPK_FIELD_CONTROL_TYPE_UNKNOWN", "Field Type is not in the product schema known control-type list.", { path: `${path}.Type` });
  }
}

function inspectListPackage(pkg, path, findings, summary) {
  if (!isObject(pkg)) {
    add(findings, "error", "YAPK_LIST_PACKAGE_NOT_OBJECT", "ListPackageInfo must be an object.", { path });
    return;
  }
  summary.childCount += 1;
  for (const key of LIST_PACKAGE_REQUIRED) {
    if (!(key in pkg)) add(findings, "error", "YAPK_LIST_PACKAGE_KEY_MISSING", "ListPackageInfo is missing a schema-required key.", { path: `${path}.${key}` });
  }
  const list = pkg.List;
  if (isObject(list)) {
    if (list.Type !== undefined && !LIST_TYPE_ENUM.has(Number(list.Type))) {
      add(findings, "error", "YAPK_LIST_TYPE_INVALID", "List.Type is outside product schema enum.", { path: `${path}.List.Type` });
    }
    if (list.Flags !== undefined && (Number(list.Flags) & LIST_FLAGS_SHOW) !== LIST_FLAGS_SHOW) {
      add(findings, "error", "YAPK_LIST_FLAGS_SHOW_MISSING", "List.Flags should include Show = 1.", { path: `${path}.List.Flags` });
    }
  } else add(findings, "error", "YAPK_LIST_INFO_MISSING", "ListPackageInfo.List must be an object.", { path: `${path}.List` });

  for (const [index, field] of asArray(pkg.Fields).entries()) inspectField(field, `${path}.Fields[${index}]`, findings, summary);
  summary.layoutCount += asArray(pkg.Layouts).length;
}

function inspectNoRule(form, path, findings, summary) {
  if (!isObject(form)) return;
  summary.formCount += 1;
  if (form.NoRule === undefined || form.NoRule === null) return;
  if (!isObject(form.NoRule)) {
    add(findings, "error", "YAPK_FORM_NORULE_NOT_OBJECT", "NoRule must be an object when present.", { path: `${path}.NoRule` });
    return;
  }
  summary.noRuleCount += 1;
  for (const key of ["Prefix", "StartIndex", "CustomLength", "AutoIncrement"]) {
    if (!(key in form.NoRule)) add(findings, "error", "YAPK_FORM_NORULE_KEY_MISSING", "NoRule is missing a schema-required key.", { path: `${path}.NoRule.${key}` });
  }
  if (typeof form.NoRule.Prefix !== "string" || !form.NoRule.Prefix.includes("{index}")) {
    add(findings, "error", "YAPK_FORM_NORULE_PREFIX_INDEX_MISSING", "NoRule.Prefix must contain {index}.", { path: `${path}.NoRule.Prefix` });
  }
}

function inspectAppPackage(decoded, findings) {
  const summary = {
    decodedTopLevelKeys: isObject(decoded) ? Object.keys(decoded) : [],
    pages: 0,
    forms: 0,
    formReports: 0,
    formNewReports: 0,
    dataReports: 0,
    groups: 0,
    tags: 0,
    metadatas: 0,
    agents: 0,
    connections: 0,
    knowledges: 0,
    themes: 0,
    components: 0,
    childCount: 0,
    fieldCount: 0,
    layoutCount: 0,
    noRuleCount: 0,
  };
  if (!isObject(decoded)) {
    add(findings, "error", "YAPK_APP_PACKAGE_NOT_OBJECT", "Decoded Resource must be AppPackageInfo object.");
    return summary;
  }
  for (const key of APP_PACKAGE_REQUIRED) {
    if (!(key in decoded)) add(findings, "error", "YAPK_APP_PACKAGE_KEY_MISSING", "Decoded AppPackageInfo is missing a schema-required key.", { key });
  }
  summary.pages = asArray(decoded.Pages).length;
  summary.formReports = asArray(decoded.FormReports).length;
  summary.formNewReports = asArray(decoded.FormNewReports).length;
  summary.dataReports = asArray(decoded.DataReports).length;
  summary.groups = asArray(decoded.Groups).length;
  summary.tags = asArray(decoded.Tags).length;
  summary.metadatas = asArray(decoded.Metadatas).length;
  summary.agents = asArray(decoded.Agents).length;
  summary.connections = asArray(decoded.Connections).length;
  summary.knowledges = asArray(decoded.Knowledges).length;
  summary.themes = asArray(decoded.Themes).length;
  summary.components = asArray(decoded.Components).length;

  for (const [index, form] of asArray(decoded.Forms).entries()) inspectNoRule(form, `Forms[${index}]`, findings, summary);
  for (const [index, child] of asArray(decoded.Childs).entries()) inspectListPackage(child, `Childs[${index}]`, findings, summary);
  return summary;
}

async function inspectFile(file) {
  const findings = [];
  let bytes;
  try {
    bytes = await readFileWithTimeout(file);
  } catch (error) {
    return { file, readable: false, error: error.message, status: "fail" };
  }
  const wrapper = parseWrapper(bytes, findings);
  if (wrapper) inspectWrapper(wrapper, findings);
  const resource = wrapper ? decodeResource(wrapper.Resource, findings) : { attempts: [], decoded: null, resourceDecodedBytes: 0, decodedTextBytes: 0 };
  const appSummary = resource.decoded ? inspectAppPackage(resource.decoded, findings) : null;
  return {
    file,
    readable: true,
    fileBytes: bytes.length,
    hasBom: bytes.subarray(0, 3).toString("hex") === "efbbbf",
    wrapperKeys: wrapper ? Object.keys(wrapper) : [],
    resourceStringLength: typeof wrapper?.Resource === "string" ? wrapper.Resource.length : 0,
    resourceDecodedBytes: resource.resourceDecodedBytes,
    brotliSuccess: Boolean(resource.decoded),
    decodedTextBytes: resource.decodedTextBytes,
    decodeAttempts: resource.attempts,
    appSummary,
    errors: findings.filter((item) => item.level === "error"),
    warnings: findings.filter((item) => item.level === "warning"),
    status: findings.some((item) => item.level === "error") ? "fail" : "pass",
  };
}

const args = process.argv.slice(2);
if (!args.length || args.includes("--help") || args.includes("-h")) usage(args.length ? 0 : 1);

const results = [];
for (const file of args) results.push(await inspectFile(file));
console.log(JSON.stringify({ status: results.every((item) => item.status === "pass") ? "pass" : "fail", results }, null, 2));
process.exit(results.every((item) => item.status === "pass") ? 0 : 1);
