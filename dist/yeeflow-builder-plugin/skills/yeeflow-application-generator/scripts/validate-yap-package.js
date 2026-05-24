#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { validateWorkflowActionShapes } = require("./workflow-action-config-validator");
const {
  isGeneratedValueControl,
  loadControlFieldSchemas,
  validateControlAgainstSchema,
  validateFieldAgainstSchema,
} = require("./yeeflow-control-field-schema-utils");
const { validateExpressionTokens } = require("./yeeflow-expression-utils");

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const SYSTEM_INT64_MAX = 9223372036854775807n;
const PLACEHOLDER_RE = /^__.*REQUIRED.*__$/;
const SECRET_KEY_RE = /(token|secret|password|credential|clientsecret|apikey|api_key|accesskey|authorization|bearer)/i;
const HEX_COLOR_RE = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const ROOT_STYLE_TOKEN_HEX = new Map([
  ["#0065ff", "--c--primary"],
  ["#e6f0ff", "--c--primary-light"],
  ["#00d1ff", "--c--secondary"],
  ["#15df42", "--c--success"],
  ["#f9c434", "--c--warning"],
  ["#f61515", "--c--danger"],
  ["#b3b7c0", "--c--neutral"],
  ["#ffffff", "--c--background"],
  ["#071638", "--c--text"],
  ["#e7e9eb", "--c--neutral-light-active"],
  ["#f7f8f9", "--c--neutral-light"],
  ["#f4f4f6", "--c--neutral-light-hover"],
]);

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node validate-yap-package.js <app.yap|decoded-data.json> --mode <compatibility|generator> [--stage <draft|final>]",
    "",
    "Examples:",
    "  node validate-yap-package.js \"./NHIC Innovation Ecosystem Platform.yap\" --mode compatibility",
    "  node validate-yap-package.js ./generated-app.decoded.json --mode generator --stage draft",
    "  node validate-yap-package.js ./generated-app.decoded.json --mode generator --stage final",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, mode: "generator", stage: "final" };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--mode") args.mode = argv[++i];
    else if (arg === "--stage") args.stage = argv[++i];
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input || !["compatibility", "generator"].includes(args.mode) || !["draft", "final"].includes(args.stage)) usage();
  return args;
}

function quoteLargeIntegers(jsonText, largeNumbers) {
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
        if (LARGE_INTEGER_RE.test(token)) {
          largeNumbers.add(token);
          out += `"${token}"`;
        } else {
          out += token;
        }
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJsonPreservingLargeInts(text, largeNumbers) {
  return JSON.parse(quoteLargeIntegers(text, largeNumbers));
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function displayLabelDisabled(value) {
  if (value === false) return true;
  return Array.isArray(value) && value[1] === false;
}

function zeroPadding(padding) {
  const value = Array.isArray(padding) ? padding[1] : padding;
  if (!isObject(value)) return false;
  return ["top", "right", "bottom", "left"].every((side) => value[side] === "--sp--s0" || value[side] === 0 || value[side] === "0" || value[side] === "");
}

function findControlByLabel(root, label) {
  let found = null;
  walkControls(root, (control) => {
    if (!found && control && control.nv_label === label) found = control;
  });
  return found;
}

function controlContains(parent, child) {
  if (!parent || !child) return false;
  let found = false;
  walkControls(parent, (control) => {
    if (control === child) found = true;
  });
  return found;
}

function uiStandardWarning(report, code, message, details) {
  issue(report, "warning", code, message, details);
}

function issue(report, level, code, message, details = {}) {
  const entry = { code, message, ...redactDetails(details) };
  if (level === "error") report.errors.push(entry);
  else if (level === "dependency") report.dependencies.push(entry);
  else report.warnings.push(entry);
}

function generatorFinalSeverity(report, fallback = "warning") {
  return report.mode === "generator" && report.stage === "final" ? "error" : fallback;
}

function redactDetails(value) {
  if (Array.isArray(value)) return value.map(redactDetails);
  if (!isObject(value)) return value;
  const out = {};
  for (const [key, child] of Object.entries(value)) {
    out[key] = SECRET_KEY_RE.test(key) ? "__REDACTED__" : redactDetails(child);
  }
  return out;
}

function walk(value, visitor, pointer = "$") {
  visitor(value, pointer);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visitor, `${pointer}[${index}]`));
  else if (isObject(value)) Object.entries(value).forEach(([key, child]) => walk(child, visitor, `${pointer}.${key}`));
}

function walkControls(control, visitor, pointer = "$") {
  if (!isObject(control)) return;
  visitor(control, pointer);
  for (const key of ["children", "columns"]) {
    if (Array.isArray(control[key])) control[key].forEach((child, index) => walkControls(child, visitor, `${pointer}.${key}[${index}]`));
  }
}

function tryParseJson(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function decodeHtmlEntities(value) {
  return String(value)
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function decodeInput(inputPath, report) {
  const raw = fs.readFileSync(inputPath, "utf8");
  let parsed;
  try {
    parsed = parseJsonPreservingLargeInts(raw, report._largeNumbers);
  } catch (error) {
    issue(report, "error", "INPUT_JSON_INVALID", "Input is not valid JSON.", { error: error.message });
    return null;
  }

  if (parsed && typeof parsed.Resource === "string") {
    const wrapper = parsed;
    report.wrapper = {
      inputType: "wrapped-yap",
      wrapperJsonValid: true,
      resourcePrefixValid: wrapper.Resource.startsWith(GZIP_PREFIX),
    };
    if (!wrapper.Resource.startsWith(GZIP_PREFIX)) {
      issue(report, "error", "RESOURCE_PREFIX_MISSING", `Wrapped .yap Resource must start with ${GZIP_PREFIX}.`);
      return null;
    }
    let resourceText;
    try {
      const compressed = Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64");
      resourceText = zlib.gunzipSync(compressed).toString("utf8");
    } catch (error) {
      issue(report, "error", "RESOURCE_DECODE_FAILED", "Resource base64/gzip decode failed.", { error: error.message });
      return null;
    }
    let resource;
    try {
      resource = parseJsonPreservingLargeInts(resourceText, report._largeNumbers);
    } catch (error) {
      issue(report, "error", "RESOURCE_JSON_INVALID", "Decoded Resource JSON is invalid.", { error: error.message });
      return null;
    }
    if (typeof resource.Data !== "string") {
      issue(report, "error", "RESOURCE_DATA_MISSING", "Decoded Resource.Data must be a JSON string.");
      return null;
    }
    let data;
    try {
      data = parseJsonPreservingLargeInts(resource.Data, report._largeNumbers);
    } catch (error) {
      issue(report, "error", "RESOURCE_DATA_JSON_INVALID", "Resource.Data JSON is invalid.", { error: error.message });
      return null;
    }
    return { wrapper, resource, data };
  }

  if (parsed && typeof parsed.Data === "string" && (parsed.MainListType !== undefined || parsed.AppID !== undefined || parsed.ReplaceIds !== undefined)) {
    let data;
    try {
      data = parseJsonPreservingLargeInts(parsed.Data, report._largeNumbers);
    } catch (error) {
      issue(report, "error", "RESOURCE_DATA_JSON_INVALID", "Decoded Resource.Data JSON is invalid.", { error: error.message });
      return null;
    }
    report.wrapper = { inputType: "decoded-resource-json", wrapperJsonValid: true, resourcePrefixValid: null };
    return { wrapper: null, resource: parsed, data };
  }

  report.wrapper = { inputType: "decoded-data-json", wrapperJsonValid: true, resourcePrefixValid: null };
  return { wrapper: null, resource: null, data: parsed };
}

function normalizeType(field) {
  const rules = tryParseJson(field && field.Rules) || {};
  const fieldType = safeString(field && field.FieldType).toLowerCase();
  const controlType = safeString(field && field.Type).toLowerCase();
  const combined = `${fieldType} ${controlType}`;
  if (controlType === "lookup" || rules.listid || rules.listsetid || rules.listfield) return "lookup";
  if (controlType === "textarea" || controlType === "richtext") return "longText";
  if (controlType === "checkbox") return "multiChoice";
  if (controlType === "radio" || controlType === "dropdown" || controlType === "select") return "choice";
  if (controlType === "datepicker") return "date";
  if (controlType === "switch" || fieldType === "bit") return "boolean";
  if (controlType === "flowstatus") return "flowstatus";
  if (controlType === "hyperlink") return "hyperlink";
  if (controlType === "list") return "list";
  if (combined.includes("file")) return "file";
  if (combined.includes("identity") || combined.includes("user") || combined.includes("person")) return "user";
  if (combined.includes("currency")) return "currency";
  if (combined.includes("percent")) return "percent";
  if (combined.includes("decimal") || combined.includes("number") || combined.includes("bigint") || combined.includes("int")) return "number";
  if (combined.includes("calculated")) return "calculated";
  if (combined.includes("date") || combined.includes("time")) return "date";
  if (combined.includes("text") || controlType === "input") return "text";
  return "unknown";
}

function classifyListResource(item, isRoot = false) {
  const list = item && item.ListModel ? item.ListModel : {};
  const type = Number(list.Type);
  if (isRoot || type === 1024) return "app/listset";
  if (type === 16) return "document library";
  if (type === 32) return "form report/list resource";
  if (type === 64) return "report/data resource";
  if (type === 1) return "data list";
  return "unknown";
}

function isDocumentLibraryOnlyPackage(data) {
  const children = asArray(data && data.Childs);
  return children.length > 0 && children.every((child) => classifyListResource(child) === "document library");
}

function validateDocumentLibraryFields(item, fieldsByName, pathPrefix, report) {
  const list = item.ListModel || {};
  const title = safeString(list.Title);
  const listId = safeString(list.ListID);
  const required = [
    {
      fieldName: "Title",
      displayName: "Name",
      fieldType: "Text",
      controlType: "input",
      rules: ["isLibrary"],
      message: "Document library native Name field should preserve FieldName Title with Text/input metadata and Rules.isLibrary.",
    },
    {
      fieldName: "Text1",
      displayName: "Type",
      fieldType: "Text",
      controlType: "input",
      message: "Document library Type field should use Text1 with Text/input metadata.",
    },
    {
      fieldName: "Bigint2",
      displayName: "Size/FileSize",
      fieldType: "Bigint",
      controlType: "input_number",
      rules: ["readonly"],
      message: "Document library Size/FileSize field should use Bigint2 with Bigint/input_number readonly metadata.",
    },
    {
      fieldName: "Text4",
      displayName: "Upload File",
      fieldType: "Text",
      controlType: "file-upload",
      rules: ["required", "isLabrary"],
      message: "Document library Upload File field should use Text4 with file-upload control metadata and library upload rules.",
    },
  ];

  for (const spec of required) {
    const field = fieldsByName.get(spec.fieldName);
    if (!field) {
      issue(report, "warning", "DOCUMENT_LIBRARY_DEFAULT_FIELD_MISSING", spec.message, { list: title, listId, fieldName: spec.fieldName });
      continue;
    }
    const rules = parsedFieldRules(field);
    const mismatches = [];
    if (safeString(field.FieldType) !== spec.fieldType) mismatches.push(`FieldType expected ${spec.fieldType}`);
    if (safeString(field.Type) !== spec.controlType) mismatches.push(`Type expected ${spec.controlType}`);
    if (field.ListID !== undefined && listId && safeString(field.ListID) !== listId) mismatches.push("ListID does not match parent document library");
    for (const ruleName of spec.rules || []) {
      if (rules[ruleName] !== true) mismatches.push(`Rules.${ruleName} expected true`);
    }
    if (spec.fieldName === "Title") {
      if (field.IsSystem !== true) mismatches.push("IsSystem expected true");
      if (field.IsIndex !== true) mismatches.push("IsIndex expected true");
    }
    if (mismatches.length) {
      issue(report, "warning", "DOCUMENT_LIBRARY_DEFAULT_FIELD_SIGNATURE_UNUSUAL", spec.message, {
        list: title,
        listId,
        fieldName: spec.fieldName,
        displayName: field.DisplayName || null,
        mismatches,
      });
    }
  }

  const parentField = fieldsByName.get("Bigint1");
  if (!parentField) {
    issue(report, "warning", "DOCUMENT_LIBRARY_PARENT_FIELD_MISSING", "Document library exports include Bigint1/ParentID for folder hierarchy support; keep it unless a focused export proves it is optional.", { list: title, listId });
  } else {
    const rules = parsedFieldRules(parentField);
    if (safeString(parentField.FieldType) !== "Bigint" || safeString(parentField.Type) !== "input_number" || rules.isNotInListFiles !== true) {
      issue(report, "warning", "DOCUMENT_LIBRARY_PARENT_FIELD_SIGNATURE_UNUSUAL", "Document library ParentID field should use Bigint1 with Bigint/input_number metadata and Rules.isNotInListFiles.", {
        list: title,
        listId,
        fieldName: parentField.FieldName,
        displayName: parentField.DisplayName || null,
      });
    }
  }

  if (safeString(list.CustomType) && !safeString(list.CustomType).startsWith("ListSite_")) {
    issue(report, "warning", "DOCUMENT_LIBRARY_CUSTOMTYPE_UNUSUAL", "Document library CustomType should usually link back to the app/listset as ListSite_<root ListID>.", { list: title, listId, customType: list.CustomType });
  }
  if (list.IsItemPerm !== true) {
    issue(report, "warning", "DOCUMENT_LIBRARY_ITEM_PERMISSION_UNUSUAL", "Studied document libraries keep ListModel.IsItemPerm true; confirm generated permission behavior if this differs.", { list: title, listId, isItemPerm: list.IsItemPerm });
  }
}

function listIdOf(item) {
  return safeString(item && item.ListModel && item.ListModel.ListID);
}

function parsedFieldRules(field) {
  if (!field) return {};
  if (isObject(field.Rules)) return field.Rules;
  return tryParseJson(field.Rules) || {};
}

function lookupSampleValues(value, multiple) {
  if (value === null || value === undefined || value === "") return [];
  if (Array.isArray(value)) return value.map(safeString).filter(Boolean);
  if (multiple && typeof value === "string") {
    const parsed = tryParseJson(value);
    if (Array.isArray(parsed)) return parsed.map(safeString).filter(Boolean);
  }
  return [safeString(value)].filter(Boolean);
}

function listSetIdOf(item, rootListSetId) {
  const list = item && item.ListModel ? item.ListModel : {};
  const candidates = [list.ListSetID, list.ListSetId, list.ListSiteID, list.CustomType, rootListSetId];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const match = safeString(candidate).match(/\d{12,}/);
    if (match) return match[0];
  }
  return "";
}

function parseDefResource(form, report, index) {
  const raw = form && form.DefResource;
  if (!raw) return null;
  const candidates = [];
  if (typeof raw === "string") {
    candidates.push(raw);
    try {
      candidates.push(Buffer.from(raw, "base64").toString("utf8"));
    } catch {
      // ignore
    }
  }
  for (const candidate of candidates) {
    if (!candidate || !candidate.trim().startsWith("{")) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      // try next
    }
  }
  issue(report, "warning", "FORM_DEFRESOURCE_PARSE_FAILED", "Form DefResource could not be parsed.", { form: form && form.Name, key: form && form.Key, index });
  return null;
}

function shapeType(shape) {
  return shape && shape.stencil && (shape.stencil.id || shape.stencil) || shape && shape.type || "unknown";
}

function shapeId(shape) {
  return shape && (shape.resourceid || shape.resourceId || shape.id);
}

function refId(ref) {
  if (!ref) return "";
  if (typeof ref === "string") return ref;
  return ref.resourceid || ref.resourceId || ref.id || "";
}

function collectShapes(def) {
  const out = [];
  function visit(nodes) {
    for (const node of asArray(nodes)) {
      out.push(node);
      if (node.childshapes) visit(node.childshapes);
    }
  }
  visit(def && def.childshapes);
  return out;
}

function validate(inputPath, mode, stage) {
  const report = {
    status: "pass",
    mode,
    stage,
    errors: [],
    warnings: [],
    dependencies: [],
    summary: {
      childResources: 0,
      dataLists: 0,
      forms: 0,
      approvalForms: 0,
      scheduledWorkflows: 0,
      listWorkflows: 0,
      reports: 0,
      dashboards: 0,
      agents: 0,
      copilots: 0,
      connections: 0,
      knowledges: 0,
      appUserGroups: 0,
      replaceIds: 0,
      lookupRelationships: 0,
      contentListReferences: 0,
      workflowActionConfig: {
        checkedNodes: 0,
        supportedNodes: 0,
        unsupportedNodes: 0,
        partialNodes: 0,
        unsafeNodes: 0,
      },
    },
    inventories: {
      resources: [],
      forms: [],
      modules: [],
    },
    _largeNumbers: new Set(),
    _controlFieldSchemas: loadControlFieldSchemas(__dirname),
  };

  const decoded = decodeInput(inputPath, report);
  if (!decoded) return finish(report);
  const { wrapper, resource, data } = decoded;

  validateBasicStructure(data, resource, report);
  const rootItem = data && data.Item;
  const rootList = rootItem && rootItem.ListModel ? rootItem.ListModel : {};
  const rootListSetId = safeString((resource && (resource.ListSetID || resource.ListSetId)) || rootList.ListID);
  const replaceIds = new Set(asArray(resource && resource.ReplaceIds).map(String));
  report.summary.replaceIds = replaceIds.size;

  const resourceItems = [rootItem, ...asArray(data && data.Childs)].filter(Boolean);
  const listsById = new Map();
  const fieldsByList = new Map();
  const localIds = new Set();
  const fieldIdsByApp = new Map();

  resourceItems.forEach((item, index) => {
    validateResourceItem(item, index, index === 0, rootListSetId, replaceIds, localIds, listsById, fieldsByList, fieldIdsByApp, report);
  });

  validateRootAppShell(data, wrapper, replaceIds, listsById, fieldsByList, report, resource);
  validateApplicationUserGroups(data, replaceIds, report);
  validateReplaceIds(replaceIds, localIds, report);
  validateCustomFormDocLibraryControls(data, listsById, fieldsByList, report);
  const aiResourcesById = buildAiResourcesById(data);
  validateForms(data, listsById, fieldsByList, replaceIds, localIds, report, aiResourcesById);
  validateGeneratedListRuntimeUsage(data, report);
  validateReportsDashboardsModules(data, listsById, fieldsByList, replaceIds, localIds, report);
  validateAgentCopilotModules(data, listsById, report);
  validateLookupRelationships(listsById, fieldsByList, report);
  validateSensitiveResources(data, report);
  validateDesignSystemColorUsage({ resource, data }, report);
  validatePlaceholders({ wrapper, resource, data }, report);
  validateSystemInt64Range({ wrapper, resource, data }, report);

  if (report._largeNumbers.size) {
    issue(report, "warning", "LARGE_NUMERIC_IDS", "Large numeric IDs were preserved as strings.", { count: report._largeNumbers.size });
  }

  return finish(report);
}

function validateSystemInt64Range(root, report) {
  const hits = [];
  walk(root, (value, pointer) => {
    if (typeof value !== "string" || !/^\d{16,}$/.test(value)) return;
    if (BigInt(value) <= SYSTEM_INT64_MAX) return;
    hits.push({ pointer, value });
  });
  const severity = generatorFinalSeverity(report);
  for (const hit of hits.slice(0, 20)) {
    issue(report, severity, "SYSTEM_INT64_ID_OVERFLOW", "Generated numeric ID exceeds System.Int64 range and can fail Yeeflow import/materialization.", hit);
  }
  if (hits.length > 20) {
    issue(report, severity, "SYSTEM_INT64_ID_OVERFLOW_TRUNCATED", "Additional generated numeric IDs exceed System.Int64 range.", { additionalCount: hits.length - 20 });
  }
}

