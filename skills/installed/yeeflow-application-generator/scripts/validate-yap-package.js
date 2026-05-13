#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const PLACEHOLDER_RE = /^__.*REQUIRED.*__$/;
const SECRET_KEY_RE = /(token|secret|password|credential|clientsecret|apikey|api_key|accesskey|authorization|bearer)/i;

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

function listIdOf(item) {
  return safeString(item && item.ListModel && item.ListModel.ListID);
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
      listWorkflows: 0,
      reports: 0,
      dashboards: 0,
      agents: 0,
      copilots: 0,
      connections: 0,
      knowledges: 0,
      replaceIds: 0,
      lookupRelationships: 0,
      contentListReferences: 0,
    },
    inventories: {
      resources: [],
      forms: [],
      modules: [],
    },
    _largeNumbers: new Set(),
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

  resourceItems.forEach((item, index) => {
    validateResourceItem(item, index, index === 0, rootListSetId, replaceIds, localIds, listsById, fieldsByList, report);
  });

  validateRootAppShell(data, wrapper, replaceIds, listsById, report);
  validateReplaceIds(replaceIds, localIds, report);
  validateForms(data, listsById, fieldsByList, replaceIds, localIds, report);
  validateReportsDashboardsModules(data, listsById, fieldsByList, replaceIds, localIds, report);
  validateLookupRelationships(listsById, fieldsByList, report);
  validateSensitiveResources(data, report);
  validatePlaceholders({ wrapper, resource, data }, report);

  if (report._largeNumbers.size) {
    issue(report, "warning", "LARGE_NUMERIC_IDS", "Large numeric IDs were preserved as strings.", { count: report._largeNumbers.size });
  }

  return finish(report);
}

function validateRootAppShell(data, wrapper, replaceIds, listsById, report) {
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
  for (const key of ["AppTags", "AppMetadatas", "AppComponents"]) {
    if (!Array.isArray(data[key])) {
      issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", `${key.toUpperCase()}_NOT_ARRAY`, `Data.${key} should be an array for app-level packages; real app exports use an array even when empty.`);
    }
  }
  if (!Array.isArray(data.AppThemes) || !data.AppThemes.length) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "APP_THEME_MISSING", "Generated app packages should include at least one AppThemes entry; real openable apps include application style metadata.");
  }
  const rootLayouts = asArray(data.Item && data.Item.Layouts);
  const rootPageLayouts = new Set(rootLayouts.filter((layout) => safeString(layout.Type) === "103").map((layout) => safeString(layout.LayoutID)).filter(Boolean));
  if (!rootPageLayouts.size) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_APP_PAGE_LAYOUT_MISSING", "Root app/ListSet should include at least one Type 103 app page layout; real app exports use it as an openable app shell.");
  }
  for (const layout of rootLayouts.filter((candidate) => safeString(candidate.Type) === "103")) {
    const layoutId = safeString(layout.LayoutID);
    if (layout.LayoutView !== null && layout.LayoutView !== undefined) {
      issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_APP_PAGE_LAYOUTVIEW_NOT_NULL", "Root Type 103 app page LayoutView should be null; working exports store page content in LayoutInResources.Resource.", { title: layout.Title, layoutId });
    }
    const resources = asArray(layout.LayoutInResources);
    if (!resources.length) {
      issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_APP_PAGE_RESOURCE_MISSING", "Root Type 103 app page layout should include LayoutInResources with embedded page content.", { title: layout.Title, layoutId });
      continue;
    }
    for (const resource of resources) {
      const resourceId = safeString(resource.ID);
      const refId = safeString(resource.RefId);
      if (!resourceId || !refId || !safeString(resource.Resource)) {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_APP_PAGE_RESOURCE_INCOMPLETE", "Root Type 103 app page LayoutInResources entry must include ID, RefId, and Resource.", { title: layout.Title, layoutId });
      }
      if (resourceId === layoutId || refId === layoutId) {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_APP_PAGE_RESOURCE_ID_MATCHES_LAYOUTID", "Root Type 103 app pages use a separate LayoutInResources ID/RefId from LayoutID in real exports.", { title: layout.Title, layoutId, resourceId, refId });
      }
      if (resourceId && refId && resourceId !== refId) {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_APP_PAGE_RESOURCE_ID_REFID_MISMATCH", "Root Type 103 app page LayoutInResources ID and RefId should match each other while remaining separate from LayoutID.", { title: layout.Title, layoutId, resourceId, refId });
      }
      if (replaceIds.has(resourceId) || replaceIds.has(refId)) {
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
      }
    }
  }
  const layoutView = tryParseJson(root.LayoutView);
  if (!layoutView) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_LAYOUTVIEW_INVALID", "Root app/ListSet LayoutView must be parseable JSON navigation metadata.");
    return;
  }
  const navItems = flattenNavigationItems(layoutView.sort || []);
  if (!navItems.length) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_NAVIGATION_EMPTY", "Root app/ListSet LayoutView.sort is empty; generated apps need navigation entries to open reliably.");
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
  }
}

