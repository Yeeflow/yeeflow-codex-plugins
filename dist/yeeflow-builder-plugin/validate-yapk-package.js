#!/usr/bin/env node

const fs = require("fs");
const { spawnSync } = require("child_process");
const zlib = require("zlib");

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
const EMPTY_PORTALINFO_IMPORT_ERROR = "YAPK_PORTALINFO_EMPTY_OBJECT_INVALID";
const LIST_PACKAGE_REQUIRED = ["List", "Fields", "Layouts", "RemindRules", "PublicForms", "FlowMappings"];
const LIST_TYPE_ENUM = new Set([1, 16, 32, 64, 128, 1024]);
const FIELD_TYPE_ENUM = new Set(["Text", "Bit", "Decimal", "DateTime", "Datetime", "Bigint"]);
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
const PLACEHOLDER_RE = /^__.*REQUIRED.*__$/;
const LARGE_INTEGER_RE = /^-?\d{16,}$/;

function usage() {
  console.error("Usage: node validate-yapk-package.js <package.yapk> [--baseline <baseline.yapk>]");
  process.exit(1);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function walk(value, visitor, pointer = "$") {
  visitor(value, pointer);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visitor, `${pointer}[${index}]`));
  else if (isObject(value)) Object.entries(value).forEach(([key, child]) => walk(child, visitor, `${pointer}.${key}`));
}

function readWrapper(file) {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  return parseJsonPreservingLargeInts(text);
}

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

function parseJsonPreservingLargeInts(text) {
  return JSON.parse(quoteLargeIntegers(text));
}

function add(list, code, message, detail = {}) {
  list.push({ code, message, ...detail });
}

function isBase64(value) {
  if (typeof value !== "string" || !value) return false;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) return false;
  return Buffer.from(value, "base64").toString("base64") === value;
}

function entropy(buffer) {
  if (!buffer.length) return 0;
  const counts = new Map();
  for (const byte of buffer) counts.set(byte, (counts.get(byte) || 0) + 1);
  let out = 0;
  for (const count of counts.values()) {
    const p = count / buffer.length;
    out -= p * Math.log2(p);
  }
  return Number(out.toFixed(4));
}

function compareBuffers(left, right) {
  const min = Math.min(left.length, right.length);
  let commonPrefixBytes = 0;
  while (commonPrefixBytes < min && left[commonPrefixBytes] === right[commonPrefixBytes]) commonPrefixBytes += 1;
  let commonSuffixBytes = 0;
  while (
    commonSuffixBytes < min - commonPrefixBytes &&
    left[left.length - 1 - commonSuffixBytes] === right[right.length - 1 - commonSuffixBytes]
  ) {
    commonSuffixBytes += 1;
  }
  let samePositionBytes = 0;
  for (let i = 0; i < min; i += 1) if (left[i] === right[i]) samePositionBytes += 1;
  return {
    leftBytes: left.length,
    rightBytes: right.length,
    commonPrefixBytes,
    commonSuffixBytes,
    samePositionByteRatio: min ? Number((samePositionBytes / min).toFixed(4)) : 0,
  };
}

function changedKeys(left, right, keys) {
  return keys.filter((key) => JSON.stringify(left[key]) !== JSON.stringify(right[key]));
}