function validateRootAppShell(data, wrapper, replaceIds, listsById, fieldsByList, report, outerResource) {
  const root = data && data.Item && data.Item.ListModel ? data.Item.ListModel : {};
  if (!root) return;
  if (wrapper && (!safeString(wrapper.Title) || wrapper.Description === undefined)) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "WRAPPER_TITLE_DESCRIPTION_INCOMPLETE", "Generated .yap wrapper should include import dialog Title and Description fields.", { titlePresent: Boolean(safeString(wrapper.Title)), descriptionPresent: wrapper.Description !== undefined });
  }
  if (wrapper && !safeString(wrapper.IconUrl)) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "WRAPPER_ICONURL_MISSING", "Generated .yap wrapper should include a non-empty IconUrl; real app exports do not use null here.");
  }
  if (safeString(root.CustomType)) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_CUSTOMTYPE_NOT_EMPTY", "Root app/ListSet CustomType should be empty; child lists use ListSite_<ListSetID>.", { customType: root.CustomType });
  }
  if (root.Perm !== undefined && Number(root.Perm) !== 0) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_PERM_NOT_APP_LEVEL", "Root app/ListSet Perm should match real app exports, usually 0.", { perm: root.Perm });
  }
  if (!safeString(root.WorkspaceID)) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_WORKSPACE_ID_MISSING", "Root app/ListSet WorkspaceID is missing; real app exports include workspace metadata.");
  }
  if (!safeString(root.CreatedBy) || !safeString(root.ModifiedBy)) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_AUDIT_USERS_MISSING", "Root app/ListSet CreatedBy and ModifiedBy should be populated; real imports/exports preserve creator metadata used by app access/open flows.", { createdByPresent: Boolean(safeString(root.CreatedBy)), modifiedByPresent: Boolean(safeString(root.ModifiedBy)) });
  }
  for (const key of ["TenantID", "CreatedBy", "ModifiedBy"]) {
    const value = safeString(root[key]);
    if (value && replaceIds.has(value)) {
      issue(report, generatorFinalSeverity(report), "ROOT_METADATA_IN_REPLACEIDS", "Generated .yap packages must preserve TenantID, CreatedBy, and ModifiedBy as real baseline metadata; do not include them in Resource.ReplaceIds or generated fake-ID remapping.", { field: key, value });
    }
  }
  for (const key of ["AppTags", "AppMetadatas", "AppComponents"]) {
    if (!Array.isArray(data[key])) {
      issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", `${key.toUpperCase()}_NOT_ARRAY`, `Data.${key} should be an array for app-level packages; real app exports use an array even when empty.`);
    }
  }
  if (!Array.isArray(data.AppThemes)) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "APPTHEMES_NOT_ARRAY", "Data.AppThemes should be an array for app-level packages; real app exports use an array even when empty.");
  } else if (!data.AppThemes.length) {
    issue(report, "warning", "APP_THEME_EMPTY", "AppThemes is empty. The minimal dashboard-only export uses an empty theme array, but richer generated apps should usually include application style metadata.");
  } else {
    validateAppThemeStandards(data.AppThemes, report);
  }
  const rootLayouts = asArray(data.Item && data.Item.Layouts);
  const rootPageLayouts = new Set(rootLayouts.filter((layout) => safeString(layout.Type) === "103").map((layout) => safeString(layout.LayoutID)).filter(Boolean));
  const documentLibraryOnlyPackage = isDocumentLibraryOnlyPackage(data);
  if (!rootPageLayouts.size) {
    issue(
      report,
      documentLibraryOnlyPackage ? "warning" : report.mode === "generator" && report.stage === "final" ? "error" : "warning",
      "ROOT_APP_PAGE_LAYOUT_MISSING",
      "Root app/ListSet has no Type 103 app page layout. Document-library-only exports can omit root pages; richer generated apps usually need an openable app shell.",
    );
  }
  for (const layout of rootLayouts.filter((candidate) => safeString(candidate.Type) === "103")) {
    const layoutId = safeString(layout.LayoutID);
    if (layout.LayoutView !== null && layout.LayoutView !== undefined) {
      issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_APP_PAGE_LAYOUTVIEW_NOT_NULL", "Root Type 103 app page LayoutView should be null; working exports store page content in LayoutInResources.Resource.", { title: layout.Title, layoutId });
    }
    if (!Array.isArray(layout.LayoutInResources)) {
      issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_APP_PAGE_LAYOUTINRESOURCES_NOT_ARRAY", "Root Type 103 app page LayoutInResources must be an array. Minimal dashboard-only exports use an empty array.", { title: layout.Title, layoutId });
      continue;
    }
    const resources = layout.LayoutInResources;
    if (!resources.length) {
      const ext2 = tryParseJson(layout.Ext2);
      const isMinimalDashboardShell = ext2 && ext2.src === true && replaceIds.has(layoutId);
      if (!isMinimalDashboardShell) {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_APP_PAGE_RESOURCE_MISSING", "Root Type 103 app page layout without embedded page content must match the minimal dashboard-only export pattern: LayoutInResources empty, Ext2 {\"src\":true}, and LayoutID in ReplaceIds.", { title: layout.Title, layoutId });
      }
      continue;
    }
    for (const resource of resources) {
      const resourceId = safeString(resource.ID);
      const refId = safeString(resource.RefId);
      if (!resourceId || !refId || !safeString(resource.Resource)) {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_APP_PAGE_RESOURCE_INCOMPLETE", "Root Type 103 app page LayoutInResources entry must include ID, RefId, and Resource.", { title: layout.Title, layoutId });
      }
      const usesInlinePageResourceId = resourceId === layoutId && refId === layoutId;
      if ((resourceId === layoutId || refId === layoutId) && !usesInlinePageResourceId) {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_APP_PAGE_RESOURCE_ID_PARTIAL_LAYOUTID_MATCH", "Root Type 103 app page LayoutInResources ID and RefId should either both match LayoutID for inline dashboard page resources, or both use a separate resource ID.", { title: layout.Title, layoutId, resourceId, refId });
      }
      if (resourceId && refId && resourceId !== refId) {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_APP_PAGE_RESOURCE_ID_REFID_MISMATCH", "Root Type 103 app page LayoutInResources ID and RefId should match each other.", { title: layout.Title, layoutId, resourceId, refId });
      }
      if (!usesInlinePageResourceId && (replaceIds.has(resourceId) || replaceIds.has(refId))) {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_APP_PAGE_RESOURCE_ID_IN_REPLACEIDS", "Root Type 103 app page LayoutInResources ID/RefId should not be in ReplaceIds; only the LayoutID is remapped.", { title: layout.Title, layoutId, resourceId, refId });
      }
      const page = tryParseJson(resource.Resource);
      if (!page) {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_APP_PAGE_RESOURCE_JSON_INVALID", "Root Type 103 app page Resource must be valid page JSON.", { title: layout.Title, layoutId, resourceId });
      } else {
        for (const key of ["children", "attrs", "title", "ver", "filterVars", "tempVars"]) {
          if (page[key] === undefined) issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_APP_PAGE_RESOURCE_REQUIRED_KEY_MISSING", `Root Type 103 app page Resource missing ${key}.`, { title: layout.Title, layoutId, resourceId, key });
        }
        if (!Array.isArray(page.children) || !page.children.length) {
          issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_APP_PAGE_RESOURCE_EMPTY_CHILDREN", "Root Type 103 app page Resource should contain at least one child component.", { title: layout.Title, layoutId, resourceId });
        }
        validateDashboardPageResource(page, layout, resource, listsById, fieldsByList, rootPageLayouts, report, outerResource);
      }
    }
  }
  const layoutView = tryParseJson(root.LayoutView);
  if (!layoutView) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_LAYOUTVIEW_INVALID", "Root app/ListSet LayoutView must be parseable JSON navigation metadata.");
    return;
  }
  validateRootNavigationStyle(layoutView, report);
  validateRootNavigationMenuStructure(layoutView.sort || [], report);
  const navItems = flattenNavigationItems(layoutView.sort || []);
  if (!navItems.length) {
    issue(
      report,
      documentLibraryOnlyPackage ? "warning" : report.mode === "generator" && report.stage === "final" ? "error" : "warning",
      "ROOT_NAVIGATION_EMPTY",
      "Root app/ListSet LayoutView.sort is empty. The minimal Document Library Sample export uses only {sortVer:1}; richer generated apps usually need navigation entries.",
    );
    return;
  }
  const formKeys = new Set(asArray(data.Forms).map((form) => safeString(form.Key || form.FlowKey || form.key)).filter(Boolean));
  for (const item of navItems) {
    const type = safeString(item.Type);
    const listId = safeString(item.ListID);
    if (type === "process" || listId.startsWith("/p/")) continue;
    if (type === "103") {
      if (!rootPageLayouts.has(listId)) {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_NAV_PAGE_REFERENCE_UNRESOLVED", "Root navigation item references a missing Type 103 app page layout.", { title: item.Title, type: item.Type, listId });
      }
    } else if (type === "1" || type === "16" || type === "32" || type === "64") {
      if (!listsById.has(listId)) {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_NAV_LIST_REFERENCE_UNRESOLVED", "Root navigation item references a missing list/page resource.", { title: item.Title, type: item.Type, listId });
      }
    } else if (type === "105") {
      if (!formKeys.has(listId)) {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_NAV_FORM_REFERENCE_UNRESOLVED", "Root navigation item references a missing approval/form key.", { title: item.Title, formKey: listId });
      }
    }
  }
}

function validateAppThemeStandards(appThemes, report) {
  for (const theme of appThemes) {
    const config = tryParseJson(theme && theme.Config);
    if (!config || !config.neutral) continue;
    const neutralLightModel = safeString(config.neutral.lightmodel || config.neutral.lightModel);
    if (neutralLightModel && neutralLightModel !== "Luminance") {
      uiStandardWarning(report, "UI_STANDARD_NEUTRAL_LIGHTMODEL_NOT_LUMINANCE", "Generated app themes should use Neutral lightmodel \"Luminance\" so neutral variants follow the Yeeflow root style standard.", {
        theme: theme.Name || theme.ID || null,
        neutralLightModel
      });
    }
  }
}

function validateRootNavigationStyle(layoutView, report) {
  const attrs = layoutView && layoutView.attrs;
  if (!isObject(attrs)) return;
  const appearance = attrs.appearance;
  const navigatorMenu = attrs["navigator-menu"];
  if (isObject(appearance)) validateApplicationHeaderSettings(appearance, report);
  if (isObject(navigatorMenu)) validateNavigationMenuSettings(navigatorMenu, report);
  if (!isObject(appearance) || !isObject(navigatorMenu)) return;
  const headerBackground = safeString(appearance.bgc);
  const headerText = safeString(appearance.color);
  const navBackground = safeString(navigatorMenu.bgc);
  const navText = safeString(navigatorMenu.color);
  if (!headerBackground || !headerText || !navBackground) return;
  if (!navText) {
    uiStandardWarning(report, "UI_STANDARD_NAV_TEXT_COLOR_MISSING", "Generated app navigation should set navigator-menu.color explicitly. Use the header background color as nav text/icon color.", {
      expectedColor: headerBackground,
      navBackground
    });
    return;
  }
  if (navBackground !== headerText || navText !== headerBackground) {
    uiStandardWarning(report, "UI_STANDARD_NAV_COLOR_NOT_INVERTED", "Generated app navigation should invert header colors: navigator-menu.bgc should equal appearance.color and navigator-menu.color should equal appearance.bgc.", {
      headerBackground,
      headerText,
      navBackground,
      navText
    });
  }
}

function validateApplicationHeaderSettings(appearance, report) {
  if (appearance.height !== undefined) {
    const height = Number(appearance.height);
    if (!Number.isFinite(height) || height <= 0) {
      issue(report, generatorFinalSeverity(report), "APP_HEADER_HEIGHT_INVALID", "Application header appearance.height should be a positive number when present.", { height: appearance.height });
    } else if (![46, 56].includes(height)) {
      issue(report, "warning", "APP_HEADER_HEIGHT_UNPROVEN", "Application header appearance.height uses a value not yet export-proven by the application settings study. The studied default is omitted/56px and v6 proves 46px.", { height });
    }
  }
  if (appearance.hideTitle !== undefined && typeof appearance.hideTitle !== "boolean") {
    issue(report, generatorFinalSeverity(report), "APP_HEADER_HIDETITLE_NOT_BOOLEAN", "Application header appearance.hideTitle should be boolean when present.", { hideTitle: appearance.hideTitle });
  }
}

function validateNavigationMenuSettings(navigatorMenu, report) {
  const position = navigatorMenu.position;
  if (position === undefined || position === null || position === "") return;
  const allowed = new Set(["default", "left", "onheader", "none"]);
  if (!allowed.has(safeString(position))) {
    issue(report, generatorFinalSeverity(report), "APP_NAVIGATION_POSITION_INVALID", "Application navigation menu attrs[\"navigator-menu\"].position should be one of the export-proven layout values: default, left, onheader, none.", { position });
  }
}

function validateRootNavigationMenuStructure(items, report, depth = 1, path = "$.Item.ListModel.LayoutView.sort") {
  const allowedResourceTypes = new Set(["1", "16", "32", "64", "103", "105"]);
  const observedNonResourceTypes = new Set(["process", "link"]);
  asArray(items).forEach((item, index) => {
    if (!isObject(item)) {
      issue(report, generatorFinalSeverity(report), "APP_NAVIGATION_ITEM_NOT_OBJECT", "Application navigation menu entries should be objects.", { path: `${path}[${index}]` });
      return;
    }
    const itemPath = `${path}[${index}]`;
    const type = safeString(item.Type);
    const hasChildren = Array.isArray(item.list);
    if (depth > 2) {
      issue(report, generatorFinalSeverity(report), "APP_NAVIGATION_DEPTH_EXCEEDED", "Application navigation menu supports only two levels: top-level item and child resource inside a group.", { path: itemPath, title: item.Title || item.DisplayName || null });
    }
    if (type === "classes") {
      if (depth !== 1) {
        issue(report, generatorFinalSeverity(report), "APP_NAVIGATION_NESTED_GROUP", "Navigation groups cannot be nested inside other groups.", { path: itemPath, title: item.Title || null });
      }
      if (!safeString(item.Title) && !safeString(item.DisplayName)) {
        issue(report, generatorFinalSeverity(report), "APP_NAVIGATION_GROUP_TEXT_MISSING", "Navigation group items should always have display text. Exports store it in Title.", { path: itemPath, id: item.ID || null });
      }
      if (!hasChildren) {
        issue(report, "warning", "APP_NAVIGATION_GROUP_CHILDREN_MISSING", "Navigation group item has no list[] children. Empty groups are runtime-sensitive and not proven useful.", { path: itemPath, title: item.Title || null });
      }
      if (item.ListID !== undefined) {
        issue(report, "warning", "APP_NAVIGATION_GROUP_LISTID_PRESENT", "Export-proven navigation groups use ID, Type classes, Title, Icon, and list[]; ListID on a group is not proven.", { path: itemPath, title: item.Title || null });
      }
      validateRootNavigationMenuStructure(item.list || [], report, depth + 1, `${itemPath}.list`);
      return;
    }
    if (hasChildren) {
      issue(report, generatorFinalSeverity(report), "APP_NAVIGATION_RESOURCE_HAS_CHILDREN", "Only Type classes navigation groups should contain list[] children.", { path: itemPath, title: item.Title || item.DisplayName || null, type: item.Type });
      validateRootNavigationMenuStructure(item.list || [], report, depth + 1, `${itemPath}.list`);
    }
    if (!allowedResourceTypes.has(type) && !observedNonResourceTypes.has(type)) {
      issue(report, "warning", "APP_NAVIGATION_TYPE_UNPROVEN", "Navigation item Type is not one of the export-proven application resource types. Use warnings until the runtime behavior is studied.", { path: itemPath, title: item.Title || item.DisplayName || null, type: item.Type });
    }
    if (allowedResourceTypes.has(type) && !safeString(item.ListID)) {
      issue(report, generatorFinalSeverity(report), "APP_NAVIGATION_RESOURCE_LISTID_MISSING", "Application resource navigation items should include ListID/Key reference metadata.", { path: itemPath, title: item.Title || item.DisplayName || null, type: item.Type });
    }
    if (item.DisplayName !== undefined && item.DisplayName !== null && typeof item.DisplayName !== "string") {
      issue(report, generatorFinalSeverity(report), "APP_NAVIGATION_DISPLAYNAME_NOT_STRING", "Navigation DisplayName/custom text should be a string when present. Omit it to allow the resource-name fallback.", { path: itemPath, displayName: item.DisplayName });
    }
    if (item.Icon !== undefined && item.Icon !== null && typeof item.Icon !== "string") {
      issue(report, generatorFinalSeverity(report), "APP_NAVIGATION_ICON_NOT_STRING", "Navigation Icon should be a string. Export-proven no-icon uses an empty string.", { path: itemPath, icon: item.Icon });
    }
    if (item.Icon === null) {
      issue(report, "warning", "APP_NAVIGATION_ICON_NULL_UNPROVEN", "Export-proven no-icon navigation items use Icon as an empty string rather than null.", { path: itemPath, title: item.Title || item.DisplayName || null });
    }
    if (item.IsHidden !== undefined && typeof item.IsHidden !== "boolean") {
      issue(report, generatorFinalSeverity(report), "APP_NAVIGATION_ISHIDDEN_NOT_BOOLEAN", "Navigation IsHidden should be boolean when present.", { path: itemPath, isHidden: item.IsHidden });
    }
  });
}

function validateDashboardPageResource(page, layout, resource, listsById, fieldsByList, rootPageLayouts, report, outerResource) {
  const severity = generatorFinalSeverity(report);
  const title = layout.Title;
  const layoutId = safeString(layout.LayoutID);
  if (page.attrs && page.attrs.hideHeaderAll !== true) {
    uiStandardWarning(report, "UI_STANDARD_DASHBOARD_HEADER_NOT_HIDDEN", "UI/UX standard dashboards should set attrs.hideHeaderAll to true.", { title, layoutId });
  }
  if (!zeroPadding(page.attrs && page.attrs.container && page.attrs.container.padding)) {
    uiStandardWarning(report, "UI_STANDARD_DASHBOARD_PADDING_NOT_ZERO", "UI/UX standard dashboards should use zero page padding: attrs.container.padding with --sp--s0 on all sides.", { title, layoutId });
  }
  validateUiStandardContainers(page, report, { surface: "dashboard", title, layoutId, requireFormBody: false });
  if (page.filterVars !== undefined && !Array.isArray(page.filterVars)) {
    issue(report, severity, "DASHBOARD_FILTERVARS_NOT_ARRAY", "Dashboard page filterVars must be an array when present.", { title, layoutId });
  }
  if (page.tempVars !== undefined && !Array.isArray(page.tempVars)) {
    issue(report, severity, "DASHBOARD_TEMPVARS_NOT_ARRAY", "Dashboard page tempVars must be an array when present.", { title, layoutId });
  }
  if (page.exts !== undefined && !Array.isArray(page.exts) && !(isObject(page.exts) && Object.keys(page.exts).length === 0)) {
    issue(report, severity, "DASHBOARD_EXTS_NOT_ARRAY", "Dashboard page exts must be an array when populated; an empty object is accepted for simple Type 103 page shells.", { title, layoutId });
  }

  const tempVars = new Set(asArray(page.tempVars).map((item) => safeString(item.id)).filter(Boolean));
  const filterVars = new Set(asArray(page.filterVars).map((item) => safeString(item.id)).filter(Boolean));
  const reportIds = new Set(asArray(outerResource && outerResource.ReportIds).map(safeString).filter(Boolean));
  const controlIds = new Set();
  const seenTempVars = new Set();
  for (const item of asArray(page.tempVars)) {
    const id = safeString(item.id);
    if (!id) issue(report, severity, "DASHBOARD_TEMPVAR_ID_MISSING", "Dashboard tempVars entries should include id.", { title, layoutId, item });
    else if (seenTempVars.has(id)) issue(report, severity, "DASHBOARD_TEMPVAR_ID_DUPLICATE", "Dashboard tempVars ids should be unique.", { title, layoutId, id });
    seenTempVars.add(id);
  }

  walk(page, (node, pointer) => {
    if (!isObject(node)) return;
    const controlId = safeString(node.id);
    if (controlId) controlIds.add(controlId);
    const binding = safeString(node.binding);
    if (binding && binding.startsWith("__filter_")) {
      const filterId = binding.replace(/^__filter_/, "");
      if (!filterVars.has(filterId)) {
        issue(report, severity, "DASHBOARD_FILTER_CONTROL_BINDING_UNRESOLVED", "Dashboard filter control binding should reference a filterVars id.", { title, layoutId, pointer, binding, filterId });
      }
    }
    const saveVar = node.attrs && node.attrs.save_var;
    const saveVarId = saveVar && safeString(saveVar.id).replace(/^__temp_/, "");
    if (saveVarId && !tempVars.has(saveVarId)) {
      issue(report, severity, "DASHBOARD_SAVE_VAR_UNRESOLVED", "Dashboard component save_var should reference a tempVars id.", { title, layoutId, pointer, saveVarId });
    }
    const dataList = node.attrs && node.attrs.data && node.attrs.data.list;
    if (dataList && safeString(dataList.ListID) && !listsById.has(safeString(dataList.ListID))) {
      issue(report, severity, "DASHBOARD_CONTROL_LIST_REFERENCE_UNRESOLVED", "Dashboard control data.list references a list not included in the package.", { title, layoutId, pointer, listId: safeString(dataList.ListID) });
    }
    if (safeString(node.type) === "document-library") {
      validateDashboardDocLibraryControl(node, title, layoutId, pointer, listsById, fieldsByList, report);
    }
    const dataForm = node.attrs && node.attrs.data && node.attrs.data.form;
    if (dataForm && safeString(dataForm.ListSetID) && safeString(dataForm.ListSetID) !== safeString(resource.ListSetID || (resource.Item && resource.Item.ListID)) && !listsById.has(safeString(dataForm.ListSetID))) {
      issue(report, report.mode === "generator" ? "error" : "dependency", "DASHBOARD_FORM_EXTERNAL_LISTSET_REFERENCE", "Dashboard action references a form/listset outside the package; generated dashboards should model or exclude external dependencies.", { title, layoutId, pointer, listSetId: safeString(dataForm.ListSetID), procKey: safeString(dataForm.ProcKey) });
    }
    const pageRef = node.type === "opendashboard" && node.attrs && node.attrs.data && node.attrs.data.page;
    if (pageRef && safeString(pageRef.PageID) && !rootPageLayouts.has(safeString(pageRef.PageID))) {
      issue(report, severity, "DASHBOARD_ACTION_PAGE_REFERENCE_UNRESOLVED", "Dashboard opendashboard action references a missing Type 103 page.", { title, layoutId, pointer, pageId: safeString(pageRef.PageID) });
    }
  });

  asArray(page.exts).forEach((ext, index) => {
    const attr = ext && ext.attr;
    const extId = safeString(ext && ext.i);
    if (extId && !controlIds.has(extId)) {
      issue(report, severity, "DASHBOARD_EXT_CONTROL_REFERENCE_UNRESOLVED", "Dashboard ext i should reference a page control id.", { title, layoutId, index, extId });
    }
    if (extId && reportIds.size && !reportIds.has(extId)) {
      issue(report, severity, "DASHBOARD_EXT_REPORTID_MISSING", "Dashboard ext i should be included in Resource.ReportIds for import/runtime binding.", { title, layoutId, index, extId });
    }
    if (!isObject(attr)) {
      issue(report, severity, "DASHBOARD_EXT_ATTR_MISSING", "Dashboard ext entries should include attr configuration.", { title, layoutId, index });
      return;
    }
    validateDashboardListId(title, layoutId, `$.exts[${index}].attr.ListID`, attr.ListID, listsById, report);
    validateDashboardExtFieldRefs(title, layoutId, `$.exts[${index}]`, attr, fieldsByList, filterVars, report);
    walk(attr, (node, pointer) => {
      if (!isObject(node)) return;
      validateDashboardListId(title, layoutId, `$.exts[${index}].attr${pointer.slice(1)}.listid`, node.listid, listsById, report);
      validateDashboardListId(title, layoutId, `$.exts[${index}].attr${pointer.slice(1)}.ListID`, node.ListID, listsById, report);
    });
  });
  validateDashboardCollectionControls(page, title, layoutId, listsById, fieldsByList, filterVars, report);
  validateDashboardFunctionalQuality(page, title, layoutId, report);
}

