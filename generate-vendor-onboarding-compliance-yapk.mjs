import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { loadDotenvFile, resolveYeeflowEnvironment } from "./scripts/yeeflow-env-utils.mjs";

const APP_ID = 41;
const FAMILY = 7601000000000000000n;
const GENERATED_AT = "2026-05-29 09:30:00";
const GENERATED_AT_UTC = "2026-05-29T01:30:00Z";
const APP_TITLE = "Vendor Onboarding & Compliance Management";
const APP_DESCRIPTION = "Full-scope generated YAPK candidate for vendor onboarding, compliance review, document tracking, task management, dashboards, and print summary.";
const SPEC_PATH = "docs/generated-app-plans/vendor-onboarding-compliance-ui-implementation-spec.md";
const OUT_YAPK = process.env.VENDOR_ONBOARDING_YAPK_OUTPUT || "/Users/Renger/Downloads/vendor-onboarding-compliance-management.full-ui.v2-src-dashboard.yapk";
const OUT_YAP = process.env.VENDOR_ONBOARDING_YAP_OUTPUT || "/Users/Renger/Downloads/vendor-onboarding-compliance-management.full-ui.v2-src-dashboard.yap";
const WRAPPER_VERSION = process.env.VENDOR_ONBOARDING_YAPK_VERSION || "full-ui.v2-src-dashboard";
const CURRENT_DASHBOARD_EXT2 = "{\"src\":true}";
const TMP_DIR = ".tmp/vendor-onboarding-compliance-management";
const OUT_DECODED_DATA = `${TMP_DIR}/vendor-onboarding-compliance-management.decoded-data.json`;
const OUT_DECODED_RESOURCE = `${TMP_DIR}/vendor-onboarding-compliance-management.decoded-resource.json`;
const OUT_VALIDATION_YAP_WRAPPER = `${TMP_DIR}/vendor-onboarding-compliance-management.validation-wrapper.yap.json`;
const OUT_APP_PACKAGE = `${TMP_DIR}/vendor-onboarding-compliance-management.app-package-info.json`;
const OUT_REPORT = `${TMP_DIR}/vendor-onboarding-compliance-management.generation-report.json`;

const ROOT_ID = String(FAMILY);
const DASHBOARD_ID = String(FAMILY + 1n);
const COMPLIANCE_WORKSPACE_ID = String(FAMILY + 2n);
const VENDORS_ID = String(FAMILY + 100n);
const VENDOR_DOCUMENTS_ID = String(FAMILY + 200n);
const COMPLIANCE_REVIEWS_ID = String(FAMILY + 300n);
const VENDOR_TASKS_ID = String(FAMILY + 400n);
const VENDOR_ACTIVITY_ID = String(FAMILY + 500n);

let idOffset = 1000n;

function nextId() {
  idOffset += 1n;
  return String(FAMILY + idOffset);
}