function validateResourceItem(item, index, isRoot, rootListSetId, replaceIds, localIds, listsById, fieldsByList, report) {
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
  }

  if (listId) {
    listsById.set(listId, { item, title, listId, listSetId, resourceType });
    localIds.add(listId);
  }
  const fields = asArray(item.Defs);
  const fieldsByName = new Map();
  const fieldNames = new Set();
  const fieldInternal = new Set();
  for (const [fieldIndex, field] of fields.entries()) {
    const fp = `${pathPrefix}.Defs[${fieldIndex}]`;
    const fieldId = safeString(field.FieldID);
    const fieldName = safeString(field.FieldName);
    const internalName = safeString(field.InternalName);
    const displayName = safeString(field.DisplayName);
    if (!fieldId) issue(report, "error", "FIELD_ID_MISSING", "FieldID is required.", { path: `${fp}.FieldID`, list: title });
    else localIds.add(fieldId);
    if (!fieldName) issue(report, "error", "FIELD_NAME_MISSING", "FieldName is required.", { path: `${fp}.FieldName`, list: title });
    if (!displayName) issue(report, "warning", "FIELD_DISPLAY_NAME_MISSING", "Field DisplayName is missing.", { path: `${fp}.DisplayName`, list: title, fieldName });
    if (fieldName) {
      if (fieldNames.has(fieldName)) issue(report, "error", "FIELD_NAME_DUPLICATE", "Duplicate FieldName in resource.", { list: title, fieldName });
      fieldNames.add(fieldName);
      fieldsByName.set(fieldName, field);
    }
    if (internalName) {
      if (fieldInternal.has(internalName)) issue(report, "warning", "FIELD_INTERNAL_NAME_DUPLICATE", "Duplicate InternalName in resource.", { list: title, internalName });
      fieldInternal.add(internalName);
      fieldsByName.set(internalName, field);
    }
    if (displayName) fieldsByName.set(displayName, field);
    if (fieldId) fieldsByName.set(fieldId, field);
    if (!isRoot && resourceType === "data list" && fieldName === "Title" && (field.Status !== 0 || field.IsSystem !== true || field.IsIndex !== true)) {
      issue(
        report,
        generatorFinalSeverity(report),
        "DATA_LIST_TITLE_FIELD_NATIVE_METADATA_INVALID",
        "Generated child data lists must preserve Yeeflow's native Title field metadata; otherwise api/crafts/datas/{AppID}/{ListID}/query can fail at runtime.",
        {
          list: title,
          listId,
          path: fp,
          status: field.Status,
          isSystem: field.IsSystem,
          isIndex: field.IsIndex,
          expected: { Status: 0, IsSystem: true, IsIndex: true },
        }
      );
    }
    if (field.Rules && !tryParseJson(field.Rules)) issue(report, "warning", "FIELD_RULES_JSON_INVALID", "Field Rules is not valid JSON.", { list: title, field: displayName || fieldName });
    if (normalizeType(field) === "unknown") issue(report, "warning", "FIELD_TYPE_UNKNOWN", "Field type could not be normalized.", { list: title, field: displayName || fieldName, fieldType: field.FieldType, controlType: field.Type });
  }
  if (listId) fieldsByList.set(listId, fieldsByName);

  const layouts = asArray(item.Layouts);
  const layoutIds = new Set(layouts.map((layout) => safeString(layout.LayoutID)).filter(Boolean));
  if (!isRoot && item.ListModel && item.ListModel.LayoutView) {
    const listLayoutView = tryParseJson(item.ListModel.LayoutView);
    if (listLayoutView) {
      for (const key of ["add", "edit", "view"]) {
        const assignedLayoutId = safeString(listLayoutView[key]);
        if (assignedLayoutId && !layoutIds.has(assignedLayoutId)) {
          issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "LIST_LAYOUTVIEW_FORM_REFERENCE_UNRESOLVED", "ListModel.LayoutView add/edit/view points to a layout ID that does not belong to this list.", { list: title, key, assignedLayoutId });
        }
      }
    }
  }
  layouts.forEach((layout, layoutIndex) => {
    const layoutId = safeString(layout.LayoutID);
    if (!layoutId) issue(report, "error", "LAYOUT_ID_MISSING", "LayoutID is required.", { path: `${pathPrefix}.Layouts[${layoutIndex}].LayoutID`, list: title });
    else localIds.add(layoutId);
    if (!isRoot && Number(layout.Type || 0) === 0) validateDataListViewLayout(layout, fieldsByName, `${pathPrefix}.Layouts[${layoutIndex}]`, report);
    if (Number(layout.Type) === 1) validateCustomFormLayout(layout, fieldsByName, `${pathPrefix}.Layouts[${layoutIndex}]`, report);
    if (Number(layout.Type) === 103 && isRoot) report.summary.dashboards += 1;
  });

  const recordCount = item.ListDatas && isObject(item.ListDatas) ? Object.keys(item.ListDatas).length : 0;
  if (item.ListDatas && !isObject(item.ListDatas)) issue(report, "error", "LISTDATAS_BAD_TYPE", "Item.ListDatas must be an object when present.", { path: `${pathPrefix}.ListDatas`, list: title });
  if (recordCount) {
    for (const [recordId, record] of Object.entries(item.ListDatas)) {
      if (recordId && LARGE_INTEGER_RE.test(recordId)) localIds.add(recordId);
      if (record && record.ListDataID && LARGE_INTEGER_RE.test(String(record.ListDataID))) localIds.add(String(record.ListDataID));
      if (isObject(record)) {
        Object.keys(record).forEach((key) => {
          if (!["ListDataID", "Created", "CreatedBy", "Modified", "ModifiedBy", "CreatedByName", "ModifiedByName"].includes(key) && !fieldsByName.has(key)) {
            issue(report, "warning", "SAMPLE_FIELD_NOT_FOUND", "Sample data field does not resolve to a known field.", { list: title, recordId, field: key });
          }
        });
      }
    }
  }

  report.inventories.resources.push({ title, listId, listSetId, resourceType, fields: fields.length, layouts: layouts.length, sampleRecords: recordCount });
  if (!isRoot) report.summary.childResources += 1;
  if (resourceType === "data list") report.summary.dataLists += 1;
  if (resourceType === "document library") report.dependencies.push({ code: "DOCUMENT_LIBRARY_RESOURCE", message: "Document library resource present; confirm document dependencies after import.", list: title, listId });
  if (resourceType === "report/data resource" || resourceType === "form report/list resource") report.summary.reports += 1;
}

