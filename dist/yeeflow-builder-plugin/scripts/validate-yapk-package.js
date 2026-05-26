#!/usr/bin/env node

const fs = require("fs");

const REQUIRED_KEYS = [
  "PackageId",
  "TenantID",
  "AppID",
  "ListID",
  "Title",
  "Resource",
  "Version",
  "Sign",
];

function usage() {
  console.error("Usage: node validate-yapk-package.js <package.yapk> [--baseline <baseline.yapk>]");
  process.exit(1);
}

function readWrapper(file) {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(text);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
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

function isBase64(value) {
  if (typeof value !== "string" || !value) return false;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) return false;
  return Buffer.from(value, "base64").toString("base64") === value;
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
  for (let i = 0; i < min; i += 1) {
    if (left[i] === right[i]) samePositionBytes += 1;
  }

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

function validate(file, baselineFile = null) {
  const errors = [];
  const warnings = [];
  const wrapper = readWrapper(file);
  if (!isObject(wrapper)) errors.push({ code: "YAPK_WRAPPER_NOT_OBJECT", message: "Top-level package must be a JSON object." });

  for (const key of REQUIRED_KEYS) {
    if (!(key in wrapper)) errors.push({ code: "YAPK_REQUIRED_KEY_MISSING", message: `Missing required key ${key}.` });
  }

  if (typeof wrapper.Resource !== "string" || !wrapper.Resource) {
    errors.push({ code: "YAPK_RESOURCE_INVALID", message: "Resource must be a non-empty base64 string." });
  }

  let resourceBytes = Buffer.alloc(0);
  if (typeof wrapper.Resource === "string") {
    if (!isBase64(wrapper.Resource)) {
      errors.push({ code: "YAPK_RESOURCE_BASE64_INVALID", message: "Resource must be canonical base64 text." });
    } else {
      resourceBytes = Buffer.from(wrapper.Resource, "base64");
      if (!resourceBytes.length) errors.push({ code: "YAPK_RESOURCE_EMPTY", message: "Decoded Resource payload is empty." });
    }
  }

  if (String(wrapper.Resource || "").startsWith("[______gizp______]")) {
    errors.push({
      code: "YAPK_RESOURCE_USES_YAP_GZIP_PREFIX",
      message: ".yapk version packages should preserve the observed raw opaque Resource payload, not the .yap gzip prefix.",
    });
  }

  if (typeof wrapper.Sign !== "string" || Buffer.from(wrapper.Sign || "", "base64").length !== 32) {
    warnings.push({ code: "YAPK_SIGN_UNEXPECTED_SHAPE", message: "Sign is expected to be a 32-byte base64 value in observed packages." });
  }

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
    resourceBytes: resourceBytes.length,
    resourceEntropy: entropy(resourceBytes),
    resourceBase64Length: typeof wrapper.Resource === "string" ? wrapper.Resource.length : 0,
  };

  if (metadata.resourceEntropy > 7.5) {
    warnings.push({
      code: "YAPK_RESOURCE_OPAQUE",
      message: "Resource has high entropy and is not the normal decoded .yap gzip resource. Treat app-resource mutation as unsafe unless Yeeflow encoding/signing is proven.",
    });
  }

  warnings.push({
    code: "YAPK_RESOURCE_VALIDATED_OPAQUE_PAYLOAD",
    message: ".yapk Resource is a base64 outer encoding with an opaque validated inner payload. Wrapper signing alone does not prove app-content generation.",
  });

  let baselineComparison = null;
  if (baselineFile) {
    const baseline = readWrapper(baselineFile);
    for (const key of ["PackageId", "TenantID", "AppID", "ListID", "Resource", "Sign"]) {
      if (JSON.stringify(wrapper[key]) !== JSON.stringify(baseline[key])) {
        warnings.push({
          code: "YAPK_BASELINE_IDENTITY_CHANGED",
          message: `Baseline ${key} differs. For first upgrade-proof packages, preserve this field unless the package was generated by Yeeflow Version management.`,
          key,
        });
      }
    }

    const baselineResourceBytes = isBase64(baseline.Resource) ? Buffer.from(baseline.Resource, "base64") : Buffer.alloc(0);
    const wrapperKeys = Array.from(new Set([...Object.keys(baseline), ...Object.keys(wrapper)])).sort();
    const wrapperChangedFields = changedKeys(baseline, wrapper, wrapperKeys);
    const metadataChangedFields = changedKeys(baseline, wrapper, ["Title", "Description", "IconUrl", "Notes", "Author", "Date", "Version"]);
    const resourceChanged = JSON.stringify(wrapper.Resource) !== JSON.stringify(baseline.Resource);
    const signChanged = JSON.stringify(wrapper.Sign) !== JSON.stringify(baseline.Sign);
    baselineComparison = {
      wrapperChangedFields,
      metadataChangedFields,
      resourceChanged,
      signChanged,
      resourceStats: compareBuffers(baselineResourceBytes, resourceBytes),
    };

    if (!resourceChanged && metadataChangedFields.length) {
      warnings.push({
        code: "YAPK_METADATA_ONLY_NO_CONTENT_CHANGE",
        message: "Metadata changed while Resource is unchanged. This is a metadata-only package; app content is unchanged.",
      });
    }

    if (resourceChanged) {
      warnings.push({
        code: "YAPK_RESOURCE_CHANGED_UNSUPPORTED",
        message: "Resource differs from baseline. Treat as Yeeflow-generated or unsupported unless the Resource-generation path is proven.",
      });
    }
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
