#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const DEFAULT_YAP_SCHEMA = "/Users/Renger/Downloads/yap-v1-schema.json";
const FALLBACK_YAP_SCHEMA = "/Users/Renger/Downloads/yap-schema_v2.json";
const DEFAULT_YAPK_SCHEMA = "/Users/Renger/Downloads/yapk-schema_v2.json";
const FALLBACK_YAPK_SCHEMA = "/Users/Renger/Downloads/yapk-schema.json";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/validate-standard-package-schema.mjs <package.yap|package.yapk> [--yap-schema <path>] [--yapk-schema <path>]",
    "",
    "Validates the package wrapper and decoded Resource against the supplied Yeeflow standard schemas.",
    "Output is redacted and does not print raw Resource, Sign, or decoded payloads.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function readJson(file) {
  return parseJsonPreservingLargeInts(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function resolveSchemaPath(type) {
  const requested = type === "yap" ? argValue("--yap-schema", DEFAULT_YAP_SCHEMA) : argValue("--yapk-schema", DEFAULT_YAPK_SCHEMA);
  if (fs.existsSync(requested)) return requested;
  if (type === "yap" && requested === DEFAULT_YAP_SCHEMA && fs.existsSync(FALLBACK_YAP_SCHEMA)) return FALLBACK_YAP_SCHEMA;
  if (type === "yapk" && requested === DEFAULT_YAPK_SCHEMA && fs.existsSync(FALLBACK_YAPK_SCHEMA)) return FALLBACK_YAPK_SCHEMA;
  return requested;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function schemaAt(root, ref) {
  if (!ref.startsWith("#/")) throw new Error(`Unsupported schema ref: ${ref}`);
  return ref.slice(2).split("/").reduce((node, part) => node?.[part.replace(/~1/g, "/").replace(/~0/g, "~")], root);
}

function typeMatches(value, expected) {
  if (Array.isArray(expected)) return expected.some((type) => typeMatches(value, type));
  if (expected === "array") return Array.isArray(value);
  if (expected === "object") return isObject(value);
  if (expected === "integer") return isIntegerLike(value);
  if (expected === "number") return typeof value === "number" && Number.isFinite(value);
  if (expected === "string") return typeof value === "string";
  if (expected === "boolean") return typeof value === "boolean";
  if (expected === "null") return value === null;
  return true;
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

function isIntegerLike(value) {
  return Number.isInteger(value) || (typeof value === "string" && LARGE_INTEGER_RE.test(value));
}

function validate(value, schema, root, instancePath = "$", errors = []) {
  if (!schema || typeof schema !== "object") return errors;
  if (schema.$ref) return validate(value, schemaAt(root, schema.$ref), root, instancePath, errors);
  if (Array.isArray(schema.allOf)) {
    for (const child of schema.allOf) validate(value, child, root, instancePath, errors);
  }
  if (schema.if && schema.then) {
    const ifErrors = [];
    validate(value, schema.if, root, instancePath, ifErrors);
    if (ifErrors.length === 0) validate(value, schema.then, root, instancePath, errors);
  }
  if (Array.isArray(schema.oneOf)) {
    let matches = 0;
    for (const child of schema.oneOf) {
      const childErrors = [];
      validate(value, child, root, instancePath, childErrors);
      if (childErrors.length === 0) matches += 1;
    }
    if (matches !== 1) errors.push({ path: instancePath, code: "oneOf", message: `Expected exactly one oneOf branch to match; matched ${matches}.` });
  }
  if (schema.type !== undefined && !typeMatches(value, schema.type)) {
    errors.push({ path: instancePath, code: "type", message: `Expected type ${JSON.stringify(schema.type)}, got ${Array.isArray(value) ? "array" : value === null ? "null" : typeof value}.` });
    return errors;
  }
  if (schema.const !== undefined && value !== schema.const) {
    errors.push({ path: instancePath, code: "const", message: `Expected const ${JSON.stringify(schema.const)}.` });
  }
  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
    errors.push({ path: instancePath, code: "enum", message: "Value is outside schema enum." });
  }
  if (typeof value === "string" && schema.pattern) {
    const re = new RegExp(schema.pattern);
    if (!re.test(value)) errors.push({ path: instancePath, code: "pattern", message: `String does not match pattern ${schema.pattern}.` });
  }
  if (typeof value === "string" && schema.format === "date-time") {
    const time = Date.parse(value);
    if (!Number.isFinite(time)) errors.push({ path: instancePath, code: "format", message: "String is not a valid date-time." });
  }
  if (typeof value === "number" && schema.minimum !== undefined && value < schema.minimum) {
    errors.push({ path: instancePath, code: "minimum", message: `Number is below minimum ${schema.minimum}.` });
  }
  if (Array.isArray(value) && schema.items) {
    value.forEach((item, index) => validate(item, schema.items, root, `${instancePath}[${index}]`, errors));
  }
  if (isObject(value)) {
    const properties = schema.properties || {};
    for (const key of schema.required || []) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) errors.push({ path: `${instancePath}.${key}`, code: "required", message: "Required property is missing." });
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.prototype.hasOwnProperty.call(properties, key)) errors.push({ path: `${instancePath}.${key}`, code: "additionalProperties", message: "Property is not allowed by schema." });
      }
    }
    for (const [key, childSchema] of Object.entries(properties)) {
      if (Object.prototype.hasOwnProperty.call(value, key)) validate(value[key], childSchema, root, `${instancePath}.${key}`, errors);
    }
  }
  return errors;
}