function uuid(prefix = "ctrl") {
  return `${prefix}-${crypto.randomUUID()}`;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function parseJson(value, fallback = {}) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function cleanInternalName(value) {
  const out = String(value).replace(/[^A-Za-z0-9_]/g, "");
  return out || `Field_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
}

function field(listId, spec) {
  const rules = spec.rules || autoFieldRules(spec);
  return {
    FieldID: spec.fieldId || nextId(),
    ListID: listId,
    FieldName: spec.fieldName,
    FieldType: spec.fieldType || "Text",
    FieldIndex: spec.fieldName === "Title" ? 0 : Number(String(spec.fieldName).match(/(\d+)$/)?.[1] || spec.fieldIndex || 0),
    DisplayName: spec.displayName,
    InternalName: cleanInternalName(spec.internalName || spec.displayName),
    DisplayName_EN: null,
    Type: spec.type || "input",
    Status: spec.status ?? (spec.fieldName === "Title" ? 0 : 1),
    Category: 0,
    DefaultValue: spec.defaultValue ?? null,
    Rules: JSON.stringify(rules),
    AppID: APP_ID,
    IsSort: spec.isSort ?? spec.fieldName === "Title",
    IsIndex: spec.isIndex ?? spec.fieldName === "Title",
    IsFilter: spec.isFilter ?? false,
    IsIndexCreated: false,
    IsSystem: spec.isSystem ?? spec.fieldName === "Title",
    IsUnique: false,
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
    Ext1: null,
    Ext2: null,
    Ext3: null,
    Title: spec.displayName,
  };
}

function choices(items) {
  return {
    choices: items.map((item, index) => ({
      Id: String(index + 1),
      Value: item,
      Text: item,
      Color: ["#2563EB", "#0F766E", "#F59E0B", "#DC2626", "#64748B", "#7C3AED"][index % 6],
    })),
  };
}

function vendorLookupRules() {
  return {
    appid: APP_ID,
    listsetid: ROOT_ID,
    listid: VENDORS_ID,
    listfield: "Title",
    displayField: "Title",
  };
}

function autoFieldRules(spec) {
  if (spec.type === "lookup" && spec.displayName === "Vendor") return vendorLookupRules();
  if (spec.type !== "select") return {};
  const byName = {
    "Vendor Type": ["Strategic Supplier", "Service Provider", "Technology Vendor", "Contractor", "Consultant"],
    "Country / Region": ["United States", "Singapore", "European Union", "United Kingdom", "Australia", "Other"],
    "Risk Level": ["Low", "Medium", "High", "Critical"],
    "Onboarding Status": ["Request Submitted", "Procurement Review", "Compliance Review", "Legal Review", "Finance Review", "Approved", "Rejected"],
    "Compliance Status": ["Not Started", "In Review", "Action Required", "Approved", "Expired"],
    "Contract Status": ["Not Started", "Drafting", "Legal Review", "Signed", "Renewal Due"],
    "Payment Terms": ["Net 15", "Net 30", "Net 45", "Net 60", "Prepaid"],
    "Budget Category": ["Operations", "IT", "Marketing", "Facilities", "Professional Services"],
    "Tax Review Status": ["Not Started", "Pending", "Approved", "Rejected"],
    "Bank Info Status": ["Not Requested", "Pending", "Verified", "Rejected"],
    "Document Type": ["W-9 / Tax Form", "Insurance Certificate", "Business Registration", "Contract", "Bank Details", "Certification"],
    "Review Status": ["Not Started", "In Review", "Action Required", "Approved", "Rejected"],
    "Review Type": ["Sanctions Screening", "Insurance Review", "Certification Review", "Privacy Review", "Risk Assessment"],
    "Severity": ["Low", "Medium", "High", "Critical"],
    "Task Type": ["Document Request", "Legal Review", "Finance Review", "Compliance Action", "Renewal Follow-up"],
    "Status": ["Open", "In Progress", "Blocked", "Completed", "Cancelled"],
    "Priority": ["Low", "Medium", "High", "Urgent"],
    "Activity Type": ["Request Submitted", "Document Uploaded", "Review Completed", "Approval Decision", "Status Changed", "Renewal Reminder"],
  };
  return choices(byName[spec.displayName] || ["Option 1", "Option 2", "Option 3"]);
}

function layout(listId, title, type, resource, extra = {}) {
  const layoutId = extra.layoutId || nextId();
  const isDashboard = Number(type) === 103;
  return {
    LayoutID: layoutId,
    ListID: listId,
    Title: title,
    Type: type,
    Status: 1,
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
    LayoutView: extra.layoutView ?? null,
    Ext1: extra.ext1 ?? null,
    Ext2: extra.ext2 ?? (isDashboard ? CURRENT_DASHBOARD_EXT2 : null),
    LayoutInResources: resource === null ? [] : [{ ID: layoutId, RefId: layoutId, Resource: JSON.stringify(resource) }],
  };
}

function listModel(listId, title, description, type = 1, layoutView = {}) {
  const normalizedType = type === "classes" ? 1024 : type;
  return {
    ListID: listId,
    Title: title,
    Name: title,
    Description: description,
    AppID: APP_ID,
    Type: normalizedType,
    ListType: normalizedType,
    Flags: 1,
    Status: 1,
    CustomType: type === "classes" ? "" : `ListSite_${ROOT_ID}`,
    TableCode: cleanInternalName(title).toLowerCase(),
    IconUrl: "{\"b\":\"#E6F7FF\",\"i\":\"fa-regular fa-building\",\"c\":\"#008DA6\"}",
    LayoutView: JSON.stringify(layoutView),
    WorkspaceID: "0",
    CreatedBy: "0",
    ModifiedBy: "0",
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
  };
}

function control(type, label, attrs = {}, children = [], extra = {}) {
  return {
    id: extra.id || uuid(type),
    type,
    label,
    attrs,
    children,
    nv_label: extra.nv_label || label,
    ...Object.fromEntries(Object.entries(extra).filter(([key]) => !["id", "nv_label"].includes(key))),
  };
}

function page(title, children, tempVars = []) {
  return {
    title,
    ver: "2.0",
    filterVars: [],
    tempVars,
    attrs: {
      hideHeaderAll: true,
      common: { padding: { left: 0, right: 0, top: 0, bottom: 0 } },
    },
    children: [
      container(`${title} padded page`, children, {
        padding: { left: 32, right: 32, top: 28, bottom: 32 },
        background: "#F7FAFC",
        gap: 24,
      }),
    ],
  };
}

function container(label, children, options = {}) {
  return control("container", "Container", {
    style: {
      direction: [null, options.direction || "column"],
      gap: [null, options.gap || 16],
      align_items: [null, options.align || "stretch"],
      justify_content: [null, options.justify || "flex-start"],
    },
    common: {
      padding: options.padding || { left: 20, right: 20, top: 20, bottom: 20 },
      background: { normal: { type: "classic", classic: { color: options.background || "#ffffff" } } },
      border: options.border === false ? undefined : {
        normal: {
          type: "1",
          width: { left: 1, right: 1, top: 1, bottom: 1 },
          color: options.borderColor || "#E5E7EB",
          radius: { left: 8, right: 8, top: 8, bottom: 8 },
        },
      },
    },
  }, children, { nv_label: label });
}

function grid(label, children, columns = 2) {
  return control("container", "Grid", {
    grid: { columns },
    style: { direction: [null, "row"], gap: [null, 16], align_items: [null, "stretch"], wrap: true },
    common: { padding: { left: 0, right: 0, top: 0, bottom: 0 } },
  }, children, { nv_label: label });
}

function heading(value, size = "h4-bold") {
  return control("heading", "Text", {
    headc: { title: { value, variable: null } },
    heads: { ty: [null, size], color: "var(--c--text)" },
  }, [], { nv_label: value });
}

function paragraph(value) {
  return control("heading", "Text", {
    headc: { title: { value, variable: null } },
    heads: { ty: [null, "s-regular"], color: "var(--c--neutral-dark-hover)" },
  }, [], { nv_label: value.slice(0, 48) });
}

function button(label, action = "navigate") {
  return control("button", "Button", {
    text: label,
    intent: action,
    button_type: "primary",
  }, [], { nv_label: label });
}

function dynamicField(fieldName, label = fieldName, extraAttrs = {}) {
  return control("dynamic-field", "Dynamic field", {
    source: "3",
    "obj-f": fieldName,
    item_style: { ty: [null, "s-medium"] },
    ...extraAttrs,
  }, [], { nv_label: label });
}

function dynamicUser(fieldName, label = fieldName) {
  return control("dynamic-user", "Dynamic user", {
    source: "3",
    "obj-f": fieldName,
    display_name: true,
    addition_fields: ["Email"],
    picture_style: { "image-size": [null, 28], gap: [null, 8], align: [null, "center"] },
  }, [], { nv_label: label });
}

function dynamicFile(fieldName, label = fieldName) {
  return control("dynamic-file", "Dynamic file", {
    source: "3",
    "obj-f": fieldName,
    type_icon_show: true,
    content: { w: [null, 100], wu: [null, "%"], iconsize: [null, 18] },
  }, [], { nv_label: label });
}

function listRef(listId, title, type = 1) {
  return { AppID: APP_ID, ListID: listId, ListSetID: ROOT_ID, Type: type, Title: title };
}

function dataTable(label, listId, title, columns) {
  return control("data-list", "Data table", {
    data: { list: listRef(listId, title) },
    listarr: columns.map((fieldName, index) => ({
      Field: fieldName,
      FieldName: fieldDisplayName(listId, fieldName),
      DisplayName: fieldDisplayName(listId, fieldName),
      Order: index + 1,
      Show: true,
    })),
    table: { striped: true, bordered: false, density: "comfortable" },
  }, [], { nv_label: label });
}

function localAction(name) {
  return {
    id: uuid("action"),
    name,
    type: "coll",
    steps: [{ type: "noop", attrs: { note: `${name} should be bound to tenant-specific workflow after import if needed.` } }],
  };
}

function kanban(label, listId, title, groupField, templateFields) {
  return control("kanban", "Kanban", {
    data: { list: listRef(listId, title), cateField: groupField },
    categories: { width: [null, 280], collapse: true },
    items: { pd: { left: 10, right: 10, top: 10, bottom: 10 } },
    actions: [localAction("View"), localAction("Assign Task")],
  }, [
    control("kanban-body", "Kanban body", {}, [
      container(`${label} card template`, templateFields.map(([fieldName, fieldLabel]) => dynamicField(fieldName, fieldLabel)), {
        padding: { left: 14, right: 14, top: 14, bottom: 14 },
        gap: 8,
      }),
    ], { nv_label: `${label} item template` }),
  ], { nv_label: label });
}

function collection(label, listId, title, templateFields, actions = []) {
  return control("collection", "Collection", {
    data: { list: listRef(listId, title) },
    layout: { type: "card-grid", columns: 2 },
    actions: actions.map(localAction),
  }, [
    container(`${label} card template`, templateFields.map(([fieldName, fieldLabel]) => (
      fieldLabel.toLowerCase().includes("assigned") || fieldLabel.toLowerCase().includes("reviewer")
        ? dynamicUser(fieldName, fieldLabel)
        : dynamicField(fieldName, fieldLabel)
    )), { padding: { left: 16, right: 16, top: 16, bottom: 16 }, gap: 8 }),
  ], { nv_label: label });
}

function timeline(label, listId, title, fields) {
  return control("timeline-v", "Vertical timeline", {
    data: {
      list: listRef(listId, title),
      sort: [{ SortName: fields.date, Direction: "desc" }],
      title: { type: "expr", exprType: "variable_ctx", ctx: "__ctx_timeline", id: fields.title },
    },
  }, [
    container(`${label} item template`, [
      dynamicField(fields.title, "Timeline title"),
      dynamicField(fields.date, "Timeline date"),
      dynamicField(fields.type, "Timeline type"),
      dynamicField(fields.actor, "Timeline actor"),
      dynamicField(fields.description, "Timeline description"),
    ], { padding: { left: 12, right: 12, top: 12, bottom: 12 }, gap: 6 }),
  ], { nv_label: label });
}

function progressCircle(label, value = 68) {
  return control("progress-circle", "Progress circle", {
    value,
    label,
    color: "var(--c--primary)",
  }, [], { nv_label: label });
}

function progressBar(label, fieldName = "Decimal16") {
  return control("progress", "Progress bar", {
    value: { type: "expr", exprType: "list_field", prop: fieldName },
    "obj-f": fieldName,
    source: "3",
    label,
    color: "var(--c--primary)",
  }, [], { nv_label: label });
}

function alertBox(label, message, tone = "warning") {
  return control("alert", "Alert", {
    title: label,
    description: message,
    type: tone,
  }, [], { nv_label: label });
}

function iconList(label, items) {
  return control("icon_list", "Icon list", {
    items: items.map((item) => ({ icon: item.icon, title: item.title, description: item.description, action: { type: "navigate", steps: [] } })),
  }, [], { nv_label: label });
}

function stepsBar() {
  return control("steps-bar", "Steps bar", {
    "steps-options": [
      "Request Submitted",
      "Procurement Review",
      "Compliance Review",
      "Legal Review",
      "Finance Review",
      "Approved",
    ].map((label, index) => ({ label, value: String(index + 1) })),
  }, [], { nv_label: "Onboarding progress steps" });
}

function tabs(label, tabSpecs) {
  return control("tabs", "Tabs", {
    tabs: tabSpecs.map((tab) => ({ id: tab.id, label: tab.label })),
  }, tabSpecs.map((tab) => control("tab-panel", tab.label, { tab: tab.id }, tab.children, { nv_label: `${tab.label} tab` })), { nv_label: label });
}

function toggle(label, children) {
  return control("toggle", "Toggle", { open: true }, [
    control("toggle-panel", label, { title: { value: label } }, children, { nv_label: `${label} section` }),
  ], { nv_label: label });
}

function dynamicSubList(label) {
  return control("list", "Dynamic Sub List", {
    binding: "RequiredDocuments",
    "list-display-preference": "dynamic",
    "list-fields": [
      { id: "DocumentType", name: "Document Type" },
      { id: "Required", name: "Required" },
      { id: "FileAttachment", name: "File Attachment" },
      { id: "ExpiryDate", name: "Expiry Date" },
      { id: "ReviewStatus", name: "Review Status" },
      { id: "Notes", name: "Notes" },
    ],
  }, [
    container("Required document row template", [
      dynamicField("Text2", "Document Type"),
      dynamicFile("Text3", "File Attachment"),
      dynamicField("DateTime7", "Expiry Date"),
      dynamicField("Text4", "Review Status"),
    ], { padding: { left: 12, right: 12, top: 12, bottom: 12 }, gap: 8 }),
  ], { nv_label: label });
}

function documentEmbed(fieldName) {
  return control("document-embed", "Document embed", {
    source: "3",
    "obj-f": fieldName,
    "doc-source": { mode: "related-list", listid: VENDOR_DOCUMENTS_ID, field: fieldName },
    height: 360,
  }, [], { nv_label: "Selected vendor document preview" });
}

function qrCode(fieldName) {
  return control("qr-code", "QR Code", {
    source: "3",
    "obj-f": fieldName,
    size: 96,
  }, [], { nv_label: "Vendor record QR code" });
}

function barcode(fieldName) {
  return control("barcode", "Barcode", {
    source: "3",
    "obj-f": fieldName,
    value: { type: "expr", exprType: "list_field", prop: fieldName },
    type: "CODE128",
    height: 56,
  }, [], { nv_label: "Vendor code barcode" });
}

function divider() {
  return control("divider", "Divider", { style: "solid", color: "#E5E7EB" }, [], { nv_label: "Section divider" });
}

function formInput(fieldName, label) {
  return control("field", label, { source: "3", "obj-f": fieldName, required: ["Title", "Text1", "Text2", "Text3"].includes(fieldName) }, [], { nv_label: label });
}

const vendorFields = [
  field(VENDORS_ID, { fieldName: "Title", displayName: "Vendor Name", internalName: "VendorName" }),
  field(VENDORS_ID, { fieldName: "Text1", displayName: "Vendor Type", type: "select", isFilter: true }),
  field(VENDORS_ID, { fieldName: "Text2", displayName: "Country / Region", type: "select", isFilter: true }),
  field(VENDORS_ID, { fieldName: "Text3", displayName: "Primary Contact" }),
  field(VENDORS_ID, { fieldName: "Text4", displayName: "Email" }),
  field(VENDORS_ID, { fieldName: "Text5", displayName: "Phone" }),
  field(VENDORS_ID, { fieldName: "Text6", displayName: "Risk Level", type: "select", isFilter: true }),
  field(VENDORS_ID, { fieldName: "Text7", displayName: "Onboarding Status", type: "select", isFilter: true }),
  field(VENDORS_ID, { fieldName: "Text8", displayName: "Compliance Status", type: "select", isFilter: true }),
  field(VENDORS_ID, { fieldName: "Text9", displayName: "Contract Status", type: "select", isFilter: true }),
  field(VENDORS_ID, { fieldName: "Text10", displayName: "Payment Terms", type: "select" }),
  field(VENDORS_ID, { fieldName: "Decimal11", fieldType: "Decimal", displayName: "Annual Spend Estimate", type: "currency" }),
  field(VENDORS_ID, { fieldName: "DateTime12", fieldType: "DateTime", displayName: "Renewal Date", type: "datepicker", isFilter: true }),
  field(VENDORS_ID, { fieldName: "Text13", displayName: "Owner", type: "identity-picker" }),
  field(VENDORS_ID, { fieldName: "DateTime14", fieldType: "DateTime", displayName: "Created Date", type: "datepicker" }),
  field(VENDORS_ID, { fieldName: "DateTime15", fieldType: "DateTime", displayName: "Last Review Date", type: "datepicker" }),
  field(VENDORS_ID, { fieldName: "Decimal16", fieldType: "Decimal", displayName: "Onboarding Completion %", type: "percent" }),
  field(VENDORS_ID, { fieldName: "Text17", displayName: "Budget Category", type: "select" }),
  field(VENDORS_ID, { fieldName: "Text18", displayName: "Tax Review Status", type: "select" }),
  field(VENDORS_ID, { fieldName: "Text19", displayName: "Bank Info Status", type: "select" }),
  field(VENDORS_ID, { fieldName: "Text20", displayName: "Vendor Code" }),
  field(VENDORS_ID, { fieldName: "Text21", displayName: "Business Justification", type: "textarea" }),
];

const documentFields = [
  field(VENDOR_DOCUMENTS_ID, { fieldName: "Title", displayName: "Document Name", internalName: "DocumentName" }),
  field(VENDOR_DOCUMENTS_ID, { fieldName: "Text1", displayName: "Vendor", type: "lookup" }),
  field(VENDOR_DOCUMENTS_ID, { fieldName: "Text2", displayName: "Document Type", type: "select", isFilter: true }),
  field(VENDOR_DOCUMENTS_ID, { fieldName: "Text3", displayName: "File Attachment", type: "file-upload" }),
  field(VENDOR_DOCUMENTS_ID, { fieldName: "DateTime7", fieldType: "DateTime", displayName: "Expiry Date", type: "datepicker", isFilter: true }),
  field(VENDOR_DOCUMENTS_ID, { fieldName: "Text4", displayName: "Review Status", type: "select", isFilter: true }),
  field(VENDOR_DOCUMENTS_ID, { fieldName: "Text5", displayName: "Reviewer", type: "identity-picker" }),
  field(VENDOR_DOCUMENTS_ID, { fieldName: "Text6", displayName: "Notes", type: "textarea" }),
  field(VENDOR_DOCUMENTS_ID, { fieldName: "Bit8", fieldType: "Bit", displayName: "Required", type: "switch" }),
  field(VENDOR_DOCUMENTS_ID, { fieldName: "DateTime9", fieldType: "DateTime", displayName: "Uploaded Date", type: "datepicker" }),
];

const reviewFields = [
  field(COMPLIANCE_REVIEWS_ID, { fieldName: "Title", displayName: "Review Title", internalName: "ReviewTitle" }),
  field(COMPLIANCE_REVIEWS_ID, { fieldName: "Text1", displayName: "Vendor", type: "lookup" }),
  field(COMPLIANCE_REVIEWS_ID, { fieldName: "Text2", displayName: "Review Type", type: "select" }),
  field(COMPLIANCE_REVIEWS_ID, { fieldName: "Decimal8", fieldType: "Decimal", displayName: "Risk Score", type: "percent" }),
  field(COMPLIANCE_REVIEWS_ID, { fieldName: "Text3", displayName: "Findings", type: "textarea" }),
  field(COMPLIANCE_REVIEWS_ID, { fieldName: "Text4", displayName: "Required Actions", type: "textarea" }),
  field(COMPLIANCE_REVIEWS_ID, { fieldName: "Text5", displayName: "Review Status", type: "select", isFilter: true }),
  field(COMPLIANCE_REVIEWS_ID, { fieldName: "Text6", displayName: "Reviewer", type: "identity-picker" }),
  field(COMPLIANCE_REVIEWS_ID, { fieldName: "DateTime9", fieldType: "DateTime", displayName: "Review Date", type: "datepicker" }),
  field(COMPLIANCE_REVIEWS_ID, { fieldName: "Text7", displayName: "Severity", type: "select", isFilter: true }),
];

const taskFields = [
  field(VENDOR_TASKS_ID, { fieldName: "Title", displayName: "Task Name", internalName: "TaskName" }),
  field(VENDOR_TASKS_ID, { fieldName: "Text1", displayName: "Vendor", type: "lookup" }),
  field(VENDOR_TASKS_ID, { fieldName: "Text2", displayName: "Task Type", type: "select", isFilter: true }),
  field(VENDOR_TASKS_ID, { fieldName: "Text3", displayName: "Assigned To", type: "identity-picker" }),
  field(VENDOR_TASKS_ID, { fieldName: "DateTime7", fieldType: "DateTime", displayName: "Due Date", type: "datepicker", isFilter: true }),
  field(VENDOR_TASKS_ID, { fieldName: "Text4", displayName: "Status", type: "select", isFilter: true }),
  field(VENDOR_TASKS_ID, { fieldName: "Text5", displayName: "Priority", type: "select", isFilter: true }),
  field(VENDOR_TASKS_ID, { fieldName: "Text6", displayName: "Notes", type: "textarea" }),
  field(VENDOR_TASKS_ID, { fieldName: "DateTime8", fieldType: "DateTime", displayName: "Completed Date", type: "datepicker" }),
];

const activityFields = [
  field(VENDOR_ACTIVITY_ID, { fieldName: "Title", displayName: "Activity Title", internalName: "ActivityTitle" }),
  field(VENDOR_ACTIVITY_ID, { fieldName: "Text1", displayName: "Vendor", type: "lookup" }),
  field(VENDOR_ACTIVITY_ID, { fieldName: "Text2", displayName: "Activity Type", type: "select" }),
  field(VENDOR_ACTIVITY_ID, { fieldName: "DateTime7", fieldType: "DateTime", displayName: "Activity Date", type: "datepicker" }),
  field(VENDOR_ACTIVITY_ID, { fieldName: "Text3", displayName: "Actor", type: "identity-picker" }),
  field(VENDOR_ACTIVITY_ID, { fieldName: "Text4", displayName: "Description", type: "textarea" }),
  field(VENDOR_ACTIVITY_ID, { fieldName: "Text5", displayName: "Related Record Type" }),
  field(VENDOR_ACTIVITY_ID, { fieldName: "Text6", displayName: "Related Record ID" }),
];

function fieldDisplayName(listId, fieldName) {
  const fields = {
    [VENDORS_ID]: vendorFields,
    [VENDOR_DOCUMENTS_ID]: documentFields,
    [COMPLIANCE_REVIEWS_ID]: reviewFields,
    [VENDOR_TASKS_ID]: taskFields,
    [VENDOR_ACTIVITY_ID]: activityFields,
  }[String(listId)] || [];
  return fields.find((item) => item.FieldName === fieldName)?.DisplayName || fieldName;
}

function vendorDashboardPage() {
  return page("Vendor Management Dashboard", [
    container("Dashboard header", [
      heading("Vendor Management Dashboard", "h3-bold"),
      paragraph("Monitor onboarding, compliance risk, expiring documents, and vendor operations."),
      grid("Dashboard actions", [button("New Vendor Request"), button("View Compliance Queue")], 2),
    ], { direction: "column", background: "#ffffff", padding: { left: 24, right: 24, top: 24, bottom: 24 } }),
    grid("KPI cards", [
      container("Total Vendors KPI", [heading("Total Vendors", "s-semibold"), heading("128", "h2-bold"), paragraph("All active and onboarding vendors")]),
      container("Pending Onboarding KPI", [heading("Pending Onboarding", "s-semibold"), heading("24", "h2-bold"), paragraph("Requests awaiting review")]),
      container("High Risk Vendors KPI", [heading("High Risk Vendors", "s-semibold"), heading("7", "h2-bold"), paragraph("High or critical risk")]),
      container("Expiring Documents KPI", [heading("Expiring Documents", "s-semibold"), heading("13", "h2-bold"), paragraph("Due within 30 days")]),
    ], 4),
    grid("Dashboard summary", [
      container("Onboarding completion card", [heading("Onboarding Completion"), progressCircle("Overall onboarding completion", 72), paragraph("Average completion across open onboarding work.")]),
      container("Urgent compliance risk card", [
        alertBox("Urgent compliance risks", "Critical risk vendors and expired documents need review today.", "danger"),
        paragraph("Example focus: high-risk vendors with expired insurance or blocked sanctions review."),
        paragraph("Use the Compliance Review Workspace to open the configured Kanban, collection, and document table."),
      ]),
    ], 2),
    grid("Operations board", [
      container("Onboarding Kanban card", [heading("Onboarding Status Board"), kanban("Vendor onboarding status Kanban", VENDORS_ID, "Vendors", "Text7", [
        ["Title", "Vendor Name"],
        ["Text6", "Risk Level"],
        ["Text8", "Compliance Status"],
        ["Text13", "Owner"],
        ["DateTime15", "Last Review Date"],
      ])], { padding: { left: 20, right: 20, top: 20, bottom: 20 } }),
      container("Quick links card", [heading("Quick Links"), iconList("Vendor quick links", [
        { icon: "fa-regular fa-plus", title: "New Vendor", description: "Start request" },
        { icon: "fa-regular fa-shield-check", title: "Compliance Queue", description: "Review risks" },
        { icon: "fa-regular fa-file-lines", title: "Expiring Docs", description: "Document follow-up" },
        { icon: "fa-regular fa-chart-line", title: "Reports", description: "Operational view" },
      ])]),
    ], 2),
    container("Vendor records table card", [
      heading("Vendor Records"),
      dataTable("Vendor records data table", VENDORS_ID, "Vendors", ["Title", "Text1", "Text2", "Text6", "Text7", "Text8", "Text9", "Text13", "DateTime12", "Decimal11"]),
    ]),
    container("Recent activity timeline card", [
      heading("Recent Vendor Activity"),
      timeline("Recent vendor activity timeline", VENDOR_ACTIVITY_ID, "Vendor Activity / History", { title: "Title", date: "DateTime7", type: "Text2", actor: "Text3", description: "Text4" }),
    ]),
  ]);
}

function complianceWorkspacePage() {
  return page("Compliance Review Workspace", [
    container("Compliance workspace header", [
      heading("Compliance Review Workspace", "h3-bold"),
      paragraph("Prioritize high-risk vendors, missing documents, and review tasks."),
      grid("Compliance actions", [button("Start Compliance Review"), button("Bulk Request Documents")], 2),
    ], { background: "#ffffff" }),
    grid("Compliance queue layout", [
      container("Risk Kanban panel", [
        heading("Risk Queue"),
        kanban("Compliance risk Kanban", VENDORS_ID, "Vendors", "Text6", [
          ["Title", "Vendor Name"],
          ["Text6", "Risk Level"],
          ["Text8", "Compliance Status"],
          ["Text2", "Country / Region"],
          ["DateTime15", "Last Review Date"],
          ["Decimal11", "Annual Spend Estimate"],
        ]),
      ]),
      container("Selected vendor summary", [
        heading("Selected Vendor Summary"),
        paragraph("Shows selected vendor name, risk level, compliance status, owner, and latest review context after dashboard selection variables are wired."),
        progressCircle("Risk score", 82),
        alertBox("High-risk issue", "Missing insurance certificate or sanctions review action required.", "danger"),
      ]),
    ], 2),
    container("Vendors needing review collection", [
      heading("Vendors Needing Review"),
      collection("Compliance review collection", COMPLIANCE_REVIEWS_ID, "Compliance Reviews", [
        ["Title", "Review Title"],
        ["Text2", "Review Type"],
        ["Decimal8", "Risk Score"],
        ["Text7", "Severity"],
        ["Text5", "Review Status"],
        ["Text6", "Reviewer"],
        ["DateTime9", "Review Date"],
        ["Text4", "Required Actions"],
      ], ["Open Vendor Detail", "Assign Reviewer", "Approve Compliance"]),
    ]),
    container("Missing documents table", [
      heading("Missing or Expired Documents"),
      dataTable("Missing documents data table", VENDOR_DOCUMENTS_ID, "Vendor Documents", ["Text1", "Text2", "Text4", "DateTime7", "Text5", "Text6"]),
    ]),
    container("Bulk operation toolbar", [
      heading("Bulk Operations"),
      paragraph("Selected vendors: 0"),
      grid("Bulk buttons", [button("Bulk Mark In Review"), button("Bulk Request Documents")], 2),
    ], { background: "#ECFEFF" }),
  ], [{ id: "__temp_selected_vendor_ids", name: "Selected Vendor IDs", type: "array" }, { id: "__temp_selected_vendor_count", name: "Selected Vendor Count", type: "number" }]);
}

function vendorDetailForm() {
  return page("Vendor Detail View Page", [
    container("Vendor header card", [
      heading("Vendor 360 View", "h3-bold"),
      grid("Vendor status summary", [
        dynamicField("Title", "Vendor Name"),
        dynamicField("Text6", "Risk Level"),
        dynamicField("Text7", "Onboarding Status"),
        dynamicField("Text8", "Compliance Status"),
        dynamicUser("Text13", "Owner"),
      ], 5),
      grid("Vendor detail actions", [button("Edit Vendor"), button("Add Document"), button("Add Task"), button("Start Review"), button("Print Summary")], 5),
    ], { background: "#ffffff" }),
    stepsBar(),
    tabs("Vendor detail tabs", [
      { id: "overview", label: "Overview", children: [
        grid("Overview details grid", [
          container("Vendor profile fields", [
            heading("Vendor Profile"),
            dynamicField("Title", "Vendor Name"),
            dynamicField("Text1", "Vendor Type"),
            dynamicField("Text2", "Country / Region"),
            dynamicField("Text3", "Primary Contact"),
            dynamicField("Text4", "Email"),
            dynamicField("Text5", "Phone"),
            dynamicUser("Text13", "Owner"),
            dynamicField("DateTime15", "Last Review Date"),
          ]),
          container("Contract payment summary", [
            heading("Contract & Payment"),
            dynamicField("Text9", "Contract Status"),
            dynamicField("Text10", "Payment Terms"),
            dynamicField("Decimal11", "Annual Spend Estimate"),
            dynamicField("Text17", "Budget Category"),
            dynamicField("Text18", "Tax Review Status"),
            dynamicField("Text19", "Bank Info Status"),
            dynamicField("DateTime12", "Renewal Date"),
            progressBar("Onboarding completion", "Decimal16"),
          ]),
        ], 2),
      ] },
      { id: "documents", label: "Documents", children: [
        container("Vendor documents", [
          dataTable("Vendor documents data table", VENDOR_DOCUMENTS_ID, "Vendor Documents", ["Text2", "Text4", "DateTime7", "Text5", "DateTime9", "Text6"]),
          documentEmbed("Text3"),
        ]),
      ] },
      { id: "compliance", label: "Compliance", children: [
        grid("Compliance tab grid", [
          container("Risk score", [progressCircle("Vendor risk score", 74), alertBox("Missing or expired documents", "Compliance approval is blocked until document review is complete.", "warning")]),
          collection("Compliance review cards", COMPLIANCE_REVIEWS_ID, "Compliance Reviews", [["Text2", "Review Type"], ["Decimal8", "Risk Score"], ["Text7", "Severity"], ["Text5", "Review Status"], ["Text3", "Findings"], ["Text4", "Required Actions"], ["Text6", "Reviewer"], ["DateTime9", "Review Date"]], ["Mark Action Required", "Approve Compliance"]),
        ], 2),
      ] },
      { id: "tasks", label: "Tasks", children: [
        collection("Open vendor tasks", VENDOR_TASKS_ID, "Vendor Tasks", [["Title", "Task Name"], ["Text2", "Task Type"], ["Text3", "Assigned To"], ["DateTime7", "Due Date"], ["Text4", "Status"], ["Text5", "Priority"], ["Text6", "Notes"]], ["Mark Complete", "Edit", "Cancel"]),
      ] },
      { id: "history", label: "History", children: [
        timeline("Vendor history timeline", VENDOR_ACTIVITY_ID, "Vendor Activity / History", { title: "Title", date: "DateTime7", type: "Text2", actor: "Text3", description: "Text4" }),
      ] },
    ]),
  ]);
}

function vendorRequestForm() {
  return page("New Vendor Request Form", [
    container("Request form intro", [
      heading("New Vendor Request", "h3-bold"),
      paragraph("Submit a complete vendor onboarding request with business, compliance, payment, and document details."),
      alertBox("Required compliance documents", "Upload or identify required tax, insurance, registration, and contract documents before submission.", "warning"),
    ]),
    grid("Vendor request sections", [
      container("Vendor Information", [formInput("Title", "Vendor Name"), formInput("Text1", "Vendor Type"), formInput("Text2", "Country / Region"), formInput("Decimal11", "Annual Spend Estimate"), formInput("Text13", "Owner")]),
      container("Contact Information", [formInput("Text3", "Primary Contact"), formInput("Text4", "Email"), formInput("Text5", "Phone")]),
      container("Business Justification", [formInput("Text21", "Business Justification"), formInput("Text17", "Budget Category")]),
      container("Payment & Contract Information", [formInput("Text10", "Payment Terms"), formInput("Text9", "Contract Status"), formInput("DateTime12", "Renewal Date"), formInput("Text18", "Tax Review Status"), formInput("Text19", "Bank Info Status")]),
    ], 2),
    toggle("Optional Details", [
      paragraph("Use optional details for vendor classification, renewal reminders, and post-import tenant-specific routing."),
      formInput("Text20", "Vendor Code"),
    ]),
    container("Required Documents", [
      dynamicSubList("Required document checklist"),
    ]),
    grid("Form actions", [button("Save Draft", "save"), button("Submit Request", "submit")], 2),
  ]);
}

function vendorPrintPage() {
  return page("Vendor Print Page", [
    container("Printable vendor header", [
      heading("Vendor Summary", "h3-bold"),
      grid("Print header fields", [
        dynamicField("Title", "Vendor Name"),
        dynamicField("Text20", "Vendor Code"),
        dynamicField("Text6", "Risk Level"),
        dynamicField("Text7", "Onboarding Status"),
        dynamicField("Text8", "Compliance Status"),
        dynamicUser("Text13", "Owner"),
      ], 3),
    ], { background: "#ffffff" }),
    divider(),
    grid("Printable summary grid", [
      container("Key Vendor Information", [
        dynamicField("Text1", "Vendor Type"),
        dynamicField("Text2", "Country / Region"),
        dynamicField("Text3", "Primary Contact"),
        dynamicField("Text4", "Email"),
        dynamicField("Text5", "Phone"),
        dynamicField("Text10", "Payment Terms"),
        dynamicField("Decimal11", "Annual Spend Estimate"),
        dynamicField("DateTime12", "Renewal Date"),
      ]),
      container("Compliance Summary", [
        stepsBar(),
        dynamicField("Text6", "Risk Level"),
        dynamicField("Text8", "Compliance Status"),
        progressCircle("Latest risk score", 74),
        dynamicField("Text18", "Tax Review Status"),
        dynamicField("Text19", "Bank Info Status"),
      ]),
    ], 2),
    container("Document Checklist", [
      dataTable("Printable document checklist", VENDOR_DOCUMENTS_ID, "Vendor Documents", ["Text2", "Text4", "DateTime7", "Text5", "Text6"]),
    ]),
    container("Approval Timeline", [
      timeline("Printable approval timeline", VENDOR_ACTIVITY_ID, "Vendor Activity / History", { title: "Title", date: "DateTime7", type: "Text2", actor: "Text3", description: "Text4" }),
    ]),
    grid("Codes", [
      container("QR code panel", [qrCode("Text20"), paragraph("Scan to locate vendor record after tenant-specific link configuration.")]),
      container("Barcode panel", [barcode("Text20"), paragraph("Vendor code for audit packet indexing.")]),
    ], 2),
  ]);
}

function makeListPackage(listId, title, description, fields, layouts, layoutView) {
  const model = listModel(listId, title, description, 1, layoutView);
  return {
    ListModel: model,
    Defs: fields,
    Layouts: layouts,
    LayoutInResources: [],
    ListDatas: {},
    RemindRules: [],
    PublicForms: [],
    FlowMappings: [],
  };
}

function viewLayout(fields, fieldDefs) {
  const byName = new Map(fieldDefs.map((item) => [item.FieldName, item]));
  return {
    layout: fields.map((fieldName, index) => {
      const def = byName.get(fieldName);
      return {
        FieldID: def?.FieldID || fieldName,
        FieldName: fieldName,
        DisplayName: def?.DisplayName || fieldName,
        Mobile: true,
        Order: index + 1,
        Show: true,
        Type: def?.Type || "input",
      };
    }),
    query: [],
    sort: [],
    rowColor: [],
    filter: [],
  };
}

function genericRecordForm(title, fields) {
  const visible = fields.filter((item) => !item.IsSystem).slice(0, 8);
  return page(title, [
    container(`${title} header`, [
      heading(title, "h3-bold"),
      paragraph("Safe padded generated form for post-import record review and maintenance."),
    ]),
    grid(`${title} field grid`, visible.map((item) => formInput(item.FieldName, item.DisplayName)), 2),
  ]);
}

function buildDecodedData() {
  const vendorViewLayoutId = nextId();
  const vendorEditLayoutId = nextId();
  const vendorPrintLayoutId = nextId();
  const documentFormLayoutId = nextId();
  const reviewFormLayoutId = nextId();
  const taskFormLayoutId = nextId();
  const activityFormLayoutId = nextId();
  const listLayoutView = {
    add: vendorEditLayoutId,
    edit: vendorEditLayoutId,
    view: vendorViewLayoutId,
    print: vendorPrintLayoutId,
    sortVer: 1,
  };

  const vendorLayouts = [
    layout(VENDORS_ID, "Vendor Detail View Page", 1, vendorDetailForm(), { layoutId: vendorViewLayoutId }),
    layout(VENDORS_ID, "New Vendor Request Form", 1, vendorRequestForm(), { layoutId: vendorEditLayoutId }),
    layout(VENDORS_ID, "Vendor Print Page", 1, vendorPrintPage(), { layoutId: vendorPrintLayoutId }),
    layout(VENDORS_ID, "All Vendors", 0, null, { layoutView: JSON.stringify(viewLayout(["Title", "Text1", "Text2", "Text6", "Text7", "Text8", "Text9", "Text13", "DateTime12", "Decimal11"], vendorFields)) }),
  ];
  const documentLayoutView = { add: documentFormLayoutId, edit: documentFormLayoutId, view: documentFormLayoutId, sortVer: 1 };
  const reviewLayoutView = { add: reviewFormLayoutId, edit: reviewFormLayoutId, view: reviewFormLayoutId, sortVer: 1 };
  const taskLayoutView = { add: taskFormLayoutId, edit: taskFormLayoutId, view: taskFormLayoutId, sortVer: 1 };
  const activityLayoutView = { add: activityFormLayoutId, edit: activityFormLayoutId, view: activityFormLayoutId, sortVer: 1 };
  const documentLayouts = [
    layout(VENDOR_DOCUMENTS_ID, "Vendor Document Form", 1, genericRecordForm("Vendor Document Form", documentFields), { layoutId: documentFormLayoutId }),
    layout(VENDOR_DOCUMENTS_ID, "All Vendor Documents", 0, null, { layoutView: JSON.stringify(viewLayout(["Title", "Text1", "Text2", "Text4", "DateTime7", "Text5"], documentFields)) }),
  ];
  const reviewLayouts = [
    layout(COMPLIANCE_REVIEWS_ID, "Compliance Review Form", 1, genericRecordForm("Compliance Review Form", reviewFields), { layoutId: reviewFormLayoutId }),
    layout(COMPLIANCE_REVIEWS_ID, "All Compliance Reviews", 0, null, { layoutView: JSON.stringify(viewLayout(["Title", "Text1", "Text2", "Decimal8", "Text5", "Text6", "DateTime9"], reviewFields)) }),
  ];
  const taskLayouts = [
    layout(VENDOR_TASKS_ID, "Vendor Task Form", 1, genericRecordForm("Vendor Task Form", taskFields), { layoutId: taskFormLayoutId }),
    layout(VENDOR_TASKS_ID, "All Vendor Tasks", 0, null, { layoutView: JSON.stringify(viewLayout(["Title", "Text1", "Text2", "Text3", "DateTime7", "Text4", "Text5"], taskFields)) }),
  ];
  const activityLayouts = [
    layout(VENDOR_ACTIVITY_ID, "Vendor Activity Form", 1, genericRecordForm("Vendor Activity Form", activityFields), { layoutId: activityFormLayoutId }),
    layout(VENDOR_ACTIVITY_ID, "All Vendor Activity", 0, null, { layoutView: JSON.stringify(viewLayout(["Title", "Text1", "Text2", "DateTime7", "Text3", "Text5"], activityFields)) }),
  ];

  const navSort = [
    { AppID: APP_ID, ListID: DASHBOARD_ID, ListSetID: ROOT_ID, Type: 103, IsHidden: false, Title: "Vendor Management Dashboard", Icon: "fa-regular fa-chart-line" },
    { AppID: APP_ID, ListID: COMPLIANCE_WORKSPACE_ID, ListSetID: ROOT_ID, Type: 103, IsHidden: false, Title: "Compliance Review Workspace", Icon: "fa-regular fa-shield-check" },
    { AppID: APP_ID, ListID: VENDORS_ID, ListSetID: ROOT_ID, Type: 1, IsHidden: false, Title: "Vendors", Icon: "fa-regular fa-building" },
    { AppID: APP_ID, ListID: VENDOR_DOCUMENTS_ID, ListSetID: ROOT_ID, Type: 1, IsHidden: false, Title: "Vendor Documents", Icon: "fa-regular fa-file-lines" },
    { AppID: APP_ID, ListID: COMPLIANCE_REVIEWS_ID, ListSetID: ROOT_ID, Type: 1, IsHidden: false, Title: "Compliance Reviews", Icon: "fa-regular fa-shield-halved" },
    { AppID: APP_ID, ListID: VENDOR_TASKS_ID, ListSetID: ROOT_ID, Type: 1, IsHidden: false, Title: "Vendor Tasks", Icon: "fa-regular fa-list-check" },
    { AppID: APP_ID, ListID: VENDOR_ACTIVITY_ID, ListSetID: ROOT_ID, Type: 1, IsHidden: false, Title: "Vendor Activity / History", Icon: "fa-regular fa-timeline" },
  ];
  const rootLayoutView = {
    add: "default",
    edit: "default",
    view: "default",
    sort: navSort,
    attrs: {
      appearance: { bgc: "var(--c--primary-light)", color: "var(--c--primary)", height: 46, hideTitle: true },
      "navigator-menu": { bgc: "var(--c--primary)", color: "var(--c--primary-light)", position: "default" },
      CustomColors: [],
      CustomFonts: [],
    },
    sortVer: 1,
  };

  const rootLayouts = [
    layout(ROOT_ID, "Vendor Management Dashboard", 103, vendorDashboardPage(), { layoutId: DASHBOARD_ID }),
    layout(ROOT_ID, "Compliance Review Workspace", 103, complianceWorkspacePage(), { layoutId: COMPLIANCE_WORKSPACE_ID }),
  ];

  const data = {
    AppID: APP_ID,
    MainListType: "classes",
    Item: {
      ListModel: listModel(ROOT_ID, APP_TITLE, APP_DESCRIPTION, "classes", rootLayoutView),
      Defs: [],
      Layouts: rootLayouts,
      LayoutInResources: [],
      ListDatas: {},
    },
    Childs: [
      makeListPackage(VENDORS_ID, "Vendors", "Master vendor records for onboarding and compliance lifecycle management.", vendorFields, vendorLayouts, listLayoutView),
      makeListPackage(VENDOR_DOCUMENTS_ID, "Vendor Documents", "Required and optional vendor documents, review status, and expiry dates.", documentFields, documentLayouts, documentLayoutView),
      makeListPackage(COMPLIANCE_REVIEWS_ID, "Compliance Reviews", "Compliance risk reviews, findings, required actions, and review decisions.", reviewFields, reviewLayouts, reviewLayoutView),
      makeListPackage(VENDOR_TASKS_ID, "Vendor Tasks", "Operational tasks for procurement, compliance, legal, finance, and vendor management.", taskFields, taskLayouts, taskLayoutView),
      makeListPackage(VENDOR_ACTIVITY_ID, "Vendor Activity / History", "Timeline events for vendor status changes, reviews, approvals, documents, and notes.", activityFields, activityLayouts, activityLayoutView),
    ],
    Forms: [],
    DataReports: [],
    FormReports: [],
    FormNewReports: [],
    AppThemes: [],
    AppTags: [],
    AppMetadatas: [],
    AppComponents: [],
    AppGroups: [
      { ID: String(FAMILY + 901n), Name: "Procurement Managers", Description: "Configure members after import.", Users: [], Created: GENERATED_AT, Modified: GENERATED_AT },
      { ID: String(FAMILY + 902n), Name: "Compliance Reviewers", Description: "Configure members after import.", Users: [], Created: GENERATED_AT, Modified: GENERATED_AT },
      { ID: String(FAMILY + 903n), Name: "Legal Reviewers", Description: "Configure members after import.", Users: [], Created: GENERATED_AT, Modified: GENERATED_AT },
      { ID: String(FAMILY + 904n), Name: "Finance Reviewers", Description: "Configure members after import.", Users: [], Created: GENERATED_AT, Modified: GENERATED_AT },
    ],
    OtherModules: [],
    ReplaceIds: Array.from(new Set([
      ROOT_ID,
      DASHBOARD_ID,
      COMPLIANCE_WORKSPACE_ID,
      VENDORS_ID,
      VENDOR_DOCUMENTS_ID,
      COMPLIANCE_REVIEWS_ID,
      VENDOR_TASKS_ID,
      VENDOR_ACTIVITY_ID,
      ...rootLayouts.map((item) => item.LayoutID),
      ...vendorLayouts.map((item) => item.LayoutID),
      ...documentLayouts.map((item) => item.LayoutID),
      ...reviewLayouts.map((item) => item.LayoutID),
      ...taskLayouts.map((item) => item.LayoutID),
      ...activityLayouts.map((item) => item.LayoutID),
      ...vendorFields.map((item) => item.FieldID),
      ...documentFields.map((item) => item.FieldID),
      ...reviewFields.map((item) => item.FieldID),
      ...taskFields.map((item) => item.FieldID),
      ...activityFields.map((item) => item.FieldID),
    ])),
  };
  return data;
}

function postJsonWithCurl(url, apiKey, body) {
  const stdout = execFileSync("curl", [
    "--silent",
    "--show-error",
    "--max-time",
    "20",
    "--request",
    "POST",
    "--header",
    `apiKey: ${apiKey}`,
    "--header",
    "Accept: application/json",
    "--header",
    "Content-Type: application/json",
    "--data-binary",
    "@-",
    "--write-out",
    "\n%{http_code}",
    url,
  ], { input: JSON.stringify(body), maxBuffer: 2 * 1024 * 1024 }).toString("utf8");
  const splitAt = stdout.lastIndexOf("\n");
  return { body: splitAt >= 0 ? stdout.slice(0, splitAt) : "", status: Number(splitAt >= 0 ? stdout.slice(splitAt + 1) : "0") };
}

function getJsonWithCurl(url, apiKey) {
  const stdout = execFileSync("curl", [
    "--silent",
    "--show-error",
    "--max-time",
    "20",
    "--request",
    "GET",
    "--header",
    `apiKey: ${apiKey}`,
    "--header",
    "Accept: application/json",
    "--write-out",
    "\n%{http_code}",
    url,
  ], { maxBuffer: 2 * 1024 * 1024 }).toString("utf8");
  const splitAt = stdout.lastIndexOf("\n");
  const body = splitAt >= 0 ? stdout.slice(0, splitAt) : "";
  const status = Number(splitAt >= 0 ? stdout.slice(splitAt + 1) : "0");
  if (status < 200 || status > 299) throw new Error(`GET ${new URL(url).pathname} failed with HTTP ${status}`);
  return JSON.parse(body || "null");
}

function resolveGenerationEnvironment() {
  loadDotenvFile(fs, ".env.local", { assertReadable: assertEnvReadable });
  const env = resolveYeeflowEnvironment(process.env);
  if (!env.apiKey) throw new Error("YEEFLOW_API_KEY is required to request Yeeflow API-issued IDs and sign YAPK output.");
  if (env.apiBaseUrl !== "https://api.yeeflow.com/v1") throw new Error(`Unexpected API base URL: ${env.apiBaseUrl}`);
  return env;
}

function extractGeneratedIds(text) {
  const ids = new Set();
  for (const match of text.matchAll(/\d{16,}/g)) ids.add(match[0]);
  ids.delete(String(APP_ID));
  return Array.from(ids);
}

function replaceAllGeneratedIds(text, idMap) {
  let out = text;
  for (const [oldId, newId] of idMap.entries()) {
    out = out.replace(new RegExp(oldId, "g"), newId);
  }
  return out;
}

function rewriteTitleFieldReferences(value) {
  const referenceKeys = new Set(["Field", "FieldName", "SortName", "listfield", "displayField", "obj-f", "prop", "id"]);
  const visit = (node, key = "") => {
    if (Array.isArray(node)) return node.map((item) => visit(item));
    if (node && typeof node === "object") {
      for (const [childKey, child] of Object.entries(node)) node[childKey] = visit(child, childKey);
      return node;
    }
    if (node === "Title" && referenceKeys.has(key)) return "Text0";
    return node;
  };
  return visit(value);
}

function normalizeFullUiDataForImport(data) {
  const next = structuredClone(data);
  const rewriteOpaqueJson = (value) => {
    if (typeof value !== "string" || !value.trim()) return value;
    try {
      return JSON.stringify(rewriteTitleFieldReferences(JSON.parse(value)));
    } catch {
      return value.replace(/"Title"/g, "\"Text0\"");
    }
  };
  const normalizeItem = (item) => {
    for (const field of item.Defs || []) {
      if (field.FieldName === "Title") {
        field.FieldName = "Text0";
        field.FieldIndex = 0;
        field.Status = 1;
        field.IsSystem = false;
        field.IsSort = true;
      }
      if (field.Rules) field.Rules = rewriteOpaqueJson(field.Rules);
      if (field.DefaultValue === null || field.DefaultValue === undefined) field.DefaultValue = "";
      if (field.Ext1 === null || field.Ext1 === undefined) field.Ext1 = "";
      if (field.Ext2 === null || field.Ext2 === undefined) field.Ext2 = "";
      if (field.Ext3 === null || field.Ext3 === undefined) field.Ext3 = "";
    }
    for (const layoutItem of item.Layouts || []) {
      if (layoutItem.LayoutView) layoutItem.LayoutView = rewriteOpaqueJson(layoutItem.LayoutView);
      for (const resource of layoutItem.LayoutInResources || []) {
        if (resource.Resource) resource.Resource = JSON.stringify(rewriteTitleFieldReferences(JSON.parse(resource.Resource)));
      }
    }
    if (item.ListModel?.LayoutView) item.ListModel.LayoutView = rewriteOpaqueJson(item.ListModel.LayoutView);
  };
  normalizeItem(next.Item);
  for (const child of next.Childs || []) normalizeItem(child);
  return next;
}

function requestApiIds(env, count) {
  const parsed = getJsonWithCurl(`${env.apiBaseUrl}/utils/generate/ids?count=${count}`, env.apiKey);
  const raw = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.Data) ? parsed.Data : Array.isArray(parsed?.data) ? parsed.data : [];
  const ids = raw.map(String);
  if (ids.length !== count) throw new Error(`generate-unique-ids returned ${ids.length} IDs; expected ${count}.`);
  if (ids.some((id) => !/^\d{16,}$/.test(id))) throw new Error("generate-unique-ids returned an unexpected non-large numeric ID.");
  return ids;
}

function summarizeApiIds(ids) {
  return {
    count: ids.length,
    firstLength: ids[0]?.length || 0,
    lastLength: ids.at(-1)?.length || 0,
    source: "Yeeflow generate-unique-ids API",
  };
}

function assertEnvReadable(filePath) {
  const flags = execFileSync("ls", ["-lO", filePath], { encoding: "utf8" });
  if (/\bdataless\b/.test(flags)) throw new Error(`${filePath} is marked dataless and cannot be read for signing.`);
}

async function signWithEnvironment(wrapper, env) {
  const signingWrapper = env.tenantId ? { ...wrapper, TenantID: env.tenantId } : wrapper;
  const unsigned = { ...signingWrapper };
  delete unsigned.Sign;
  const signResult = postJsonWithCurl(`${env.apiBaseUrl}/utils/apppackage/setsign`, env.apiKey, unsigned);
  if (signResult.status < 200 || signResult.status > 299) {
    throw new Error(`setsign failed with HTTP ${signResult.status}`);
  }
  const signJson = JSON.parse(signResult.body || "{}");
  const sign = signJson?.Data ?? signJson?.data ?? signJson?.Sign ?? signJson?.sign ?? (typeof signJson === "string" ? signJson : null);
  if (typeof sign !== "string" || Buffer.from(sign, "base64").length !== 32) throw new Error("setsign response did not contain a 32-byte base64 signature.");
  const signed = { ...signingWrapper, Sign: sign };
  const verifyResult = postJsonWithCurl(`${env.apiBaseUrl}/utils/apppackage/verifysign`, env.apiKey, signed);
  if (verifyResult.status < 200 || verifyResult.status > 299) throw new Error(`verifysign failed with HTTP ${verifyResult.status}`);
  return {
    wrapper: signed,
    status: "signed_and_verified",
    signByteLength: Buffer.from(sign, "base64").length,
    verifyStatus: verifyResult.status,
    apiBaseUrl: env.apiBaseUrl,
  };
}

function wrapperForAppPackage(resourceBase64, { packageId, rootListId }) {
  const versionNote = WRAPPER_VERSION === "1.0"
    ? "Generated from the approved Vendor Onboarding UI implementation spec. Tenant-neutral package candidate; manual runtime import proof is required."
    : `Server-signed ${WRAPPER_VERSION} package generated from the validated V1 Vendor Onboarding baseline. Tenant-neutral package candidate; manual runtime import proof is required.`;
  return {
    PackageId: packageId,
    TenantID: "0",
    AppID: APP_ID,
    ListID: rootListId,
    Title: APP_TITLE,
    Description: APP_DESCRIPTION,
    IconUrl: "{\"b\":\"#E6F7FF\",\"i\":\"fa-regular fa-building-shield\",\"c\":\"#008DA6\"}",
    Resource: resourceBase64,
    Notes: versionNote,
    Author: "Yeeflow Builder",
    Date: GENERATED_AT_UTC,
    Version: WRAPPER_VERSION,
    Sign: "",
  };
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
  for (const key of keys) out = out.replace(new RegExp(`"${key}":"(-?\\d+)"`, "g"), `"${key}":$1`);
  return out;
}

function stringifyYapkAppPackage(value) {
  let text = JSON.stringify(value);
  for (const key of ["ListID", "FieldID", "ID", "RefId"]) {
    text = text.replace(new RegExp(`"${key}":"(\\d{16,})"`, "g"), `"${key}":$1`);
  }
  return text;
}

function collectGeneratedReplaceIds(data) {
  const ids = new Set();
  const add = (value) => {
    if (value === undefined || value === null || value === "") return;
    const id = String(value);
    if (/^\d{16,}$/.test(id)) ids.add(id);
  };
  const collectItem = (item) => {
    if (!item) return;
    add(item.ListModel?.ListID);
    for (const field of item.Defs || []) add(field.FieldID);
    for (const layout of item.Layouts || []) {
      add(layout.LayoutID);
      for (const resource of layout.LayoutInResources || []) {
        add(resource.ID);
        add(resource.RefId);
      }
    }
    for (const [recordId, record] of Object.entries(item.ListDatas || {})) {
      add(recordId);
      add(record?.ListDataID);
    }
  };
  collectItem(data.Item);
  for (const child of data.Childs || []) collectItem(child);
  for (const group of data.AppGroups || []) add(group.ID);
  return Array.from(ids);
}

function writeYapPackage(data, output) {
  const listExportInfo = toYapListExportInfo(data);
  const listExportInfoText = unquoteIntegerProperties(JSON.stringify(listExportInfo));
  const listExportResult = {
    MainListType: 1024,
    AppID: APP_ID,
    ReplaceIds: collectGeneratedReplaceIds(data),
    ReportIds: [],
    FormKeys: [],
    Data: listExportInfoText,
    SimplePortal: {},
  };
  const resourceText = unquoteIntegerProperties(JSON.stringify(listExportResult));
  const wrapper = {
    Title: APP_TITLE,
    Description: APP_DESCRIPTION,
    IconUrl: "{\"b\":\"#E6F7FF\",\"i\":\"fa-regular fa-building-shield\",\"c\":\"#008DA6\"}",
    IsListSet: true,
    Resource: `[______gizp______]${zlib.gzipSync(Buffer.from(resourceText, "utf8")).toString("base64")}`,
  };
  fs.writeFileSync(output, `${JSON.stringify(wrapper, null, 2)}\n`);
}

function coverageSummary(data) {
  return {
    specPath: SPEC_PATH,
    dataLists: data.Childs.map((child) => child.ListModel.Title),
    pages: data.Item.Layouts.map((item) => item.Title),
    vendorForms: data.Childs[0].Layouts.filter((item) => Number(item.Type) === 1).map((item) => item.Title),
    controls: [
      "KPI cards",
      "Progress circle",
      "Progress bar",
      "Alert",
      "Kanban",
      "Data table",
      "Icon list",
      "Vertical timeline",
      "Tabs",
      "Steps bar",
      "Dynamic fields",
      "Dynamic user",
      "Dynamic file",
      "Document embed",
      "Dynamic Sub List",
      "Collection actions",
      "Bulk toolbar",
      "QR Code",
      "Barcode",
      "Divider",
      "Scoped custom CSS markers",
    ],
  };
}

function stringOrEmpty(value) {
  return value === undefined || value === null ? "" : String(value);
}

function intOrDefault(value, fallback = 0) {
  if (Number.isInteger(value)) return value;
  if (typeof value === "string" && /^-?\d+$/.test(value) && value.length < 16) return Number.parseInt(value, 10);
  return fallback;
}

function normalizeFieldCategory(value) {
  return intOrDefault(value, 0);
}

function normalizeListInfoForYapk(model, { root = false } = {}) {
  return {
    ListID: stringOrEmpty(model.ListID),
    Title: stringOrEmpty(model.Title || APP_TITLE),
    Description: stringOrEmpty(model.Description),
    Status: intOrDefault(model.Status, 1),
    IsItemPerm: Boolean(model.IsItemPerm),
    IsVerRecord: Boolean(model.IsVerRecord),
    HasComment: Boolean(model.HasComment),
    IconUrl: stringOrEmpty(model.IconUrl || "{\"b\":\"#E6F7FF\",\"i\":\"fa-regular fa-building\",\"c\":\"#008DA6\"}"),
    TableCode: stringOrEmpty(model.TableCode || "flowcraft"),
    Ext1: stringOrEmpty(model.Ext1),
    Ext2: stringOrEmpty(model.Ext2),
    Ext3: stringOrEmpty(model.Ext3),
    Type: intOrDefault(model.Type, root ? 1024 : 1),
    Flags: intOrDefault(model.Flags, 1),
    LayoutView: stringOrEmpty(model.LayoutView),
    Perms: Array.isArray(model.Perms) ? model.Perms : [],
    AdvancePerms: Array.isArray(model.AdvancePerms) ? model.AdvancePerms : [],
    Items: model.Items && typeof model.Items === "object" && !Array.isArray(model.Items) ? model.Items : {},
  };
}

function normalizeFieldForYapk(fieldItem) {
  return {
    FieldID: stringOrEmpty(fieldItem.FieldID),
    ListID: stringOrEmpty(fieldItem.ListID),
    FieldName: stringOrEmpty(fieldItem.FieldName),
    FieldType: stringOrEmpty(fieldItem.FieldType || "Text"),
    FieldIndex: intOrDefault(fieldItem.FieldIndex, 0),
    DisplayName: stringOrEmpty(fieldItem.DisplayName || fieldItem.FieldName),
    InternalName: cleanInternalName(fieldItem.InternalName || fieldItem.DisplayName || fieldItem.FieldName),
    Type: stringOrEmpty(fieldItem.Type || "input"),
    Status: intOrDefault(fieldItem.Status, 1),
    Category: normalizeFieldCategory(fieldItem.Category),
    DefaultValue: stringOrEmpty(fieldItem.DefaultValue),
    Rules: fieldItem.Rules === undefined || fieldItem.Rules === null ? "{}" : stringOrEmpty(fieldItem.Rules),
    IsSort: Boolean(fieldItem.IsSort),
    IsSystem: Boolean(fieldItem.IsSystem),
    IsUnique: Boolean(fieldItem.IsUnique),
    Ext1: stringOrEmpty(fieldItem.Ext1),
    Ext2: stringOrEmpty(fieldItem.Ext2),
    Ext3: stringOrEmpty(fieldItem.Ext3),
  };
}

function normalizeLayoutForYapk(layoutItem, fallbackTitle) {
  return {
    ListID: stringOrEmpty(layoutItem.ListID),
    LayoutID: stringOrEmpty(layoutItem.LayoutID),
    Type: intOrDefault(layoutItem.Type, 0),
    Title: stringOrEmpty(layoutItem.Title || fallbackTitle),
    LayoutView: stringOrEmpty(layoutItem.LayoutView),
    Ext1: stringOrEmpty(layoutItem.Ext1),
    Ext2: stringOrEmpty(layoutItem.Ext2),
    Ext3: stringOrEmpty(layoutItem.Ext3),
    IsDefault: Boolean(layoutItem.IsDefault),
    IsItemPerm: Boolean(layoutItem.IsItemPerm),
    Perms: Array.isArray(layoutItem.Perms) ? layoutItem.Perms : [],
    LayoutInResources: (Array.isArray(layoutItem.LayoutInResources) ? layoutItem.LayoutInResources : []).map((resource) => ({
      ID: stringOrEmpty(resource.ID),
      RefId: stringOrEmpty(resource.RefId),
      Resource: stringOrEmpty(resource.Resource),
    })),
  };
}

function appPackageInfoFromDecodedData(data) {
  return {
    ListSet: normalizeListInfoForYapk(data.Item.ListModel, { root: true }),
    Pages: (data.Item.Layouts || []).map((layoutItem, index) => normalizeLayoutForYapk(layoutItem, index === 0 ? "Vendor Management Dashboard" : `Page ${index + 1}`)),
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
    PortalInfo: null,
    Childs: data.Childs.map((child) => ({
      List: normalizeListInfoForYapk(child.ListModel),
      Fields: child.Defs.map(normalizeFieldForYapk),
      Layouts: child.Layouts.map((layoutItem, index) => normalizeLayoutForYapk(layoutItem, `${child.ListModel?.Title || "List"} Layout ${index + 1}`)),
      RemindRules: [],
      PublicForms: [],
      FlowMappings: [],
    })),
  };
}

function normalizeListModelForYap(model) {
  const next = { ...model };
  delete next.Name;
  delete next.ListType;
  return next;
}

function normalizeLayoutForYap(layoutItem) {
  return {
    LayoutID: layoutItem.LayoutID,
    ListID: layoutItem.ListID,
    Type: layoutItem.Type,
    Title: layoutItem.Title || "",
    LayoutView: stringOrEmpty(layoutItem.LayoutView),
    Ext1: stringOrEmpty(layoutItem.Ext1),
    Ext2: stringOrEmpty(layoutItem.Ext2),
    Ext3: stringOrEmpty(layoutItem.Ext3),
    IsDefault: Boolean(layoutItem.IsDefault),
    IsItemPerm: Boolean(layoutItem.IsItemPerm),
    LayoutInResources: Array.isArray(layoutItem.LayoutInResources) ? layoutItem.LayoutInResources : [],
  };
}

function normalizeFieldForYap(fieldItem) {
  return {
    ...fieldItem,
    DefaultValue: stringOrEmpty(fieldItem.DefaultValue),
    Ext1: stringOrEmpty(fieldItem.Ext1),
    Ext2: stringOrEmpty(fieldItem.Ext2),
    Ext3: stringOrEmpty(fieldItem.Ext3),
  };
}

function toYapListExportInfo(data) {
  return {
    Item: {
      ListModel: normalizeListModelForYap(data.Item.ListModel),
      Defs: [],
      Layouts: (data.Item.Layouts || []).map(normalizeLayoutForYap),
      PublicForms: [],
      RemindRules: [],
      FlowMappings: [],
      ListDatas: {},
    },
    Childs: data.Childs.map((child) => ({
      ListModel: normalizeListModelForYap(child.ListModel),
      Defs: child.Defs.map(normalizeFieldForYap),
      Layouts: child.Layouts.map(normalizeLayoutForYap),
      PublicForms: [],
      RemindRules: [],
      FlowMappings: [],
      ListDatas: {},
    })),
    Forms: [],
    FormReports: [],
    DataReports: [],
    FormNewReports: [],
    AppGroups: (data.AppGroups || []).map((group) => ({
      ID: String(group.ID),
      Name: String(group.Name || ""),
      Description: String(group.Description || ""),
    })),
    AppTags: [],
    AppMetadatas: [],
    AppThemes: [],
    AppComponents: [],
    OtherModules: [],
  };
}

async function main() {
  ensureDir(TMP_DIR);
  const env = resolveGenerationEnvironment();
  const localData = buildDecodedData();
  const localText = JSON.stringify(localData);
  const localIds = extractGeneratedIds(localText);
  const apiIds = requestApiIds(env, localIds.length + 1);
  const idMap = new Map(localIds.map((id, index) => [id, apiIds[index]]));
  const data = normalizeFullUiDataForImport(JSON.parse(replaceAllGeneratedIds(localText, idMap)));
  data.ReplaceIds = collectGeneratedReplaceIds(data);

  const appPackage = appPackageInfoFromDecodedData(data);
  const decodedResource = {
    AppID: APP_ID,
    MainListType: "classes",
    Data: JSON.stringify(data),
    ReplaceIds: data.ReplaceIds,
  };
  const validationYapWrapper = {
    Title: APP_TITLE,
    Description: APP_DESCRIPTION,
    IconUrl: "{\"b\":\"#E6F7FF\",\"i\":\"fa-regular fa-building-shield\",\"c\":\"#008DA6\"}",
    IsListSet: true,
    Resource: `[______gizp______]${zlib.gzipSync(Buffer.from(unquoteIntegerProperties(JSON.stringify(decodedResource)), "utf8")).toString("base64")}`,
  };
  const appPackageText = stringifyYapkAppPackage(appPackage);
  const resourceBase64 = zlib.brotliCompressSync(Buffer.from(appPackageText, "utf8")).toString("base64");
  const rootListId = String(data.Item.ListModel.ListID);
  const signResult = await signWithEnvironment(wrapperForAppPackage(resourceBase64, { packageId: apiIds.at(-1), rootListId }), env);
  fs.writeFileSync(OUT_DECODED_DATA, `${JSON.stringify(data, null, 2)}\n`);
  fs.writeFileSync(OUT_DECODED_RESOURCE, `${JSON.stringify(decodedResource, null, 2)}\n`);
  fs.writeFileSync(OUT_VALIDATION_YAP_WRAPPER, `${JSON.stringify(validationYapWrapper, null, 2)}\n`);
  fs.writeFileSync(OUT_APP_PACKAGE, `${JSON.stringify(appPackage, null, 2)}\n`);
  fs.writeFileSync(OUT_YAPK, `${JSON.stringify(signResult.wrapper, null, 2)}\n`);
  writeYapPackage(data, OUT_YAP);
  const report = {
    status: "generated",
    outputPackage: OUT_YAPK,
    outputYap: OUT_YAP,
    decodedDataPath: OUT_DECODED_DATA,
    decodedResourcePath: OUT_DECODED_RESOURCE,
    validationYapWrapperPath: OUT_VALIDATION_YAP_WRAPPER,
    appPackageInfoPath: OUT_APP_PACKAGE,
    specPath: SPEC_PATH,
    signing: {
      status: signResult.status,
      signByteLength: signResult.signByteLength,
      verifyStatus: signResult.verifyStatus,
      apiBaseUrl: signResult.apiBaseUrl,
    },
    ids: {
      generatedIdCount: localIds.length,
      apiIds: summarizeApiIds(apiIds),
      rootListId,
      packageIdSource: "Yeeflow generate-unique-ids API",
    },
    coverage: coverageSummary(data),
    proofBoundary: "YAPK content is locally generated and wrapper-decodable. Runtime import/open behavior must be manually tested before claiming runtime proof.",
  };
  fs.writeFileSync(OUT_REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({
    status: report.status,
    outputPackage: report.outputPackage,
    outputYap: report.outputYap,
    signing: report.signing,
    ids: report.ids.apiIds,
    dataLists: report.coverage.dataLists.length,
    pages: report.coverage.pages.length,
    vendorForms: report.coverage.vendorForms.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "fail", error: error.message }, null, 2));
  process.exit(1);
});