function decodeBrotliResource(resource, errors) {
  const attempts = [];
  const base64Bytes = isBase64(resource) ? Buffer.from(resource, "base64") : Buffer.alloc(0);
  const variants = [
    ["base64Bytes", base64Bytes],
    ["rawResourceUtf8Bytes", Buffer.from(String(resource || ""), "utf8")],
    ["base64urlBytes", Buffer.from(String(resource || "").replace(/-/g, "+").replace(/_/g, "/"), "base64")],
  ];
  for (const [name, bytes] of variants) {
    try {
      const decompressed = zlib.brotliDecompressSync(bytes);
      const decoded = parseJsonPreservingLargeInts(decompressed.toString("utf8"));
      attempts.push({ name, brotli: true, json: true, inputBytes: bytes.length, decodedTextBytes: decompressed.length });
      return { decoded, attempts, resourceBytes: base64Bytes.length, decodedTextBytes: decompressed.length };
    } catch (error) {
      const tolerant = tolerantBrotliDecodeSync(bytes);
      if (tolerant.text) {
        try {
          const decoded = parseJsonPreservingLargeInts(tolerant.text);
          attempts.push({ name, brotli: "tolerant", json: true, inputBytes: bytes.length, decodedTextBytes: Buffer.byteLength(tolerant.text), errorClass: error.code || error.name || "DECODE_ERROR" });
          return { decoded, attempts, resourceBytes: base64Bytes.length, decodedTextBytes: Buffer.byteLength(tolerant.text) };
        } catch {
          // Fall through to record the normal sync decode failure.
        }
      }
      attempts.push({ name, brotli: false, inputBytes: bytes.length, errorClass: error.code || error.name || "DECODE_ERROR" });
    }
  }
  add(errors, "YAPK_RESOURCE_BROTLI_DECODE_FAILED", "Product schema describes Resource as Brotli-compressed AppPackageInfo, but tested decode variants did not produce JSON.");
  return { decoded: null, attempts, resourceBytes: base64Bytes.length, decodedTextBytes: 0 };
}

function tolerantBrotliDecodeSync(bytes) {
  const script = `
    const zlib = require("zlib");
    const chunks = [];
    const stream = zlib.createBrotliDecompress();
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", () => {
      process.stdout.write(Buffer.concat(chunks).toString("base64"));
    });
    stream.on("end", () => {
      process.stdout.write(Buffer.concat(chunks).toString("base64"));
    });
    stream.end(Buffer.from(process.argv[1], "base64"));
  `;
  const result = spawnSync(process.execPath, ["-e", script, bytes.toString("base64")], { encoding: "utf8", maxBuffer: 128 * 1024 * 1024 });
  if (result.status !== 0 || !result.stdout) return { text: "" };
  return { text: Buffer.from(result.stdout, "base64").toString("utf8") };
}

function validateField(field, path, errors, warnings) {
  if (!isObject(field)) {
    add(errors, "YAPK_FIELD_NOT_OBJECT", "List field entry must be an object.", { path });
    return;
  }
  if (!Number.isInteger(field.Category)) {
    add(errors, "FIELD_CATEGORY_NOT_INT", "Field.Category must be an integer for generated YAPK packages.", {
      path: `${path}.Category`,
      field: field.DisplayName || field.FieldName || field.InternalName || null,
      actualType: field.Category === undefined ? "missing" : Array.isArray(field.Category) ? "array" : field.Category === null ? "null" : typeof field.Category,
    });
  }
  const fieldName = String(field.FieldName || "");
  const match = fieldName.match(FIELD_NAME_SUFFIX_RE);
  if (!match && fieldName !== "Title") add(errors, "YAPK_FIELD_NAME_SUFFIX_MISSING", "FieldName must end with digits, except the built-in Title field.", { path: `${path}.FieldName` });
  else if (match && String(field.FieldIndex ?? "") !== match[1]) add(errors, "YAPK_FIELD_NAME_SUFFIX_INDEX_MISMATCH", "FieldName trailing digits must equal FieldIndex.", { path: `${path}.FieldName` });
  if (typeof field.InternalName !== "string" || !INTERNAL_NAME_RE.test(field.InternalName)) add(errors, "YAPK_FIELD_INTERNAL_NAME_INVALID", "InternalName must match ^[a-zA-Z0-9_]+$.", { path: `${path}.InternalName` });
  if (field.FieldType !== undefined && !FIELD_TYPE_ENUM.has(field.FieldType)) add(errors, "YAPK_FIELD_TYPE_INVALID", "FieldType is outside product schema enum.", { path: `${path}.FieldType` });
  if (field.Type !== undefined && !FIELD_CONTROL_TYPES.has(field.Type)) add(warnings, "YAPK_FIELD_CONTROL_TYPE_UNKNOWN", "Field Type is not in product schema known control-type list.", { path: `${path}.Type` });
}