function validateDataListViewLayout(layout, fieldsByName, pathPrefix, report) {
  const view = tryParseJson(layout.LayoutView);
  const severity = report.mode === "generator" && report.stage === "final" ? "error" : "warning";
  if (!view) {
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
  if (!asArray(form.children).length) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "CUSTOM_FORM_EMPTY_CHILDREN", "Assigned custom form has no controls.", { title: layout.Title });
  }
  asArray(form.children).forEach((child, index) => walkControls(child, (control, pointer) => {
    const binding = control.binding;
    if (binding && !fieldsByName.has(String(binding))) {
      issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_BINDING_NOT_FOUND", "Custom form control binding does not resolve to a field.", { title: layout.Title, binding, path: `${pathPrefix}.LayoutInResources[0].Resource.children[${index}]${pointer.slice(1)}` });
    }
    if (control.fieldID && !fieldsByName.has(String(control.fieldID))) {
      issue(report, "warning", "CUSTOM_FORM_FIELDID_NOT_FOUND", "Custom form control fieldID does not resolve to a field.", { title: layout.Title, fieldID: control.fieldID });
    }
  }));
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

function validateForms(data, listsById, fieldsByList, replaceIds, localIds, report) {
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
    if (approvalLike) validateApprovalDef(def, form, report);
    validateWorkflowGraph(def, form, report);
    validateWorkflowReferences(def, form, listsById, fieldsByList, report);
    if (Object.prototype.hasOwnProperty.call(nodeTypes, "AI")) issue(report, "dependency", "AI_NODE_PRESENT", "AI node present in workflow; validate agent/tool dependencies before generated package use.", { form: formName, key });
    if (Object.prototype.hasOwnProperty.call(nodeTypes, "HttpRequest")) issue(report, "dependency", "HTTP_REQUEST_NODE_PRESENT", "HTTP request node present; external connection/credential dependency must be resolved.", { form: formName, key });
    if (Object.prototype.hasOwnProperty.call(nodeTypes, "GenerateDocument")) issue(report, "dependency", "GENERATE_DOCUMENT_NODE_PRESENT", "Document generation node present; template/library dependencies must be resolved.", { form: formName, key });
  });
}