function dashboardTextValue(node) {
  if (!isObject(node)) return "";
  const attrs = node.attrs || {};
  return safeString(
    attrs.value ??
    (attrs.headc && attrs.headc.title && attrs.headc.title.value) ??
    (attrs.layout && attrs.layout.title && attrs.layout.title.value) ??
    node.label ??
    node.nv_label ??
    ""
  );
}

function validateDashboardFunctionalQuality(page, title, layoutId, report) {
  const severity = generatorFinalSeverity(report);
  const counts = { summary: 0, dataList: 0, collection: 0, chart: 0 };
  const allText = [];

  function visit(node, pointer, contextLabels) {
    if (!isObject(node)) return;
    const ownLabel = [node.type, node.label, node.nv_label, dashboardTextValue(node)].map(safeString).filter(Boolean).join(" ");
    const context = `${contextLabels} ${ownLabel}`;
    const type = safeString(node.type);
    if (type === "summary") counts.summary += 1;
    if (type === "data-list") counts.dataList += 1;
    if (type === "collection") counts.collection += 1;
    if (["pie-chart", "bar-chart", "line-chart"].includes(type)) counts.chart += 1;

    const textValue = dashboardTextValue(node);
    if (textValue) allText.push(textValue);
    if (["heading", "text-editor", "text"].includes(type) && /(^|>|\s)(0|0\.00|N\/A)(\s|<|$)/i.test(textValue) && /\b(kpi|summary|card|metric|queue|operations|reporting|trend|chart)\b/i.test(context)) {
      issue(report, severity, "DASHBOARD_STATIC_KPI_PLACEHOLDER", "Dashboard KPI/summary-like sections must not use static Text controls for values such as 0, 0.00, or N/A. Use a Summary control or a data-bound fallback.", { title, layoutId, pointer, text: textValue.slice(0, 120), context: context.slice(0, 240) });
    }
    asArray(node.children).forEach((child, index) => visit(child, `${pointer}.children[${index}]`, context));
  }

  visit(page, "$", "");
  const joined = allText.join(" \n ");
  const hasQueueLanguage = /\b(queue|queues|pending hr|pending finance|needs my action|returned requests|expiry follow-up)\b/i.test(joined);
  const hasReportingLanguage = /\b(advanced reporting|reporting|analytics|trend|ranking|chart)\b/i.test(joined);
  const hasChartLanguage = /\b(pie chart|column chart|line chart|trend|by status|by product type|self vs family|custom vs standard)\b/i.test(joined);

  if (/hr operations/i.test(title) && counts.summary === 0) {
    issue(report, severity, "DASHBOARD_HR_OPERATIONS_NO_SUMMARY_CONTROLS", "HR Operations dashboards must use real Summary controls for KPI cards; static text KPI cards are not acceptable.", { title, layoutId });
  }
  if (hasQueueLanguage && counts.dataList + counts.collection === 0) {
    issue(report, severity, "DASHBOARD_QUEUES_NOT_DATA_BOUND", "Dashboard queue/operations sections must use Collection or data-list controls, not only explanatory text.", { title, layoutId, dataListControls: counts.dataList, collectionControls: counts.collection });
  }
  if (hasReportingLanguage && counts.summary + counts.dataList + counts.collection + counts.chart === 0) {
    issue(report, severity, "DASHBOARD_REPORTING_NOT_FUNCTIONAL", "Dashboard reporting/analytics sections must contain Summary, chart, Collection, or data-list controls.", { title, layoutId });
  }
  if (hasChartLanguage && counts.chart === 0 && counts.dataList + counts.collection === 0) {
    issue(report, severity, "DASHBOARD_CHARTS_NO_CONTROL_OR_FALLBACK", "Dashboard chart/trend language requires real chart controls or a functional data-list/Collection fallback.", { title, layoutId });
  }
}

function validateDashboardCollectionControls(page, title, layoutId, listsById, fieldsByList, filterVars, report) {
  const severity = generatorFinalSeverity(report);
  const seenControlIds = new Set();
  function validateExpressionNode(node, pointer, collection) {
    if (!isObject(node)) return;
    if (node.exprType === "variable_ctx" && node.ctx === "__ctx_coll") {
      if (!collection) {
        issue(report, severity, "DASHBOARD_COLLECTION_CONTEXT_EXPR_OUTSIDE_COLLECTION", "Collection item expressions should be nested inside a collection item template.", { title, layoutId, pointer, field: safeString(node.id) });
        return;
      }
      const fieldName = safeString(node.id);
      if (fieldName && !collection.fields.has(fieldName)) {
        issue(report, severity, "DASHBOARD_COLLECTION_EXPR_FIELD_UNRESOLVED", "Collection item expression references a field not present on the collection source list.", { title, layoutId, pointer, listId: collection.listId, fieldName });
      }
    }
    if (node.exprType === "variable" && safeString(node.id).startsWith("__filter_")) {
      const name = safeString(node.name);
      const expectedId = name ? `__filter_${name}` : "";
      if (name && !filterVars.has(name)) {
        issue(report, severity, "DASHBOARD_COLLECTION_FILTER_VARIABLE_UNRESOLVED", "Collection filter expression should reference a page filterVars id.", { title, layoutId, pointer, filterVar: name });
      }
      if (expectedId && safeString(node.id) !== expectedId) {
        issue(report, severity, "DASHBOARD_COLLECTION_FILTER_VARIABLE_ID_MISMATCH", "Collection filter expression id should use the __filter_ prefix plus the filter variable name.", { title, layoutId, pointer, id: safeString(node.id), expected: expectedId });
      }
    }
  }

  function validateControlDisplay(control, pointer, collection) {
    for (const [index, rule] of asArray(control.attrs && control.attrs.control_display).entries()) {
      walk(rule.formulas, (node, formulaPointer) => validateExpressionNode(node, `${pointer}.attrs.control_display[${index}].formulas${formulaPointer.slice(1)}`, collection));
      const ruleControlId = safeString(rule.controlId);
      const controlId = safeString(control.id);
      if (ruleControlId && controlId && ruleControlId !== controlId) {
        issue(report, severity, "DASHBOARD_COLLECTION_DISPLAY_RULE_CONTROL_MISMATCH", "Collection dynamic display rule controlId should match the target control id.", { title, layoutId, pointer: `${pointer}.attrs.control_display[${index}].controlId`, controlId, ruleControlId });
      }
      const action = rule.actions || {};
      const actionAttrs = action.attrs || {};
      const regulationAction = safeString(actionAttrs.style_regulation_action);
      const actionStyle = actionAttrs.action_style;
      if (safeString(action.type) && safeString(action.type) !== "1") {
        issue(report, severity, "DASHBOARD_COLLECTION_DISPLAY_ACTION_TYPE_UNSUPPORTED", "Collection dynamic display actions should use the studied action type 1.", { title, layoutId, pointer: `${pointer}.attrs.control_display[${index}].actions.type`, actionType: action.type });
      }
      if (regulationAction === "style_class") {
        if (typeof actionStyle !== "string" || !actionStyle.trim()) {
          issue(report, severity, "DASHBOARD_COLLECTION_STYLE_ACTION_MISSING", "Collection conditional style action should include action_style JSON.", { title, layoutId, pointer: `${pointer}.attrs.control_display[${index}].actions.attrs.action_style` });
        } else if (!tryParseJson(actionStyle)) {
          issue(report, severity, "DASHBOARD_COLLECTION_STYLE_ACTION_JSON_INVALID", "Collection conditional style action_style should be valid JSON.", { title, layoutId, pointer: `${pointer}.attrs.control_display[${index}].actions.attrs.action_style` });
        }
      } else if (regulationAction === "style_regulation_action_show") {
        if (actionStyle !== null && actionStyle !== undefined) {
          issue(report, severity, "DASHBOARD_COLLECTION_SHOW_ACTION_STYLE_NOT_NULL", "Collection show dynamic display action should keep action_style null.", { title, layoutId, pointer: `${pointer}.attrs.control_display[${index}].actions.attrs.action_style` });
        }
      } else if (regulationAction) {
        issue(report, severity, "DASHBOARD_COLLECTION_DISPLAY_ACTION_UNSTUDIED", "Collection dynamic display rule uses an unstudied style_regulation_action.", { title, layoutId, pointer: `${pointer}.attrs.control_display[${index}].actions.attrs.style_regulation_action`, regulationAction });
      }
    }
  }

  function visit(control, pointer, collection) {
    if (!isObject(control)) return;
    const controlId = safeString(control.id);
    if (controlId) {
      if (seenControlIds.has(controlId)) {
        issue(report, severity, "DASHBOARD_CONTROL_ID_DUPLICATE", "Dashboard page control ids should be unique.", { title, layoutId, pointer, controlId });
      }
      seenControlIds.add(controlId);
    }
    if (control.type === "flex_grid") {
      const attrs = control.attrs || {};
      if (attrs.layout && attrs.layout.cols && !attrs.columns) {
        issue(report, severity, "DASHBOARD_FLEX_GRID_COLUMNS_SCHEMA_INVALID", "Dashboard flex_grid columns should use attrs.columns/attrs.rows, not attrs.layout.cols.", { title, layoutId, pointer, controlId });
      }
      if (attrs.columns && !attrs.rows) {
        issue(report, severity, "DASHBOARD_FLEX_GRID_ROWS_MISSING", "Dashboard flex_grid controls with columns should also include attrs.rows.", { title, layoutId, pointer, controlId });
      }
      if (["Table header", "Table row"].includes(safeString(control.label)) && !displayLabelDisabled(control.displayLabel)) {
        issue(report, severity, "DASHBOARD_FLEX_GRID_DISPLAY_CAPTION_VISIBLE", "Table-style Collection header and row flex_grid controls should turn off Display caption with displayLabel [null,false].", { title, layoutId, pointer, controlId, label: safeString(control.label) });
      }
    }
    const binding = safeString(control.binding);
    if (binding.startsWith("__filter_")) {
      const filterVar = binding.slice("__filter_".length);
      if (!filterVars.has(filterVar)) {
        issue(report, severity, "DASHBOARD_FILTER_CONTROL_BINDING_UNRESOLVED", "Dashboard filter control binding should resolve to page.filterVars.", { title, layoutId, pointer, controlId, binding, filterVar });
      }
    }
    let activeCollection = collection;
    if (control.type === "collection") {
      const listId = safeString(control.attrs && control.attrs.data && control.attrs.data.list && control.attrs.data.list.ListID);
      if (!listId) {
        issue(report, severity, "DASHBOARD_COLLECTION_LIST_MISSING", "Collection control should include attrs.data.list.ListID.", { title, layoutId, pointer });
      } else if (!listsById.has(listId)) {
        issue(report, severity, "DASHBOARD_COLLECTION_LIST_REFERENCE_UNRESOLVED", "Collection control data source should resolve to a list included in the package.", { title, layoutId, pointer, listId });
      }
      const fields = fieldsByList.get(listId) || new Map();
      activeCollection = { listId, fields };
      if (!asArray(control.children).length) {
        issue(report, severity, "DASHBOARD_COLLECTION_ITEM_TEMPLATE_MISSING", "Collection control should include one item-template child.", { title, layoutId, pointer, listId });
      }
      for (const [fulltextIndex, item] of asArray(control.attrs && control.attrs.data && control.attrs.data.fulltext).entries()) {
        for (const [fieldIndex, fieldName] of asArray(item.fields).map(safeString).entries()) {
          if (fieldName && !fields.has(fieldName)) {
            issue(report, severity, "DASHBOARD_COLLECTION_FULLTEXT_FIELD_UNRESOLVED", "Collection fulltext search references a field not present on the collection source list.", { title, layoutId, pointer: `${pointer}.attrs.data.fulltext[${fulltextIndex}].fields[${fieldIndex}]`, listId, fieldName });
          }
        }
        walk(item.value, (node, valuePointer) => validateExpressionNode(node, `${pointer}.attrs.data.fulltext[${fulltextIndex}].value${valuePointer.slice(1)}`, activeCollection));
      }
    }
    if (control.type === "dynamic-field" && safeString(control.attrs && control.attrs.source) === "3") {
      if (!activeCollection) {
        issue(report, severity, "DASHBOARD_COLLECTION_DYNAMIC_FIELD_OUTSIDE_COLLECTION", "Dynamic field source 3 should be nested inside a collection item template.", { title, layoutId, pointer, fieldName: safeString(control.attrs && control.attrs["obj-f"]) });
      } else {
        const fieldName = safeString(control.attrs && control.attrs["obj-f"]);
        if (fieldName && !activeCollection.fields.has(fieldName)) {
          issue(report, severity, "DASHBOARD_COLLECTION_DYNAMIC_FIELD_UNRESOLVED", "Dynamic field source 3 references a field not present on the collection source list.", { title, layoutId, pointer, listId: activeCollection.listId, fieldName });
        }
      }
    }
    validateControlDisplay(control, pointer, activeCollection);
    if (control.attrs) walk(control.attrs, (node, attrPointer) => validateExpressionNode(node, `${pointer}.attrs${attrPointer.slice(1)}`, activeCollection));
    asArray(control.children).forEach((child, index) => visit(child, `${pointer}.children[${index}]`, activeCollection));
  }

  asArray(page.children).forEach((child, index) => visit(child, `$.children[${index}]`, null));
}

function validateDashboardExtFieldRefs(title, layoutId, pointer, attr, fieldsByList, filterVars, report) {
  const listId = safeString(attr && attr.ListID);
  if (!listId) return;
  const fields = fieldsByList.get(listId);
  if (!fields) return;
  const systemFields = new Set(["ListDataID", "CreatedBy", "Created", "ModifiedBy", "Modified"]);
  const settings = attr.settings;
  if (!isObject(settings)) return;
  for (const key of ["rows", "columns", "values"]) {
    for (const [index, item] of asArray(settings[key]).entries()) {
      const fieldName = safeString(item && item.fieldName);
      if (!fieldName || fields.has(fieldName) || systemFields.has(fieldName)) continue;
      issue(report, generatorFinalSeverity(report), "DASHBOARD_EXT_FIELD_REFERENCE_UNRESOLVED", "Dashboard ext settings fieldName does not resolve to the referenced list fields.", { title, layoutId, pointer: `${pointer}.attr.settings.${key}[${index}].fieldName`, listId, fieldName });
    }
  }
  validateDashboardConditions(title, layoutId, `${pointer}.attr.settings.Conditions`, settings.Conditions, fields, filterVars, report);
}

function validateDashboardConditions(title, layoutId, pointer, conditions, fields, filterVars, report) {
  asArray(conditions).forEach((condition, index) => {
    if (!isObject(condition)) return;
    const conditionPointer = `${pointer}[${index}]`;
    const left = safeString(condition.left);
    if (left && !fields.has(left)) {
      issue(report, generatorFinalSeverity(report), "DASHBOARD_EXT_CONDITION_FIELD_UNRESOLVED", "Dashboard ext condition left field does not resolve to the referenced list fields.", { title, layoutId, pointer: `${conditionPointer}.left`, fieldName: left });
    }
    for (const [rightIndex, item] of asArray(condition.right).entries()) {
      if (!isObject(item) || item.exprType !== "variable") continue;
      const name = safeString(item.name);
      const id = safeString(item.id);
      if (name && !filterVars.has(name)) {
        issue(report, generatorFinalSeverity(report), "DASHBOARD_EXT_FILTER_VARIABLE_UNRESOLVED", "Dashboard ext condition variable name should resolve to page filterVars.", { title, layoutId, pointer: `${conditionPointer}.right[${rightIndex}].name`, filterVar: name });
      }
      if (id && name && id !== `__filter_${name}`) {
        issue(report, generatorFinalSeverity(report), "DASHBOARD_EXT_FILTER_VARIABLE_ID_MISMATCH", "Dashboard ext condition variable id should use the __filter_ prefix plus the filter variable name.", { title, layoutId, pointer: `${conditionPointer}.right[${rightIndex}].id`, id, expected: `__filter_${name}` });
      }
    }
    validateDashboardConditions(title, layoutId, `${conditionPointer}.conditions`, condition.conditions, fields, filterVars, report);
  });
}

function validateDashboardListId(title, layoutId, pointer, value, listsById, report) {
  const listId = safeString(value);
  if (!listId) return;
  if (!listsById.has(listId)) {
    issue(report, generatorFinalSeverity(report), "DASHBOARD_DATA_SOURCE_UNRESOLVED", "Dashboard data source ListID/listid does not resolve to a package list or report resource.", { title, layoutId, pointer, listId });
  }
}