function decodeYap(wrapper) {
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error(`YAP Resource must start with ${GZIP_PREFIX}`);
  }
  const text = zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8");
  return parseJsonPreservingLargeInts(text);
}

function decodedYapData(decoded, schema) {
  if (!isObject(decoded) || !("Data" in decoded)) {
    return {
      data: null,
      errors: [{
        scope: "decodedResource",
        path: "$.Resource",
        code: "YAP_RESOURCE_NOT_LIST_EXPORT_RESULT",
        message: "Decoded YAP Resource must be ListExportResult with Data, not direct ListExportInfo.",
      }],
    };
  }
  if (typeof decoded.Data === "string") {
    try {
      return { data: parseJsonPreservingLargeInts(decoded.Data), errors: [] };
    } catch (error) {
      return {
        data: null,
        errors: [{
          scope: "decodedResource",
          path: "$.Data",
          code: "YAP_DATA_JSON_INVALID",
          message: `ListExportResult.Data string did not parse as JSON: ${error.message}`,
        }],
      };
    }
  }
  if (isObject(decoded.Data)) return { data: decoded.Data, errors: [] };
  return {
    data: null,
    errors: [{
      scope: "decodedResource",
      path: "$.Data",
      code: "YAP_DATA_INVALID",
      message: "ListExportResult.Data must be a JSON string or ListExportInfo object.",
    }],
  };
}

async function decodeYapk(wrapper) {
  if (typeof wrapper.Resource !== "string") throw new Error("YAPK Resource must be a string.");
  const bytes = Buffer.from(wrapper.Resource, "base64");
  try {
    return parseJsonPreservingLargeInts(zlib.brotliDecompressSync(bytes).toString("utf8"));
  } catch (syncError) {
    const text = await tolerantBrotliText(bytes);
    if (text) return parseJsonPreservingLargeInts(text);
    throw syncError;
  }
}

function tolerantBrotliText(bytes) {
  return new Promise((resolve) => {
    const stream = zlib.createBrotliDecompress();
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", () => resolve(Buffer.concat(chunks).toString("utf8")));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    stream.end(bytes);
  });
}

