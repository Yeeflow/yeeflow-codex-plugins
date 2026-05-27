import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";

const GZIP_PREFIX = "[______gizp______]";
const SOURCE_PACKAGE = process.env.YEEFLOW_SOURCE_PACKAGE || "/Users/Renger/Downloads/Sub list Dynamic.yap";
const OUT_DIR = ".tmp/sub-list-dynamic-actions-runtime-proof";
const OUT_PACKAGE = `${OUT_DIR}/sub-list-dynamic-actions-runtime-proof.v1.yap`;
const OUT_RESOURCE = `${OUT_DIR}/sub-list-dynamic-actions-runtime-proof.v1.resource.json`;
const OUT_DATA = `${OUT_DIR}/sub-list-dynamic-actions-runtime-proof.v1.app-def.json`;
const OUT_FORM_DEF = `${OUT_DIR}/sub-list-dynamic-actions-runtime-proof.v1.approval-form-def.json`;
const OUT_REPORT = `${OUT_DIR}/sub-list-dynamic-actions-runtime-proof.v1.generation-report.json`;
const DOWNLOADS_COPY = "/Users/Renger/Downloads/sub-list-dynamic-actions-runtime-proof.v1.yap";
const TITLE = "Sub List Dynamic Runtime Proof";
const FORM_NAME = "Dynamic Sub List Runtime Form";
const FORM_KEY = "SLDR";
const DASHBOARD_LAYOUT_ID = "1001";
const PROCESS_ID = "2001";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function uuid() {
  return crypto.randomUUID();
}

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function decodePackage(inputPath) {
  const wrapper = parseJson(fs.readFileSync(inputPath, "utf8"), inputPath);
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error(`${inputPath} is not a gzip-prefixed .yap wrapper.`);
  }
  const resource = parseJson(zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"), "Resource");
  const data = parseJson(resource.Data, "Resource.Data");
  return { wrapper, resource, data };
}

function walkControls(control, visitor) {
  if (!isObject(control)) return;
  visitor(control);
  for (const key of ["children", "columns", "rows", "items", "controls", "cells"]) {
    asArray(control[key]).forEach((child) => walkControls(child, visitor));
  }
}

function filterControlTree(control, predicate) {
  if (!isObject(control) || !predicate(control)) return null;
  const next = clone(control);
  for (const key of ["children", "columns", "rows", "items", "controls", "cells"]) {
    if (Array.isArray(next[key])) {
      next[key] = next[key].map((child) => filterControlTree(child, predicate)).filter(Boolean);
    }
  }
  return next;
}

function findFirstSubList(formdef) {
  let found = null;
  asArray(formdef.children).forEach((child) => {
    walkControls(child, (control) => {
      if (!found && control.type === "list" && control.attrs?.["list-fields"]) found = control;
    });
  });
  if (!found) throw new Error("Source export did not contain a Sub List control.");
  return clone(found);
}

function tokenPadding(value = "--sp--s0") {
  return [null, { top: value, right: value, bottom: value, left: value }];
}

function container(nvLabel, attrs = {}, children = []) {
  return { id: uuid(), type: "container", label: "Container", nv_label: nvLabel, attrs, children };
}

function heading(text, nvLabel, ty = "h4-medium") {
  return {
    id: uuid(),
    type: "heading",
    label: "Text",
    nv_label: nvLabel,
    attrs: {
      headc: { title: { value: text, variable: null } },
      heads: { ty: [null, ty], color: "var(--c--text)" },
      common: { positioning: { widthtype: [null, "2"] } },
    },
    children: [],
  };
}

function paragraph(text, nvLabel) {
  return {
    id: uuid(),
    type: "heading",
    label: "Text",
    nv_label: nvLabel,
    attrs: {
      headc: { title: { value: text, variable: null } },
      heads: { ty: [null, "s-regular"], color: "var(--c--neutral-dark-hover)" },
      common: { positioning: { widthtype: [null, "2"] } },
    },
    children: [],
  };
}

function cardAttrs() {
  return {
    style: { gap: [null, "--sp--s200"], direction: [null, "column"] },
    common: {
      padding: tokenPadding("--sp--s300"),
      background: { normal: { type: "classic", classic: { color: "var(--c--background)" } } },
      border: {
        normal: {
          type: "1",
          width: [null, { top: 1, right: 1, bottom: 1, left: 1 }],
          color: "var(--c--neutral-light-active)",
          radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }],
        },
      },
    },
  };
}