function validateDashboardDocLibraryControl(node, title, layoutId, pointer, listsById, fieldsByList, report) {
  const attrs = node.attrs || {};
  const data = attrs.data || {};
  const listRef = data.list || {};
  const listId = safeString(listRef.ListID);
  if (!listId) {
    issue(report, "warning", "DOC_LIBRARY_CONTROL_LIST_MISSING", "Doc library dashboard control should include attrs.data.list.ListID.", { title, layoutId, pointer });
    return;
  }

  const list = listsById.get(listId);
  if (!list) {
    issue(report, generatorFinalSeverity(report), "DOC_LIBRARY_CONTROL_LIST_UNRESOLVED", "Doc library dashboard control references a list not included in the package.", { title, layoutId, pointer, listId });
    return;
  }
  if (list.resourceType !== "document library" || Number(list.item && list.item.ListModel && list.item.ListModel.Type) !== 16) {
    issue(report, "warning", "DOC_LIBRARY_CONTROL_TARGET_NOT_TYPE16", "Doc library dashboard control should target a Type 16 document library resource.", { title, layoutId, pointer, listId, targetType: list.resourceType });
  }
  if (safeString(listRef.Type) && safeString(listRef.Type) !== "16") {
    issue(report, "warning", "DOC_LIBRARY_CONTROL_LIST_TYPE_UNUSUAL", "Doc library dashboard control attrs.data.list.Type should be 16.", { title, layoutId, pointer, listId, type: listRef.Type });
  }
  if (safeString(listRef.Title) && safeString(listRef.Title) !== list.title) {
    issue(report, "warning", "DOC_LIBRARY_CONTROL_LIST_TITLE_MISMATCH", "Doc library dashboard control list title should match the referenced document library.", { title, layoutId, pointer, listId, controlTitle: listRef.Title, targetTitle: list.title });
  }

  const fields = fieldsByList.get(listId) || new Map();
  asArray(attrs.listarr).forEach((column, index) => {
    const fieldName = safeString(column && column.Field);
    if (fieldName && !fields.has(fieldName)) {
      issue(report, "warning", "DOC_LIBRARY_CONTROL_FIELD_UNRESOLVED", "Doc library dashboard control listarr field should resolve to a field on the target document library.", { title, layoutId, pointer: `${pointer}.attrs.listarr[${index}]`, listId, fieldName });
    }
  });

  const folder = data.folder;
  if (folder !== undefined) {
    const pathValue = safeString(folder && folder.path);
    if (!pathValue) {
      issue(report, "warning", "DOC_LIBRARY_CONTROL_FOLDER_PATH_MISSING", "Folder-bound Doc library dashboard controls should include attrs.data.folder.path.", { title, layoutId, pointer, listId });
    } else {
      const folderIds = pathValue.split("/").filter((part) => part && part !== "0");
      const rows = list.item && isObject(list.item.ListDatas) ? list.item.ListDatas : {};
      for (const folderId of folderIds) {
        const row = rows[folderId] || Object.values(rows).find((candidate) => safeString(candidate && candidate.ListDataID) === folderId);
        if (!row) {
          issue(report, "warning", "DOC_LIBRARY_CONTROL_FOLDER_UNRESOLVED", "Doc library dashboard control folder.path should resolve to folder rows in the target document library.", { title, layoutId, pointer, listId, folderId, path: pathValue });
          continue;
        }
        if (safeString(row.Text1).toLowerCase() !== "folder") {
          issue(report, "warning", "DOC_LIBRARY_CONTROL_FOLDER_ROW_NOT_FOLDER", "Doc library dashboard control folder.path should point to rows with Text1 = folder.", { title, layoutId, pointer, listId, folderId, rowType: row.Text1 });
        }
        if (row.Text4) {
          issue(report, "warning", "DOC_LIBRARY_CONTROL_FOLDER_ROW_HAS_UPLOAD_PAYLOAD", "Folder rows referenced by Doc library controls should not include uploaded file payloads.", { title, layoutId, pointer, listId, folderId });
        }
      }
    }
  }

  if (data.customPath !== undefined) {
    if (!Array.isArray(data.customPath)) {
      issue(report, "warning", "DOC_LIBRARY_CONTROL_CUSTOMPATH_NOT_ARRAY", "Dynamic folder customPath should be an expression-token array when present.", { title, layoutId, pointer, listId });
    } else {
      const result = validateExpressionTokens(data.customPath);
      result.issues.forEach((expressionIssue) => {
        issue(report, "warning", `DOC_LIBRARY_CONTROL_CUSTOMPATH_${expressionIssue.code}`, expressionIssue.message, { title, layoutId, pointer: `${pointer}.attrs.data.customPath`, listId });
      });
    }
  }

  const caption = attrs.caption;
  if (caption !== undefined && isObject(caption)) {
    const captionLayout = safeString(caption.layout);
    if (captionLayout) {
      const layoutIds = new Set(asArray(list.item && list.item.Layouts).map((candidate) => safeString(candidate.LayoutID)).filter(Boolean));
      if (!layoutIds.has(captionLayout)) {
        issue(report, "warning", "DOC_LIBRARY_CONTROL_CAPTION_LAYOUT_UNRESOLVED", "Doc library dashboard control caption.layout should reference a layout on the target document library.", { title, layoutId, pointer, listId, captionLayout });
      }
    }
    for (const key of ["display", "add", "search"]) {
      if (caption[key] !== undefined && typeof caption[key] !== "boolean") {
        issue(report, "warning", "DOC_LIBRARY_CONTROL_CAPTION_FLAG_NOT_BOOLEAN", "Doc library dashboard control caption display/add/search settings should be booleans.", { title, layoutId, pointer: `${pointer}.attrs.caption.${key}`, key, value: caption[key] });
      }
    }
  }
}

function flattenNavigationItems(items) {
  const out = [];
  for (const item of asArray(items)) {
    if (!item || typeof item !== "object") continue;
    if (Array.isArray(item.list)) out.push(...flattenNavigationItems(item.list));
    else out.push(item);
  }
  return out;
}

function validateBasicStructure(data, resource, report) {
  if (!isObject(data)) {
    issue(report, "error", "DATA_NOT_OBJECT", "Decoded Resource.Data must be an object.");
    return;
  }
  if (!isObject(data.Item)) issue(report, "error", "DATA_ITEM_MISSING", "Data.Item is required.");
  if (!Array.isArray(data.Childs)) issue(report, "error", "DATA_CHILDS_NOT_ARRAY", "Data.Childs must be an array.");
  for (const key of ["Forms", "OtherModules", "FormReports", "DataReports", "FormNewReports", "AppGroups", "AppThemes"]) {
    if (data[key] !== undefined && data[key] !== null && !Array.isArray(data[key])) {
      issue(report, "error", `${key.toUpperCase()}_NOT_ARRAY`, `Data.${key} must be an array when present.`);
    }
  }
  if (resource) {
    if (!Array.isArray(resource.ReplaceIds)) issue(report, "error", "REPLACEIDS_NOT_ARRAY", "Resource.ReplaceIds must be an array.");
    if (resource.AppID === undefined || resource.AppID === null || resource.AppID === "") {
      issue(report, "error", "RESOURCE_APPID_MISSING", "Resource.AppID is required in wrapped .yap packages.");
    }
    if (isDocumentLibraryOnlyPackage(data) && resource.SimplePortal !== null) {
      issue(report, "warning", "DOCUMENT_LIBRARY_SIMPLEPORTAL_NOT_NULL", "Known-good document-library exports use Resource.SimplePortal = null. Generated [] wrappers failed Yeeflow create in v1/v2.", { simplePortalType: Array.isArray(resource.SimplePortal) ? "array" : typeof resource.SimplePortal });
    }
  }
}

function validateApplicationUserGroups(data, replaceIds, report) {
  const groups = asArray(data && data.AppGroups);
  report.summary.appUserGroups = groups.length;
  const seen = new Set();
  groups.forEach((group, index) => {
    if (!isObject(group)) {
      issue(report, generatorFinalSeverity(report), "APP_USER_GROUP_NOT_OBJECT", "Application user group entries should be objects.", { index });
      return;
    }
    const id = safeString(group.ID);
    const name = safeString(group.Name);
    if (!id) issue(report, generatorFinalSeverity(report), "APP_USER_GROUP_ID_MISSING", "Application user groups should include an ID.", { index, name });
    if (!name) issue(report, generatorFinalSeverity(report), "APP_USER_GROUP_NAME_MISSING", "Application user groups should include a Name.", { index, id });
    if (id && seen.has(id)) issue(report, generatorFinalSeverity(report), "APP_USER_GROUP_ID_DUPLICATE", "Application user group IDs should be unique inside Data.AppGroups.", { index, id, name });
    seen.add(id);
    if (id && replaceIds.size && !replaceIds.has(id)) {
      issue(report, "warning", "APP_USER_GROUP_ID_NOT_IN_REPLACEIDS", "The v6 application user group export includes group IDs in ReplaceIds. Confirm import behavior if generated group IDs are not remapped.", { index, id, name });
    }
    if (group.Description !== undefined && group.Description !== null && typeof group.Description !== "string") {
      issue(report, "warning", "APP_USER_GROUP_DESCRIPTION_NOT_STRING", "Application user group Description should be null or string based on the export-proven schema.", { index, id, name });
    }
    const raw = JSON.stringify(group);
    if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(raw)) {
      issue(report, generatorFinalSeverity(report), "APP_USER_GROUP_PRIVATE_EMAIL_PRESENT", "Generated application packages must not embed real user email addresses in AppGroups or related group metadata.", { index, id, name });
    }
    for (const key of Object.keys(group)) {
      if (/users?|members?/i.test(key)) {
        issue(report, "warning", "APP_USER_GROUP_MEMBER_SCHEMA_UNPROVEN", "This export study proves Data.AppGroups group records, but does not yet prove a safe member list schema. Treat member data as private and runtime-sensitive.", { index, id, name, key });
      }
    }
  });
}

function validateResourceItem(item, index, isRoot, rootListSetId, replaceIds, localIds, listsById, fieldsByList, fieldIdsByApp, report) {
  const pathPrefix = isRoot ? "$.Item" : `$.Childs[${index - 1}]`;
  if (!isObject(item) || !isObject(item.ListModel)) {
    issue(report, "error", "RESOURCE_LISTMODEL_MISSING", "Resource Item.ListModel is required.", { path: pathPrefix });
    return;
  }
  const list = item.ListModel;
  const listId = safeString(list.ListID);
  const title = safeString(list.Title);
  const resourceType = classifyListResource(item, isRoot);
  const listSetId = listSetIdOf(item, rootListSetId);
  if (isRoot) {
    if (!title) issue(report, "error", "ROOT_TITLE_MISSING", "Root app title is required.", { path: `${pathPrefix}.ListModel.Title` });
    if (!list.AppID && report.mode === "generator" && report.stage === "final") issue(report, "error", "ROOT_APPID_MISSING", "Root AppID is required.", { path: `${pathPrefix}.ListModel.AppID` });
    if (!listId) issue(report, "error", "ROOT_LISTSET_ID_MISSING", "Root ListID/ListSetID is required.", { path: `${pathPrefix}.ListModel.ListID` });
  } else {
    if (!listId) issue(report, "error", "CHILD_LISTID_MISSING", "Child ListID is required.", { path: `${pathPrefix}.ListModel.ListID`, title });
    if (!title) issue(report, "warning", "CHILD_TITLE_MISSING", "Child resource title is missing.", { path: `${pathPrefix}.ListModel.Title`, listId });
    if (resourceType === "data list" && list.ListType === undefined) {
      issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "MAIN_LIST_TYPE_MISSING", "Generated child data lists should include ListModel.ListType so extracted standalone list validation does not fail.", { path: `${pathPrefix}.ListModel.ListType`, title, listId });
    }
  }

  if (listId) {
    listsById.set(listId, { item, title, listId, listSetId, resourceType });
    localIds.add(listId);
  }
  const fields = asArray(item.Defs);
  const fieldsByName = new Map();
  const fieldNames = new Set();
  const fieldInternal = new Set();
  const fieldDisplayNames = new Set();
  for (const [fieldIndex, field] of fields.entries()) {
    const fp = `${pathPrefix}.Defs[${fieldIndex}]`;
    const fieldId = safeString(field.FieldID);
    const fieldName = safeString(field.FieldName);
    const internalName = safeString(field.InternalName);
    const displayName = safeString(field.DisplayName);
    if (!fieldId) issue(report, "error", "FIELD_ID_MISSING", "FieldID is required.", { path: `${fp}.FieldID`, list: title });
    else {
      localIds.add(fieldId);
      const previous = fieldIdsByApp.get(fieldId);
      if (previous) {
        issue(report, generatorFinalSeverity(report), "APP_FIELD_ID_DUPLICATE", "Duplicate FieldID across application resources; generated .yap data-list fields must use app-wide unique FieldID values to avoid blank-app materialization failures.", {
          fieldId,
          list: title,
          fieldName,
          previousList: previous.list,
          previousFieldName: previous.fieldName,
        });
      } else {
        fieldIdsByApp.set(fieldId, { list: title, fieldName });
      }
    }
    if (safeString(field.ListID) && listId && safeString(field.ListID) !== listId) {
      issue(report, generatorFinalSeverity(report), "FIELD_LIST_ID_MISMATCH", "Field ListID must match its parent data-list ListID; otherwise Yeeflow may materialize the list shell without custom fields.", {
        list: title,
        fieldName,
        fieldId,
        fieldListId: safeString(field.ListID),
        parentListId: listId,
        path: `${fp}.ListID`,
      });
    }
    if (!fieldName) issue(report, "error", "FIELD_NAME_MISSING", "FieldName is required.", { path: `${fp}.FieldName`, list: title });
    if (!displayName) issue(report, "warning", "FIELD_DISPLAY_NAME_MISSING", "Field DisplayName is missing.", { path: `${fp}.DisplayName`, list: title, fieldName });
    if (fieldName) {
      if (fieldNames.has(fieldName)) issue(report, "error", "FIELD_NAME_DUPLICATE", "Duplicate FieldName in resource.", { list: title, fieldName });
      fieldNames.add(fieldName);
      fieldsByName.set(fieldName, field);
    }
    if (internalName) {
      if (fieldInternal.has(internalName)) issue(report, "error", "DUPLICATE_INTERNAL_NAME", "Duplicate InternalName in resource; generated data lists must use unique internal field names.", { list: title, internalName });
      fieldInternal.add(internalName);
      fieldsByName.set(internalName, field);
    }
    if (displayName) {
      if (fieldDisplayNames.has(displayName)) {
        issue(report, generatorFinalSeverity(report), "FIELD_DISPLAY_NAME_DUPLICATE", "Duplicate DisplayName in data-list resource; Yeeflow runtime import may skip materializing the list/app shell.", { list: title, displayName });
      }
      fieldDisplayNames.add(displayName);
      fieldsByName.set(displayName, field);
    }
    if (fieldId) fieldsByName.set(fieldId, field);
    if (!isRoot && resourceType === "data list" && fieldName === "Title" && (field.Status !== 0 || field.IsSystem !== true || field.IsIndex !== true || field.FieldIndex !== 0)) {
      issue(
        report,
        generatorFinalSeverity(report),
        "DATA_LIST_TITLE_FIELD_NATIVE_METADATA_INVALID",
        "Generated child data lists must preserve Yeeflow's native Title field metadata; otherwise api/crafts/datas/{AppID}/{ListID}/query can fail or hang at runtime.",
        {
          list: title,
          listId,
          path: fp,
          status: field.Status,
          isSystem: field.IsSystem,
          isIndex: field.IsIndex,
          fieldIndex: field.FieldIndex,
          expected: { Status: 0, IsSystem: true, IsIndex: true, FieldIndex: 0 },
        }
      );
    }
    if (field.Rules && !tryParseJson(field.Rules)) issue(report, "warning", "FIELD_RULES_JSON_INVALID", "Field Rules is not valid JSON.", { list: title, field: displayName || fieldName });
    validateFieldAgainstSchema(field, report._controlFieldSchemas).forEach((schemaIssue) => {
      issue(report, "warning", `FIELD_SCHEMA_${schemaIssue.code}`, schemaIssue.message, {
        list: title,
        path: fp,
        field: displayName || fieldName || null,
        fieldType: field.Type || null,
        ...(schemaIssue.detail || {}),
      });
    });
    if (normalizeType(field) === "unknown") issue(report, "warning", "FIELD_TYPE_UNKNOWN", "Field type could not be normalized.", { list: title, field: displayName || fieldName, fieldType: field.FieldType, controlType: field.Type });
  }
  if (listId) fieldsByList.set(listId, fieldsByName);
  if (!isRoot && resourceType === "document library") {
    validateDocumentLibraryFields(item, fieldsByName, pathPrefix, report);
  }

  const layouts = asArray(item.Layouts);
  const layoutIds = new Set(layouts.map((layout) => safeString(layout.LayoutID)).filter(Boolean));
  if (!isRoot && item.ListModel && item.ListModel.LayoutView) {
    const listLayoutView = tryParseJson(item.ListModel.LayoutView);
    if (listLayoutView) {
      if (resourceType === "document library") {
        const assignedKeys = ["add", "edit", "view"].filter((key) => safeString(listLayoutView[key]));
        if (assignedKeys.length > 0 && assignedKeys.length < 3) {
          issue(report, "warning", "DOCUMENT_LIBRARY_LAYOUTVIEW_PARTIAL_ASSIGNMENT", "Document Library Sample uses null LayoutView for the minimal library, while configured libraries assign add/edit/view together. A partial New-only assignment is runtime-sensitive.", { list: title, assignedKeys });
        }
      }
      for (const key of ["add", "edit", "view"]) {
        const assignedLayoutId = safeString(listLayoutView[key]);
        if (assignedLayoutId && !layoutIds.has(assignedLayoutId)) {
          issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "LIST_LAYOUTVIEW_FORM_REFERENCE_UNRESOLVED", "ListModel.LayoutView add/edit/view points to a layout ID that does not belong to this list.", { list: title, key, assignedLayoutId });
        }
      }
      if (resourceType === "data list" && report.mode === "generator") {
        const customFormsByTitle = new Map(layouts.filter((layout) => Number(layout.Type) === 1 && layout.Title).map((layout) => [safeString(layout.Title).toLowerCase(), layout]));
        const editLayout = customFormsByTitle.get("edit item");
        const viewLayout = customFormsByTitle.get("view item");
        if (!editLayout) issue(report, "warning", "UI_STANDARD_EDIT_ITEM_FORM_MISSING", "Generated data lists should include a current-standard custom form titled \"Edit Item\".", { list: title, listId });
        if (!viewLayout) issue(report, "warning", "UI_STANDARD_VIEW_ITEM_FORM_MISSING", "Generated data lists should include a current-standard custom form titled \"View Item\".", { list: title, listId });
        if (editLayout && safeString(listLayoutView.add) !== safeString(editLayout.LayoutID)) {
          issue(report, "warning", "UI_STANDARD_NEW_NOT_USING_EDIT_ITEM_FORM", "Generated data-list New item display setting should use the Edit Item custom form.", { list: title, listId, expectedLayoutId: editLayout.LayoutID, actualLayoutId: listLayoutView.add });
        }
        if (editLayout && safeString(listLayoutView.edit) !== safeString(editLayout.LayoutID)) {
          issue(report, "warning", "UI_STANDARD_EDIT_NOT_USING_EDIT_ITEM_FORM", "Generated data-list Edit item display setting should use the Edit Item custom form.", { list: title, listId, expectedLayoutId: editLayout.LayoutID, actualLayoutId: listLayoutView.edit });
        }
        if (viewLayout && safeString(listLayoutView.view) !== safeString(viewLayout.LayoutID)) {
          issue(report, "warning", "UI_STANDARD_VIEW_NOT_USING_VIEW_ITEM_FORM", "Generated data-list View item display setting should use the View Item custom form.", { list: title, listId, expectedLayoutId: viewLayout.LayoutID, actualLayoutId: listLayoutView.view });
        }
      }
    }
  }
  layouts.forEach((layout, layoutIndex) => {
    const layoutId = safeString(layout.LayoutID);
    if (!layoutId) issue(report, "error", "LAYOUT_ID_MISSING", "LayoutID is required.", { path: `${pathPrefix}.Layouts[${layoutIndex}].LayoutID`, list: title });
    else localIds.add(layoutId);
    if (!isRoot && Number(layout.Type || 0) === 0) validateDataListViewLayout(layout, fieldsByName, `${pathPrefix}.Layouts[${layoutIndex}]`, report, resourceType);
    if (Number(layout.Type) === 1) validateCustomFormLayout(layout, fieldsByName, `${pathPrefix}.Layouts[${layoutIndex}]`, report);
    if (Number(layout.Type) === 103 && isRoot) report.summary.dashboards += 1;
  });

  const recordCount = item.ListDatas && isObject(item.ListDatas) ? Object.keys(item.ListDatas).length : 0;
  if (item.ListDatas && !isObject(item.ListDatas)) issue(report, "error", "LISTDATAS_BAD_TYPE", "Item.ListDatas must be an object when present.", { path: `${pathPrefix}.ListDatas`, list: title });
  if (recordCount) {
    const recordIds = new Set();
    const documentFolderIds = new Set(Object.entries(item.ListDatas)
      .filter(([, record]) => isObject(record) && safeString(record.Text1).toLowerCase() === "folder")
      .flatMap(([recordId, record]) => [safeString(recordId), safeString(record.ListDataID)])
      .filter(Boolean));
    for (const [recordId, record] of Object.entries(item.ListDatas)) {
      const normalizedRecordId = safeString(recordId);
      const listDataId = safeString(record && record.ListDataID);
      const canonicalRecordId = listDataId || normalizedRecordId;
      if (canonicalRecordId) {
        if (recordIds.has(canonicalRecordId)) issue(report, "error", "LISTDATA_ID_DUPLICATE", "ListDataID/sample record IDs must be unique within a resource.", { list: title, recordId: canonicalRecordId });
        recordIds.add(canonicalRecordId);
      }
      if (recordId && LARGE_INTEGER_RE.test(recordId)) localIds.add(recordId);
      if (record && record.ListDataID && LARGE_INTEGER_RE.test(String(record.ListDataID))) localIds.add(String(record.ListDataID));
      if (isObject(record)) {
        Object.keys(record).forEach((key) => {
          if (!["ListDataID", "Created", "CreatedBy", "Modified", "ModifiedBy", "CreatedByName", "ModifiedByName"].includes(key) && !fieldsByName.has(key)) {
            issue(report, "warning", "SAMPLE_FIELD_NOT_FOUND", "Sample data field does not resolve to a known field.", { list: title, recordId, field: key });
          }
          if (resourceType === "document library" && key === "Text4" && record[key]) {
            issue(report, "warning", "DOCUMENT_LIBRARY_SAMPLE_FILE_CONTENT_PRESENT", "Document library sample data includes a Text4 upload value. Do not include raw file/document payloads in generated packages unless a focused runtime export proves the expected safe shape.", { list: title, recordId, field: key });
          }
        });
        if (resourceType === "document library" && safeString(record.Text1).toLowerCase() === "folder") {
          if (!listDataId) issue(report, "warning", "DOCUMENT_LIBRARY_FOLDER_LISTDATAID_MISSING", "Document library folder rows should include ListDataID.", { list: title, recordId });
          if (!safeString(record.Title)) issue(report, "warning", "DOCUMENT_LIBRARY_FOLDER_TITLE_MISSING", "Document library folder rows should include Title/Name.", { list: title, recordId });
          const parentId = safeString(record.Bigint1);
          if (parentId === "") issue(report, "warning", "DOCUMENT_LIBRARY_FOLDER_PARENT_MISSING", "Document library folder rows should include Bigint1/ParentID; root folders use \"0\" in studied exports.", { list: title, recordId });
          if (parentId && parentId !== "0" && !documentFolderIds.has(parentId)) {
            issue(report, "warning", "DOCUMENT_LIBRARY_FOLDER_PARENT_UNRESOLVED", "Document library folder ParentID should be 0 or point to another folder row.", { list: title, recordId, parentId });
          }
          if (record.Text4) issue(report, "warning", "DOCUMENT_LIBRARY_FOLDER_UPLOAD_PAYLOAD_PRESENT", "Document library folder rows should not include uploaded file payloads.", { list: title, recordId });
          if (record.Bigint2 !== undefined && record.Bigint2 !== "") issue(report, "warning", "DOCUMENT_LIBRARY_FOLDER_SIZE_UNUSUAL", "Studied document-library folder rows leave Bigint2/FileSize blank.", { list: title, recordId, value: record.Bigint2 });
        }
      }
    }
  }

  report.inventories.resources.push({ title, listId, listSetId, resourceType, fields: fields.length, layouts: layouts.length, sampleRecords: recordCount });
  if (!isRoot) report.summary.childResources += 1;
  if (resourceType === "data list") report.summary.dataLists += 1;
  if (resourceType === "document library") report.dependencies.push({ code: "DOCUMENT_LIBRARY_RESOURCE", message: "Document library resource present; validate Type 16 fields, views, forms, folder behavior, and upload behavior before runtime claims.", list: title, listId });
  if (resourceType === "report/data resource" || resourceType === "form report/list resource") report.summary.reports += 1;
}