function inspectFieldCategories(decoded, type) {
  const errors = [];
  const groups = [];
  if (type === "yap") {
    if (decoded.Item) groups.push({ path: "$.Item.Defs", list: decoded.Item.ListModel?.Title || null, fields: decoded.Item.Defs || [] });
    (decoded.Childs || []).forEach((child, index) => groups.push({ path: `$.Childs[${index}].Defs`, list: child.ListModel?.Title || null, fields: child.Defs || [] }));
  } else {
    if (decoded.ListSet) groups.push({ path: "$.ListSet.Fields", list: decoded.ListSet.List?.Title || null, fields: decoded.ListSet.Fields || [] });
    (decoded.Childs || []).forEach((child, index) => groups.push({ path: `$.Childs[${index}].Fields`, list: child.List?.Title || null, fields: child.Fields || [] }));
  }
  for (const group of groups) {
    group.fields.forEach((field, index) => {
      if (!isIntegerLike(field?.Category)) {
        errors.push({
          scope: "decodedResource",
          path: `${group.path}[${index}].Category`,
          code: "FIELD_CATEGORY_NOT_INT",
          message: "Field.Category must be an integer.",
          list: group.list,
          field: field?.DisplayName || field?.FieldName || field?.InternalName || null,
          actualType: field?.Category === undefined ? "missing" : Array.isArray(field?.Category) ? "array" : field?.Category === null ? "null" : typeof field?.Category,
        });
      }
      if (type === "yap" && typeof field?.FieldName === "string" && isIntegerLike(field?.FieldIndex)) {
        const match = field.FieldName.match(/(\d+)$/);
        if (!match || Number.parseInt(match[1], 10) !== Number(field.FieldIndex)) {
          errors.push({
            scope: "decodedResource.Data",
            path: `${group.path}[${index}].FieldName`,
            code: "FIELD_NAME_SUFFIX_INDEX_MISMATCH",
            message: "FieldName trailing digits must equal FieldIndex.",
            list: group.list,
            field: field.DisplayName || field.FieldName || field.InternalName || null,
            fieldName: field.FieldName,
            fieldIndex: field.FieldIndex,
          });
        }
      }
    });
  }
  return errors;
}

function pushDuplicate(errors, code, message, seen, value, detail) {
  const key = String(value);
  const previous = seen.get(key);
  if (previous) {
    errors.push({
      scope: "decodedResource.Data",
      code,
      message,
      value,
      previousPath: previous.path,
      ...detail,
    });
  } else {
    seen.set(key, detail);
  }
}