function validateListPackage(pkg, path, errors, warnings, counts) {
  if (!isObject(pkg)) {
    add(errors, "YAPK_LIST_PACKAGE_NOT_OBJECT", "ListPackageInfo must be an object.", { path });
    return;
  }
  counts.childs += 1;
  for (const key of LIST_PACKAGE_REQUIRED) if (!(key in pkg)) add(errors, "YAPK_LIST_PACKAGE_KEY_MISSING", "ListPackageInfo is missing a schema-required key.", { path: `${path}.${key}` });
  if (!isObject(pkg.List)) add(errors, "YAPK_LIST_INFO_MISSING", "ListPackageInfo.List must be an object.", { path: `${path}.List` });
  else {
    if (pkg.List.Type !== undefined && !LIST_TYPE_ENUM.has(Number(pkg.List.Type))) add(errors, "YAPK_LIST_TYPE_INVALID", "List.Type is outside product schema enum.", { path: `${path}.List.Type` });
    if (Number(pkg.List.Flags) !== 1) add(errors, "YAPK_LISTMODEL_FLAGS_MISSING_OR_INVALID", "Generated AppPackageInfo child list resources require List.Flags = 1 before signing.", { path: `${path}.List.Flags`, value: pkg.List.Flags });
  }
  counts.fields += asArray(pkg.Fields).length;
  counts.layouts += asArray(pkg.Layouts).length;
  for (const [index, field] of asArray(pkg.Fields).entries()) validateField(field, `${path}.Fields[${index}]`, errors, warnings);
  if ("Defs" in pkg) add(errors, "YAPK_CHILDS_USES_DEFS", "YAPK Childs items must use Fields, not YAP Defs.", { path: `${path}.Defs` });
}

function validateNoRule(form, path, errors, counts) {
  if (!isObject(form)) return;
  counts.forms += 1;
  if (form.NoRule === undefined || form.NoRule === null) return;
  if (!isObject(form.NoRule)) {
    add(errors, "YAPK_FORM_NORULE_NOT_OBJECT", "NoRule must be an object when present.", { path: `${path}.NoRule` });
    return;
  }
  counts.noRules += 1;
  for (const key of ["Prefix", "StartIndex", "CustomLength", "AutoIncrement"]) {
    if (!(key in form.NoRule)) add(errors, "YAPK_FORM_NORULE_KEY_MISSING", "NoRule is missing a schema-required key.", { path: `${path}.NoRule.${key}` });
  }
  if (typeof form.NoRule.Prefix !== "string" || !form.NoRule.Prefix.includes("{index}")) add(errors, "YAPK_FORM_NORULE_PREFIX_INDEX_MISSING", "NoRule.Prefix must contain {index}.", { path: `${path}.NoRule.Prefix` });
}

