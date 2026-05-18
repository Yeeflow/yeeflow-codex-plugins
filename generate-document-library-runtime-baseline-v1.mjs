import fs from "node:fs";
import zlib from "node:zlib";
import { execFileSync } from "node:child_process";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const SOURCE_EXPORT = process.argv[2] || "/Users/Renger/Downloads/Projects Center.yap";
const OUT_RESOURCE = "document-library-runtime-baseline.v1.resource.json";
const OUT_APP_DEF = "document-library-runtime-baseline.v1.app-def.json";
const OUT_YAP = "document-library-runtime-baseline.v1.yap";
const OUT_REPORT = "document-library-runtime-baseline.v1.generation-report.json";
const TITLE = "Document Library Runtime Baseline - Codex";
const DESCRIPTION = "Minimal generated Yeeflow app for Type 16 document library runtime learning. Contains no uploaded document rows.";
const GENERATED_AT = "2026-05-18 17:20:00";
const ID_BASE = 6318000000000000000n;

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

function parseJson(text, largeNumbers) {
  return JSON.parse(quoteLargeIntegers(text, largeNumbers));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function decodeYap(filePath) {
  const largeNumbers = new Set();
  const wrapper = parseJson(fs.readFileSync(filePath, "utf8"), largeNumbers);
  if (!wrapper.Resource || !wrapper.Resource.startsWith(GZIP_PREFIX)) throw new Error("Unsupported .yap Resource wrapper");
  const resource = parseJson(zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"), largeNumbers);
  const data = parseJson(resource.Data, largeNumbers);
  return { wrapper, resource, data };
}

function parseMaybeJson(value, fallback) {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function collectIds(value, ids = new Set(), key = "") {
  if (["TenantID", "CreatedBy", "ModifiedBy"].includes(key)) return ids;
  if (typeof value === "string" && LARGE_INTEGER_RE.test(value)) ids.add(value);
  else if (Array.isArray(value)) value.forEach((item) => collectIds(item, ids));
  else if (value && typeof value === "object") Object.entries(value).forEach(([childKey, child]) => collectIds(child, ids, childKey));
  return ids;
}

function remapValue(value, idMap, key = "") {
  if (["TenantID", "CreatedBy", "ModifiedBy"].includes(key)) return value;
  if (typeof value === "string") {
    let out = value;
    for (const [oldId, newId] of idMap.entries()) out = out.split(oldId).join(newId);
    return out;
  }
  if (Array.isArray(value)) return value.map((item) => remapValue(item, idMap));
  if (!value || typeof value !== "object") return value;
  const out = {};
  for (const [childKey, child] of Object.entries(value)) out[remapValue(childKey, idMap)] = remapValue(child, idMap, childKey);
  return out;
}

function nextGeneratedId(offset) {
  return String(ID_BASE + BigInt(offset));
}

function simplePageResource() {
  return JSON.stringify({
    children: [
      {
        id: "document-library-baseline-main",
        type: "container",
        label: "Container",
        attrs: {
          style: { gap: [null, "--sp--s200"], direction: [null, "column"], align_items: [null, "stretch"] },
          common: { padding: [null, { top: 24, right: 24, bottom: 24, left: 24 }] },
        },
        children: [
          {
            id: "document-library-baseline-title",
            type: "heading",
            label: "Text",
            attrs: {
              headc: { title: { value: TITLE, variable: null } },
              heads: { ty: [null, "xl-semibold"], color: "var(--c--text)" },
              common: { positioning: { widthtype: [null, "2"] } },
            },
            children: [],
            nv_label: "Page title",
          },
          {
            id: "document-library-baseline-note",
            type: "heading",
            label: "Text",
            attrs: {
              headc: { title: { value: "Open Baseline Documents to validate the Type 16 document library resource.", variable: null } },
              heads: { ty: [null, "s-regular"], color: "var(--c--neutral-dark-hover)" },
              common: { positioning: { widthtype: [null, "2"] } },
            },
            children: [],
            nv_label: "Runtime note",
          },
        ],
        nv_label: "Main",
      },
    ],
    attrs: {
      hideHeaderAll: true,
      container: { padding: [null, { top: 0, right: 0, bottom: 0, left: 0 }] },
    },
    title: "Home",
    filterVars: [],
    tempVars: [],
    ver: "2.0",
  });
}

function configuredDocumentView(fields) {
  const byName = new Map(fields.map((field) => [field.FieldName, field]));
  const columnSpecs = [
    ["Title", "Name", true],
    ["Text1", "Type", true],
    ["Bigint2", "Size", true],
    ["Text2", "Extension", true],
  ];
  return JSON.stringify({
    layout: columnSpecs.map(([fieldName, displayName, show], index) => {
      const field = byName.get(fieldName);
      return {
        DisplayName: displayName,
        FieldName: fieldName,
        FieldID: field ? field.FieldID : fieldName === "CreatedBy" ? "-2" : fieldName === "Created" ? "-4" : fieldName === "ModifiedBy" ? "-3" : "-5",
        Show: show,
        Order: index + 1,
        Type: field ? field.Type : fieldName.includes("By") ? "identity-picker" : "datepicker",
        Mobile: 0,
      };
    }),
    sort: [{ SortName: "Created", SortByDesc: true }],
    query: [
      { FieldName: "Title", ID: byName.get("Title").FieldID, Name: "Name", Type: "input" },
      { FieldName: "ListDataID", ID: "-1", Name: "Id", Type: "input" },
      { FieldName: "CreatedBy", ID: "-2", Name: "Created By", Type: "identity-picker" },
      { FieldName: "Created", ID: "-4", Name: "Created Time", Type: "datepicker" },
      { FieldName: "ModifiedBy", ID: "-3", Name: "Modified By", Type: "identity-picker" },
      { FieldName: "Modified", ID: "-5", Name: "Modified Time", Type: "datepicker" },
    ],
    rowColor: [],
    filter: [],
  });
}

const decoded = decodeYap(SOURCE_EXPORT);
const sourceData = decoded.data;
const sourceRoot = sourceData.Item;
const sourceLibrary = sourceData.Childs.find((child) => child.ListModel && child.ListModel.Title === "New Document library");
if (!sourceLibrary) throw new Error("New Document library was not found in source export");

const data = {
  Item: clone(sourceRoot),
  Childs: [clone(sourceLibrary)],
  Forms: [],
  OtherModules: [],
  FormReports: [],
  DataReports: [],
    FormNewReports: [],
    AppGroups: [],
    AppThemes: clone(sourceData.AppThemes || []),
    AppTags: [],
    AppMetadatas: [],
    AppComponents: [],
  };

const idMap = new Map();
const sourceIds = [...collectIds(data)].sort();
sourceIds.forEach((oldId, index) => idMap.set(oldId, nextGeneratedId(index)));
const remappedData = remapValue(data, idMap);

const rootId = idMap.get(String(sourceRoot.ListModel.ListID));
const libraryId = idMap.get(String(sourceLibrary.ListModel.ListID));
const homeLayoutId = nextGeneratedId(sourceIds.length + 1);
const libraryLayoutId = remappedData.Childs[0].Layouts[0].LayoutID;
const libraryFormId = remappedData.Childs[0].Layouts.find((layout) => Number(layout.Type) === 1)?.LayoutID;

const rootModel = remappedData.Item.ListModel;
rootModel.ListID = rootId;
rootModel.Title = TITLE;
rootModel.Description = DESCRIPTION;
rootModel.CustomType = "";
rootModel.IconUrl = "{\"b\":\"#E6F0FF\",\"i\":\"fa-regular fa-folder-open\",\"c\":\"#0065FF\"}";
rootModel.Created = GENERATED_AT;
rootModel.Modified = GENERATED_AT;
rootModel.LayoutView = JSON.stringify({
  add: "default",
  edit: "default",
  view: "default",
  sort: [
    { AppID: 41, ListID: homeLayoutId, ListSetID: rootId, Type: 103, IsHidden: false, Title: "Home", Icon: "fa-regular fa-house" },
    { AppID: 41, ListID: libraryId, ListSetID: rootId, Type: 16, IsHidden: false, Title: "Baseline Documents", Icon: "fa-regular fa-folder-open" },
  ],
  attrs: {
    appearance: { bgc: "var(--c--primary-light)", color: "var(--c--primary)" },
    "navigator-menu": { bgc: "var(--c--primary)", color: "var(--c--primary-light)", position: "default" },
    CustomColors: [],
    CustomFonts: [],
  },
  sortVer: 1,
});

remappedData.Item.Layouts = [
  {
    ...clone(sourceRoot.Layouts[0]),
    LayoutID: homeLayoutId,
    ListID: rootId,
    Title: "Home",
    Type: 103,
    LayoutView: null,
    Ext2: "{\"src\":true}",
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
    LayoutInResources: [{ ID: homeLayoutId, RefId: homeLayoutId, Resource: simplePageResource() }],
  },
];

const library = remappedData.Childs[0];
library.ListModel.ListID = libraryId;
library.ListModel.Title = "Baseline Documents";
library.ListModel.Description = "Minimal Type 16 document library for runtime validation.";
library.ListModel.CustomType = `ListSite_${rootId}`;
library.ListModel.Created = GENERATED_AT;
library.ListModel.Modified = GENERATED_AT;
library.ListModel.LayoutView = libraryFormId ? JSON.stringify({ add: libraryFormId, opentype: { add: "modal" }, modalsize: { add: 1 } }) : null;
library.Defs.forEach((field) => {
  field.ListID = libraryId;
  field.Created = GENERATED_AT;
  field.Modified = GENERATED_AT;
});
library.Layouts.forEach((layout, index) => {
  layout.ListID = libraryId;
  layout.Created = GENERATED_AT;
  layout.Modified = GENERATED_AT;
  if (Number(layout.Type) === 0) {
    layout.Title = "All Documents";
    layout.IsDefault = true;
    layout.LayoutView = configuredDocumentView(library.Defs);
  }
  if (Number(layout.Type) === 1) {
    layout.Title = "New file";
  }
});
library.ListDatas = {};

const resource = {
  ...clone(decoded.resource),
  MainListType: 1024,
  AppID: 41,
  ReportIds: [],
  FormKeys: [],
  SimplePortal: [],
  ReplaceIds: [...collectIds(remappedData)].filter((id) => id.startsWith(String(ID_BASE).slice(0, 4))).sort(),
  Data: JSON.stringify(remappedData),
};

fs.writeFileSync(OUT_APP_DEF, `${JSON.stringify(remappedData, null, 2)}\n`);
fs.writeFileSync(OUT_RESOURCE, `${JSON.stringify(resource, null, 2)}\n`);

const buildOutput = execFileSync("node", [
  "build-yap-wrapper.js",
  OUT_RESOURCE,
  OUT_YAP,
  "--title",
  TITLE,
  "--description",
  DESCRIPTION,
], { encoding: "utf8" });

const report = {
  status: "pass",
  source: SOURCE_EXPORT,
  outputs: { resource: OUT_RESOURCE, appDef: OUT_APP_DEF, yap: OUT_YAP },
  rootId,
  libraryId,
  generatedIdFamily: String(ID_BASE).slice(0, 4),
  documentLibrary: {
    title: library.ListModel.Title,
    type: library.ListModel.Type,
    fieldNames: library.Defs.map((field) => field.FieldName),
    layouts: library.Layouts.map((layout) => ({ title: layout.Title || null, type: layout.Type, layoutId: layout.LayoutID })),
    containsUploadedRows: Object.keys(library.ListDatas || {}).length > 0,
  },
  build: JSON.parse(buildOutput),
};
fs.writeFileSync(OUT_REPORT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