function inspectYapIds(data) {
  const errors = [];
  const listIds = new Map();
  const fieldIds = new Map();
  const layoutIds = new Map();
  const resourceIds = new Map();
  const idKeys = new Set(["AppID", "ListID", "FieldID", "LayoutID", "ID", "RefId", "ReportID", "ProcModelID", "ResourceID"]);
  const assertSafeIntegerId = (value, path) => {
    if (value === undefined || value === null || value === "") return;
    if (typeof value === "string" && LARGE_INTEGER_RE.test(value)) return;
    if (!Number.isInteger(value)) {
      errors.push({
        scope: "decodedResource.Data",
        path,
        code: "INVALID_ID_TYPE",
        message: "Generated YAP ID values must be JSON integers.",
        actualType: Array.isArray(value) ? "array" : value === null ? "null" : typeof value,
      });
    } else if (!Number.isSafeInteger(value)) {
      errors.push({
        scope: "decodedResource.Data",
        path,
        code: "UNSAFE_INTEGER_ID",
        message: "Generated YAP integer IDs parsed as JavaScript numbers must be within Number.MAX_SAFE_INTEGER; preserve API-issued 64-bit IDs as raw JSON integer tokens during parsing.",
        value,
      });
    }
  };
  const walk = (value, path = "$") => {
    if (Array.isArray(value)) value.forEach((child, index) => walk(child, `${path}[${index}]`));
    else if (isObject(value)) {
      for (const [key, child] of Object.entries(value)) {
        const childPath = `${path}.${key}`;
        if (idKeys.has(key)) assertSafeIntegerId(child, childPath);
        walk(child, childPath);
      }
    }
  };
  walk(data);

  const items = [];
  if (data?.Item) items.push({ item: data.Item, path: "$.Item", title: data.Item.ListModel?.Title || "root" });
  (data?.Childs || []).forEach((child, index) => items.push({ item: child, path: `$.Childs[${index}]`, title: child.ListModel?.Title || null }));
  for (const { item, path: itemPath, title } of items) {
    const listId = item?.ListModel?.ListID;
    const appId = item?.ListModel?.AppID;
    if (appId !== undefined && String(appId) !== "41") {
      errors.push({
        scope: "decodedResource.Data",
        path: `${itemPath}.ListModel.AppID`,
        code: "LISTMODEL_APPID_NOT_FIXED_41",
        message: "Generated YAP ListModel.AppID must stay fixed at 41; use API-issued IDs for list/field/layout IDs only.",
        list: title,
        appId,
      });
    }
    if (listId !== undefined) {
      assertSafeIntegerId(listId, `${itemPath}.ListModel.ListID`);
      pushDuplicate(errors, "DUPLICATE_LIST_ID", "ListID values must be globally unique across generated ListExportItem resources.", listIds, listId, { path: `${itemPath}.ListModel.ListID`, list: title });
    }
    const fieldIndexes = new Map();
    const fieldNames = new Map();
    const internalNames = new Map();
    const displayNames = new Map();
    (item?.Defs || []).forEach((field, index) => {
      const fieldPath = `${itemPath}.Defs[${index}]`;
      const fieldLabel = field?.DisplayName || field?.FieldName || field?.InternalName || null;
      if (field?.FieldID !== undefined) {
        assertSafeIntegerId(field.FieldID, `${fieldPath}.FieldID`);
        pushDuplicate(errors, "DUPLICATE_FIELD_ID", "FieldID values must be globally unique in generated packages.", fieldIds, field.FieldID, { path: `${fieldPath}.FieldID`, list: title, field: fieldLabel });
      }
      if (field?.FieldIndex !== undefined) {
        assertSafeIntegerId(field.FieldIndex, `${fieldPath}.FieldIndex`);
        pushDuplicate(errors, "DUPLICATE_FIELD_INDEX", "FieldIndex values must be unique within a list.", fieldIndexes, field.FieldIndex, { path: `${fieldPath}.FieldIndex`, list: title, field: fieldLabel });
      }
      if (field?.FieldName) pushDuplicate(errors, "DUPLICATE_FIELD_NAME", "FieldName values must be unique within a list.", fieldNames, field.FieldName, { path: `${fieldPath}.FieldName`, list: title, field: fieldLabel });
      if (field?.InternalName) pushDuplicate(errors, "DUPLICATE_INTERNAL_NAME", "InternalName values must be unique within a list.", internalNames, field.InternalName, { path: `${fieldPath}.InternalName`, list: title, field: fieldLabel });
      if (field?.DisplayName) pushDuplicate(errors, "DUPLICATE_DISPLAY_NAME", "DisplayName values should be unique within a generated list.", displayNames, field.DisplayName, { path: `${fieldPath}.DisplayName`, list: title, field: fieldLabel });
    });
    (item?.Layouts || []).forEach((layout, index) => {
      const layoutPath = `${itemPath}.Layouts[${index}]`;
      const layoutLabel = layout?.Title || null;
      if (layout?.LayoutID !== undefined) {
        assertSafeIntegerId(layout.LayoutID, `${layoutPath}.LayoutID`);
        pushDuplicate(errors, "DUPLICATE_LAYOUT_ID", "LayoutID values must be globally unique across all ListExportItem.Layouts.", layoutIds, layout.LayoutID, { path: `${layoutPath}.LayoutID`, list: title, layout: layoutLabel });
      }
      (layout?.LayoutInResources || []).forEach((resource, resourceIndex) => {
        if (resource?.ID !== undefined) {
          assertSafeIntegerId(resource.ID, `${layoutPath}.LayoutInResources[${resourceIndex}].ID`);
          pushDuplicate(errors, "DUPLICATE_RESOURCE_ID", "LayoutInResources ID values must be globally unique across layout resources.", resourceIds, resource.ID, { path: `${layoutPath}.LayoutInResources[${resourceIndex}].ID`, list: title, layout: layoutLabel });
        }
        if (resource?.RefId !== undefined) assertSafeIntegerId(resource.RefId, `${layoutPath}.LayoutInResources[${resourceIndex}].RefId`);
      });
    });
  }
  return errors;
}