function validateAppPackage(decoded, errors, warnings) {
  const errorCountBeforeContent = errors.length;
  const counts = {
    pages: 0,
    forms: 0,
    formReports: 0,
    formNewReports: 0,
    dataReports: 0,
    childs: 0,
    fields: 0,
    layouts: 0,
    agents: 0,
    connections: 0,
    knowledges: 0,
    themes: 0,
    components: 0,
    noRules: 0,
  };
  if (!isObject(decoded)) {
    add(errors, "YAPK_APP_PACKAGE_NOT_OBJECT", "Decoded Resource must be an AppPackageInfo object.");
    return { decodedKeys: [], counts };
  }
  if ("MainListType" in decoded || "Data" in decoded || "Item" in decoded) {
    add(errors, "YAPK_RESOURCE_NOT_APP_PACKAGE_INFO", "Decoded YAPK Resource must be AppPackageInfo, not YAP ListExportResult/ListExportInfo.");
    return { decodedKeys: Object.keys(decoded), counts };
  }
  for (const key of APP_PACKAGE_REQUIRED) if (!(key in decoded)) add(errors, "YAPK_APP_PACKAGE_KEY_MISSING", "Decoded AppPackageInfo is missing a schema-required key.", { key });
  if (isObject(decoded.PortalInfo) && Object.keys(decoded.PortalInfo).length === 0) {
    add(errors, EMPTY_PORTALINFO_IMPORT_ERROR, "Product import feedback requires PortalInfo to be [] when no portal is included; do not emit an empty object.", { path: "PortalInfo" });
  }
  if (decoded.PortalInfo !== undefined && !Array.isArray(decoded.PortalInfo) && !isObject(decoded.PortalInfo)) {
    add(errors, "YAPK_PORTALINFO_INVALID", "PortalInfo must be [] for no portal or a portal object when a portal is included.", { path: "PortalInfo", actualType: decoded.PortalInfo === null ? "null" : typeof decoded.PortalInfo });
  }
  if (isObject(decoded.ListSet) && Number(decoded.ListSet.Flags) !== 1) {
    add(errors, "YAPK_LISTMODEL_FLAGS_MISSING_OR_INVALID", "Generated AppPackageInfo root app/list-set resource requires ListSet.Flags = 1 before signing.", { path: "ListSet.Flags", value: decoded.ListSet.Flags });
  }
  counts.pages = asArray(decoded.Pages).length;
  counts.formReports = asArray(decoded.FormReports).length;
  counts.formNewReports = asArray(decoded.FormNewReports).length;
  counts.dataReports = asArray(decoded.DataReports).length;
  counts.agents = asArray(decoded.Agents).length;
  counts.connections = asArray(decoded.Connections).length;
  counts.knowledges = asArray(decoded.Knowledges).length;
  counts.themes = asArray(decoded.Themes).length;
  counts.components = asArray(decoded.Components).length;
  for (const [index, form] of asArray(decoded.Forms).entries()) validateNoRule(form, `Forms[${index}]`, errors, counts);
  for (const [index, child] of asArray(decoded.Childs).entries()) validateListPackage(child, `Childs[${index}]`, errors, warnings, counts);
  validateGeneratedYapkIds(decoded, errors);
  validateDashboardDataTables(decoded, errors);
  const placeholders = [];
  walk(decoded, (value, pointer) => {
    if (typeof value === "string" && PLACEHOLDER_RE.test(value)) placeholders.push({ path: pointer, placeholder: value });
  });
  for (const placeholder of placeholders.slice(0, 25)) {
    add(errors, "YAPK_UNRESOLVED_PLACEHOLDER", "Generated AppPackageInfo must not contain unresolved required placeholders before signing.", placeholder);
  }
  if (placeholders.length > 25) {
    add(errors, "YAPK_UNRESOLVED_PLACEHOLDER_TRUNCATED", "Additional unresolved required placeholders remain in generated AppPackageInfo.", { additionalCount: placeholders.length - 25 });
  }
  if (errors.length > errorCountBeforeContent) {
    add(errors, "YAPK_CONTENT_VALIDATION_FAILED_BEFORE_SIGNING", "Do not run setsign for generated YAPK content until decoded AppPackageInfo/package validation, graph validation, workflow publish-readiness checks, and placeholder scans pass.");
  }
  return { decodedKeys: Object.keys(decoded), counts };
}