function headerGrid() {
  const cell = (text) => container(`Header ${text}`, {
    style: { gap: [null, "--sp--s0"], direction: [null, "column"] },
    common: { padding: tokenPadding("--sp--s100") },
  }, [heading(text, `${text} header`, "base-medium")]);
  return {
    id: uuid(),
    type: "flex_grid",
    label: "Grid",
    nv_label: "Dynamic Sub List Header",
    displayLabel: [null, false],
    attrs: {
      columns: { desktop: [{ w: 5 }, { w: 3 }, { w: 4 }] },
      rows: [{ h: "auto" }],
      cgap: { desktop: "--sp--s100" },
      rgap: { desktop: "--sp--s0" },
    },
    children: [cell("Item Name"), cell("Quantity"), cell("Notes")],
  };
}

function pageShell(subList) {
  return {
    id: uuid(),
    title: FORM_NAME,
    pagetype: 1,
    filterVars: [],
    tempVars: [],
    ver: 2,
    attrs: {
      container: { cw: "2", padding: tokenPadding("--sp--s0") },
      background: { type: "classic", classic: { color: "var(--c--neutral-light)" } },
    },
    children: [
      container("Main", {
        style: { gap: [null, "--sp--s0"], direction: [null, "column"], justify_content: [null, "flex-start"], align_items: [null, "center"] },
      }, [
        container("Content", {
          style: { gap: [null, "--sp--s300"], direction: [null, "column"], justify_content: [null, "flex-start"] },
          common: { padding: tokenPadding("--sp--s300") },
        }, [
          container("Form body", cardAttrs(), [
            heading(FORM_NAME, "Runtime proof heading"),
            paragraph("Use this form to manually verify Dynamic Sub List rendering and the selected local list actions.", "Runtime proof helper"),
            headerGrid(),
            subList,
          ]),
          container("Form bottom", {
            style: { gap: [null, "--sp--s200"], direction: [null, "column"] },
          }, [
            { id: uuid(), type: "workflowControlPanel", label: "Action Panel", attrs: { "show-task-panel": true, rejectValidation: true, align: "center" }, nv_label: "Action panel" },
            { id: uuid(), type: "workflowHistory", label: "Flow History", attrs: { "show-history": true }, nv_label: "Flow history" },
          ]),
        ]),
      ]),
    ],
  };
}

function reviewPageShell() {
  return {
    id: uuid(),
    title: `${FORM_NAME} Review`,
    pagetype: 2,
    filterVars: [],
    tempVars: [],
    ver: 2,
    attrs: {
      container: { cw: "2", padding: tokenPadding("--sp--s0") },
      background: { type: "classic", classic: { color: "var(--c--neutral-light)" } },
    },
    children: [
      container("Main", {
        style: { gap: [null, "--sp--s0"], direction: [null, "column"], justify_content: [null, "flex-start"], align_items: [null, "center"] },
      }, [
        container("Content", {
          style: { gap: [null, "--sp--s300"], direction: [null, "column"], justify_content: [null, "flex-start"] },
          common: { padding: tokenPadding("--sp--s300") },
        }, [
          container("Form body", cardAttrs(), [
            heading(`${FORM_NAME} Review`, "Review heading"),
            paragraph("Review page exists for approval-form package validity. Dynamic Sub List action runtime testing is scoped to the request page.", "Review helper"),
          ]),
          container("Form bottom", {
            style: { gap: [null, "--sp--s200"], direction: [null, "column"] },
          }, [
            { id: uuid(), type: "workflowControlPanel", label: "Action Panel", attrs: { "show-task-panel": true, rejectValidation: true, align: "center" }, nv_label: "Action panel" },
            { id: uuid(), type: "workflowHistory", label: "Flow History", attrs: { "show-history": true }, nv_label: "Flow history" },
          ]),
        ]),
      ]),
    ],
  };
}