function inspectYapkIds(decoded) {
  const errors = [];
  const listIds = new Map();
  const fieldIds = new Map();
  const layoutIds = new Map();
  const resourceIds = new Map();
  const assertSafeIntegerId = (value, path) => {
    if (value === undefined || value === null || value === "") return;
    if (typeof value === "string" && LARGE_INTEGER_RE.test(value)) return;
    if (!Number.isInteger(value)) {
      errors.push({
        scope: "decodedResource",
        path,
        code: "INVALID_ID_TYPE",
        message: "Generated YAPK ID values marked as integer must be JSON integers or preserved raw large integer tokens.",
        actualType: Array.isArray(value) ? "array" : value === null ? "null" : typeof value,
      });
    } else if (!Number.isSafeInteger(value)) {
      errors.push({
        scope: "decodedResource",
        path,
        code: "UNSAFE_INTEGER_ID",
        message: "Generated YAPK integer IDs parsed as JavaScript numbers must be within Number.MAX_SAFE_INTEGER; preserve API-issued 64-bit IDs as raw JSON integer tokens during parsing.",
        value,
      });
    }
  };
  const pushDuplicate = (code, message, seen, value, detail) => {
    const key = String(value);
    const previous = seen.get(key);
    if (previous) errors.push({ scope: "decodedResource", code, message, value, previousPath: previous.path, ...detail });
    else seen.set(key, detail);
  };
  if (decoded?.MainListType !== undefined || decoded?.Data !== undefined) {
    errors.push({
      scope: "decodedResource",
      path: "$.Resource",
      code: "YAPK_RESOURCE_NOT_APP_PACKAGE_INFO",
      message: "Decoded YAPK Resource must be AppPackageInfo, not YAP ListExportResult/ListExportInfo.",
    });
    return errors;
  }
  const rootListId = decoded?.ListSet?.ListID;
  if (rootListId !== undefined) {
    assertSafeIntegerId(rootListId, "$.ListSet.ListID");
    pushDuplicate("DUPLICATE_LIST_ID", "ListID values must be globally unique across generated YAPK resources.", listIds, rootListId, { path: "$.ListSet.ListID", list: decoded?.ListSet?.Title || "root" });
  }
  for (const [index, layout] of asArray(decoded?.Pages).entries()) {
    const layoutPath = `$.Pages[${index}]`;
    if (layout?.ListID !== undefined) assertSafeIntegerId(layout.ListID, `${layoutPath}.ListID`);
    if (layout?.LayoutID !== undefined) {
      if (typeof layout.LayoutID !== "string" || !/^\d+$/.test(layout.LayoutID)) {
        errors.push({ scope: "decodedResource", path: `${layoutPath}.LayoutID`, code: "INVALID_ID_TYPE", message: "YAPK LayoutID must be LongAsString." });
      }
      pushDuplicate("DUPLICATE_LAYOUT_ID", "LayoutID values must be globally unique across generated YAPK layouts.", layoutIds, layout.LayoutID, { path: `${layoutPath}.LayoutID`, layout: layout.Title || null });
    }
    for (const [resourceIndex, resource] of asArray(layout?.LayoutInResources).entries()) {
      if (resource?.ID !== undefined) {
        assertSafeIntegerId(resource.ID, `${layoutPath}.LayoutInResources[${resourceIndex}].ID`);
        pushDuplicate("DUPLICATE_RESOURCE_ID", "LayoutInResources ID values must be globally unique.", resourceIds, resource.ID, { path: `${layoutPath}.LayoutInResources[${resourceIndex}].ID`, layout: layout.Title || null });
      }
      if (resource?.RefId !== undefined) assertSafeIntegerId(resource.RefId, `${layoutPath}.LayoutInResources[${resourceIndex}].RefId`);
    }
  }
  for (const [childIndex, child] of asArray(decoded?.Childs).entries()) {
    const childPath = `$.Childs[${childIndex}]`;
    if ("Defs" in child) errors.push({ scope: "decodedResource", path: `${childPath}.Defs`, code: "YAPK_CHILDS_USES_DEFS", message: "YAPK Childs items must use Fields, not YAP Defs." });
    const listId = child?.List?.ListID;
    const title = child?.List?.Title || null;
    if (listId !== undefined) {
      assertSafeIntegerId(listId, `${childPath}.List.ListID`);
      pushDuplicate("DUPLICATE_LIST_ID", "ListID values must be globally unique across generated YAPK resources.", listIds, listId, { path: `${childPath}.List.ListID`, list: title });
    }
    const fieldIndexes = new Map();
    const fieldNames = new Map();
    const internalNames = new Map();
    for (const [fieldIndex, field] of asArray(child?.Fields).entries()) {
      const fieldPath = `${childPath}.Fields[${fieldIndex}]`;
      const fieldLabel = field?.DisplayName || field?.FieldName || field?.InternalName || null;
      if (field?.ListID !== undefined) assertSafeIntegerId(field.ListID, `${fieldPath}.ListID`);
      if (field?.FieldID !== undefined) {
        assertSafeIntegerId(field.FieldID, `${fieldPath}.FieldID`);
        pushDuplicate("DUPLICATE_FIELD_ID", "FieldID values must be globally unique in generated YAPK packages.", fieldIds, field.FieldID, { path: `${fieldPath}.FieldID`, list: title, field: fieldLabel });
      }
      if (field?.FieldIndex !== undefined) pushDuplicate("DUPLICATE_FIELD_INDEX", "FieldIndex values must be unique within a list.", fieldIndexes, field.FieldIndex, { path: `${fieldPath}.FieldIndex`, list: title, field: fieldLabel });
      if (field?.FieldName) pushDuplicate("DUPLICATE_FIELD_NAME", "FieldName values must be unique within a list.", fieldNames, field.FieldName, { path: `${fieldPath}.FieldName`, list: title, field: fieldLabel });
      if (field?.InternalName) pushDuplicate("DUPLICATE_INTERNAL_NAME", "InternalName values must be unique within a list.", internalNames, field.InternalName, { path: `${fieldPath}.InternalName`, list: title, field: fieldLabel });
    }
    for (const [layoutIndex, layout] of asArray(child?.Layouts).entries()) {
      const layoutPath = `${childPath}.Layouts[${layoutIndex}]`;
      if (layout?.ListID !== undefined) assertSafeIntegerId(layout.ListID, `${layoutPath}.ListID`);
      if (layout?.LayoutID !== undefined) {
        if (typeof layout.LayoutID !== "string" || !/^\d+$/.test(layout.LayoutID)) {
          errors.push({ scope: "decodedResource", path: `${layoutPath}.LayoutID`, code: "INVALID_ID_TYPE", message: "YAPK LayoutID must be LongAsString." });
        }
        pushDuplicate("DUPLICATE_LAYOUT_ID", "LayoutID values must be globally unique across generated YAPK layouts.", layoutIds, layout.LayoutID, { path: `${layoutPath}.LayoutID`, list: title, layout: layout.Title || null });
      }
    }
  }
  return errors;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function summarizeDecoded(decoded, type) {
  if (type === "yap") {
    const data = isObject(decoded) && "Data" in decoded ? (typeof decoded.Data === "string" ? safeParseJson(decoded.Data) : decoded.Data) : decoded;
    return {
      decodedType: isObject(decoded) && "Data" in decoded ? "ListExportResult" : "ListExportInfo",
      dataShape: typeof decoded?.Data === "string" ? "json-string" : isObject(decoded?.Data) ? "object" : null,
      childLists: Array.isArray(data?.Childs) ? data.Childs.length : 0,
      fields: Array.isArray(data?.Childs) ? data.Childs.reduce((total, child) => total + (Array.isArray(child?.Defs) ? child.Defs.length : 0), 0) : 0,
      layouts: Array.isArray(data?.Childs) ? data.Childs.reduce((total, child) => total + (Array.isArray(child?.Layouts) ? child.Layouts.length : 0), Array.isArray(data?.Item?.Layouts) ? data.Item.Layouts.length : 0) : 0,
    };
  }
  return {
    decodedType: "AppPackageInfo",
    childLists: Array.isArray(decoded.Childs) ? decoded.Childs.length : 0,
    pages: Array.isArray(decoded.Pages) ? decoded.Pages.length : 0,
    forms: Array.isArray(decoded.Forms) ? decoded.Forms.length : 0,
  };
}

function normalizeYapkDecodedForSchema(decoded) {
  if (!isObject(decoded)) return decoded;
  if (decoded.PortalInfo !== null) return decoded;
  return { ...decoded, PortalInfo: {} };
}

function normalizeYapDecodedForSchema(decoded) {
  if (!isObject(decoded)) return decoded;
  if (decoded.SimplePortal !== null) return decoded;
  return { ...decoded, SimplePortal: {} };
}

function inspectYapSimplePortal(decoded) {
  const errors = [];
  if (!isObject(decoded)) return errors;
  if (decoded.SimplePortal === null) return errors;
  const actualType = Array.isArray(decoded.SimplePortal) ? "array" : decoded.SimplePortal === undefined ? "missing" : typeof decoded.SimplePortal;
  errors.push({
    scope: "decodedResource",
    path: "$.SimplePortal",
    code: isObject(decoded.SimplePortal) && Object.keys(decoded.SimplePortal).length === 0 ? "YAP_SIMPLEPORTAL_EMPTY_OBJECT_INVALID" : "YAP_SIMPLEPORTAL_NOT_NULL",
    message: "Product import feedback requires SimplePortal to be null when no portal is included; do not emit an empty object or other value.",
    actualType,
  });
  return errors;
}

function inspectYapkPortalInfo(decoded) {
  const errors = [];
  if (!isObject(decoded)) return errors;
  if (isObject(decoded.PortalInfo) && Object.keys(decoded.PortalInfo).length === 0) {
    errors.push({
      scope: "decodedResource",
      path: "$.PortalInfo",
      code: "YAPK_PORTALINFO_EMPTY_OBJECT_INVALID",
      message: "Product import feedback requires PortalInfo to be null when no portal is included; do not emit an empty object.",
    });
  } else if (Array.isArray(decoded.PortalInfo)) {
    errors.push({
      scope: "decodedResource",
      path: "$.PortalInfo",
      code: "YAPK_PORTALINFO_ARRAY_INVALID",
      message: "Product import feedback requires PortalInfo to be null when no portal is included; do not emit an array.",
      length: decoded.PortalInfo.length,
    });
  } else if (decoded.PortalInfo !== undefined && decoded.PortalInfo !== null && !isObject(decoded.PortalInfo)) {
    errors.push({
      scope: "decodedResource",
      path: "$.PortalInfo",
      code: "YAPK_PORTALINFO_INVALID",
      message: "PortalInfo must be null for no portal or a portal object when a portal is included.",
      actualType: typeof decoded.PortalInfo,
    });
  }
  return errors;
}

function inspectYapkDashboards(decoded) {
  const errors = [];
  if (!isObject(decoded)) return errors;
  for (const [index, page] of asArray(decoded.Pages).entries()) {
    if (Number(page?.Type) !== 103) continue;
    const ext2 = safeParseJson(page.Ext2);
    if (!ext2 || ext2.src !== true) {
      errors.push({
        scope: "decodedResource",
        path: `$.Pages[${index}].Ext2`,
        code: "DASHBOARD_CURRENT_VERSION_MARKER_MISSING",
        message: "YAPK Type 103 dashboard pages must include Ext2 {\"src\":true}; otherwise Yeeflow opens the retired legacy dashboard renderer.",
        title: page.Title || null,
        layoutId: page.LayoutID || null,
        hasInlineResource: asArray(page.LayoutInResources).length > 0,
      });
    }
  }
  return errors;
}

function safeParseJson(value) {
  try {
    return parseJsonPreservingLargeInts(value);
  } catch {
    return null;
  }
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h") || process.argv.length < 3) usage(process.argv.length < 3 ? 1 : 0);
  const input = process.argv[2];
  const type = path.extname(input).toLowerCase().replace(".", "");
  if (!["yap", "yapk"].includes(type)) throw new Error("Input must end with .yap or .yapk.");

  const schemaPath = resolveSchemaPath(type);
  const schema = readJson(schemaPath);
  const wrapper = readJson(input);
  const wrapperErrors = validate(wrapper, schema, schema);
  let decoded;
  try {
    decoded = type === "yap" ? decodeYap(wrapper) : await decodeYapk(wrapper);
  } catch (error) {
    const errors = [...wrapperErrors.map((item) => ({ scope: "wrapper", ...item })), {
      scope: "decodedResource",
      path: "$.Resource",
      code: "decode",
      message: error.message,
    }];
    console.log(JSON.stringify({
      input: path.basename(input),
      schema: path.basename(schemaPath),
      status: "fail",
      errors: errors.length,
      summary: { decodedType: type === "yap" ? "ListExportInfo" : "AppPackageInfo", decoded: false },
      findings: errors.slice(0, 80),
      truncatedFindings: Math.max(0, errors.length - 80),
    }, null, 2));
    process.exitCode = 1;
    return;
  }
  const decodedRef = schema["x-decodedResourceSchema"] || (type === "yapk" && schema.$defs?.AppPackageInfo ? { $ref: "#/$defs/AppPackageInfo" } : undefined);
  const decodedForSchema = type === "yapk" ? normalizeYapkDecodedForSchema(decoded) : type === "yap" ? normalizeYapDecodedForSchema(decoded) : decoded;
  const decodedErrors = validate(decodedForSchema, decodedRef, schema);
  let contentErrors = [];
  let categoryTarget = decoded;
  if (type === "yap") {
    const dataResult = decodedYapData(decoded, schema);
    contentErrors = dataResult.errors;
    categoryTarget = dataResult.data || {};
    if (dataResult.data) {
      const contentRef = schema.$defs?.ListExportInfo ? { $ref: "#/$defs/ListExportInfo" } : decodedRef;
      contentErrors = contentErrors.concat(validate(dataResult.data, contentRef, schema).map((error) => ({ scope: "decodedResource.Data", ...error })));
    }
  }
  const categoryErrors = inspectFieldCategories(categoryTarget, type);
  const idErrors = type === "yap" && categoryTarget ? inspectYapIds(categoryTarget) : type === "yapk" ? inspectYapkIds(decoded) : [];
  const simplePortalErrors = type === "yap" ? inspectYapSimplePortal(decoded) : [];
  const portalErrors = type === "yapk" ? inspectYapkPortalInfo(decoded) : [];
  const dashboardErrors = type === "yapk" ? inspectYapkDashboards(decoded) : [];
  const errors = [...wrapperErrors.map((error) => ({ scope: "wrapper", ...error })), ...decodedErrors.map((error) => ({ scope: "decodedResource", ...error })), ...contentErrors, ...categoryErrors, ...idErrors, ...simplePortalErrors, ...portalErrors, ...dashboardErrors];

  console.log(JSON.stringify({
    input: path.basename(input),
    schema: path.basename(schemaPath),
    status: errors.length ? "fail" : "pass",
    errors: errors.length,
    summary: summarizeDecoded(decoded, type),
    findings: errors.slice(0, 80),
    truncatedFindings: Math.max(0, errors.length - 80),
  }, null, 2));
  if (errors.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "fail", error: error.message }, null, 2));
  process.exit(1);
});