function validateGeneratedYapkIds(decoded, errors) {
  const listIds = new Map();
  const fieldIds = new Map();
  const layoutIds = new Map();
  const resourceIds = new Map();
  const safeId = (value, path, longAsString = false) => {
    if (value === undefined || value === null || value === "") return;
    if (longAsString) {
      if (typeof value !== "string" || !/^\d+$/.test(value)) add(errors, "INVALID_ID_TYPE", "YAPK LongAsString ID must be a numeric string.", { path, actualType: Array.isArray(value) ? "array" : value === null ? "null" : typeof value });
      return;
    }
    if (typeof value === "string" && /^\d{16,}$/.test(value)) return;
    if (!Number.isInteger(value)) add(errors, "INVALID_ID_TYPE", "YAPK integer ID must be a JSON integer or preserved raw large integer token.", { path, actualType: Array.isArray(value) ? "array" : value === null ? "null" : typeof value });
    else if (!Number.isSafeInteger(value)) add(errors, "UNSAFE_INTEGER_ID", "YAPK integer ID was parsed as an unsafe JavaScript number; preserve 64-bit IDs without rounding.", { path, value });
  };
  const duplicate = (seen, value, code, message, detail) => {
    const key = String(value);
    if (!key) return;
    const previous = seen.get(key);
    if (previous) add(errors, code, message, { value: key, previousPath: previous.path, ...detail });
    else seen.set(key, detail);
  };
  safeId(decoded.ListSet?.ListID, "ListSet.ListID");
  duplicate(listIds, decoded.ListSet?.ListID, "DUPLICATE_LIST_ID", "ListID values must be globally unique.", { path: "ListSet.ListID", list: decoded.ListSet?.Title || "root" });
  for (const [index, page] of asArray(decoded.Pages).entries()) {
    safeId(page.ListID, `Pages[${index}].ListID`);
    safeId(page.LayoutID, `Pages[${index}].LayoutID`, true);
    duplicate(layoutIds, page.LayoutID, "DUPLICATE_LAYOUT_ID", "LayoutID values must be globally unique.", { path: `Pages[${index}].LayoutID`, layout: page.Title || null });
    for (const [resourceIndex, resource] of asArray(page.LayoutInResources).entries()) {
      safeId(resource.ID, `Pages[${index}].LayoutInResources[${resourceIndex}].ID`);
      safeId(resource.RefId, `Pages[${index}].LayoutInResources[${resourceIndex}].RefId`);
      duplicate(resourceIds, resource.ID, "DUPLICATE_RESOURCE_ID", "LayoutInResources ID values must be globally unique.", { path: `Pages[${index}].LayoutInResources[${resourceIndex}].ID`, layout: page.Title || null });
    }
  }
  for (const [childIndex, child] of asArray(decoded.Childs).entries()) {
    const title = child.List?.Title || null;
    safeId(child.List?.ListID, `Childs[${childIndex}].List.ListID`);
    duplicate(listIds, child.List?.ListID, "DUPLICATE_LIST_ID", "ListID values must be globally unique.", { path: `Childs[${childIndex}].List.ListID`, list: title });
    for (const [fieldIndex, field] of asArray(child.Fields).entries()) {
      safeId(field.ListID, `Childs[${childIndex}].Fields[${fieldIndex}].ListID`);
      safeId(field.FieldID, `Childs[${childIndex}].Fields[${fieldIndex}].FieldID`);
      duplicate(fieldIds, field.FieldID, "DUPLICATE_FIELD_ID", "FieldID values must be globally unique.", { path: `Childs[${childIndex}].Fields[${fieldIndex}].FieldID`, list: title, field: field.DisplayName || field.FieldName || null });
    }
    for (const [layoutIndex, layout] of asArray(child.Layouts).entries()) {
      safeId(layout.ListID, `Childs[${childIndex}].Layouts[${layoutIndex}].ListID`);
      safeId(layout.LayoutID, `Childs[${childIndex}].Layouts[${layoutIndex}].LayoutID`, true);
      duplicate(layoutIds, layout.LayoutID, "DUPLICATE_LAYOUT_ID", "LayoutID values must be globally unique.", { path: `Childs[${childIndex}].Layouts[${layoutIndex}].LayoutID`, list: title, layout: layout.Title || null });
    }
  }
}

function fieldsByList(decoded) {
  const out = new Map();
  for (const child of asArray(decoded.Childs)) {
    const listId = String(child.List?.ListID || "");
    if (!listId) continue;
    const fields = new Set();
    for (const field of asArray(child.Fields)) {
      for (const candidate of [field.FieldName, field.InternalName, field.DisplayName, field.FieldID].filter(Boolean)) fields.add(String(candidate));
    }
    out.set(listId, fields);
  }
  return out;
}

function walkControls(node, visitor) {
  if (!node || typeof node !== "object") return;
  visitor(node);
  for (const child of asArray(node.children)) walkControls(child, visitor);
}

