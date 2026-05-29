import fs from "node:fs";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const SOURCE_RESOURCE = ".tmp/vendor-onboarding-compliance-management/vendor-onboarding-compliance-management.decoded-resource.json";
const TMP_DIR = ".tmp/vendor-onboarding-compliance-management";
const TITLE = "Vendor Onboarding & Compliance Management";
const DESCRIPTION = "Generated Yeeflow application package from the approved Vendor Onboarding UI implementation spec.";
const ICON_URL = "{\"b\":\"#E6F7FF\",\"i\":\"fa-regular fa-building-shield\",\"c\":\"#008DA6\"}";

function parseResource() {
  const resource = JSON.parse(fs.readFileSync(SOURCE_RESOURCE, "utf8"));
  return { resource, data: JSON.parse(resource.Data) };
}

function writeResource(name, resource, data) {
  const out = `${TMP_DIR}/${name}.json`;
  const next = { ...resource, MainListType: 1024, SimplePortal: null, Data: JSON.stringify(data) };
  fs.writeFileSync(out, `${JSON.stringify(next, null, 2)}\n`);
  return out;
}

function buildYap(input, output) {
  const result = spawnSync(process.execPath, [
    "build-yap-wrapper.js",
    input,
    output,
    "--title",
    TITLE,
    "--description",
    DESCRIPTION,
    "--icon-url",
    ICON_URL,
    "--validation-mode",
    "generator",
  ], { cwd: process.cwd(), encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) {
    throw new Error(`build-yap-wrapper failed for ${output}: ${result.stderr || result.stdout}`);
  }
  return JSON.parse(result.stdout);
}

function parseJsonMaybe(value, fallback = {}) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeLayoutResource(layout) {
  const resources = Array.isArray(layout.LayoutInResources) ? layout.LayoutInResources : [];
  return resources.map((item) => ({
    ...item,
    ID: layout.LayoutID,
    RefId: layout.LayoutID,
  }));
}

function minimalSurface(title) {
  return {
    title,
    ver: "2.0",
    filterVars: [],
    tempVars: [],
    attrs: { hideHeaderAll: true },
    children: [{
      id: `main-${layoutSafeId(title)}`,
      type: "container",
      label: "Container",
      nv_label: "Main",
      attrs: {
        style: { direction: "column", gap: "16px", align_items: "stretch" },
        common: { padding: { left: 24, right: 24, top: 24, bottom: 24 } },
      },
      children: [{
        id: `heading-${layoutSafeId(title)}`,
        type: "heading",
        label: "Text",
        nv_label: title,
        attrs: {
          headc: { title: { value: title, variable: null } },
          heads: { ty: "h4-bold", color: "var(--c--text)" },
        },
        children: [],
      }],
    }],
  };
}

function layoutSafeId(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "surface";
}

function normalizeViewLayout(layout, index) {
  return {
    ...layout,
    Title: index === 0 ? "All Records" : layout.Title || `View ${index + 1}`,
    Status: layout.Status ?? 1,
    IsDefault: index === 0,
    IsItemPerm: false,
    Perms: null,
    Ext1: layout.Ext1 ?? null,
    Ext2: layout.Ext2 ?? null,
    Ext3: layout.Ext3 ?? null,
    LayoutInResources: normalizeLayoutResource(layout),
  };
}

function normalizeFormLayout(layout, title) {
  return {
    ...layout,
    Title: title,
    Status: layout.Status ?? 1,
    Type: 1,
    LayoutView: null,
    Ext1: layout.Ext1 ?? null,
    Ext2: "{\"src\":true}",
    Ext3: layout.Ext3 ?? null,
    IsDefault: false,
    IsItemPerm: false,
    Perms: null,
    LayoutInResources: [{
      ID: layout.LayoutID,
      RefId: layout.LayoutID,
      Resource: JSON.stringify(minimalSurface(title)),
    }],
  };
}

function makeMinimalHomePage(layout) {
  return {
    ...layout,
    Title: "Home",
    Type: 103,
    LayoutView: null,
    Ext1: layout.Ext1 ?? null,
    Ext2: layout.Ext2 ?? null,
    Ext3: layout.Ext3 ?? null,
    IsDefault: false,
    IsItemPerm: false,
    Perms: null,
    LayoutInResources: [{
      ID: layout.LayoutID,
      RefId: layout.LayoutID,
      Resource: JSON.stringify(minimalSurface("Home")),
    }],
  };
}

function makeDataModelOnly(data) {
  const next = structuredClone(data);
  const home = makeMinimalHomePage(next.Item.Layouts[0]);
  next.Item.Layouts = [home];
  next.Item.ListModel.LayoutView = JSON.stringify({
    add: "default",
    edit: "default",
    view: "default",
    sort: [
      {
        AppID: next.AppID,
        ListID: home.LayoutID,
        ListSetID: next.Item.ListModel.ListID,
        Type: 103,
        IsHidden: false,
        Title: "Home",
        Icon: "fa-regular fa-house",
      },
      ...next.Childs.map((child) => ({
      AppID: next.AppID,
      ListID: child.ListModel.ListID,
      ListSetID: next.Item.ListModel.ListID,
      Type: child.ListModel.Type,
      IsHidden: false,
      Title: child.ListModel.Title,
      Icon: "fa-regular fa-list-check",
      })),
    ],
    sortVer: 1,
  });

  for (const child of next.Childs) {
    const views = child.Layouts.filter((layout) => Number(layout.Type) === 0).map(normalizeViewLayout);
    const forms = child.Layouts.filter((layout) => Number(layout.Type) === 1);
    const edit = forms[0] ? normalizeFormLayout(forms[0], "Edit Item") : null;
    const view = forms[1] ? normalizeFormLayout(forms[1], "View Item") : edit;
    child.Layouts = [edit, view, ...views].filter(Boolean);
    child.ListModel.LayoutView = JSON.stringify({
      add: edit?.LayoutID || "default",
      edit: edit?.LayoutID || "default",
      view: view?.LayoutID || edit?.LayoutID || "default",
      opentype: { add: "modal" },
      modalsize: {},
      sortVer: 1,
    });
    child.ListModel.Type = 1;
    child.ListModel.ListType = 1;
    child.ListModel.Flags = 1;
  }

  next.AppGroups = [];
  next.AppThemes = [];
  next.OtherModules = [];
  next.ReplaceIds = Array.from(new Set([
    next.Item.ListModel.ListID,
    ...next.Childs.flatMap((child) => [
      child.ListModel.ListID,
      ...child.Defs.map((field) => field.FieldID),
      ...child.Layouts.map((layout) => layout.LayoutID),
    ]),
  ].map(String)));
  return next;
}

function main() {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const { resource, data } = parseResource();

  const numericResourcePath = writeResource("vendor-onboarding-compliance-management.decoded-resource-yap-v1.1", resource, data);
  const numericResult = buildYap(numericResourcePath, "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.1-mainlisttype.yap");

  const dataModel = makeDataModelOnly(data);
  const dataModelResourcePath = writeResource("vendor-onboarding-compliance-management.decoded-resource-yap-v1.2-data-model", resource, dataModel);
  const dataModelResult = buildYap(dataModelResourcePath, "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.2-data-model.yap");
  const schemaDirect = makeSchemaDirectData(dataModel);
  const schemaDirectPath = "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.3-schema-direct.yap";
  writeSchemaDirectYap(schemaDirect, schemaDirectPath);
  const categoryFixedPath = "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-category-fixed.yap";
  writeSchemaDirectYap(schemaDirect, categoryFixedPath);
  const schemaResultPath = "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-yap-schema-result.yap";
  writeSchemaResultYap(schemaDirect, schemaResultPath);
  const schemaResultNoLookups = removeLookupRelationships(schemaDirect);
  const schemaResultNoLookupsPath = "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-yap-schema-result-no-lookups.yap";
  writeSchemaResultYap(schemaResultNoLookups, schemaResultNoLookupsPath);

  console.log(JSON.stringify({
    status: "generated",
    outputs: [
      {
        path: "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.1-mainlisttype.yap",
        purpose: "numeric MainListType candidate",
        buildStatus: numericResult.status,
      },
      {
        path: "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.2-data-model.yap",
        purpose: "data-model import isolation candidate",
        buildStatus: dataModelResult.status,
        dataLists: dataModel.Childs.length,
        fields: dataModel.Childs.reduce((total, child) => total + child.Defs.length, 0),
        dashboards: dataModel.Item.Layouts.length,
        layouts: dataModel.Childs.reduce((total, child) => total + child.Layouts.length, 0),
      },
      {
        path: schemaDirectPath,
        purpose: "schema-direct YAP v1 candidate",
        buildStatus: "written",
        dataLists: schemaDirect.Childs.length,
        fields: schemaDirect.Childs.reduce((total, child) => total + child.Defs.length, 0),
        dashboards: schemaDirect.Item.Layouts.length,
        layouts: schemaDirect.Childs.reduce((total, child) => total + child.Layouts.length, 0) + schemaDirect.Item.Layouts.length,
      },
      {
        path: categoryFixedPath,
        purpose: "schema-direct YAP with integer Field.Category values",
        buildStatus: "written",
        dataLists: schemaDirect.Childs.length,
        fields: schemaDirect.Childs.reduce((total, child) => total + child.Defs.length, 0),
        dashboards: schemaDirect.Item.Layouts.length,
        layouts: schemaDirect.Childs.reduce((total, child) => total + child.Layouts.length, 0) + schemaDirect.Item.Layouts.length,
      },
      {
        path: schemaResultNoLookupsPath,
        purpose: "ListExportResult YAP with Data string, no lookup relationships",
        buildStatus: "written",
        dataLists: schemaResultNoLookups.Childs.length,
        fields: schemaResultNoLookups.Childs.reduce((total, child) => total + child.Defs.length, 0),
        dashboards: schemaResultNoLookups.Item.Layouts.length,
        layouts: schemaResultNoLookups.Childs.reduce((total, child) => total + child.Layouts.length, 0) + schemaResultNoLookups.Item.Layouts.length,
      },
      {
        path: schemaResultPath,
        purpose: "ListExportResult YAP with Data string and lookup relationships",
        buildStatus: "written",
        dataLists: schemaDirect.Childs.length,
        fields: schemaDirect.Childs.reduce((total, child) => total + child.Defs.length, 0),
        dashboards: schemaDirect.Item.Layouts.length,
        layouts: schemaDirect.Childs.reduce((total, child) => total + child.Layouts.length, 0) + schemaDirect.Item.Layouts.length,
      },
    ],
  }, null, 2));
}

main();

function makeSchemaDirectData(source) {
  const data = structuredClone(source);
  const normalizeDate = "2026-05-29T01:30:00Z";
  const mapFieldName = (name) => name === "Title" ? "Text0" : name;
  const fixLayoutView = (value) => {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
      const parsed = JSON.parse(value);
      const rewrite = (node) => {
        if (Array.isArray(node)) return node.map(rewrite);
        if (node && typeof node === "object") {
          for (const [key, child] of Object.entries(node)) {
            if ((key === "FieldName" || key === "SortName" || key === "listfield" || key === "displayField") && child === "Title") node[key] = "Text0";
            else node[key] = rewrite(child);
          }
        }
        return node;
      };
      return JSON.stringify(rewrite(parsed));
    } catch {
      return value;
    }
  };
  const listModel = (model) => ({
    TenantID: 0,
    AppID: model.AppID || 41,
    ListID: model.ListID,
    Title: model.Title,
    Description: model.Description || "",
    Status: 1,
    IsItemPerm: false,
    IsVerRecord: false,
    HasComment: false,
    IconUrl: model.IconUrl || ICON_URL,
    TableCode: model.TableCode || "flowcraft",
    IndexCode: "",
    Created: normalizeDate,
    Modified: normalizeDate,
    CreatedBy: 0,
    ModifiedBy: 0,
    Ext1: "",
    Ext2: "",
    Ext3: "",
    Perm: 0,
    Type: model.Type,
    Flags: 1,
    CustomType: model.CustomType || "",
    WorkspaceID: "0",
    LayoutView: fixLayoutView(model.LayoutView),
    IsBreakInherit: false,
    IsDataSeparate: false,
    HasDeleted: false,
    HasEnabled: true,
    HasDisabled: false,
    AdvanceList: [],
  });
  const field = (item) => {
    const next = { ...item };
    next.FieldName = mapFieldName(next.FieldName);
    if (next.FieldName === "Text0") {
      next.FieldIndex = 0;
      next.IsSystem = false;
      next.Status = 1;
      next.Type = "input";
    }
    if (typeof next.Rules === "string") {
      try {
        const rules = JSON.parse(next.Rules);
        if (rules.listfield === "Title") rules.listfield = "Text0";
        if (rules.displayField === "Title") rules.displayField = "Text0";
        next.Rules = JSON.stringify(rules);
      } catch {
        // Leave opaque Rules strings unchanged.
      }
    }
    next.Category = normalizeFieldCategory(next.Category);
    return next;
  };
  const layout = (item) => ({
    LayoutID: item.LayoutID,
    ListID: item.ListID,
    Type: item.Type,
    Title: item.Title || "",
    LayoutView: fixLayoutView(item.LayoutView),
    AppID: 41,
    TenantID: 0,
    Created: normalizeDate,
    Modified: normalizeDate,
    CreatedBy: 0,
    ModifiedBy: 0,
    Ext1: typeof item.Ext1 === "string" ? item.Ext1 : "",
    Ext2: typeof item.Ext2 === "string" ? item.Ext2 : "",
    Ext3: typeof item.Ext3 === "string" ? item.Ext3 : "",
    IsDefault: !!item.IsDefault,
    IsItemPerm: !!item.IsItemPerm,
    LayoutInResources: (item.LayoutInResources || []).map((resource) => ({
      ID: item.LayoutID,
      RefId: item.LayoutID,
      Resource: resource.Resource || "",
    })),
  });
  return {
    Item: {
      ListModel: listModel(data.Item.ListModel),
      Defs: [],
      Layouts: (data.Item.Layouts || []).map(layout),
      PublicForms: [],
      RemindRules: [],
      FlowMappings: [],
      ListDatas: {},
    },
    Childs: data.Childs.map((child) => ({
      ListModel: listModel(child.ListModel),
      Defs: child.Defs.map(field),
      Layouts: child.Layouts.map(layout),
      PublicForms: [],
      RemindRules: [],
      FlowMappings: [],
      ListDatas: {},
    })),
    Forms: [],
    FormReports: [],
    DataReports: [],
    FormNewReports: [],
    AppGroups: [],
    AppTags: [],
    AppMetadatas: [],
    AppThemes: [],
    AppComponents: [],
    OtherModules: [],
  };
}