function validateApprovalDef(def, form, report) {
  const pages = asArray(def.pageurls);
  if (!pages.length) issue(report, "error", "APPROVAL_PAGEURLS_MISSING", "Approval form must include pageurls.", { form: form.Name, key: form.Key });
  const ids = new Set();
  pages.forEach((page, index) => {
    if (!page.id) issue(report, "error", "PAGEURL_ID_MISSING", "pageurls entry missing id.", { form: form.Name, index });
    if (page.id) ids.add(String(page.id));
    if (!page.formdef) issue(report, "error", "PAGEURL_FORMDEF_MISSING", "pageurls entry missing formdef.", { form: form.Name, page: page.title || page.name || page.id });
    if (page.formdef && !Array.isArray(page.formdef.children)) issue(report, "error", "PAGEURL_FORMDEF_CHILDREN_NOT_ARRAY", "formdef.children must be an array.", { form: form.Name, page: page.title || page.id });
  });
  collectShapes(def).forEach((shape) => {
    if (shapeType(shape) !== "MultiAssignmentTask" && shapeType(shape) !== "StartNoneEvent") return;
    const taskurl = shape.properties && shape.properties.taskurl;
    if (taskurl && !ids.has(String(taskurl))) {
      issue(report, "warning", "TASKURL_PAGE_NOT_FOUND", "Workflow taskurl does not match a pageurls id.", { form: form.Name, node: shape.properties && shape.properties.name, taskurl });
    }
  });
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
}

function validateWorkflowReferences(def, form, listsById, fieldsByList, report) {
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
  });
}

function validateReportsDashboardsModules(data, listsById, fieldsByList, replaceIds, localIds, report) {
  report.summary.reports += asArray(data && data.DataReports).length + asArray(data && data.FormReports).length + asArray(data && data.FormNewReports).length;
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
    if (/agent/i.test(type)) report.summary.agents += count || 1;
    else if (/knowledge/i.test(type)) report.summary.knowledges += count || 1;
    else if (/copilot/i.test(type)) report.summary.copilots += count || 1;
    else if (/connection/i.test(type)) report.summary.connections += count || 1;
    else issue(report, report.mode === "generator" ? "warning" : "warning", "UNKNOWN_OTHER_MODULE", "OtherModules entry has an unknown module type.", { type, index });
  });
}

function validateLookupRelationships(listsById, fieldsByList, report) {
  for (const list of listsById.values()) {
    const fields = asArray(list.item.Defs);
    for (const field of fields) {
      const rules = tryParseJson(field.Rules) || {};
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
      const targetFields = fieldsByList.get(targetListId) || new Map();
      if (displayField && !targetFields.has(displayField)) {
        issue(report, report.mode === "generator" ? "error" : "warning", "LOOKUP_DISPLAY_FIELD_NOT_FOUND", "Lookup display field does not resolve in target list.", { list: list.title, field: field.DisplayName || field.FieldName, targetListId, displayField });
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