function validateDashboardDataTables(decoded, errors) {
  const maps = fieldsByList(decoded);
  for (const [pageIndex, page] of asArray(decoded.Pages).entries()) {
    for (const [resourceIndex, resource] of asArray(page.LayoutInResources).entries()) {
      if (typeof resource.Resource !== "string" || !resource.Resource.trim()) continue;
      let parsed;
      try { parsed = JSON.parse(resource.Resource); } catch { continue; }
      walkControls(parsed, (control) => {
        if (control?.type !== "data-list") return;
        const pointer = `Pages[${pageIndex}].LayoutInResources[${resourceIndex}].Resource`;
        const listRef = control.attrs?.data?.list || {};
        for (const key of ["AppID", "ListID", "Type", "Title", "ListSetID"]) {
          if (listRef[key] === undefined || listRef[key] === null || String(listRef[key]) === "") add(errors, "YAPK_DASHBOARD_DATA_TABLE_SOURCE_KEY_MISSING", "Dashboard Data table attrs.data.list must include AppID, ListID, Type, Title, and ListSetID.", { path: `${pointer}.attrs.data.list.${key}`, key });
        }
        const listId = String(listRef.ListID || "");
        const fields = maps.get(listId);
        for (const [columnIndex, column] of asArray(control.attrs?.listarr).entries()) {
          const field = column?.Field === undefined || column?.Field === null ? "" : String(column.Field);
          if (!field) add(errors, "DASHBOARD_DATA_TABLE_DISPLAY_FIELD_BINDING_MISSING", "Dashboard Data table display columns must include Field source bindings; FieldName is only the visible label.", { path: `${pointer}.attrs.listarr[${columnIndex}]`, listId });
          else if (fields && !fields.has(field)) add(errors, "DASHBOARD_DATA_TABLE_DISPLAY_FIELD_UNRESOLVED", "Dashboard Data table Field binding must resolve to the source list.", { path: `${pointer}.attrs.listarr[${columnIndex}].Field`, listId, field });
        }
      });
    }
  }
}