function normalizeSubList(sourceSubList, listVarId) {
  const subList = clone(sourceSubList);
  subList.id = uuid();
  subList.label = "Runtime Line Items";
  subList.nv_label = "Runtime dynamic sub list";
  subList.binding = listVarId;
  subList.displayLabel = [null, true];
  subList.attrs["list-display-preference"] = "dynamic";
  subList.attrs.fallback = { et: "Click the following button to add a new item." };
  delete subList.attrs.common?.css;

  const wanted = new Map([
    ["field_1", { name: "Item Name", type: "text", label: "Item Name", controlType: "input" }],
    ["field_2", { name: "Quantity", type: "number", label: "Quantity", controlType: "input_number" }],
    ["field_4", { name: "Notes", type: "text", label: "Notes", controlType: "input" }],
  ]);
  subList.attrs["list-fields"] = asArray(subList.attrs["list-fields"])
    .filter((field) => wanted.has(field.id))
    .map((field, order) => {
      const meta = wanted.get(field.id);
      const next = { ...field, name: meta.name, type: meta.type, Order: order };
      if (next.control) {
        next.control = { ...next.control, label: meta.label, type: meta.controlType, binding: field.id };
        next.control.id = uuid();
        next.control.attrs = {
          ...(next.control.attrs || {}),
          list_field: true,
          list_field_binding: listVarId,
          list_control_id: subList.id,
        };
        if (field.id === "field_2") {
          next.control.attrs.displayThousandths = "1";
          next.control.attrs["rounded-to"] = 0;
          next.control.attrs.number_min = 0;
        } else {
          next.control.attrs.placeholder = `Enter ${meta.name.toLowerCase()}`;
        }
      }
      return next;
    });
  subList.attrs["list-variables"] = asArray(subList.attrs["list-variables"])
    .filter((field) => wanted.has(field.id))
    .map((field) => ({ ...field, name: wanted.get(field.id).name, type: wanted.get(field.id).type }));
  subList.attrs["list-fields-summary"] = [{ field: "field_2", type: "total", display: true }];

  const keptActionNames = new Set(["Add sub item", "Duplicate item", "Delete item", "Import items"]);
  subList.attrs.actions = asArray(subList.attrs.actions).filter((action) => keptActionNames.has(action.name));
  const actionIdByName = new Map(subList.attrs.actions.map((action) => [action.name, action.id]));

  subList.children = asArray(subList.children).map((child) => {
    if (child.type !== "list-body") return child;
    return filterControlTree(child, (node) => {
      if (node.attrs?.list_field && !wanted.has(node.binding)) return false;
      if (node.type === "action_button" && /Insert/.test(String(node.label))) return false;
      return true;
    });
  }).filter(Boolean);

  walkControls(subList, (control) => {
    if (control.attrs?.list_field) {
      control.attrs.list_field_binding = listVarId;
      control.attrs.list_control_id = subList.id;
      if (wanted.has(control.binding)) control.label = wanted.get(control.binding).label;
    }
  });

  const body = subList.children.find((child) => child.type === "list-body");
  let duplicateButton = null;
  walkControls(body, (control) => {
    if (control.type === "action_button" && control.label === "Duplicate") duplicateButton = control;
  });
  if (duplicateButton && actionIdByName.has("Delete item")) {
    const deleteButton = clone(duplicateButton);
    deleteButton.id = uuid();
    deleteButton.label = "Delete";
    deleteButton.attrs.control_action = actionIdByName.get("Delete item");
    deleteButton.attrs.icon = "fa-regular fa-trash";
    const host = findParentWithChildren(body, duplicateButton);
    if (host) host.children.push(deleteButton);
  }

  walkControls(subList, (control) => {
    if (control.type !== "action_button") return;
    if (control.label === "Add another item") control.attrs.control_action = actionIdByName.get("Add sub item");
    if (control.label === "Import items") control.attrs.control_action = actionIdByName.get("Import items");
    if (control.label === "Duplicate") control.attrs.control_action = actionIdByName.get("Duplicate item");
    if (control.label === "Delete") control.attrs.control_action = actionIdByName.get("Delete item");
  });

  return subList;
}

function findParentWithChildren(root, target) {
  if (!isObject(root)) return null;
  if (asArray(root.children).includes(target)) return root;
  for (const child of asArray(root.children)) {
    const hit = findParentWithChildren(child, target);
    if (hit) return hit;
  }
  return null;
}

function renewControlIds(root) {
  walkControls(root, (control) => {
    if (control.id) control.id = uuid();
    asArray(control.attrs?.["list-fields"]).forEach((field) => {
      if (field.control?.id) field.control.id = uuid();
    });
  });
}

function dashboardPage() {
  return {
    title: "Runtime Proof Home",
    ver: 2,
    attrs: {
      hideHeaderAll: true,
      container: { padding: tokenPadding("--sp--s0") },
      background: { type: "classic", classic: { color: "var(--c--neutral-light)" } },
    },
    filterVars: [],
    tempVars: [],
    children: [
      container("Main", {
        style: { gap: [null, "--sp--s0"], direction: [null, "column"], justify_content: [null, "flex-start"], align_items: [null, "center"] },
      }, [
        container("Content", {
          style: { gap: [null, "--sp--s300"], direction: [null, "column"] },
          common: { padding: tokenPadding("--sp--s300") },
        }, [
          heading(TITLE, "Dashboard title", "h3-bold"),
          paragraph("Open the approval form from the app navigation and test the Dynamic Sub List actions manually.", "Dashboard helper"),
        ]),
      ]),
    ],
  };
}