function validateDataListViewLayout(layout, fieldsByName, pathPrefix, report, resourceType = "data list") {
  const view = tryParseJson(layout.LayoutView);
  const severity = report.mode === "generator" && report.stage === "final" ? "error" : "warning";
  if (!view) {
    if (resourceType === "document library") {
      issue(report, "warning", "DOCUMENT_LIBRARY_VIEW_LAYOUTVIEW_EMPTY_OR_INVALID", "A newly created document library export may have an empty default view LayoutView; configured libraries should use the normal list view layout JSON.", { path: `${pathPrefix}.LayoutView`, title: layout.Title || null });
      return;
    }
    issue(report, severity, "DATA_LIST_VIEW_LAYOUTVIEW_INVALID", "Data-list view LayoutView must be parseable JSON.", { path: `${pathPrefix}.LayoutView`, title: layout.Title });
    return;
  }
  if (Array.isArray(view.fields) && !Array.isArray(view.layout)) {
    issue(report, severity, "DATA_LIST_VIEW_LAYOUTVIEW_LIGHTWEIGHT_FIELDS", "Generated data-list view LayoutView uses a lightweight fields array instead of Yeeflow's layout/sort/query/rowColor/filter schema.", { title: layout.Title });
  }
  for (const key of ["layout", "sort", "query", "rowColor", "filter"]) {
    if (!Array.isArray(view[key])) {
      issue(report, severity, "DATA_LIST_VIEW_LAYOUTVIEW_REQUIRED_ARRAY_MISSING", `Data-list view LayoutView missing ${key} array.`, { title: layout.Title, key });
    }
  }
  if (!Array.isArray(view.layout)) return;
  view.layout.forEach((column, index) => {
    const fieldId = safeString(column.FieldID);
    const fieldName = safeString(column.FieldName);
    const displayName = safeString(column.DisplayName);
    if (!fieldId || !fieldName || !displayName || column.Mobile === undefined || column.Order === undefined || column.Show === undefined || !safeString(column.Type)) {
      issue(report, severity, "DATA_LIST_VIEW_COLUMN_INCOMPLETE", "Data-list view layout column should include FieldID, FieldName, Mobile, Order, Show, Type, and DisplayName.", { title: layout.Title, index, fieldId, fieldName });
    }
    if (fieldId && !fieldsByName.has(fieldId)) {
      issue(report, severity, "DATA_LIST_VIEW_FIELDID_NOT_FOUND", "Data-list view FieldID does not resolve to a list field.", { title: layout.Title, index, fieldId });
    }
    if (fieldName && !fieldsByName.has(fieldName)) {
      issue(report, severity, "DATA_LIST_VIEW_FIELDNAME_NOT_FOUND", "Data-list view FieldName does not resolve to a list field.", { title: layout.Title, index, fieldName });
    }
    if (safeString(column.Type) === "textarea") {
      issue(report, severity, "DATA_LIST_VIEW_TEXTAREA_COLUMN_UNPROVEN", "Generated Type 0 data-list grid views should not include textarea columns; working app exports keep long text fields in forms but omit them from grid layout.", { title: layout.Title, index, fieldName });
    }
  });
}

function validateCustomFormLayout(layout, fieldsByName, pathPrefix, report) {
  if (layout.LayoutView !== null && layout.LayoutView !== undefined) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "CUSTOM_FORM_LAYOUTVIEW_NOT_NULL", "Custom form LayoutView should be null.", { path: `${pathPrefix}.LayoutView`, title: layout.Title });
  }
  const resources = asArray(layout.LayoutInResources);
  if (!resources.length) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "CUSTOM_FORM_RESOURCE_MISSING", "Custom form LayoutInResources is missing.", { path: `${pathPrefix}.LayoutInResources`, title: layout.Title });
    return;
  }
  const layoutId = safeString(layout.LayoutID);
  const first = resources[0];
  if (safeString(first.ID) !== layoutId || safeString(first.RefId) !== layoutId) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "CUSTOM_FORM_RESOURCE_ID_MISMATCH", "LayoutInResources ID/RefId should match LayoutID.", { title: layout.Title, layoutId, id: first.ID, refId: first.RefId });
  }
  const form = tryParseJson(first.Resource);
  if (!form) {
    issue(report, "error", "CUSTOM_FORM_RESOURCE_JSON_INVALID", "Custom form Resource is not valid JSON.", { title: layout.Title });
    return;
  }
  for (const key of ["children", "attrs", "title", "filterVars", "ver", "tempVars"]) {
    if (form[key] === undefined) issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_REQUIRED_KEY_MISSING", `Custom form Resource missing ${key}.`, { title: layout.Title, key });
  }
  validateUiStandardFormRoot(form, report, { surface: "custom list form", title: layout.Title, path: pathPrefix });
  validateUiStandardContainers(form, report, { surface: "custom list form", title: layout.Title, path: pathPrefix, requireFormBody: false });
  if (!asArray(form.children).length) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "CUSTOM_FORM_EMPTY_CHILDREN", "Assigned custom form has no controls.", { title: layout.Title });
  }
  asArray(form.children).forEach((child, index) => walkControls(child, (control, pointer) => {
    validateEmbeddedControlSchema(control, report, {
      title: layout.Title,
      path: `${pathPrefix}.LayoutInResources[0].Resource.children[${index}]${pointer.slice(1)}`,
      surface: "custom list form",
    });
    const binding = control.binding;
    if (binding && !fieldsByName.has(String(binding))) {
      issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_BINDING_NOT_FOUND", "Custom form control binding does not resolve to a field.", { title: layout.Title, binding, path: `${pathPrefix}.LayoutInResources[0].Resource.children[${index}]${pointer.slice(1)}` });
    }
    if (control.fieldID && !fieldsByName.has(String(control.fieldID))) {
      issue(report, "warning", "CUSTOM_FORM_FIELDID_NOT_FOUND", "Custom form control fieldID does not resolve to a field.", { title: layout.Title, fieldID: control.fieldID });
    }
  }));
}

function validateCustomFormDocLibraryControls(data, listsById, fieldsByList, report) {
  const items = [data && data.Item, ...asArray(data && data.Childs)];
  items.forEach((item, itemIndex) => {
    const pathPrefix = itemIndex === 0 ? "$.Item" : `$.Childs[${itemIndex - 1}]`;
    asArray(item && item.Layouts).forEach((layout, layoutIndex) => {
      if (Number(layout.Type) !== 1) return;
      const resource = asArray(layout.LayoutInResources)[0];
      const form = resource && tryParseJson(resource.Resource);
      if (!form) return;
      const layoutId = safeString(layout.LayoutID);
      asArray(form.children).forEach((child, childIndex) => {
        walkControls(child, (control, pointer) => {
          if (safeString(control.type) !== "document-library") return;
          validateDashboardDocLibraryControl(control, layout.Title, layoutId, `${pathPrefix}.Layouts[${layoutIndex}].LayoutInResources[0].Resource.children[${childIndex}]${pointer.slice(1)}`, listsById, fieldsByList, report);
        });
      });
    });
  });
}

function validateEmbeddedControlSchema(control, report, context) {
  validateControlAgainstSchema(control, report._controlFieldSchemas).forEach((schemaIssue) => {
    issue(report, "warning", `CONTROL_SCHEMA_${schemaIssue.code}`, schemaIssue.message, {
      surface: context.surface,
      title: context.title,
      path: schemaIssue.detail && schemaIssue.detail.path ? `${context.path}.${schemaIssue.detail.path}` : context.path,
      controlType: control && control.type || null,
      ...(schemaIssue.detail || {}),
    });
  });
  if (
    report.mode === "generator" &&
    report.stage === "final" &&
    isGeneratedValueControl(control && control.type) &&
    control.readonly !== true &&
    !control.binding
  ) {
    issue(report, "warning", "CONTROL_BINDING_MISSING_FOR_VALUE_CONTROL", "Generated value-entry controls should usually include a binding unless intentionally display-only.", {
      surface: context.surface,
      title: context.title,
      path: context.path,
      controlType: control.type,
      label: control.label || control.nv_label || null,
    });
  }
  validateEmbeddedControlExpressions(control, report, context);
}

function validateEmbeddedControlExpressions(control, report, context) {
  const candidates = [
    { value: control && control.attrs && control.attrs.calculated, label: "attrs.calculated" },
    { value: control && control.attrs && control.attrs.formula, label: "attrs.formula" },
    { value: control && control.attrs && control.attrs.default_value_expr, label: "attrs.default_value_expr" },
  ].filter((entry) => entry.value);
  for (const entry of candidates) {
    const expressionReport = validateExpressionTokens(entry.value, { path: `${context.path}.${entry.label}` });
    expressionReport.issues.forEach((expressionIssue) => {
      issue(report, expressionIssue.code === "EXPRESSION_NOT_ARRAY" ? "error" : "warning", expressionIssue.code, expressionIssue.message, {
        surface: context.surface,
        title: context.title,
        path: expressionIssue.path,
        controlType: control && control.type || null,
        detail: expressionIssue.detail || null,
      });
    });
  }
  asArray(control && control.attrs && control.attrs.control_display).forEach((rule, index) => {
    if (!rule || !rule.formulas) return;
    const expressionReport = validateExpressionTokens(rule.formulas, { path: `${context.path}.attrs.control_display[${index}].formulas` });
    expressionReport.issues.forEach((expressionIssue) => {
      issue(report, "warning", expressionIssue.code, expressionIssue.message, {
        surface: context.surface,
        title: context.title,
        path: expressionIssue.path,
        controlType: control && control.type || null,
        detail: expressionIssue.detail || null,
      });
    });
  });
}

function validateReplaceIds(replaceIds, localIds, report) {
  if (!replaceIds.size) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "REPLACEIDS_EMPTY", "Resource.ReplaceIds is empty or unavailable.");
    return;
  }
  const seen = new Set();
  for (const id of replaceIds) {
    if (seen.has(id)) issue(report, "warning", "REPLACEIDS_DUPLICATE", "Duplicate ID found in ReplaceIds.", { id });
    seen.add(id);
  }
  let missing = 0;
  for (const id of localIds) {
    if (!replaceIds.has(id)) {
      missing += 1;
      if (missing <= 20) {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "LOCAL_ID_NOT_IN_REPLACEIDS", "Local app/list/field/layout/sample ID is not present in ReplaceIds.", { id });
      }
    }
  }
  if (missing > 20) issue(report, "warning", "LOCAL_ID_NOT_IN_REPLACEIDS_TRUNCATED", "Additional local IDs are missing from ReplaceIds.", { additionalCount: missing - 20 });
}

function validateForms(data, listsById, fieldsByList, replaceIds, localIds, report, aiResourcesById = new Map()) {
  const forms = asArray(data && data.Forms);
  report.summary.forms = forms.length;
  forms.forEach((form, index) => {
    const formName = safeString(form.Name);
    const key = safeString(form.Key);
    const workflowType = String(form.WorkflowType || "");
    if (!formName) issue(report, "warning", "FORM_NAME_MISSING", "Form Name is missing.", { index });
    if (!key) issue(report, "error", "FORM_KEY_MISSING", "Form Key is required.", { form: formName, index });
    if (!workflowType) issue(report, "warning", "FORM_WORKFLOWTYPE_MISSING", "Form WorkflowType is missing.", { form: formName, key });
    const def = parseDefResource(form, report, index);
    const shapes = collectShapes(def);
    const nodeTypes = {};
    shapes.forEach((shape) => { nodeTypes[shapeType(shape)] = (nodeTypes[shapeType(shape)] || 0) + 1; });
    const scheduledLike = workflowType === "3";
    const hasApprovalTask = shapes.some((shape) => shapeType(shape) === "MultiAssignmentTask");
    const approvalLike = workflowType === "2" || (!scheduledLike && hasApprovalTask && asArray(def && def.pageurls).length >= 2);
    if (approvalLike) report.summary.approvalForms += 1;
    else if (scheduledLike) report.summary.scheduledWorkflows += 1;
    else report.summary.listWorkflows += 1;
    report.inventories.forms.push({ name: formName, key, workflowType, kind: approvalLike ? "approval form" : scheduledLike ? "scheduled workflow" : "list/process workflow", pages: asArray(def && def.pageurls).length, nodeTypes });
    if (approvalLike && Object.prototype.hasOwnProperty.call(form, "ListID") && String(form.ListID) !== "0") {
      issue(
        report,
        report.mode === "generator" && report.stage === "final" ? "error" : "warning",
        "APPROVAL_FORM_LISTID_NOT_ZERO",
        "App-level approval form registration should keep Data.Forms[].ListID as 0; using the ProcModelID here can import without registering the form in navigation.",
        { form: formName, key, listId: safeString(form.ListID), procModelId: safeString(form.ProcModelID) }
      );
    }
    if (!def) return;
    if (def.defkey && key && String(def.defkey) !== key) issue(report, "warning", "FORM_DEFKEY_MISMATCH", "Form Key and decoded Def defkey differ.", { form: formName, key, defkey: def.defkey });
    validateWorkflowDesignerCompatibility(form, def, report);
    if (scheduledLike) validateScheduledWorkflow(form, def, report);
    else validateListWorkflowRegistration(form, listsById, fieldsByList, report);
    if (approvalLike) validateApprovalDef(def, form, report, listsById, fieldsByList);
    validateFormLookupControls(def, form, listsById, fieldsByList, report);
    validateWorkflowGraph(def, form, report);
    validateWorkflowActionConfigurations(def, form, report);
    validateWorkflowReferences(def, form, listsById, fieldsByList, report, aiResourcesById);
    if (Object.prototype.hasOwnProperty.call(nodeTypes, "AI")) issue(report, "dependency", "AI_NODE_PRESENT", "AI node present in workflow; validate agent/tool dependencies before generated package use.", { form: formName, key });
    if (Object.prototype.hasOwnProperty.call(nodeTypes, "HttpRequest")) issue(report, "dependency", "HTTP_REQUEST_NODE_PRESENT", "HTTP request node present; external connection/credential dependency must be resolved.", { form: formName, key });
    if (Object.prototype.hasOwnProperty.call(nodeTypes, "GenerateDocument")) issue(report, "dependency", "GENERATE_DOCUMENT_NODE_PRESENT", "Document generation node present; template/library dependencies must be resolved.", { form: formName, key });
  });
}

function validateWorkflowDesignerCompatibility(form, def, report) {
  const severity = generatorFinalSeverity(report);
  const formName = safeString(form.Name);
  const key = safeString(form.Key);
  if (!Array.isArray(def.pageurls)) issue(report, severity, "WORKFLOW_DEF_PAGEURLS_NOT_ARRAY", "Workflow designer expects DefResource.pageurls to be an array, even for list workflows with no pages.", { form: formName, key });
  if (!Array.isArray(def.flowPage)) issue(report, severity, "WORKFLOW_DEF_FLOWPAGE_NOT_ARRAY", "Workflow designer expects DefResource.flowPage to be an array.", { form: formName, key });
  if (!isObject(def.variables)) {
    issue(report, severity, "WORKFLOW_DEF_VARIABLES_INVALID", "Workflow designer expects DefResource.variables to be an object with basic/listref/filter arrays.", { form: formName, key });
  } else {
    for (const group of ["basic", "listref", "filter"]) {
      if (!Array.isArray(def.variables[group])) {
        issue(report, severity, "WORKFLOW_DEF_VARIABLE_GROUP_NOT_ARRAY", "Workflow designer expects DefResource.variables.basic/listref/filter to be arrays.", { form: formName, key, group });
      }
    }
  }
  if (!isObject(def.graphposition)) issue(report, severity, "WORKFLOW_DEF_GRAPHPOSITION_MISSING", "Workflow designer expects DefResource.graphposition metadata.", { form: formName, key });
  if (def.graphzoom === undefined) issue(report, severity, "WORKFLOW_DEF_GRAPHZOOM_MISSING", "Workflow designer expects DefResource.graphzoom metadata.", { form: formName, key });
  if (def.graphver === undefined) issue(report, severity, "WORKFLOW_DEF_GRAPHVER_MISSING", "Workflow designer expects DefResource.graphver metadata.", { form: formName, key });

  const shapes = collectShapes(def);
  shapes.forEach((shape, index) => {
    const type = shapeType(shape);
    const id = safeString(shape.id);
    const resourceId = safeString(shape.resourceid);
    if (!id || !resourceId) {
      issue(report, severity, "WORKFLOW_SHAPE_ID_MISSING", "Workflow designer expects each childshape to include both id and resourceid.", { form: formName, key, index, type, id, resourceid: resourceId });
    }
    if (type === "SequenceFlow") {
      if (!shape.source || !safeString(shape.source.id) || !safeString(shape.source.resourceid)) {
        issue(report, severity, "WORKFLOW_SEQUENCE_SOURCE_INVALID", "SequenceFlow source should include id and resourceid.", { form: formName, key, index });
      }
      if (!shape.target || !safeString(shape.target.id) || !safeString(shape.target.resourceid)) {
        issue(report, severity, "WORKFLOW_SEQUENCE_TARGET_INVALID", "SequenceFlow target should include id and resourceid.", { form: formName, key, index });
      }
    } else if (!isObject(shape.position)) {
      issue(report, severity, "WORKFLOW_NODE_POSITION_MISSING", "Workflow designer expects non-sequence workflow nodes to include position metadata.", { form: formName, key, index, type });
    }
  });
}