function normalizeFieldCategory(value) {
  if (Number.isInteger(value)) return value;
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) return Number.parseInt(value, 10);
  if (value === undefined || value === null || value === "" || value === "List") return 0;
  throw new Error(`Field.Category must be an integer; got ${Array.isArray(value) ? "array" : typeof value}.`);
}

function removeLookupRelationships(data) {
  const next = structuredClone(data);
  for (const child of next.Childs || []) {
    for (const field of child.Defs || []) {
      if (field.Type === "lookup") {
        field.Type = "input";
        field.Rules = null;
      }
    }
  }
  return next;
}

function writeSchemaDirectYap(data, output) {
  let resourceText = JSON.stringify(data);
  resourceText = unquoteIntegerProperties(resourceText);
  const wrapper = {
    Title: TITLE,
    Description: DESCRIPTION,
    IconUrl: ICON_URL,
    IsListSet: true,
    Resource: `[______gizp______]${zlib.gzipSync(Buffer.from(resourceText, "utf8")).toString("base64")}`,
  };
  fs.writeFileSync(output, `${JSON.stringify(wrapper, null, 2)}\n`);
}

function writeSchemaResultYap(data, output) {
  const listExportInfoText = unquoteIntegerProperties(JSON.stringify(data));
  const listExportResult = {
    MainListType: 1024,
    AppID: 41,
    ReplaceIds: [],
    ReportIds: [],
    FormKeys: [],
    Data: listExportInfoText,
  };
  const resourceText = JSON.stringify(listExportResult);
  const wrapper = {
    Title: TITLE,
    Description: DESCRIPTION,
    IconUrl: ICON_URL,
    IsListSet: true,
    Resource: `[______gizp______]${zlib.gzipSync(Buffer.from(resourceText, "utf8")).toString("base64")}`,
  };
  fs.writeFileSync(output, `${JSON.stringify(wrapper, null, 2)}\n`);
}

function unquoteIntegerProperties(jsonText) {
  const keys = [
    "TenantID",
    "AppID",
    "ListID",
    "CreatedBy",
    "ModifiedBy",
    "Perm",
    "Type",
    "Flags",
    "LayoutID",
    "FieldID",
    "FieldIndex",
    "ID",
    "RefId",
    "Status",
  ];
  let out = jsonText;
  for (const key of keys) {
    out = out.replace(new RegExp(`"${key}":"(-?\\d+)"`, "g"), `"${key}":$1`);
  }
  return out;
}
