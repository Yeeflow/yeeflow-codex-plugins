import fs from "node:fs";
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
    ],
  }, null, 2));
}

main();