function validateListWorkflowRegistration(form, listsById, fieldsByList, report) {
  const workflowType = safeString(form.WorkflowType);
  if (workflowType !== "1") return;
  const formName = safeString(form.Name);
  const key = safeString(form.Key);
  const listId = safeString(form.ListID);
  if (!listId) {
    issue(report, report.mode === "generator" ? "error" : "warning", "LIST_WORKFLOW_LISTID_MISSING", "Data-list workflow should include a ListID that links it to its host data list.", { form: formName, key });
    return;
  }
  const list = listsById.get(listId);
  if (!list) {
    issue(report, report.mode === "generator" ? "error" : "dependency", "LIST_WORKFLOW_LISTID_UNRESOLVED", "Data-list workflow ListID does not resolve to a package data list.", { form: formName, key, listId });
    return;
  }
  const mappings = asArray(list.item && list.item.FlowMappings);
  const mapping = mappings.find((entry) => safeString(entry.DefKey) === key);
  if (!mapping) {
    issue(report, report.mode === "generator" ? "error" : "warning", "LIST_WORKFLOW_FLOWMAPPING_MISSING", "Data-list workflow has no matching FlowMappings registration on the host list.", { form: formName, key, list: list.title, listId });
    return;
  }
  const mappingSetting = tryParseJson(mapping.Setting) || {};
  if (!isObject(mappingSetting)) {
    issue(report, "warning", "LIST_WORKFLOW_FLOWMAPPING_SETTING_INVALID", "Data-list workflow FlowMappings Setting should be parseable JSON.", { form: formName, key, list: list.title });
  }
  if (isObject(mappingSetting) && mappingSetting.NewTrigger !== true) {
    issue(report, report.mode === "generator" ? "error" : "warning", "LIST_WORKFLOW_NEW_TRIGGER_MISSING", "Generated data-list new-item workflows should register the trigger through FlowMappings.Setting.NewTrigger = true.", { form: formName, key, list: list.title });
  }
  if (form.Settings !== null && form.Settings !== undefined && safeString(form.Settings) !== "") {
    issue(report, generatorFinalSeverity(report), "LIST_WORKFLOW_FORM_SETTINGS_NOT_NULL", "Export-proven data-list new-item workflows keep Data.Forms[].Settings null; trigger configuration belongs in FlowMappings.Setting.", { form: formName, key, list: list.title });
  }
  const fieldName = safeString(mapping.FieldName);
  if (isObject(mappingSetting) && mappingSetting.NewTrigger === true && fieldName) {
    issue(report, generatorFinalSeverity(report), "LIST_WORKFLOW_NEW_TRIGGER_FIELDNAME_NOT_NULL", "Export-proven Add Item new-item triggers keep FlowMappings.FieldName null; non-null FieldName can render an empty trigger condition and break designer open.", { form: formName, key, list: list.title, fieldName });
  }
  if (fieldName) {
    const fields = fieldsByList.get(listId) || new Map();
    const field = fields.get(fieldName);
    if (!field) {
      issue(report, report.mode === "generator" ? "error" : "warning", "LIST_WORKFLOW_FLOWSTATUS_FIELD_UNRESOLVED", "FlowMappings FieldName does not resolve on the host data list.", { form: formName, key, list: list.title, fieldName });
    } else if (normalizeType(field) !== "flowstatus") {
      issue(report, "warning", "LIST_WORKFLOW_FLOWSTATUS_FIELD_TYPE_UNEXPECTED", "The mapped FlowMappings field is present but is not export-proven as a flowstatus field.", {
        form: formName,
        key,
        list: list.title,
        fieldName,
        fieldType: normalizeType(field),
      });
    }
  }
}

function validateScheduledWorkflow(form, def, report) {
  const severity = report.mode === "generator" && report.stage === "final" ? "error" : "warning";
  const formName = safeString(form.Name);
  const settings = isObject(form.Settings) ? form.Settings : tryParseJson(form.Settings) || {};
  const workflowType = safeString(form.WorkflowType || def && def.workflowType);
  if (workflowType !== "3") {
    issue(report, severity, "SCHEDULED_WORKFLOW_TYPE_MISMATCH", "Scheduled Workflow resources should use WorkflowType = 3.", { form: formName, key: form.Key, workflowType });
  }
  for (const key of ["TimeZone", "Times", "StartDate", "Frequency", "Interval"]) {
    if (settings[key] === undefined || settings[key] === null || settings[key] === "") {
      issue(report, severity, "SCHEDULED_WORKFLOW_SETTING_MISSING", "Scheduled Workflow Settings is missing a schedule field observed in the export.", { form: formName, key: form.Key, setting: key });
    }
  }
  if (settings.Times !== undefined && !Array.isArray(settings.Times)) {
    issue(report, severity, "SCHEDULED_WORKFLOW_TIMES_INVALID", "Scheduled Workflow Settings.Times should be an array of time strings.", { form: formName, key: form.Key });
  }
  const frequency = safeString(settings.Frequency);
  if (frequency && !["0", "1", "2"].includes(frequency)) {
    issue(report, "warning", "SCHEDULED_WORKFLOW_FREQUENCY_UNSTUDIED", "Scheduled Workflow Frequency value is not proven by the current export. Observed values are 0 for daily and 1 for weekly.", { form: formName, key: form.Key, frequency });
  }
  if (settings.Interval !== undefined && (Number.isNaN(Number(settings.Interval)) || Number(settings.Interval) < 1)) {
    issue(report, severity, "SCHEDULED_WORKFLOW_INTERVAL_INVALID", "Scheduled Workflow Interval should be a positive number.", { form: formName, key: form.Key, interval: settings.Interval });
  }
  if (frequency === "1" && !Array.isArray(settings.Values)) {
    issue(report, severity, "SCHEDULED_WORKFLOW_WEEKLY_DAYS_MISSING", "Weekly Scheduled Workflow Settings.Values should contain selected weekday numbers.", { form: formName, key: form.Key });
  }
  if (Object.prototype.hasOwnProperty.call(settings, "IsWorkday") && typeof settings.IsWorkday !== "boolean") {
    issue(report, severity, "SCHEDULED_WORKFLOW_ISWORKDAY_INVALID", "Scheduled Workflow IsWorkday should be boolean when present.", { form: formName, key: form.Key, isWorkday: settings.IsWorkday });
  }
  if (safeString(form.ListID) !== "0") {
    issue(report, severity, "SCHEDULED_WORKFLOW_LISTID_NOT_ZERO", "App-level Scheduled Workflow registration should keep Data.Forms[].ListID as 0.", { form: formName, key: form.Key, listId: safeString(form.ListID) });
  }
  if (safeString(form.Deployed) && form.Deployed !== true) {
    issue(report, "warning", "SCHEDULED_WORKFLOW_DEPLOYED_UNUSUAL", "Studied Scheduled Workflow resources export with Deployed true; confirm runtime behavior if generated packages differ.", { form: formName, key: form.Key, deployed: form.Deployed });
  }
}

function validateFormLookupControls(def, form, listsById, fieldsByList, report) {
  const severity = report.mode === "generator" && report.stage === "final" ? "error" : "warning";
  for (const page of asArray(def && def.pageurls)) {
    const formdef = typeof page.formdef === "string" ? tryParseJson(page.formdef) : page.formdef;
    asArray(formdef && formdef.children).forEach((child, childIndex) => {
      walkControls(child, (control, pointer) => {
        if (control.type !== "lookup") return;
        const attrs = control.attrs || {};
        const listId = safeString(attrs.listid || attrs.ListID || attrs.data && attrs.data.list && attrs.data.list.ListID);
        const displayField = safeString(attrs.listfield || attrs.displayfield || attrs.DisplayField || attrs.data && attrs.data.listfield);
        const location = `Data.Forms[${safeString(form.Key || form.Name)}].pageurls[${safeString(page.id || page.title)}].formdef.children[${childIndex}]${pointer.slice(1)}`;
        if (!listId) {
          issue(report, severity, "FORM_LOOKUP_TARGET_LISTID_MISSING", "Approval-form lookup control should declare target list metadata.", { form: form.Name, page: page.title || page.id, location, label: control.label || control.nv_label || null });
          return;
        }
        const target = listsById.get(listId);
        if (!target) {
          issue(report, severity, "FORM_LOOKUP_TARGET_UNRESOLVED", "Approval-form lookup control references a master/reference list not included in the package.", { form: form.Name, page: page.title || page.id, location, listId, label: control.label || control.nv_label || null });
          return;
        }
        const sampleCount = target.item && target.item.ListDatas && isObject(target.item.ListDatas) ? Object.keys(target.item.ListDatas).length : 0;
        if (!sampleCount) {
          issue(report, "warning", "FORM_LOOKUP_TARGET_LIST_EMPTY", "Approval-form lookup target list is included but has no sample/reference rows; runtime lookup selection may be empty until data is maintained.", { form: form.Name, page: page.title || page.id, location, list: target.title, listId });
        }
        const targetFields = fieldsByList.get(listId) || new Map();
        if (displayField && !targetFields.has(displayField)) {
          issue(report, severity, "FORM_LOOKUP_DISPLAY_FIELD_NOT_FOUND", "Approval-form lookup display field does not resolve on the target list.", { form: form.Name, page: page.title || page.id, location, list: target.title, listId, displayField });
        }
      });
    });
  }
}

function validateApprovalDef(def, form, report, listsById = new Map(), fieldsByList = new Map()) {
  const pages = asArray(def.pageurls);
  if (!pages.length) issue(report, "error", "APPROVAL_PAGEURLS_MISSING", "Approval form must include pageurls.", { form: form.Name, key: form.Key });
  const ids = new Set();
  pages.forEach((page, index) => {
    if (!page.id) issue(report, "error", "PAGEURL_ID_MISSING", "pageurls entry missing id.", { form: form.Name, index });
    if (page.id) ids.add(String(page.id));
    if (!page.formdef) issue(report, "error", "PAGEURL_FORMDEF_MISSING", "pageurls entry missing formdef.", { form: form.Name, page: page.title || page.name || page.id });
    const formdef = typeof page.formdef === "string" ? tryParseJson(page.formdef) : page.formdef;
    if (formdef && !Array.isArray(formdef.children)) issue(report, "error", "PAGEURL_FORMDEF_CHILDREN_NOT_ARRAY", "formdef.children must be an array.", { form: form.Name, page: page.title || page.id });
    if (isObject(formdef)) {
      validateUiStandardFormRoot(formdef, report, { surface: "approval form page", title: page.title || page.name || page.id, form: form.Name });
      validateUiStandardContainers(formdef, report, { surface: "approval form page", title: page.title || page.name || page.id, form: form.Name, requireFormBody: true });
      asArray(formdef.children).forEach((child, childIndex) => {
        walkControls(child, (control, pointer) => {
          validateEmbeddedControlSchema(control, report, {
            title: page.title || page.name || page.id,
            path: `Data.Forms[${form.Name || form.Key}].pageurls[${index}].formdef.children[${childIndex}]${pointer.slice(1)}`,
            surface: "approval form page",
          });
          if (safeString(control.type) === "document-library") {
            validateDashboardDocLibraryControl(control, page.title || page.name || page.id, page.id || index, `Data.Forms[${form.Name || form.Key}].pageurls[${index}].formdef.children[${childIndex}]${pointer.slice(1)}`, listsById, fieldsByList, report);
          }
        });
      });
    }
  });
  collectShapes(def).forEach((shape) => {
    if (shapeType(shape) !== "MultiAssignmentTask" && shapeType(shape) !== "StartNoneEvent") return;
    const taskurl = shape.properties && shape.properties.taskurl;
    if (taskurl && !ids.has(String(taskurl))) {
      issue(report, "warning", "TASKURL_PAGE_NOT_FOUND", "Workflow taskurl does not match a pageurls id.", { form: form.Name, node: shape.properties && shape.properties.name, taskurl });
    }
  });
}

function validateUiStandardFormRoot(form, report, context = {}) {
  const container = form && form.attrs && form.attrs.container;
  if (container && container.cw !== "2") {
    uiStandardWarning(report, "UI_STANDARD_CONTENT_WIDTH_NOT_FULL", "UI/UX standard forms should use full-width content area: attrs.container.cw = \"2\".", context);
  }
  if (!zeroPadding(container && container.padding)) {
    uiStandardWarning(report, "UI_STANDARD_FORM_PADDING_NOT_ZERO", "UI/UX standard forms should use zero page padding: attrs.container.padding with --sp--s0 on all sides.", context);
  }
}

function hasPageLevelBackground(root) {
  return Boolean(root && root.attrs && root.attrs.background);
}

function hasContainerBackground(control) {
  return Boolean(control && control.attrs && control.attrs.common && control.attrs.common.background);
}

function validateUiStandardContainers(root, report, context = {}) {
  const main = findControlByLabel(root, "Main");
  const content = findControlByLabel(root, "Content");
  if (!main) {
    uiStandardWarning(report, "UI_STANDARD_MAIN_CONTAINER_MISSING", "UI/UX standard pages/forms should have a top-level container with nv_label \"Main\".", context);
    return;
  }
  if (!content) {
    uiStandardWarning(report, "UI_STANDARD_CONTENT_CONTAINER_MISSING", "UI/UX standard pages/forms should place visible content inside a container with nv_label \"Content\".", context);
    return;
  }
  if (!controlContains(main, content)) {
    uiStandardWarning(report, "UI_STANDARD_CONTENT_NOT_INSIDE_MAIN", "UI/UX standard Content container should be inside Main.", context);
  }
  if (hasContainerBackground(main)) {
    uiStandardWarning(report, "MAIN_CONTAINER_PAGE_BACKGROUND", "Main should stay structural. Put full-page background on the page/form background property, and reserve container backgrounds for specific sections, cards, headers, and content surfaces.", context);
    if (!hasPageLevelBackground(root)) {
      uiStandardWarning(report, "PAGE_BACKGROUND_MISSING_WITH_MAIN_BACKGROUND", "Page/form background is missing while Main carries a background. Generated dashboards, custom list forms, and approval pages should use the page-level background setting for full-page color.", context);
    }
  }
  const actionPanel = [];
  const flowHistory = [];
  walkControls(root, (control) => {
    if (control.type === "workflowControlPanel") actionPanel.push(control);
    if (control.type === "workflowHistory") flowHistory.push(control);
  });
  if (!context.requireFormBody && !actionPanel.length && !flowHistory.length) return;
  const formBody = findControlByLabel(root, "Form body");
  const formBottom = findControlByLabel(root, "Form bottom");
  if (!formBody) uiStandardWarning(report, "UI_STANDARD_FORM_BODY_MISSING", "Approval form pages should put main fields inside a container with nv_label \"Form body\".", context);
  if (!formBottom) uiStandardWarning(report, "UI_STANDARD_FORM_BOTTOM_MISSING", "Approval form pages should put Action Panel and Flow History inside a container with nv_label \"Form bottom\".", context);
  if (formBottom) {
    for (const control of actionPanel) {
      if (!controlContains(formBottom, control)) uiStandardWarning(report, "UI_STANDARD_ACTION_PANEL_NOT_IN_FORM_BOTTOM", "workflowControlPanel should be placed inside Form bottom.", context);
    }
    for (const control of flowHistory) {
      if (!controlContains(formBottom, control)) uiStandardWarning(report, "UI_STANDARD_FLOW_HISTORY_NOT_IN_FORM_BOTTOM", "workflowHistory should be placed inside Form bottom.", context);
    }
  }
}

function validateWorkflowGraph(def, form, report) {
  const shapes = collectShapes(def);
  if (!shapes.length) {
    issue(report, "warning", "WORKFLOW_NODES_MISSING", "Workflow has no childshapes.", { form: form.Name, key: form.Key });
    return;
  }
  const ids = new Set(shapes.map(shapeId).filter(Boolean));
  shapes.forEach((shape) => {
    for (const ref of asArray(shape.outgoing)) {
      const id = refId(ref);
      if (id && !ids.has(id)) issue(report, "warning", "WORKFLOW_OUTGOING_TARGET_NOT_FOUND", "Workflow outgoing reference does not resolve.", { form: form.Name, node: shapeId(shape), outgoing: id });
    }
    for (const ref of asArray(shape.incoming)) {
      const id = refId(ref);
      if (id && !ids.has(id)) issue(report, "warning", "WORKFLOW_INCOMING_SOURCE_NOT_FOUND", "Workflow incoming reference does not resolve.", { form: form.Name, node: shapeId(shape), incoming: id });
    }
  });
  const flowsById = new Map(shapes.filter((shape) => shapeType(shape) === "SequenceFlow").map((shape) => [shapeId(shape), shape]));
  shapes.forEach((shape) => {
    if (shapeType(shape) !== "MultiAssignmentTask") return;
    const outgoingIds = asArray(shape.outgoing).map(refId).filter(Boolean);
    if (outgoingIds.length < 2) return;
    const outgoingFlows = outgoingIds.map((id) => flowsById.get(id)).filter(Boolean);
    const conditionBlob = JSON.stringify(outgoingFlows.map((flow) => flow.properties && flow.properties.conditioninfo || []));
    if (conditionBlob.includes("HasCustomPackageProduct")) {
      const hasStandardNo = conditionBlob.includes("Has Custom Package Product") && conditionBlob.includes("s.=") && conditionBlob.includes("No");
      const hasFallbackNotNo = conditionBlob.includes("Has Custom Package Product") && conditionBlob.includes("s.!=") && conditionBlob.includes("No");
      if (hasStandardNo && !hasFallbackNotNo) {
        issue(report, "warning", "WORKFLOW_BRANCH_CUSTOM_PACKAGE_FALLBACK_MISSING", "Workflow branches on HasCustomPackageProduct should include a fallback for Yes, empty, or unexpected values, typically routing to Finance/Benefits Review.", { form: form.Name, node: shape.properties && shape.properties.name || shapeId(shape) });
      }
    }
  });
}

function validateGeneratedListRuntimeUsage(data, report) {
  const listTitles = new Map();
  asArray(data && data.Childs).forEach((child) => {
    const list = child && child.ListModel ? child.ListModel : {};
    const id = safeString(list.ListID);
    const title = safeString(list.Title);
    if (id && title) listTitles.set(id, title);
  });
  if (!listTitles.size) return;
  const reads = new Map();
  const writes = new Map();
  const edits = new Map();
  for (const form of asArray(data && data.Forms)) {
    const def = parseDefResource(form, report, -1);
    if (!def) continue;
    for (const shape of collectShapes(def)) {
      if (shapeType(shape) === "ContentList") {
        const props = shape.properties || {};
        const id = safeString(props.listid || props.ListID);
        if (!id) continue;
        writes.set(id, (writes.get(id) || 0) + 1);
        if (["edit", "remove"].includes(safeString(props.type))) edits.set(id, (edits.get(id) || 0) + 1);
      }
    }
    for (const page of asArray(def.pageurls)) {
      const formdef = typeof page.formdef === "string" ? tryParseJson(page.formdef) : page.formdef;
      for (const action of asArray(formdef && formdef.actions)) {
        for (const step of asArray(action && action.steps)) {
          if (step && step.type === "querydata") {
            const ref = step.attrs && step.attrs.querydata_list;
            const id = safeString(ref && (ref.ListID || ref.listid));
            if (id) reads.set(id, (reads.get(id) || 0) + 1);
          }
        }
      }
    }
  }
  for (const [id, title] of listTitles.entries()) {
    const businessConfigLike = /(Requirement Rules|Configuration|Rules)$/i.test(title);
    const usageLike = /(Quota Usage|Usage History|Usage)$/i.test(title);
    if ((businessConfigLike || usageLike) && !reads.has(id) && !writes.has(id)) {
      issue(report, "warning", "GENERATED_LIST_UNUSED_RUNTIME_PURPOSE", "Generated configuration/usage list has no detected form-action read or workflow ContentList write/update. Use it in v1 or defer it out of the package.", { list: title, listId: id });
    }
    if (/Attachment Requirement Rules/i.test(title) && !reads.has(id)) {
      issue(report, "warning", "ATTACHMENT_RULES_NOT_READ_BY_FORM_ACTION", "Attachment Requirement Rules exists but no Query data form action reads it; prefer using it for guidance/validation or defer the list.", { list: title, listId: id });
    }
    if (/Family Quota Usage/i.test(title)) {
      if (!writes.has(id)) {
        issue(report, "warning", "FAMILY_QUOTA_USAGE_NOT_WRITTEN", "Family Quota Usage exists but no workflow ContentList write/update targets it.", { list: title, listId: id });
      }
      if (!reads.has(id)) {
        issue(report, "warning", "FAMILY_QUOTA_USAGE_NOT_READ_BY_QUOTA_CHECK", "Family Quota Usage should be read by quota-check Query data actions.", { list: title, listId: id });
      }
      if (!edits.has(id)) {
        issue(report, "warning", "FAMILY_QUOTA_USAGE_RELEASE_NOT_MODELED", "Family Quota Usage should model approval confirmation or rejection release through ContentList edit/remove when runtime-safe.", { list: title, listId: id });
      }
    }
  }
}

