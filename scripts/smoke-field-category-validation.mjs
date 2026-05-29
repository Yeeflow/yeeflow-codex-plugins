#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const GZIP_PREFIX = "[______gizp______]";
const repoRoot = path.resolve(import.meta.dirname, "..");

function makeField(category) {
  return {
    FieldID: "1001",
    ListID: "2001",
    FieldName: "VendorName1",
    InternalName: "VendorName",
    DisplayName: "Vendor Name",
    FieldType: "Text",
    Type: "input",
    Category: category,
  };
}

function makeListExportInfo(category) {
  return {
    Item: {
      ListModel: {
        ListID: "9001",
        AppID: "8001",
        Title: "Synthetic Field Category Smoke App",
        Type: 103,
        ListType: 103,
      },
      Defs: [],
      Layouts: [],
      LayoutInResources: [],
    },
    Childs: [
      {
        ListModel: {
          ListID: "2001",
          AppID: "8001",
          Title: "Vendors",
          Type: 1,
          ListType: 1,
        },
        Defs: [makeField(category)],
        Layouts: [],
      },
    ],
    Data: "",
    ReplaceIds: [],
  };
}

function makeAppPackageInfo(category) {
  return {
    ListSet: {
      ListID: "9001",
      AppID: "8001",
      Title: "Synthetic Field Category Smoke App",
      Type: 103,
      Flags: 1,
    },
    Pages: [],
    Forms: [],
    FormReports: [],
    FormNewReports: [],
    DataReports: [],
    Groups: [],
    Tags: [],
    Metadatas: [],
    Agents: [],
    Connections: [],
    Knowledges: [],
    Themes: [],
    Components: [],
    PortalInfo: {},
    Childs: [
      {
        List: {
          ListID: "2001",
          AppID: "8001",
          Title: "Vendors",
          Type: 1,
          Flags: 1,
        },
        Fields: [makeField(category)],
        Layouts: [],
        RemindRules: [],
        PublicForms: [],
        FlowMappings: [],
      },
    ],
  };
}

function writeYap(file, category) {
  const resource = GZIP_PREFIX + zlib.gzipSync(Buffer.from(JSON.stringify(makeListExportInfo(category)), "utf8")).toString("base64");
  const wrapper = {
    Title: "Synthetic Field Category Smoke App",
    Description: "Temporary validator smoke package.",
    IconUrl: "",
    IsListSet: true,
    Resource: resource,
  };
  fs.writeFileSync(file, `${JSON.stringify(wrapper, null, 2)}\n`);
}

function writeYapk(file, category) {
  const resource = zlib.brotliCompressSync(Buffer.from(JSON.stringify(makeAppPackageInfo(category)), "utf8")).toString("base64");
  const wrapper = {
    PackageId: "00000000-0000-0000-0000-000000000001",
    TenantID: "1",
    AppID: "8001",
    ListID: "9001",
    Title: "Synthetic Field Category Smoke App",
    Description: "Temporary validator smoke package.",
    IconUrl: "",
    Resource: resource,
    Notes: "Temporary validator smoke package.",
    Author: "Codex",
    Date: "2026-05-29T00:00:00Z",
    Version: "smoke",
    Sign: Buffer.alloc(32).toString("base64"),
  };
  fs.writeFileSync(file, `${JSON.stringify(wrapper, null, 2)}\n`);
}

function run(command, args) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
}

function assertIncludes(result, needle, label) {
  const output = `${result.stdout}\n${result.stderr}`;
  if (!output.includes(needle)) {
    throw new Error(`${label} did not include ${needle}.`);
  }
}

function assertExcludes(result, needle, label) {
  const output = `${result.stdout}\n${result.stderr}`;
  if (output.includes(needle)) {
    throw new Error(`${label} unexpectedly included ${needle}.`);
  }
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-field-category-smoke-"));
try {
  const badYap = path.join(dir, "field-category-string.yap");
  const goodYap = path.join(dir, "field-category-int.yap");
  const badYapk = path.join(dir, "field-category-string.yapk");
  const goodYapk = path.join(dir, "field-category-int.yapk");
  writeYap(badYap, "0");
  writeYap(goodYap, 0);
  writeYapk(badYapk, "0");
  writeYapk(goodYapk, 0);

  const checks = [
    {
      label: "validate-yap-package string Category",
      result: run("node", ["validate-yap-package.js", badYap, "--mode", "generator", "--stage", "final"]),
      expectCode: true,
    },
    {
      label: "validate-yap-package integer Category",
      result: run("node", ["validate-yap-package.js", goodYap, "--mode", "generator", "--stage", "final"]),
      expectCode: false,
    },
    {
      label: "inspect-yap-schema-standard string Category",
      result: run("node", ["scripts/inspect-yap-schema-standard.mjs", badYap]),
      expectCode: true,
    },
    {
      label: "inspect-yap-schema-standard integer Category",
      result: run("node", ["scripts/inspect-yap-schema-standard.mjs", goodYap]),
      expectCode: false,
    },
    {
      label: "validate-yapk-package string Category",
      result: run("node", ["validate-yapk-package.js", badYapk]),
      expectCode: true,
    },
    {
      label: "validate-yapk-package integer Category",
      result: run("node", ["validate-yapk-package.js", goodYapk]),
      expectCode: false,
    },
    {
      label: "inspect-yapk-schema-standard string Category",
      result: run("node", ["scripts/inspect-yapk-schema-standard.mjs", badYapk]),
      expectCode: true,
    },
    {
      label: "inspect-yapk-schema-standard integer Category",
      result: run("node", ["scripts/inspect-yapk-schema-standard.mjs", goodYapk]),
      expectCode: false,
    },
  ];

  for (const check of checks) {
    if (check.expectCode) assertIncludes(check.result, "FIELD_CATEGORY_NOT_INT", check.label);
    else assertExcludes(check.result, "FIELD_CATEGORY_NOT_INT", check.label);
  }

  console.log(JSON.stringify({
    status: "pass",
    checks: checks.map((check) => ({ label: check.label, exitCode: check.result.status, categoryCheck: check.expectCode ? "detected" : "not-present" })),
  }, null, 2));
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