function validate(file, baselineFile = null) {
  const errors = [];
  const warnings = [];
  const wrapper = readWrapper(file);
  if (!isObject(wrapper)) add(errors, "YAPK_WRAPPER_NOT_OBJECT", "Top-level package must be a JSON object.");
  for (const key of WRAPPER_REQUIRED) if (!(key in wrapper)) add(errors, "YAPK_REQUIRED_KEY_MISSING", `Missing required key ${key}.`);
  if (typeof wrapper.TenantID !== "string" || !NUMERIC_STRING_RE.test(wrapper.TenantID || "")) add(errors, "YAPK_TENANT_ID_INVALID", "Generated YAPK TenantID must be a LongAsString numeric string.");
  if (typeof wrapper.ListID !== "string" || !NUMERIC_STRING_RE.test(wrapper.ListID || "")) add(errors, "YAPK_LIST_ID_INVALID", "Generated YAPK top-level ListID must be a LongAsString numeric string.");
  if (String(wrapper.AppID) !== "41") add(errors, "YAPK_APPID_NOT_FIXED_41", "Generated YAPK wrapper AppID must stay fixed at 41.");
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource) add(errors, "YAPK_RESOURCE_INVALID", "Resource must be a non-empty base64 string.");
  if (typeof wrapper.Resource === "string" && !isBase64(wrapper.Resource)) add(errors, "YAPK_RESOURCE_BASE64_INVALID", "Resource must be canonical base64 text.");
  if (String(wrapper.Resource || "").startsWith("[______gizp______]")) add(errors, "YAPK_RESOURCE_USES_YAP_GZIP_PREFIX", ".yapk Resource must not use .yap gzip prefix.");
  if (typeof wrapper.TenantID !== "string" || !NUMERIC_STRING_RE.test(wrapper.TenantID || "")) add(errors, "YAPK_TENANT_ID_INVALID", "TenantID should be a numeric string.");
  if (typeof wrapper.ListID !== "string" || !NUMERIC_STRING_RE.test(wrapper.ListID || "")) add(errors, "YAPK_LIST_ID_INVALID", "ListID should be a numeric string.");
  if (typeof wrapper.Date !== "string" || !UTC_DATE_RE.test(wrapper.Date || "")) add(errors, "YAPK_DATE_FORMAT_INVALID", "Date should be UTC yyyy-MM-ddTHH:mm:ssZ.");
  if (typeof wrapper.Sign !== "string" || Buffer.from(wrapper.Sign || "", "base64").length !== 32) add(warnings, "YAPK_SIGN_UNEXPECTED_SHAPE", "Sign is expected to be a 32-byte base64 value in observed packages.");

  const resource = decodeBrotliResource(wrapper.Resource, errors);
  const appValidation = resource.decoded ? validateAppPackage(resource.decoded, errors, warnings) : { decodedKeys: [], counts: null };

  const metadata = {
    redactedIdentityPresent: {
      PackageId: Boolean(wrapper.PackageId),
      TenantID: Boolean(wrapper.TenantID),
      AppID: Boolean(wrapper.AppID),
      ListID: Boolean(wrapper.ListID),
    },
    titlePresent: Boolean(wrapper.Title),
    versionPresent: Boolean(wrapper.Version),
    datePresent: Boolean(wrapper.Date),
    signByteLength: Buffer.from(wrapper.Sign || "", "base64").length,
    resourceBase64Length: typeof wrapper.Resource === "string" ? wrapper.Resource.length : 0,
    resourceBytes: resource.resourceBytes,
    resourceEntropy: entropy(Buffer.from(wrapper.Resource || "", "base64")),
    brotliSuccess: Boolean(resource.decoded),
    decodedTextBytes: resource.decodedTextBytes,
    decodedKeys: appValidation.decodedKeys,
    decodedCounts: appValidation.counts,
    decodeAttempts: resource.attempts,
  };

  add(warnings, "YAPK_CONTENT_GENERATION_RUNTIME_PROOF_REQUIRED", "Even if Resource decodes and validates, content generation requires edit -> Brotli encode -> sign -> verify -> runtime upgrade proof.");

  let baselineComparison = null;
  if (baselineFile) {
    const baseline = readWrapper(baselineFile);
    const baselineBytes = isBase64(baseline.Resource) ? Buffer.from(baseline.Resource, "base64") : Buffer.alloc(0);
    const resourceBytes = isBase64(wrapper.Resource) ? Buffer.from(wrapper.Resource, "base64") : Buffer.alloc(0);
    const wrapperKeys = Array.from(new Set([...Object.keys(baseline), ...Object.keys(wrapper)])).sort();
    const metadataChangedFields = changedKeys(baseline, wrapper, ["Title", "Description", "IconUrl", "Notes", "Author", "Date", "Version"]);
    const resourceChanged = JSON.stringify(wrapper.Resource) !== JSON.stringify(baseline.Resource);
    baselineComparison = {
      wrapperChangedFields: changedKeys(baseline, wrapper, wrapperKeys),
      metadataChangedFields,
      resourceChanged,
      signChanged: JSON.stringify(wrapper.Sign) !== JSON.stringify(baseline.Sign),
      resourceStats: compareBuffers(baselineBytes, resourceBytes),
    };
    if (!resourceChanged && metadataChangedFields.length) add(warnings, "YAPK_METADATA_ONLY_NO_CONTENT_CHANGE", "Metadata changed while Resource is unchanged. This is a metadata-only package; app content is unchanged.");
    if (resourceChanged) add(warnings, "YAPK_RESOURCE_CHANGED_REQUIRES_RUNTIME_PROOF", "Resource differs from baseline. Treat as Yeeflow-generated or experimental until edit/encode/sign/runtime proof succeeds.");
  }

  return {
    status: errors.length ? "fail" : "pass",
    file,
    baselineFile,
    metadata,
    baselineComparison,
    errors,
    warnings,
  };
}

const args = process.argv.slice(2);
if (!args.length || args.includes("--help") || args.includes("-h")) usage();
let file = null;
let baseline = null;
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--baseline") baseline = args[++i];
  else if (!file) file = args[i];
  else usage();
}
if (!file) usage();

try {
  const report = validate(file, baseline);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
} catch (error) {
  console.log(JSON.stringify({ status: "fail", errors: [{ code: "YAPK_VALIDATION_EXCEPTION", message: error.message }] }, null, 2));
  process.exit(1);
}