function validateWorkflowActionConfigurations(def, form, report) {
  const shapes = collectShapes(def);
  const actionReport = validateWorkflowActionShapes(shapes, {
    mode: report.mode,
    stage: report.stage,
    pointerForIndex: (index) => `Data.Forms[${safeString(form.Key || form.Name)}].DefResource.childshapes[${index}]`,
  });
  for (const [key, value] of Object.entries(actionReport.summary)) {
    report.summary.workflowActionConfig[key] = (report.summary.workflowActionConfig[key] || 0) + value;
  }
  actionReport.issues.forEach((entry) => {
    let level = entry.level;
    if (level === "dependency") level = "dependency";
    else if (level !== "error") level = "warning";
    issue(report, level, entry.code, entry.message, { form: form.Name, key: form.Key, ...entry });
  });
}

function validateWorkflowReferences(def, form, listsById, fieldsByList, report, aiResourcesById = new Map()) {
  collectShapes(def).forEach((shape) => {
    const type = shapeType(shape);
    const props = shape.properties || {};
    if (type === "ContentList") {
      report.summary.contentListReferences += 1;
      const listId = safeString(props.listid || props.ListID);
      if (!listId) issue(report, "error", "CONTENTLIST_LISTID_MISSING", "ContentList node missing target listid.", { form: form.Name, node: props.name || shapeId(shape) });
      else if (!listsById.has(listId)) issue(report, report.mode === "generator" ? "error" : "dependency", "CONTENTLIST_TARGET_UNRESOLVED", "ContentList target list does not resolve inside package.", { form: form.Name, node: props.name || shapeId(shape), listId });
      const targetFields = fieldsByList.get(listId) || new Map();
      asArray(props.listdatas).forEach((entry) => {
        if (entry && entry.Columns && targetFields.size && !targetFields.has(String(entry.Columns))) {
          issue(report, report.mode === "generator" ? "error" : "warning", "CONTENTLIST_TARGET_FIELD_NOT_FOUND", "ContentList target field does not resolve.", { form: form.Name, node: props.name || shapeId(shape), listId, column: entry.Columns });
        }
      });
    }
    if (type === "QueryData") {
      const listId = safeString(props.listid || props.ListID || props.sourceListId || props.sourceListID);
      if (listId && !listsById.has(listId)) issue(report, report.mode === "generator" ? "error" : "dependency", "QUERYDATA_TARGET_UNRESOLVED", "QueryData target list does not resolve inside package.", { form: form.Name, node: props.name || shapeId(shape), listId });
    }
    if (type === "AI") {
      const agentId = safeString(props.data && props.data.AgentID);
      if (safeString(props.type) === "agent") {
        if (!agentId) {
          issue(report, report.mode === "generator" ? "error" : "warning", "AI_ACTION_AGENT_REFERENCE_MISSING", "AI Assistant workflow action in agent mode is missing properties.data.AgentID.", { form: form.Name, node: props.name || shapeId(shape) });
        } else if (!aiResourcesById.has(agentId)) {
          issue(report, report.mode === "generator" ? "error" : "dependency", "AI_ACTION_AGENT_REFERENCE_UNRESOLVED", "AI Assistant workflow action references an AI Agent not included in the package.", { form: form.Name, node: props.name || shapeId(shape), agentId });
        }
      }
      if (!Array.isArray(props.inputVariables)) {
        issue(report, report.mode === "generator" ? "error" : "warning", "AI_ACTION_INPUT_VARIABLES_INVALID", "AI Assistant workflow action should store inputVariables as an array.", { form: form.Name, node: props.name || shapeId(shape) });
      } else {
        for (const input of props.inputVariables) {
          if (!isObject(input) || !safeString(input.id)) {
            issue(report, report.mode === "generator" ? "error" : "warning", "AI_ACTION_INPUT_VARIABLE_ID_MISSING", "AI Assistant workflow action input variable should include an id.", { form: form.Name, node: props.name || shapeId(shape) });
            continue;
          }
          if (!safeString(input.type)) {
            issue(report, report.mode === "generator" ? "error" : "warning", "AI_ACTION_INPUT_VARIABLE_TYPE_MISSING", "AI Assistant workflow action input variable should include a type.", { form: form.Name, node: props.name || shapeId(shape), inputId: input.id });
          }
          const expr = isObject(input.value) ? input.value.value : null;
          if (safeString(input.type) === "img") {
            if (!isObject(input.value)) {
              issue(report, report.mode === "generator" ? "error" : "warning", "AI_ACTION_IMAGE_INPUT_VALUE_MISSING", "AI Assistant workflow image input should include a structured value mapping.", { form: form.Name, node: props.name || shapeId(shape), inputId: input.id });
            } else if (isObject(expr) && safeString(expr.exprType) === "list_field") {
              const valueType = safeString(expr.valueType);
              if (valueType && !["icon-upload", "file-upload"].includes(valueType)) {
                issue(report, "warning", "AI_ACTION_IMAGE_INPUT_VALUE_TYPE_UNSTUDIED", "Studied workflow image inputs map from list fields using valueType icon-upload or file-upload.", {
                  form: form.Name,
                  node: props.name || shapeId(shape),
                  inputId: input.id,
                  valueType,
                });
              }
            }
          }
        }
      }
      if (!Array.isArray(props.outputVariables)) {
        issue(report, report.mode === "generator" ? "error" : "warning", "AI_ACTION_OUTPUT_VARIABLES_INVALID", "AI Assistant workflow action should store outputVariables as an array.", { form: form.Name, node: props.name || shapeId(shape) });
      }
      for (const output of asArray(props.outputVariables)) {
        const target = output && output.value;
        if (!isObject(target) || !safeString(target.prefix) || !safeString(target.value)) {
          issue(report, report.mode === "generator" ? "error" : "warning", "AI_ACTION_OUTPUT_MAPPING_INVALID", "AI Assistant output variable should map to a workflow variable using value.prefix and value.value.", { form: form.Name, node: props.name || shapeId(shape), outputId: output && output.id || null });
        }
      }
    }
  });
}

function buildAiResourcesById(data) {
  const out = new Map();
  for (const module of asArray(data && data.OtherModules)) {
    if (safeString(module.Type) !== "Agents") continue;
    for (const item of asArray(module.Data)) {
      const id = safeString(item && item.ID);
      if (id) out.set(id, item);
    }
  }
  return out;
}

function validateReportsDashboardsModules(data, listsById, fieldsByList, replaceIds, localIds, report) {
  report.summary.reports += asArray(data && data.DataReports).length + asArray(data && data.FormReports).length + asArray(data && data.FormNewReports).length;
  validateFormNewReports(data, report);
  for (const reportItem of [...asArray(data && data.DataReports), ...asArray(data && data.FormReports), ...asArray(data && data.FormNewReports)]) {
    const raw = JSON.stringify(reportItem);
    const ids = [...raw.matchAll(/"ListID"\s*:\s*"?(\d{12,})"?/g)].map((m) => m[1]);
    ids.forEach((id) => {
      if (!listsById.has(String(id))) issue(report, report.mode === "generator" ? "error" : "dependency", "REPORT_SOURCE_LIST_UNRESOLVED", "Report source ListID does not resolve inside package.", { report: reportItem.Title || reportItem.Name || reportItem.Key || null, listId: String(id) });
    });
  }

  const rootLayouts = asArray(data && data.Item && data.Item.Layouts);
  rootLayouts.filter((layout) => Number(layout.Type) === 103).forEach((layout) => {
    const resources = asArray(layout.LayoutInResources);
    resources.forEach((resource, index) => {
      const form = tryParseJson(resource.Resource);
      if (!form) {
        if (resource.Resource) issue(report, "warning", "DASHBOARD_RESOURCE_JSON_INVALID", "Dashboard/page Resource is not valid JSON.", { layout: layout.Title, index });
        return;
      }
      walk(form, (node) => {
        if (!isObject(node)) return;
        const listId = node.ListID || node.listid || node.listId;
        if (listId && LARGE_INTEGER_RE.test(String(listId)) && !listsById.has(String(listId))) {
          issue(report, report.mode === "generator" ? "error" : "dependency", "DASHBOARD_LIST_REFERENCE_UNRESOLVED", "Dashboard/page references a ListID not found inside package.", { layout: layout.Title, listId: String(listId) });
        }
      });
    });
  });

  asArray(data && data.OtherModules).forEach((module, index) => {
    const type = safeString(module.Type || module.type || "unknown");
    const count = Array.isArray(module.Data) ? module.Data.length : isObject(module.Data) ? Object.keys(module.Data).length : 0;
    report.inventories.modules.push({ type, count });
    if (!/^(Agents|Knowledges|Connections)$/i.test(type)) issue(report, report.mode === "generator" ? "warning" : "warning", "UNKNOWN_OTHER_MODULE", "OtherModules entry has an unknown module type.", { type, index });
  });
}

function validateFormNewReports(data, report) {
  const formsByKey = new Map();
  for (const form of asArray(data && data.Forms)) {
    const def = tryParseJson(form && form.DefResource) || {};
    const key = safeString(form && (form.Key || def.defkey));
    if (!key) continue;
    formsByKey.set(key, { form, def, variables: formReportVariableIndex(def) });
  }

  const reportChildrenById = new Map();
  for (const child of asArray(data && data.Childs)) {
    if (Number(child && child.ListModel && child.ListModel.Type) === 32) {
      reportChildrenById.set(safeString(child.ListModel.ListID), child);
    }
  }

  for (const [index, formReport] of asArray(data && data.FormNewReports).entries()) {
    const label = formReport && (formReport.Name || formReport.Title || formReport.ID || `FormNewReports[${index}]`);
    const settings = tryParseJson(formReport && formReport.Settings);
    if (!isObject(settings)) {
      issue(report, generatorFinalSeverity(report), "FORM_REPORT_SETTINGS_INVALID", "Form Report Settings must be parseable JSON object.", { report: label, index });
      continue;
    }

    const attr = tryParseJson(formReport && formReport.Attr) || {};
    for (const key of ["isViewDetail", "isExport"]) {
      if (attr[key] !== undefined && typeof attr[key] !== "boolean") {
        issue(report, "warning", "FORM_REPORT_ATTR_UNKNOWN_VALUE", "Form Report Attr uses an unrecognized value type.", { report: label, attr: key, valueType: typeof attr[key] });
      }
    }

    const source = formsByKey.get(safeString(formReport && formReport.DefKey));
    if (!source) {
      issue(report, generatorFinalSeverity(report, "dependency"), "FORM_REPORT_SOURCE_APPROVAL_FORM_UNRESOLVED", "Form Report DefKey should resolve to an included approval form.", { report: label, defKey: formReport && formReport.DefKey });
      continue;
    }

    const child = reportChildrenById.get(safeString(formReport && formReport.ID));
    if (!child) {
      issue(report, generatorFinalSeverity(report, "dependency"), "FORM_REPORT_CHILD_RESOURCE_MISSING", "Form Report should have a matching child resource with ListModel.Type = 32 and ListID equal to the report ID.", { report: label });
    } else {
      if (asArray(child.FlowMappings).length || asArray(child.PublicForms).length) {
        issue(report, generatorFinalSeverity(report), "FORM_REPORT_SHOULD_NOT_DEFINE_WORKFLOW_OR_FORMS", "Form Report resources should not define workflow mappings or edit/create forms.", { report: label, flowMappings: asArray(child.FlowMappings).length, publicForms: asArray(child.PublicForms).length });
      }
      if (child.ListModel && child.ListModel.IsBreakInherit === true && child.ListModel.Perm === undefined) {
        issue(report, "warning", "FORM_REPORT_CUSTOM_PERMISSION_INCOMPLETE", "Custom Form Report permissions should include explicit permission metadata when inheritance is disabled.", { report: label });
      }
      for (const [viewIndex, layout] of asArray(child.Layouts).entries()) {
        const layoutView = tryParseJson(layout && layout.LayoutView) || {};
        if (layoutView.Attr_IsViewDetail !== undefined && typeof layoutView.Attr_IsViewDetail !== "boolean") {
          issue(report, "warning", "FORM_REPORT_VIEW_DETAIL_ACCESS_UNRECOGNIZED", "Form Report view detail-page access flag should be boolean when present.", { report: label, viewIndex });
        }
      }
      if (asArray(child.Defs).length && asArray(settings.Fields).length && asArray(child.Defs).length !== asArray(settings.Fields).length) {
        issue(report, "warning", "FORM_REPORT_FIELD_RESOURCE_COUNT_MISMATCH", "Form Report child resource fields should align with Settings.Fields.", { report: label, settingsFields: asArray(settings.Fields).length, childFields: asArray(child.Defs).length });
      }
    }

    const subListId = safeString(settings.SubListID);
    if (Array.isArray(settings.SubListID) || isObject(settings.SubListID) || subListId.includes(",")) {
      issue(report, "warning", "FORM_REPORT_MULTIPLE_SUBLISTS_UNPROVEN", "Only one selected Form Report sub-list is export-proven; multiple sub-list generation should warn.", { report: label, subListID: settings.SubListID });
    }
    if (subListId && !source.variables.listVariables.has(subListId)) {
      issue(report, generatorFinalSeverity(report, "warning"), "FORM_REPORT_SUBLIST_UNRESOLVED", "Form Report SubListID should resolve to an approval form list variable key.", { report: label, subListID: subListId });
    }

    const keys = new Set();
    const names = new Set();
    let selectedSubListFieldCount = 0;
    for (const [fieldIndex, field] of asArray(settings.Fields).entries()) {
      const key = safeString(field && field.Key);
      const displayName = safeString(field && (field.Name || field.Label || field.PropName));
      if (!key) {
        issue(report, generatorFinalSeverity(report), "FORM_REPORT_FIELD_KEY_MISSING", "Form Report fields should include a stable Key.", { report: label, fieldIndex });
      } else if (keys.has(key)) {
        issue(report, generatorFinalSeverity(report), "FORM_REPORT_FIELD_KEY_DUPLICATE", "Form Report field Keys should be unique inside one report.", { report: label, key });
      }
      keys.add(key);
      if (displayName) {
        if (names.has(displayName)) issue(report, "warning", "FORM_REPORT_FIELD_DISPLAY_NAME_DUPLICATE", "Form Report field display names should be unique inside one report.", { report: label, fieldIndex });
        names.add(displayName);
      }

      const sourceInfo = formReportFieldSource(field, subListId, source.variables);
      if (!sourceInfo.resolved && !field.IsSystem) {
        issue(report, generatorFinalSeverity(report, "warning"), "FORM_REPORT_FIELD_SOURCE_UNRESOLVED", "Form Report field should reference a valid approval variable or selected sub-list field.", { report: label, fieldIndex, key, sourceKind: sourceInfo.kind });
      }
      if (sourceInfo.kind === "sub-list-field") selectedSubListFieldCount += 1;
      if (sourceInfo.resolved && !formReportMappingCompatible(sourceInfo.variableType, field && (field.L_Type || field.Type))) {
        issue(report, "warning", "FORM_REPORT_FIELD_TYPE_MAPPING_UNSTUDIED", "Form Report variable-to-field type mapping is not in the export-backed compatibility table.", { report: label, fieldIndex, variableType: sourceInfo.variableType, reportFieldType: field && (field.L_Type || field.Type) });
      }
      validateFormReportFieldSettings(field, label, fieldIndex, report);
    }
    if (subListId && selectedSubListFieldCount === 0) {
      issue(report, "warning", "FORM_REPORT_SUBLIST_FIELDS_MISSING", "Form Report selected a sub-list but no sub-list field mappings were detected.", { report: label, subListID: subListId });
    }
  }
}

function formReportVariableIndex(def) {
  const basicById = new Map();
  const listVariables = new Set();
  const listRefsByListVariable = new Map();
  const listFieldTypes = new Map();
  const listRefs = new Map();
  for (const variable of asArray(def && def.variables && def.variables.basic)) {
    basicById.set(safeString(variable.id), safeString(variable.type || "unknown"));
  }
  for (const listRef of asArray(def && def.variables && def.variables.listref)) {
    listRefs.set(safeString(listRef.id), asArray(listRef.fields));
  }
  for (const variable of asArray(def && def.variables && def.variables.basic)) {
    if (safeString(variable.type) !== "list") continue;
    const listVariableKey = `vlist_${safeString(variable.id)}`;
    listVariables.add(listVariableKey);
    const listRefId = safeString(variable.value && variable.value.listref);
    listRefsByListVariable.set(listVariableKey, listRefId);
    for (const field of asArray(listRefs.get(listRefId))) {
      listFieldTypes.set(`${listVariableKey}:${safeString(field.id)}`, safeString(field.type || "unknown"));
    }
  }
  return { basicById, listVariables, listRefsByListVariable, listFieldTypes };
}

function formReportFieldSource(field, subListId, variables) {
  const key = safeString(field && field.Key);
  const id = safeString(field && field.ID);
  if (field && field.IsSystem) return { kind: "system", resolved: true, variableType: "system" };
  if (subListId && key.startsWith(`${subListId}_`)) {
    const subFieldId = key.slice(`${subListId}_`.length);
    const variableType = variables.listFieldTypes.get(`${subListId}:${subFieldId}`);
    return { kind: "sub-list-field", resolved: Boolean(variableType), variableType: variableType || safeString(field && field.Type) || "unknown" };
  }
  if (key.startsWith("vlist_")) {
    return { kind: "approval-list-variable", resolved: variables.listVariables.has(key) || variables.basicById.has(id), variableType: variables.basicById.get(id) || safeString(field && field.Type) || "list" };
  }
  return { kind: "approval-variable", resolved: variables.basicById.has(id), variableType: variables.basicById.get(id) || safeString(field && field.Type) || "unknown" };
}

function formReportMappingCompatible(variableType, reportFieldType) {
  const vt = safeString(variableType).toLowerCase();
  const ft = safeString(reportFieldType).toLowerCase();
  if (!vt || !ft || vt === "system") return true;
  const allowed = {
    text: new Set(["input", "textarea", "richtext", "percent", "switch", "signature", "input_number", "currency", "datepicker", "time", "identity-picker", "organization-picker", "location-picker", "cost-center-picker", "file-upload", "icon-upload"]),
    number: new Set(["input_number", "percent", "currency", "input"]),
    boolean: new Set(["switch"]),
    date: new Set(["datepicker", "time"]),
    file: new Set(["file-upload"]),
    img: new Set(["icon-upload"]),
    user: new Set(["identity-picker"]),
    groupselect: new Set(["organization-picker"]),
    location: new Set(["location-picker"]),
    costcenter: new Set(["cost-center-picker"]),
    metadata: new Set(["metadata"]),
    "mutiple-metadata": new Set(["mutiple-metadata"]),
    lookup: new Set(["lookup"]),
    list: new Set(["textarea"]),
  };
  return allowed[vt] ? allowed[vt].has(ft) : false;
}

function validateFormReportFieldSettings(field, reportLabel, fieldIndex, report) {
  const type = safeString(field && (field.L_Type || field.Type)).toLowerCase();
  const rules = field && field.Rules;
  const hasRules = isObject(rules);
  const requireRule = (ruleName) => {
    if (!hasRules || rules[ruleName] === undefined || rules[ruleName] === null || rules[ruleName] === "") {
      issue(report, "warning", "FORM_REPORT_FIELD_SETTING_MISSING", "Form Report field type usually carries an additional setting in studied exports.", { report: reportLabel, fieldIndex, fieldType: type, setting: ruleName });
    }
  };
  if (["input_number", "percent"].includes(type)) requireRule("rounded-to");
  if (type === "currency") {
    requireRule("currencyCode");
    requireRule("displayFormat");
    requireRule("rounded-to");
  }
  if (type === "switch") requireRule("displayStyle");
  if (type === "datepicker") {
    requireRule("showtime");
    requireRule("dateformat");
  }
  if (type === "time") requireRule("dateformat");
  if (["identity-picker", "organization-picker", "cost-center-picker"].includes(type)) requireRule("multiple");
  if (type === "lookup") {
    requireRule("listid");
    requireRule("listfield");
  }
}

