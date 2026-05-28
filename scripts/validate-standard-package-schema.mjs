#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const DEFAULT_YAP_SCHEMA = "/Users/Renger/Downloads/yap-v1-schema_v2.json";
const DEFAULT_YAPK_SCHEMA = "/Users/Renger/Downloads/yapk-schema.json";

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
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
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
  if (expected === "integer") return Number.isInteger(value);
  if (expected === "number") return typeof value === "number" && Number.isFinite(value);
  if (expected === "string") return typeof value === "string";
  if (expected === "boolean") return typeof value === "boolean";
  if (expected === "null") return value === null;
  return true;
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
  return JSON.parse(text);
}

function decodeYapk(wrapper) {
  if (typeof wrapper.Resource !== "string") throw new Error("YAPK Resource must be a string.");
  const text = zlib.brotliDecompressSync(Buffer.from(wrapper.Resource, "base64")).toString("utf8");
  return JSON.parse(text);
}

function summarizeDecoded(decoded, type) {
  if (type === "yap") {
    return {
      decodedType: "ListExportInfo",
      childLists: Array.isArray(decoded.Childs) ? decoded.Childs.length : 0,
      fields: Array.isArray(decoded.Childs) ? decoded.Childs.reduce((total, child) => total + (Array.isArray(child?.Defs) ? child.Defs.length : 0), 0) : 0,
      layouts: Array.isArray(decoded.Childs) ? decoded.Childs.reduce((total, child) => total + (Array.isArray(child?.Layouts) ? child.Layouts.length : 0), Array.isArray(decoded.Item?.Layouts) ? decoded.Item.Layouts.length : 0) : 0,
    };
  }
  return {
    decodedType: "AppPackageInfo",
    childLists: Array.isArray(decoded.Childs) ? decoded.Childs.length : 0,
    pages: Array.isArray(decoded.Pages) ? decoded.Pages.length : 0,
    forms: Array.isArray(decoded.Forms) ? decoded.Forms.length : 0,
  };
}

function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h") || process.argv.length < 3) usage(process.argv.length < 3 ? 1 : 0);
  const input = process.argv[2];
  const type = path.extname(input).toLowerCase().replace(".", "");
  if (!["yap", "yapk"].includes(type)) throw new Error("Input must end with .yap or .yapk.");

  const schemaPath = type === "yap" ? argValue("--yap-schema", DEFAULT_YAP_SCHEMA) : argValue("--yapk-schema", DEFAULT_YAPK_SCHEMA);
  const schema = readJson(schemaPath);
  const wrapper = readJson(input);
  const wrapperErrors = validate(wrapper, schema, schema);
  let decoded;
  try {
    decoded = type === "yap" ? decodeYap(wrapper) : decodeYapk(wrapper);
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
  const decodedRef = type === "yap" ? schema["x-decodedResourceSchema"] : schema["x-decodedResourceSchema"];
  const decodedErrors = validate(decoded, decodedRef, schema);
  const errors = [...wrapperErrors.map((error) => ({ scope: "wrapper", ...error })), ...decodedErrors.map((error) => ({ scope: "decodedResource", ...error }))];

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

main();