function rootDashboardLayout(rootListId, metadata) {
  return {
    LayoutID: DASHBOARD_LAYOUT_ID,
    Type: 103,
    Title: "Runtime Proof Home",
    ListID: rootListId,
    LayoutView: null,
    Ext2: "{\"src\":true}",
    IsDefault: true,
    IsItemPerm: false,
    Created: metadata.Created,
    Modified: metadata.Modified,
    CreatedBy: metadata.CreatedBy,
    ModifiedBy: metadata.ModifiedBy,
    LayoutInResources: [{ ID: DASHBOARD_LAYOUT_ID, RefId: DASHBOARD_LAYOUT_ID, Resource: JSON.stringify(dashboardPage()) }],
  };
}

function updateReplaceIds(resource, data) {
  const preserve = new Set([
    data.Item?.ListModel?.TenantID,
    data.Item?.ListModel?.CreatedBy,
    data.Item?.ListModel?.ModifiedBy,
  ].filter(Boolean).map(String));
  const ids = new Set(asArray(resource.ReplaceIds).map(String));
  ids.add(DASHBOARD_LAYOUT_ID);
  ids.add(PROCESS_ID);
  resource.ReplaceIds = [...ids].filter((id) => !preserve.has(id));
}

function main() {
  const decoded = decodePackage(SOURCE_PACKAGE);
  const { wrapper, resource, data } = decoded;
  const form = data.Forms?.[0];
  if (!form) throw new Error("Source export has no approval form.");
  const def = parseJson(form.DefResource, "form.DefResource");
  const firstPage = def.pageurls?.[0];
  if (!firstPage) throw new Error("Source approval form has no pageurls[0].");
  const sourceFormdef = typeof firstPage.formdef === "string" ? parseJson(firstPage.formdef, "page.formdef") : firstPage.formdef;
  const sourceSubList = findFirstSubList(sourceFormdef);
  const listVarId = "LineItems";
  const listRefId = "listref_runtime_line_items";
  const subList = normalizeSubList(sourceSubList, listVarId);

  const root = data.Item.ListModel;
  root.Title = TITLE;
  root.Description = "Focused generated package for manual runtime proof of Approval Form Dynamic Sub List actions.";
  root.IconUrl = JSON.stringify({ b: "#E6F0FF", i: "fa-regular fa-list-check", c: "#0065FF" });
  root.CustomType = "";
  root.Perm = 0;
  root.Flags = 1;
  root.LayoutView = JSON.stringify({
    sortVer: 1,
    sort: [
      { AppID: root.AppID, ListID: DASHBOARD_LAYOUT_ID, ListSetID: root.ListID, Type: 103, IsHidden: false, Title: "Runtime Proof Home" },
      { AppID: root.AppID, ListID: FORM_KEY, ListSetID: root.ListID, Type: 105, IsHidden: false, Title: FORM_NAME },
    ],
    attrs: {
      "navigator-menu": { position: "left", bgc: "#ffffff", color: "#172554" },
      appearance: { bgc: "#172554", color: "#ffffff", hideTitle: false, height: 46 },
    },
  });
  data.Item.Layouts = [rootDashboardLayout(root.ListID, root)];

  form.Name = FORM_NAME;
  form.Key = FORM_KEY;
  form.DefKey = FORM_KEY;
  form.FlowKey = FORM_KEY;
  form.Description = "Focused approval form for manual Dynamic Sub List action runtime proof.";
  form.Status = 1;
  form.Deployed = true;
  form.ListID = 0;
  form.ProcModelID = PROCESS_ID;
  form.NoRule = { Prefix: "SLDR-{index}", StartIndex: 1, CustomLength: 4, AutoIncrement: 1 };
  form.WorkflowType = 2;
  form.ListSetID = root.ListID;
  form.AppListSetID = root.ListID;
  form.ProcModelListSetID = root.ListID;

  const pageId = uuid();
  const reviewPageId = uuid();
  def.defkey = FORM_KEY;
  def.name = FORM_NAME;
  def.title = FORM_NAME;
  def.workflowType = "approval";
  def.deployed = true;
  def.status = 1;
  def.published = true;
  def.ProcModelListID = PROCESS_ID;
  def.ProcModelAppID = root.AppID;
  def.ProcModelListSetID = root.ListID;
  def.AppListSetID = root.ListID;
  def.listSet = root.ListID;
  const submitFormdef = pageShell(subList);
  const reviewFormdef = reviewPageShell();
  def.pageurls = [{
    id: pageId,
    name: FORM_NAME,
    title: FORM_NAME,
    type: 1,
    pagetype: 1,
    formdef: submitFormdef,
  }, {
    id: reviewPageId,
    name: `${FORM_NAME} Review`,
    title: `${FORM_NAME} Review`,
    type: 2,
    pagetype: 1,
    formdef: reviewFormdef,
  }];
  def.pageurls[0].formdef.id = pageId;
  def.pageurls[1].formdef.id = reviewPageId;
  def.variables = {
    basic: [{
      idx: "sldr-var-line-items",
      id: listVarId,
      name: "Line Items",
      type: "list",
      editable: true,
      value: listRefId,
    }],
    listref: [{
      id: listRefId,
      name: listVarId,
      idx: "sldr-listref-line-items",
      fields: subList.attrs["list-variables"].map((field) => ({ ...field })),
    }],
    filter: [],
  };

  const startId = "sldr-node-start";
  const endId = "sldr-node-end";
  const flowId = "sldr-flow-start-end";
  def.flowPage = [];
  def.graphposition = { x: 0, y: 0, width: 640, height: 360 };
  def.graphzoom = 1;
  def.graphver = "1.0";
  def.childshapes = [
    { id: startId, resourceid: startId, stencil: { id: "StartNoneEvent" }, outgoing: [{ id: flowId, resourceid: flowId }], incoming: [], position: { x: 80, y: 120 }, properties: { name: "Start", taskurl: pageId, taskUrl: pageId, TaskUrl: pageId } },
    { id: flowId, resourceid: flowId, stencil: { id: "SequenceFlow" }, source: { id: startId, resourceid: startId }, target: { id: endId, resourceid: endId }, outgoing: [{ resourceid: endId }], incoming: [{ resourceid: startId }], properties: { name: "Start to End", conditioninfo: [] } },
    { id: endId, resourceid: endId, stencil: { id: "EndNoneEvent" }, outgoing: [], incoming: [{ id: flowId, resourceid: flowId }], position: { x: 360, y: 120 }, properties: { name: "End" } },
  ];
  form.DefResource = JSON.stringify(def);
  data.Forms = [form];

  resource.MainListType = 1024;
  resource.FormKeys = [FORM_KEY];
  resource.ReportIds = [];
  resource.Data = JSON.stringify(data);
  updateReplaceIds(resource, data);

  const outWrapper = {
    ...wrapper,
    Title: TITLE,
    Description: "Focused generated package for manual runtime proof of Approval Form Dynamic Sub List list actions.",
    IconUrl: root.IconUrl,
    IsListSet: true,
    Resource: `${GZIP_PREFIX}${zlib.gzipSync(Buffer.from(JSON.stringify(resource), "utf8")).toString("base64")}`,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_RESOURCE, `${JSON.stringify(resource, null, 2)}\n`);
  fs.writeFileSync(OUT_DATA, `${JSON.stringify(data, null, 2)}\n`);
  fs.writeFileSync(OUT_FORM_DEF, `${JSON.stringify(def, null, 2)}\n`);
  fs.writeFileSync(OUT_PACKAGE, `${JSON.stringify(outWrapper, null, 2)}\n`);
  fs.copyFileSync(OUT_PACKAGE, DOWNLOADS_COPY);
  fs.writeFileSync(OUT_REPORT, `${JSON.stringify({
    status: "pass",
    sourcePackage: SOURCE_PACKAGE,
    outputPackage: OUT_PACKAGE,
    downloadsCopy: DOWNLOADS_COPY,
    appName: TITLE,
    approvalForm: FORM_NAME,
    subLists: 1,
    layout: "dynamic",
    actions: ["list_new", "list_dup", "list_del", "list_import"],
    proofBoundary: "Pending manual runtime import/open/action test; generated from export-proven Approval Form Dynamic Sub List schema only.",
  }, null, 2)}\n`);

  console.log(JSON.stringify({
    status: "pass",
    package: OUT_PACKAGE,
    downloadsCopy: DOWNLOADS_COPY,
    actions: ["list_new", "list_dup", "list_del", "list_import"],
  }, null, 2));
}

main();