function parseOtherModuleData(module, report, expectedType) {
  if (!module) return [];
  const raw = module.Data;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    const parsed = tryParseJson(raw);
    if (Array.isArray(parsed)) return parsed;
    issue(report, "warning", "OTHER_MODULE_DATA_JSON_INVALID", "OtherModules Data should parse to an array for studied AI/resource modules.", { type: expectedType || module.Type || null });
    return [];
  }
  if (raw === undefined || raw === null) return [];
  issue(report, "warning", "OTHER_MODULE_DATA_NOT_ARRAY", "OtherModules Data should be an array for studied AI/resource modules.", { type: expectedType || module.Type || null, dataType: typeof raw });
  return [];
}

function validateConnectionModuleEntry(connection, index, report) {
  const name = safeString(connection && connection.Name);
  const id = safeString(connection && connection.ID);
  const type = Number(connection && connection.Type);
  if (!id) issue(report, generatorFinalSeverity(report), "CONNECTION_ID_MISSING", "Connection entries should include ID so Agent/Copilot tools can reference them.", { index, name });
  if (!name) issue(report, "warning", "CONNECTION_NAME_MISSING", "Connection entries should include a display name.", { index, id });
  if (!Number.isFinite(type)) {
    issue(report, "warning", "CONNECTION_TYPE_MISSING", "Connection entry Type is missing or not numeric.", { index, name });
  } else if (![10, 11].includes(type)) {
    issue(report, "warning", "CONNECTION_TYPE_UNSTUDIED", "Connection entry uses a Type that is not yet proven by the AI Agent/Copilot application-resource export study.", { index, name, type });
  }

  const config = tryParseJson(connection && connection.Config) || connection && connection.Config;
  if (!isObject(config)) {
    issue(report, generatorFinalSeverity(report), "CONNECTION_CONFIG_INVALID", "Connection Config should be parseable object metadata.", { index, name, id });
    return;
  }

  const configKeys = Object.keys(config);
  if (type === 10) {
    for (const key of ["Environment", "Timeout", "BaseUrl", "AuthenticationMethod", "AllowedMethods"]) {
      if (config[key] === undefined) issue(report, "warning", "HTTP_CONNECTION_CONFIG_KEY_MISSING", "HTTP API / Generic connection is missing an export-proven Config key.", { connection: name, key });
    }
  }
  if (type === 11) {
    for (const key of ["Environment", "Timeout", "BaseUrl", "GrantType", "AuthorizationMode", "AuthorizationEndpoint", "TokenEndpoint", "ClientId", "Scopes", "AllowedMethods", "AuthenticationMethod"]) {
      if (config[key] === undefined) issue(report, "warning", "OAUTH_CONNECTION_CONFIG_KEY_MISSING", "OAuth 2.0 connection is missing an export-proven Config key.", { connection: name, key });
    }
  }
  if (configKeys.some((key) => /(access[_-]?token|refresh[_-]?token|id[_-]?token|secret|password|api[_-]?key|accesskey)/i.test(key) && safeString(config[key]))) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "dependency", "CONNECTION_CONFIG_SECRET_FIELD_PRESENT", "Connection Config contains a secret/token-like field. Do not commit raw values; generated packages must use placeholders or require reconfiguration.", { connection: name });
  }
  if (configKeys.some((key) => /(clientid|endpoint|baseurl|authorization)/i.test(key) && safeString(config[key]))) {
    issue(report, "dependency", "CONNECTION_CONFIG_SENSITIVE_FIELD_PRESENT", "Connection Config contains tenant/environment-sensitive metadata. Reports and references must redact the value.", { connection: name, keys: configKeys.filter((key) => /(clientid|endpoint|baseurl|authorization)/i.test(key)) });
  }
}

function validateAgentCopilotModules(data, listsById, report) {
  const modules = new Map(asArray(data && data.OtherModules).map((module) => [safeString(module.Type), module]));
  const connections = parseOtherModuleData(modules.get("Connections"), report, "Connections");
  const aiResources = parseOtherModuleData(modules.get("Agents"), report, "Agents");
  const knowledges = parseOtherModuleData(modules.get("Knowledges"), report, "Knowledges");

  report.summary.connections = connections.length;
  report.summary.knowledges = knowledges.length;

  const connectionIds = new Set(connections.map((connection) => safeString(connection.ID)).filter(Boolean));
  const aiResourceIds = new Set(aiResources.map((resource) => safeString(resource.ID)).filter(Boolean));
  const knowledgeNames = new Set(knowledges.map((knowledge) => safeString(knowledge.Name)).filter(Boolean));
  const rootListSetId = safeString(data && data.Item && data.Item.ListModel && data.Item.ListModel.ListID);

  connections.forEach((connection, index) => validateConnectionModuleEntry(connection, index, report));

  report.summary.agents = aiResources.filter((resource) => Number(resource.Type) === 0).length;
  report.summary.copilots = aiResources.filter((resource) => Number(resource.Type) === 1).length;

  aiResources.forEach((aiResource, index) => {
    const resourceName = safeString(aiResource.Name);
    const resourceId = safeString(aiResource.ID);
    const resourceType = Number(aiResource.Type);
    if (!resourceId) issue(report, generatorFinalSeverity(report), "AI_RESOURCE_ID_MISSING", "AI Agent/Copilot resource is missing ID.", { index, name: resourceName });
    if (!resourceName) issue(report, "warning", "AI_RESOURCE_NAME_MISSING", "AI Agent/Copilot resource is missing Name.", { index, id: resourceId });
    if (aiResource.Publisher === null || aiResource.Publisher === undefined || aiResource.Publisher === "") {
      issue(report, generatorFinalSeverity(report), "AI_RESOURCE_PUBLISHER_MISSING", "Generated AI Agent/Copilot resources should set Publisher to 0 by default; null publisher metadata can fail Yeeflow import/materialization.", { index, name: resourceName, id: resourceId });
    } else if (Number.isNaN(Number(aiResource.Publisher))) {
      issue(report, generatorFinalSeverity(report), "AI_RESOURCE_PUBLISHER_INVALID", "Generated AI Agent/Copilot Publisher should be numeric, usually 0 for default generated resources.", { index, name: resourceName, id: resourceId, publisher: aiResource.Publisher });
    }
    if (![0, 1].includes(resourceType)) {
      issue(report, "warning", "AI_RESOURCE_TYPE_UNSTUDIED", "AI resources in the studied Agents module use Type 0 for AI Agent and Type 1 for Copilot.", { index, name: resourceName, type: aiResource.Type });
    }
    const settings = tryParseJson(aiResource.Settings);
    const draft = tryParseJson(aiResource.Draft);
    if (!isObject(settings)) issue(report, generatorFinalSeverity(report), "AI_RESOURCE_SETTINGS_INVALID", "AI Agent/Copilot Settings should be parseable JSON object.", { name: resourceName, id: resourceId });
    if (aiResource.Draft !== undefined && !isObject(draft)) issue(report, "warning", "AI_RESOURCE_DRAFT_INVALID", "AI Agent/Copilot Draft should be parseable JSON object when present.", { name: resourceName, id: resourceId });
    if (resourceType === 0 && isObject(settings) && settings.Prompt === undefined) {
      issue(report, "warning", "AI_AGENT_PROMPT_MISSING", "Studied AI Agent resources store persona/prompt content in Settings.Prompt.", { name: resourceName, id: resourceId });
    }
    if (resourceType === 1 && isObject(settings) && settings.Instructions === undefined) {
      issue(report, "warning", "COPILOT_INSTRUCTIONS_MISSING", "Studied Copilot resources store user-facing guidance in Settings.Instructions.", { name: resourceName, id: resourceId });
    }
    if (!Array.isArray(aiResource.Components)) {
      issue(report, generatorFinalSeverity(report), "AI_RESOURCE_COMPONENTS_NOT_ARRAY", "AI Agent/Copilot Components should be an array of knowledge/tool bindings.", { name: resourceName, id: resourceId });
      return;
    }
    aiResource.Components.forEach((component, componentIndex) => {
      const componentName = safeString(component.Name);
      const componentType = Number(component.Type);
      if (![1, 2].includes(componentType)) {
        issue(report, "warning", "AI_COMPONENT_TYPE_UNSTUDIED", "Studied AI resource Components use Type 1 for knowledge and Type 2 for tools.", { aiResource: resourceName, component: componentName, componentType });
      }
      if (componentType === 1 && componentName && !knowledgeNames.has(componentName)) {
        issue(report, "warning", "AI_KNOWLEDGE_COMPONENT_NAME_UNRESOLVED", "Knowledge component name does not match an included Knowledges module entry. Confirm import remapping before generation.", { aiResource: resourceName, component: componentName });
      }
      if (componentType !== 2) return;
      const componentSettings = tryParseJson(component.Settings);
      if (!isObject(componentSettings)) {
        issue(report, generatorFinalSeverity(report), "AI_TOOL_SETTINGS_INVALID", "AI tool component Settings should be parseable JSON object.", { aiResource: resourceName, component: componentName, componentIndex });
        return;
      }
      const dataRef = isObject(componentSettings.Data) ? componentSettings.Data : null;
      const value = safeString(dataRef && dataRef.Value);
      if (!dataRef || !value) {
        issue(report, "warning", "AI_TOOL_DATA_REFERENCE_MISSING", "AI tool component has no Settings.Data.Value reference. It may be configuration-only, but generation should not assume a target.", { aiResource: resourceName, component: componentName });
        return;
      }
      if (connectionIds.has(value)) {
        issue(report, "dependency", "AI_TOOL_EXTERNAL_CONNECTION_REFERENCE", "AI tool references an application connection. Runtime testing must not call the external system without safe test credentials.", { aiResource: resourceName, component: componentName, connectionId: value, credentialstype: componentSettings.credentialstype || null });
      } else if (value === rootListSetId) {
        if (!isObject(componentSettings.resources)) {
          issue(report, "warning", "AI_APPLICATION_RESOURCE_TOOL_RESOURCES_MISSING", "Application-resource access tool should include Settings.resources when exporting selectable app resources; absence may mean all resources are implied.", { aiResource: resourceName, component: componentName });
        } else {
          const dataListItems = asArray(componentSettings.resources.dataLists && componentSettings.resources.dataLists.items);
          if (componentSettings.resources.dataLists && !Array.isArray(componentSettings.resources.dataLists.items)) {
            issue(report, "warning", "AI_APPLICATION_RESOURCE_TOOL_DATALISTS_INVALID", "Application-resource access tool dataLists.items should be an array when present.", { aiResource: resourceName, component: componentName });
          }
          dataListItems.forEach((entry, entryIndex) => {
            const resourceListId = safeString(entry && entry.id);
            if (!resourceListId) {
              issue(report, generatorFinalSeverity(report), "AI_APPLICATION_RESOURCE_TOOL_DATALIST_ID_MISSING", "Application-resource access tool data list entry should include an id.", { aiResource: resourceName, component: componentName, entryIndex });
              return;
            }
            if (!listsById.has(resourceListId)) {
              issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "dependency", "AI_APPLICATION_RESOURCE_TOOL_DATALIST_UNRESOLVED", "Application-resource access tool references a data list that is not included in the package.", {
                aiResource: resourceName,
                component: componentName,
                listId: resourceListId,
              });
            }
            if (entry.permissions === undefined || entry.permissions === null || entry.permissions === "") {
              issue(report, generatorFinalSeverity(report), "AI_APPLICATION_RESOURCE_TOOL_PERMISSION_MISSING", "Application-resource access tool data list entry should include numeric bitmask permissions.", {
                aiResource: resourceName,
                component: componentName,
                listId: resourceListId,
              });
            } else if (Number.isNaN(Number(entry.permissions))) {
              issue(report, generatorFinalSeverity(report), "AI_APPLICATION_RESOURCE_TOOL_PERMISSION_INVALID", "Application-resource access tool data list permissions should be numeric bitmask values, not arrays or labels.", {
                aiResource: resourceName,
                component: componentName,
                listId: resourceListId,
                permissions: entry.permissions,
              });
            } else if ((Number(entry.permissions) & ~15) !== 0) {
              issue(report, "warning", "AI_APPLICATION_RESOURCE_TOOL_PERMISSION_UNEXPECTED_BITS", "Application-resource access tool permissions should use known bitmask values: create/add=1, edit/update=2, delete=4, read/view=8.", {
                aiResource: resourceName,
                component: componentName,
                listId: resourceListId,
                permissions: entry.permissions,
              });
            }
          });
        }
      } else if (listsById.has(value)) {
        const list = listsById.get(value);
        if (!Array.isArray(componentSettings.Inputs)) issue(report, "warning", "AI_LIST_TOOL_INPUTS_NOT_ARRAY", "List-backed AI tool Settings.Inputs should be an array.", { aiResource: resourceName, component: componentName, list: list.title });
        if (!Array.isArray(componentSettings.Outputs)) issue(report, "warning", "AI_LIST_TOOL_OUTPUTS_NOT_ARRAY", "List-backed AI tool Settings.Outputs should be an array.", { aiResource: resourceName, component: componentName, list: list.title });
      } else if (aiResourceIds.has(value)) {
        issue(report, "dependency", "AI_TOOL_CONNECTED_AGENT_REFERENCE", "AI tool references another AI Agent resource. Generated packages must include and remap the target Agent/Copilot together or defer the binding.", { aiResource: resourceName, component: componentName, targetResourceId: value });
      } else {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "dependency", "AI_TOOL_DATA_REFERENCE_UNRESOLVED", "AI tool Settings.Data.Value does not resolve to an included list, connection, or current app/listset.", { aiResource: resourceName, component: componentName, value });
      }
    });
  });
}

function validateLookupRelationships(listsById, fieldsByList, report) {
  for (const list of listsById.values()) {
    const fields = asArray(list.item.Defs);
    for (const field of fields) {
      const rules = parsedFieldRules(field);
      if (normalizeType(field) !== "lookup" && !rules.listid && !rules.listfield) continue;
      report.summary.lookupRelationships += 1;
      const targetListId = safeString(rules.listid || rules.ListID);
      const displayField = safeString(rules.listfield || rules.listField);
      if (!targetListId) {
        issue(report, report.mode === "generator" ? "error" : "warning", "LOOKUP_TARGET_LISTID_MISSING", "Lookup field missing target listid.", { list: list.title, field: field.DisplayName || field.FieldName });
        continue;
      }
      if (!listsById.has(targetListId)) {
        issue(report, report.mode === "generator" ? "error" : "dependency", "LOOKUP_TARGET_UNRESOLVED", "Lookup target list does not resolve inside package.", { list: list.title, field: field.DisplayName || field.FieldName, targetListId });
        continue;
      }
      const target = listsById.get(targetListId);
      const targetRecords = target.item && target.item.ListDatas && isObject(target.item.ListDatas) ? target.item.ListDatas : {};
      const targetRecordIds = new Set(Object.entries(targetRecords).flatMap(([recordId, record]) => [safeString(recordId), safeString(record && record.ListDataID)]).filter(Boolean));
      if (!targetRecordIds.size) {
        issue(report, "warning", "LOOKUP_TARGET_LIST_EMPTY", "Lookup target list is included but has no sample/reference rows; generated master/reference lists should include usable sample data when forms depend on them.", { list: list.title, field: field.DisplayName || field.FieldName, targetList: target.title, targetListId });
      }
      const targetFields = fieldsByList.get(targetListId) || new Map();
      if (displayField && !targetFields.has(displayField)) {
        issue(report, report.mode === "generator" ? "error" : "warning", "LOOKUP_DISPLAY_FIELD_NOT_FOUND", "Lookup display field does not resolve in target list.", { list: list.title, field: field.DisplayName || field.FieldName, targetListId, displayField });
      }
      const sourceRecords = list.item && list.item.ListDatas && isObject(list.item.ListDatas) ? list.item.ListDatas : {};
      for (const [recordId, record] of Object.entries(sourceRecords)) {
        if (!isObject(record)) continue;
        const value = record[field.FieldName] !== undefined ? record[field.FieldName] : record[field.InternalName];
        for (const lookupId of lookupSampleValues(value, rules.multiple === true || rules.multiple === "true")) {
          if (!targetRecordIds.has(lookupId)) {
            issue(report, report.mode === "generator" ? "error" : "warning", "SAMPLE_LOOKUP_TARGET_RECORD_NOT_FOUND", "Lookup sample value does not reference a valid target row in the included master/reference list.", {
              list: list.title,
              field: field.DisplayName || field.FieldName,
              recordId,
              value: lookupId,
              targetList: target.title,
              targetListId,
            });
          }
        }
      }
    }
  }
}

function validateSensitiveResources(data, report) {
  for (const list of [data && data.Item, ...asArray(data && data.Childs)].filter(Boolean)) {
    const title = safeString(list.ListModel && list.ListModel.Title);
    if (SECRET_KEY_RE.test(title)) issue(report, "dependency", "TOKEN_OR_CREDENTIAL_LIST", "Token/credential-like list detected. Values are not included in the report.", { title });
    for (const field of asArray(list.Defs)) {
      const label = `${field.DisplayName || ""} ${field.InternalName || ""} ${field.FieldName || ""}`;
      if (SECRET_KEY_RE.test(label)) issue(report, "dependency", "TOKEN_OR_CREDENTIAL_FIELD", "Token/credential-like field detected. Values are not included in the report.", { list: title, field: field.DisplayName || field.InternalName || field.FieldName });
    }
  }
  asArray(data && data.OtherModules).forEach((module) => {
    const type = safeString(module.Type || module.type || "unknown");
    if (/connection/i.test(type)) issue(report, "dependency", "CONNECTION_MODULE_PRESENT", "Connection module present; treat as sensitive external dependency.", { type });
    if (/agent/i.test(type)) issue(report, "dependency", "AI_AGENT_MODULE_PRESENT", "AI Agent module present; validate agent dependencies before generated package use.", { type });
    if (/knowledge/i.test(type)) issue(report, "dependency", "KNOWLEDGE_MODULE_PRESENT", "Knowledge module present; validate knowledge/copilot dependencies before generated package use.", { type });
  });
}

function validateDesignSystemColorUsage(root, report) {
  if (report.mode !== "generator") return;
  const literalHits = [];
  const arbitraryHits = [];
  walk(root, (node, pointer) => {
    if (typeof node !== "string") return;
    for (const match of node.matchAll(HEX_COLOR_RE)) {
      const color = match[0].toLowerCase();
      const token = ROOT_STYLE_TOKEN_HEX.get(color);
      const hit = { color: match[0], path: pointer, token: token || null };
      if (token) literalHits.push(hit);
      else arbitraryHits.push(hit);
    }
  });
  if (literalHits.length) {
    issue(report, "warning", "DESIGN_SYSTEM_RESOLVED_TOKEN_COLOR", "Generated UI contains literal hex colors that match known Yeeflow root tokens. Prefer token references where the target schema supports them, but do not fail exports that store resolved values.", {
      count: literalHits.length,
      examples: literalHits.slice(0, 8),
    });
  }
  if (arbitraryHits.length > 12) {
    issue(report, "warning", "DESIGN_SYSTEM_ARBITRARY_COLOR_USAGE", "Generated UI contains many hard-coded hex colors. Prefer semantic Yeeflow root tokens for primary, success, warning, danger, neutral, background, and text colors where supported.", {
      count: arbitraryHits.length,
      examples: arbitraryHits.slice(0, 8),
    });
  }
}

function validatePlaceholders(root, report) {
  const placeholders = [];
  walk(root, (node, pointer) => {
    if (typeof node === "string" && PLACEHOLDER_RE.test(node)) placeholders.push({ placeholder: node, path: pointer });
  });
  for (const entry of placeholders) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "UNRESOLVED_PLACEHOLDER", "Unresolved placeholder found.", entry);
  }
}

function finish(report) {
  delete report._largeNumbers;
  delete report._controlFieldSchemas;
  if (report.errors.length) report.status = "fail";
  else if (report.warnings.length || report.dependencies.length) report.status = "pass_with_warnings";
  else report.status = "pass";
  return report;
}

function main() {
  const args = parseArgs(process.argv);
  const report = validate(args.input, args.mode, args.stage);
  console.log(JSON.stringify(report, null, 2));
  if (report.status === "fail") process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({
    status: "fail",
    mode: null,
    stage: null,
    errors: [{ code: "VALIDATOR_RUNTIME_ERROR", message: error.message }],
    warnings: [],
    dependencies: [],
  }, null, 2));
  process.exit(1);
}
