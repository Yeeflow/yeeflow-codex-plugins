import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { loadDotenvFile, resolveYeeflowEnvironment } from "./scripts/yeeflow-env-utils.mjs";
import { fetchYeeflowUniqueIds, summarizeIds } from "./scripts/yeeflow-id-api-utils.mjs";

const APP_ID = 41;
const FAMILY = 7601000000000000000n;
const GENERATED_AT = "2026-05-29 09:30:00";
const GENERATED_AT_UTC = "2026-05-29T01:30:00Z";
const APP_TITLE = "Vendor Onboarding & Compliance Management";
const APP_DESCRIPTION = "Full-scope generated YAPK candidate for vendor onboarding, compliance review, document tracking, task management, dashboards, and print summary.";
const SPEC_PATH = "docs/generated-app-plans/vendor-onboarding-compliance-ui-implementation-spec.md";
const OUT_YAPK = process.env.VENDOR_ONBOARDING_YAPK_OUTPUT || "/Users/Renger/Downloads/vendor-onboarding-compliance-management.full-ui.v4.yapk";
const OUT_YAP = process.env.VENDOR_ONBOARDING_YAP_OUTPUT || "/Users/Renger/Downloads/vendor-onboarding-compliance-management.full-ui.v4.yap";
const WRAPPER_VERSION = process.env.VENDOR_ONBOARDING_YAPK_VERSION || "full-ui.v4";
const TMP_DIR = ".tmp/vendor-onboarding-compliance-management";
const OUT_DECODED_DATA = `${TMP_DIR}/vendor-onboarding-compliance-management.decoded-data.json`;
const OUT_DECODED_RESOURCE = `${TMP_DIR}/vendor-onboarding-compliance-management.decoded-resource.json`;
const OUT_VALIDATION_YAP_WRAPPER = `${TMP_DIR}/vendor-onboarding-compliance-management.validation-wrapper.yap.json`;
const OUT_APP_PACKAGE = `${TMP_DIR}/vendor-onboarding-compliance-management.app-package-info.json`;
const OUT_REPORT = `${TMP_DIR}/vendor-onboarding-compliance-management.generation-report.json`;
const GZIP_PREFIX = "[______gizp______]";

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
    FieldIndex: spec.fieldName === "Text0" ? 0 : Number(String(spec.fieldName).match(/(\d+)$/)?.[1] || spec.fieldIndex || 0),
    DisplayName: spec.displayName,
    InternalName: cleanInternalName(spec.internalName || spec.displayName),
    DisplayName_EN: null,
    Type: spec.type || "input",
    Status: spec.status ?? 1,
    Category: 0,
    DefaultValue: spec.defaultValue ?? null,
    Rules: JSON.stringify(rules),
    AppID: APP_ID,
    IsSort: spec.isSort ?? spec.fieldName === "Text0",
    IsIndex: spec.isIndex ?? spec.fieldName === "Text0",
    IsFilter: spec.isFilter ?? false,
    IsIndexCreated: false,
    IsSystem: spec.isSystem ?? false,
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
    listfield: "Text0",
    displayField: "Text0",
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
    Ext2: extra.ext2 ?? (Number(type) === 103 || Number(type) === 1 ? "{\"src\":true}" : null),
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
  const actionId = `action_${cleanInternalName(label).toLowerCase()}`;
  const mutating = /submit|approve|assign|bulk|request missing|add document row/i.test(label);
  return control("button", label, {
    text: label,
    intent: action,
    control_action: actionId,
    actionId,
    disabled: mutating,
    deferReason: mutating ? `${label} requires tenant workflow/user routing confirmation after import; generated as disabled until configured.` : "",
    button_type: "primary",
    actions: [localAction(label, { id: actionId, disabled: mutating })],
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
    listarr: columns.map((column, index) => {
      const fieldName = Array.isArray(column) ? column[0] : column;
      const displayName = Array.isArray(column) ? column[1] : fieldDisplayName(title, fieldName);
      return {
        Field: fieldName,
        FieldName: displayName,
        DisplayName: displayName,
        Order: index + 1,
        Show: true,
      };
    }),
    table: { striped: true, bordered: false, density: "comfortable" },
  }, [], { nv_label: label });
}

function localAction(name, options = {}) {
  return {
    id: options.id || uuid("action"),
    name,
    type: options.disabled ? "deferred" : "navigate",
    disabled: Boolean(options.disabled),
    steps: [{
      type: options.disabled ? "deferred" : "navigate",
      attrs: {
        label: name,
        target: options.target || "included_vendor_onboarding_surface",
        reason: options.disabled ? `${name} is intentionally disabled until tenant-specific workflow/action routing is configured.` : "",
      },
    }],
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
      dynamicField(fields.title, fields.titleLabel || "Activity Title"),
      dynamicField(fields.date, fields.dateLabel || "Activity Date"),
      dynamicField(fields.type, fields.typeLabel || "Activity Type"),
      dynamicField(fields.actor, fields.actorLabel || "Actor"),
      dynamicField(fields.description, fields.descriptionLabel || "Description"),
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

function progressBar(label, fieldName = "Decimal2") {
  return control("progress", "Progress bar", {
    value: { type: "expr", exprType: "list_field", prop: fieldName },
    "obj-f": fieldName,
    source: "3",
    label,
    color: "var(--c--primary)",
  }, [], { nv_label: label });
}

function alertBox(label, message, tone = "warning") {
  return control("alert", label, {
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
      dynamicField("DateTime1", "Expiry Date"),
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

function customCss(label, css) {
  return control("custom-css", label, { css }, [], { nv_label: label });
}

function formInput(fieldName, label) {
  return control("field", label, { source: "3", "obj-f": fieldName, required: ["Text0", "Text1", "Text2", "Text3"].includes(fieldName) }, [], { nv_label: label });
}

const vendorFields = [
  field(VENDORS_ID, { fieldName: "Text0", displayName: "Vendor Name", internalName: "VendorName" }),
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
  field(VENDORS_ID, { fieldName: "Decimal1", fieldType: "Decimal", displayName: "Annual Spend Estimate", type: "currency" }),
  field(VENDORS_ID, { fieldName: "DateTime1", fieldType: "DateTime", displayName: "Renewal Date", type: "datepicker", isFilter: true }),
  field(VENDORS_ID, { fieldName: "Text11", displayName: "Owner", type: "identity-picker" }),
  field(VENDORS_ID, { fieldName: "DateTime2", fieldType: "DateTime", displayName: "Created Date", type: "datepicker" }),
  field(VENDORS_ID, { fieldName: "DateTime3", fieldType: "DateTime", displayName: "Last Review Date", type: "datepicker" }),
  field(VENDORS_ID, { fieldName: "Decimal2", fieldType: "Decimal", displayName: "Onboarding Completion %", type: "percent" }),
  field(VENDORS_ID, { fieldName: "Text12", displayName: "Budget Category", type: "select" }),
  field(VENDORS_ID, { fieldName: "Text13", displayName: "Tax Review Status", type: "select" }),
  field(VENDORS_ID, { fieldName: "Text14", displayName: "Bank Info Status", type: "select" }),
  field(VENDORS_ID, { fieldName: "Text15", displayName: "Vendor Code" }),
  field(VENDORS_ID, { fieldName: "Text16", displayName: "Business Justification", type: "textarea" }),
];

const documentFields = [
  field(VENDOR_DOCUMENTS_ID, { fieldName: "Text0", displayName: "Document Name", internalName: "DocumentName" }),
  field(VENDOR_DOCUMENTS_ID, { fieldName: "Text1", displayName: "Vendor", type: "lookup" }),
  field(VENDOR_DOCUMENTS_ID, { fieldName: "Text2", displayName: "Document Type", type: "select", isFilter: true }),
  field(VENDOR_DOCUMENTS_ID, { fieldName: "Text3", displayName: "File Attachment", type: "file-upload" }),
  field(VENDOR_DOCUMENTS_ID, { fieldName: "DateTime1", fieldType: "DateTime", displayName: "Expiry Date", type: "datepicker", isFilter: true }),
  field(VENDOR_DOCUMENTS_ID, { fieldName: "Text4", displayName: "Review Status", type: "select", isFilter: true }),
  field(VENDOR_DOCUMENTS_ID, { fieldName: "Text5", displayName: "Reviewer", type: "identity-picker" }),
  field(VENDOR_DOCUMENTS_ID, { fieldName: "Text6", displayName: "Notes", type: "textarea" }),
  field(VENDOR_DOCUMENTS_ID, { fieldName: "Bit1", fieldType: "Bit", displayName: "Required", type: "switch" }),
  field(VENDOR_DOCUMENTS_ID, { fieldName: "DateTime2", fieldType: "DateTime", displayName: "Uploaded Date", type: "datepicker" }),
];

const reviewFields = [
  field(COMPLIANCE_REVIEWS_ID, { fieldName: "Text0", displayName: "Review Title", internalName: "ReviewTitle" }),
  field(COMPLIANCE_REVIEWS_ID, { fieldName: "Text1", displayName: "Vendor", type: "lookup" }),
  field(COMPLIANCE_REVIEWS_ID, { fieldName: "Text2", displayName: "Review Type", type: "select" }),
  field(COMPLIANCE_REVIEWS_ID, { fieldName: "Decimal1", fieldType: "Decimal", displayName: "Risk Score", type: "percent" }),
  field(COMPLIANCE_REVIEWS_ID, { fieldName: "Text3", displayName: "Findings", type: "textarea" }),
  field(COMPLIANCE_REVIEWS_ID, { fieldName: "Text4", displayName: "Required Actions", type: "textarea" }),
  field(COMPLIANCE_REVIEWS_ID, { fieldName: "Text5", displayName: "Review Status", type: "select", isFilter: true }),
  field(COMPLIANCE_REVIEWS_ID, { fieldName: "Text6", displayName: "Reviewer", type: "identity-picker" }),
  field(COMPLIANCE_REVIEWS_ID, { fieldName: "DateTime1", fieldType: "DateTime", displayName: "Review Date", type: "datepicker" }),
  field(COMPLIANCE_REVIEWS_ID, { fieldName: "Text7", displayName: "Severity", type: "select", isFilter: true }),
];

const taskFields = [
  field(VENDOR_TASKS_ID, { fieldName: "Text0", displayName: "Task Name", internalName: "TaskName" }),
  field(VENDOR_TASKS_ID, { fieldName: "Text1", displayName: "Vendor", type: "lookup" }),
  field(VENDOR_TASKS_ID, { fieldName: "Text2", displayName: "Task Type", type: "select", isFilter: true }),
  field(VENDOR_TASKS_ID, { fieldName: "Text3", displayName: "Assigned To", type: "identity-picker" }),
  field(VENDOR_TASKS_ID, { fieldName: "DateTime1", fieldType: "DateTime", displayName: "Due Date", type: "datepicker", isFilter: true }),
  field(VENDOR_TASKS_ID, { fieldName: "Text4", displayName: "Status", type: "select", isFilter: true }),
  field(VENDOR_TASKS_ID, { fieldName: "Text5", displayName: "Priority", type: "select", isFilter: true }),
  field(VENDOR_TASKS_ID, { fieldName: "Text6", displayName: "Notes", type: "textarea" }),
  field(VENDOR_TASKS_ID, { fieldName: "DateTime2", fieldType: "DateTime", displayName: "Completed Date", type: "datepicker" }),
];

const activityFields = [
  field(VENDOR_ACTIVITY_ID, { fieldName: "Text0", displayName: "Activity Title", internalName: "ActivityTitle" }),
  field(VENDOR_ACTIVITY_ID, { fieldName: "Text1", displayName: "Vendor", type: "lookup" }),
  field(VENDOR_ACTIVITY_ID, { fieldName: "Text2", displayName: "Activity Type", type: "select" }),
  field(VENDOR_ACTIVITY_ID, { fieldName: "DateTime1", fieldType: "DateTime", displayName: "Activity Date", type: "datepicker" }),
  field(VENDOR_ACTIVITY_ID, { fieldName: "Text3", displayName: "Actor", type: "identity-picker" }),
  field(VENDOR_ACTIVITY_ID, { fieldName: "Text4", displayName: "Description", type: "textarea" }),
  field(VENDOR_ACTIVITY_ID, { fieldName: "Text5", displayName: "Related Record Type" }),
  field(VENDOR_ACTIVITY_ID, { fieldName: "Text6", displayName: "Related Record ID" }),
];

function fieldDisplayName(listTitle, fieldName) {
  const byTitle = {
    Vendors: vendorFields,
    "Vendor Documents": documentFields,
    "Compliance Reviews": reviewFields,
    "Vendor Tasks": taskFields,
    "Vendor Activity / History": activityFields,
  };
  const match = byTitle[listTitle]?.find((item) => item.FieldName === fieldName);
  return match?.DisplayName || fieldName;
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
      container("Onboarding completion card", [heading("Onboarding Completion"), progressCircle("Overall onboarding completion", 72), dynamicField("Decimal2", "Onboarding Completion %", { source: "1" }), paragraph("72% average completion across open onboarding work and Onboarding Status movement.")]),
      container("Urgent compliance risk card", [
        alertBox("Urgent Compliance Risks", "High-risk vendors, blocked Review Status items, and expired documents need owner follow-up today.", "danger"),
        paragraph("Example focus: High-risk vendors with expired insurance, blocked Compliance Status, or sanctions review action required."),
        paragraph("Review Status, Risk Level, Vendor Name, Compliance Status, and Expiry Date drive this operational risk alert."),
        paragraph("Use the Compliance Review Workspace to open the configured Kanban, collection, and document table."),
      ]),
    ], 2),
    grid("Operations board", [
      container("Onboarding Kanban card", [heading("Onboarding Status Board"), kanban("Vendor onboarding status Kanban", VENDORS_ID, "Vendors", "Text7", [
        ["Text0", "Vendor Name"],
        ["Text6", "Risk Level"],
        ["Text8", "Compliance Status"],
        ["Text11", "Owner"],
        ["DateTime1", "Renewal Date"],
        ["DateTime3", "Last Review Date"],
      ]), button("View Vendor")], { padding: { left: 20, right: 20, top: 20, bottom: 20 } }),
      container("Quick links card", [heading("Quick Links"), iconList("Vendor quick links", [
        { icon: "fa-regular fa-plus", title: "New Vendor", description: "Start request" },
        { icon: "fa-regular fa-shield-check", title: "Compliance Queue", description: "Review risks" },
        { icon: "fa-regular fa-file-lines", title: "Expiring Docs", description: "Document follow-up" },
        { icon: "fa-regular fa-chart-line", title: "Reports", description: "Operational view" },
      ]), grid("Quick link actions", [button("New Vendor Request"), button("View Compliance Queue")], 2)]),
    ], 2),
    container("Vendor records table card", [
      heading("Vendor Records"),
      dataTable("Vendor records data table", VENDORS_ID, "Vendors", ["Text0", "Text1", "Text2", "Text3", "Text4", "Text5", "Text6", "Text7", "DateTime1", "Text8", "Text9", "Text11", "Decimal1"]),
    ]),
    container("Recent activity timeline card", [
      heading("Recent Vendor Activity"),
      timeline("Recent vendor activity timeline", VENDOR_ACTIVITY_ID, "Vendor Activity / History", { title: "Text0", date: "DateTime1", type: "Text2", actor: "Text3", description: "Text4" }),
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
          ["Text0", "Vendor Name"],
          ["Text6", "Risk Level"],
          ["Text8", "Compliance Status"],
          ["Text2", "Country / Region"],
          ["Text11", "Owner"],
          ["DateTime3", "Last Review Date"],
          ["Decimal1", "Annual Spend Estimate"],
        ]),
        paragraph("Required Actions from Compliance Reviews are reviewed with each risk queue card."),
        button("Open Vendor Detail"),
      ]),
      container("Selected vendor summary", [
        heading("Selected Vendor Summary"),
        paragraph("Review queue summary shows Vendor Name, Risk Level, Compliance Status, Owner, Review Status, and Required Actions for the selected review context."),
        progressCircle("Risk score", 82),
        heading("Risk Progress", "s-semibold"),
        alertBox("High Risk Action Required", "Missing Documents and Expired Documents need reviewer follow-up before approval.", "danger"),
      ]),
    ], 2),
    container("Vendors needing review collection", [
      heading("Vendors Needing Review"),
      collection("Compliance review collection", COMPLIANCE_REVIEWS_ID, "Compliance Reviews", [
        ["Text0", "Review Title"],
        ["Text2", "Review Type"],
        ["Decimal1", "Risk Score"],
        ["Text7", "Severity"],
        ["Text5", "Review Status"],
        ["Text6", "Reviewer"],
        ["DateTime1", "Review Date"],
        ["Text4", "Required Actions"],
      ], ["Open Vendor Detail", "Assign Reviewer", "Approve Compliance"]),
    ]),
    container("Missing documents table", [
      heading("Missing or Expired Documents"),
      dataTable("Missing documents data table", VENDOR_DOCUMENTS_ID, "Vendor Documents", ["Text1", "Text2", "Text4", "DateTime1", "Text5", "Text6"]),
    ]),
    container("Review action area", [
      heading("Review Actions"),
      paragraph("Reviewer, Review Status, and Compliance Status are reviewed before any tenant-specific workflow action is enabled."),
      grid("Review buttons", [button("Assign Reviewer"), button("Approve Compliance"), button("Request Missing Documents")], 3),
    ], { background: "#ECFEFF" }),
  ], [{ id: "__temp_selected_vendor_ids", name: "Selected Vendor IDs", type: "array" }, { id: "__temp_selected_vendor_count", name: "Selected Vendor Count", type: "number" }]);
}

function vendorDetailForm() {
  return page("Vendor Detail View Page", [
    container("Vendor header card", [
      heading("Vendor 360 View", "h3-bold"),
      paragraph("Data source: Vendors, with related Vendor Documents, Compliance Reviews, Vendor Tasks, and Vendor Activity / History sections."),
      grid("Vendor status summary", [
        dynamicField("Text0", "Vendor Name"),
        dynamicField("Text6", "Risk Level"),
        dynamicField("Text7", "Onboarding Status"),
        dynamicField("Text8", "Compliance Status"),
        dynamicUser("Text11", "Owner"),
      ], 5),
      grid("Vendor detail actions", [button("Edit Vendor"), button("Add Document"), button("Add Task"), button("Start Review"), button("Print Summary")], 5),
    ], { background: "#ffffff" }),
    stepsBar(),
    tabs("Vendor detail tabs", [
      { id: "overview", label: "Overview", children: [
        grid("Overview details grid", [
          container("Vendor profile fields", [
            heading("Vendor Profile"),
            dynamicField("Text0", "Vendor Name"),
            dynamicField("Text1", "Vendor Type"),
            dynamicField("Text2", "Country / Region"),
            dynamicField("Text3", "Primary Contact"),
            dynamicField("Text4", "Email"),
            dynamicField("Text5", "Phone"),
            dynamicUser("Text11", "Owner"),
            dynamicField("DateTime3", "Last Review Date"),
          ]),
          container("Contract payment summary", [
            heading("Contract & Payment"),
            dynamicField("Text9", "Contract Status"),
            dynamicField("Text10", "Payment Terms"),
            dynamicField("Decimal1", "Annual Spend Estimate"),
            dynamicField("Text12", "Budget Category"),
            dynamicField("Text13", "Tax Review Status"),
            dynamicField("Text14", "Bank Info Status"),
            dynamicField("DateTime1", "Renewal Date"),
            progressBar("Onboarding completion", "Decimal2"),
          ]),
        ], 2),
      ] },
      { id: "documents", label: "Documents", children: [
        container("Vendor documents", [
          button("Add Document"),
          dataTable("Vendor documents data table", VENDOR_DOCUMENTS_ID, "Vendor Documents", ["Text2", "Text4", "DateTime1", "Text5", "DateTime2", "Text6"]),
          documentEmbed("Text3"),
        ]),
      ] },
      { id: "compliance", label: "Compliance", children: [
        grid("Compliance tab grid", [
          container("Risk score", [button("Start Review"), progressCircle("Vendor risk score", 74), alertBox("Missing or expired documents", "Compliance approval is blocked until document review is complete.", "warning")]),
          collection("Compliance review cards", COMPLIANCE_REVIEWS_ID, "Compliance Reviews", [["Text2", "Review Type"], ["Decimal1", "Risk Score"], ["Text7", "Severity"], ["Text5", "Review Status"], ["Text3", "Findings"], ["Text4", "Required Actions"], ["Text6", "Reviewer"], ["DateTime1", "Review Date"]], ["Mark Action Required", "Approve Compliance"]),
        ], 2),
      ] },
      { id: "tasks", label: "Tasks", children: [
        container("Task action card", [
          button("Add Task"),
          collection("Open vendor tasks", VENDOR_TASKS_ID, "Vendor Tasks", [["Text0", "Task Name"], ["Text2", "Task Type"], ["Text3", "Assigned To"], ["DateTime1", "Due Date"], ["Text4", "Status"], ["Text5", "Priority"], ["Text6", "Notes"]], ["Mark Complete", "Edit", "Cancel"]),
        ]),
      ] },
      { id: "history", label: "History", children: [
        timeline("Vendor history timeline", VENDOR_ACTIVITY_ID, "Vendor Activity / History", { title: "Text0", date: "DateTime1", type: "Text2", actor: "Text3", description: "Text4" }),
      ] },
    ]),
  ]);
}

function vendorRequestForm() {
  return page("New Vendor Request Form", [
    container("Request form intro", [
      heading("New Vendor Request", "h3-bold"),
      paragraph("Data source: Vendors and Vendor Documents. Onboarding Status is set during request submission and review."),
      paragraph("Submit a complete vendor onboarding request with business, compliance, payment, and document details."),
      alertBox("Required compliance documents", "Upload or identify required tax, insurance, registration, and contract documents before submission.", "warning"),
    ]),
    grid("Vendor request sections", [
      container("Vendor Information", [formInput("Text0", "Vendor Name"), formInput("Text1", "Vendor Type"), formInput("Text2", "Country / Region"), formInput("Decimal1", "Annual Spend Estimate"), formInput("Text11", "Owner")]),
      container("Contact Information", [formInput("Text3", "Primary Contact"), formInput("Text4", "Email"), formInput("Text5", "Phone")]),
      container("Business Justification", [formInput("Text16", "Business Justification"), formInput("Text12", "Budget Category")]),
      container("Payment & Contract Information", [formInput("Text10", "Payment Terms"), formInput("Text9", "Contract Status"), formInput("DateTime1", "Renewal Date"), formInput("Text13", "Tax Review Status"), formInput("Text14", "Bank Info Status")]),
    ], 2),
    toggle("Optional Details", [
      paragraph("Use optional details for vendor classification, renewal reminders, and post-import tenant-specific routing."),
      formInput("Text15", "Vendor Code"),
    ]),
    container("Required Documents", [
      button("Add Document Row"),
      dynamicSubList("Required document checklist"),
    ]),
    container("Footer actions", [
      dynamicField("Text7", "Onboarding Status"),
      grid("Form actions", [button("Save Draft", "save"), button("Submit Request", "submit")], 2),
    ]),
  ]);
}

function vendorPrintPage() {
  return page("Vendor Print Page", [
    container("Printable vendor header", [
      heading("Vendor Summary", "h3-bold"),
      paragraph("Data source: Vendors with Vendor Documents, Compliance Reviews, and Vendor Activity / History printable sections."),
      grid("Print header fields", [
        dynamicField("Text0", "Vendor Name"),
        dynamicField("Text15", "Vendor Code"),
        dynamicField("Text6", "Risk Level"),
        dynamicField("Text7", "Onboarding Status"),
        dynamicField("Text8", "Compliance Status"),
        dynamicUser("Text11", "Owner"),
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
        dynamicField("Decimal1", "Annual Spend Estimate"),
        dynamicField("DateTime1", "Renewal Date"),
        dynamicField("DateTime3", "Last Review Date"),
      ]),
      container("Compliance Summary", [
        stepsBar(),
        dynamicField("Text6", "Risk Level"),
        dynamicField("Text8", "Compliance Status"),
        progressCircle("Latest risk score", 74),
        paragraph("Risk Score, Review Status, and Required Actions from Compliance Reviews are included in the approval packet summary."),
        dynamicField("Text13", "Tax Review Status"),
        dynamicField("Text14", "Bank Info Status"),
      ]),
    ], 2),
    container("Document Checklist", [
      dataTable("Printable document checklist", VENDOR_DOCUMENTS_ID, "Vendor Documents", ["Text2", "Text4", "DateTime1", "Text5", "Text6"]),
    ]),
    container("Approval Timeline", [
      timeline("Printable approval timeline", VENDOR_ACTIVITY_ID, "Vendor Activity / History", { title: "Text0", date: "DateTime1", type: "Text2", actor: "Text3", description: "Text4" }),
    ]),
    grid("Codes", [
      container("QR code panel", [qrCode("Text15"), paragraph("Scan to locate vendor record after tenant-specific link configuration.")]),
      container("Barcode panel", [barcode("Text15"), paragraph("Vendor code for audit packet indexing.")]),
    ], 2),
    container("Print styling and internal notes", [
      heading("Print Styling", "s-semibold"),
      paragraph("Signature, Internal Notes, page-break controls, and read-only print spacing are reserved for the final compliance packet."),
      customCss("Vendor print page CSS", "@media print { .vendor-print-page { page-break-after: always; } .vendor-print-card { break-inside: avoid; } }"),
    ]),
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
      paragraph(`${title} groups the primary operational fields for post-import record review, update, and audit follow-up.`),
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
    layout(VENDORS_ID, "All Vendors", 0, null, { layoutView: JSON.stringify(viewLayout(["Text0", "Text1", "Text2", "Text6", "Text7", "Text8", "Text9", "Text11", "DateTime1", "Decimal1"], vendorFields)) }),
  ];
  const documentLayoutView = { add: documentFormLayoutId, edit: documentFormLayoutId, view: documentFormLayoutId, sortVer: 1 };
  const reviewLayoutView = { add: reviewFormLayoutId, edit: reviewFormLayoutId, view: reviewFormLayoutId, sortVer: 1 };
  const taskLayoutView = { add: taskFormLayoutId, edit: taskFormLayoutId, view: taskFormLayoutId, sortVer: 1 };
  const activityLayoutView = { add: activityFormLayoutId, edit: activityFormLayoutId, view: activityFormLayoutId, sortVer: 1 };
  const documentLayouts = [
    layout(VENDOR_DOCUMENTS_ID, "Vendor Document Form", 1, genericRecordForm("Vendor Document Form", documentFields), { layoutId: documentFormLayoutId }),
    layout(VENDOR_DOCUMENTS_ID, "All Vendor Documents", 0, null, { layoutView: JSON.stringify(viewLayout(["Text0", "Text1", "Text2", "Text4", "DateTime1", "Text5"], documentFields)) }),
  ];
  const reviewLayouts = [
    layout(COMPLIANCE_REVIEWS_ID, "Compliance Review Form", 1, genericRecordForm("Compliance Review Form", reviewFields), { layoutId: reviewFormLayoutId }),
    layout(COMPLIANCE_REVIEWS_ID, "All Compliance Reviews", 0, null, { layoutView: JSON.stringify(viewLayout(["Text0", "Text1", "Text2", "Decimal1", "Text5", "Text6", "DateTime1"], reviewFields)) }),
  ];
  const taskLayouts = [
    layout(VENDOR_TASKS_ID, "Vendor Task Form", 1, genericRecordForm("Vendor Task Form", taskFields), { layoutId: taskFormLayoutId }),
    layout(VENDOR_TASKS_ID, "All Vendor Tasks", 0, null, { layoutView: JSON.stringify(viewLayout(["Text0", "Text1", "Text2", "Text3", "DateTime1", "Text4", "Text5"], taskFields)) }),
  ];
  const activityLayouts = [
    layout(VENDOR_ACTIVITY_ID, "Vendor Activity Form", 1, genericRecordForm("Vendor Activity Form", activityFields), { layoutId: activityFormLayoutId }),
    layout(VENDOR_ACTIVITY_ID, "All Vendor Activity", 0, null, { layoutView: JSON.stringify(viewLayout(["Text0", "Text1", "Text2", "DateTime1", "Text3", "Text5"], activityFields)) }),
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

function appPackageInfoFromDecodedData(data) {
  const normalizeList = (model, { root = false } = {}) => ({
    ListID: String(model.ListID),
    Title: String(model.Title || APP_TITLE),
    Description: String(model.Description || ""),
    Status: Number.isInteger(model.Status) ? model.Status : 1,
    IsItemPerm: Boolean(model.IsItemPerm),
    IsVerRecord: Boolean(model.IsVerRecord),
    HasComment: Boolean(model.HasComment),
    IconUrl: String(model.IconUrl || ""),
    TableCode: String(model.TableCode || cleanInternalName(model.Title || "list").toLowerCase()),
    Ext1: String(model.Ext1 || ""),
    Ext2: String(model.Ext2 || ""),
    Ext3: String(model.Ext3 || ""),
    Type: Number.isInteger(model.Type) ? model.Type : root ? 1024 : 1,
    Flags: Number.isInteger(model.Flags) ? model.Flags : 1,
    LayoutView: String(model.LayoutView || ""),
    Perms: Array.isArray(model.Perms) ? model.Perms : [],
    AdvancePerms: Array.isArray(model.AdvancePerms) ? model.AdvancePerms : [],
    Items: model.Items && typeof model.Items === "object" && !Array.isArray(model.Items) ? model.Items : {},
  });
  const normalizeField = (item, index) => ({
    FieldID: String(item.FieldID),
    ListID: String(item.ListID),
    FieldName: String(item.FieldName),
    FieldType: String(item.FieldType || "Text"),
    FieldIndex: index,
    DisplayName: String(item.DisplayName || item.FieldName),
    InternalName: cleanInternalName(item.InternalName || item.DisplayName || item.FieldName),
    Type: String(item.Type || "input"),
    Status: Number.isInteger(item.Status) ? item.Status : 1,
    Category: Number.isInteger(item.Category) ? item.Category : 0,
    DefaultValue: item.DefaultValue ?? "",
    Rules: item.Rules === undefined || item.Rules === null ? "{}" : String(item.Rules),
    IsSort: Boolean(item.IsSort),
    IsSystem: Boolean(item.IsSystem),
    IsUnique: Boolean(item.IsUnique),
    Ext1: String(item.Ext1 || ""),
    Ext2: String(item.Ext2 || ""),
    Ext3: String(item.Ext3 || ""),
  });
  const normalizeLayout = (item) => ({
    ListID: String(item.ListID),
    LayoutID: String(item.LayoutID),
    Type: Number.isInteger(item.Type) ? item.Type : Number(item.Type || 0),
    Title: String(item.Title || ""),
    LayoutView: item.LayoutView === null || item.LayoutView === undefined ? "" : String(item.LayoutView),
    Ext1: String(item.Ext1 || ""),
    Ext2: String(item.Ext2 || ""),
    Ext3: String(item.Ext3 || ""),
    IsDefault: Boolean(item.IsDefault),
    IsItemPerm: Boolean(item.IsItemPerm),
    Perms: Array.isArray(item.Perms) ? item.Perms : [],
    LayoutInResources: (Array.isArray(item.LayoutInResources) ? item.LayoutInResources : []).map((resource) => ({
      ID: String(resource.ID || item.LayoutID),
      RefId: String(resource.RefId || item.LayoutID),
      Resource: String(resource.Resource || ""),
    })),
  });
  return {
    ListSet: normalizeList(data.Item.ListModel, { root: true }),
    Pages: data.Item.Layouts.map(normalizeLayout),
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
      List: normalizeList(child.ListModel),
      Fields: child.Defs.map(normalizeField),
      Layouts: child.Layouts.map(normalizeLayout),
      RemindRules: child.RemindRules || [],
      PublicForms: child.PublicForms || [],
      FlowMappings: child.FlowMappings || [],
    })),
  };
}

function collectPlaceholderIds(value) {
  const text = JSON.stringify(value);
  return Array.from(new Set(text.match(/\b760100000000000\d+\b/g) || []));
}

function replaceAllIds(value, idMap) {
  let text = JSON.stringify(value);
  for (const [from, to] of idMap.entries()) text = text.replaceAll(from, to);
  return JSON.parse(text);
}

async function remapGeneratedIdsToApiIds(data, env) {
  const placeholders = collectPlaceholderIds(data);
  if (!placeholders.length) throw new Error("No generated placeholder IDs were found for API ID remapping.");
  if (!env.apiKey) throw new Error("YEEFLOW_API_KEY is required because generated packages must use API-issued IDs.");
  const apiIds = await fetchYeeflowUniqueIds({
    apiBaseUrl: env.apiBaseUrl,
    apiKey: env.apiKey,
    count: placeholders.length + 1,
  });
  const packageId = apiIds[0];
  const idMap = new Map(placeholders.map((placeholder, index) => [placeholder, apiIds[index + 1]]));
  return {
    data: replaceAllIds(data, idMap),
    packageId,
    remappedIdCount: placeholders.length,
    apiIdSummary: summarizeIds(apiIds),
  };
}

function buildYapWrapper(data) {
  const normalizeListModel = (model) => ({
    TenantID: 0,
    AppID: APP_ID,
    ListID: model.ListID,
    Title: model.Title,
    Description: model.Description || "",
    Status: Number.isInteger(model.Status) ? model.Status : 1,
    IsItemPerm: Boolean(model.IsItemPerm),
    IsVerRecord: Boolean(model.IsVerRecord),
    HasComment: Boolean(model.HasComment),
    IconUrl: model.IconUrl || "",
    TableCode: model.TableCode || cleanInternalName(model.Title || "list").toLowerCase(),
    IndexCode: "",
    Created: GENERATED_AT_UTC,
    Modified: GENERATED_AT_UTC,
    CreatedBy: 0,
    ModifiedBy: 0,
    Ext1: model.Ext1 || "",
    Ext2: model.Ext2 || "",
    Ext3: model.Ext3 || "",
    Perm: 0,
    Type: model.Type,
    Flags: Number.isInteger(model.Flags) ? model.Flags : 1,
    CustomType: model.CustomType || "",
    WorkspaceID: "0",
    LayoutView: model.LayoutView || "",
    IsBreakInherit: false,
    IsDataSeparate: false,
    HasDeleted: false,
    HasEnabled: true,
    HasDisabled: false,
    AdvanceList: [],
  });
  const normalizeLayout = (layout) => ({
    LayoutID: layout.LayoutID,
    ListID: layout.ListID,
    Type: layout.Type,
    Title: layout.Title || "",
    LayoutView: layout.LayoutView === null || layout.LayoutView === undefined ? "" : layout.LayoutView,
    AppID: APP_ID,
    TenantID: 0,
    Created: GENERATED_AT_UTC,
    Modified: GENERATED_AT_UTC,
    CreatedBy: 0,
    ModifiedBy: 0,
    Ext1: layout.Ext1 || "",
    Ext2: layout.Ext2 || "",
    Ext3: layout.Ext3 || "",
    IsDefault: Boolean(layout.IsDefault),
    IsItemPerm: Boolean(layout.IsItemPerm),
    LayoutInResources: Array.isArray(layout.LayoutInResources) ? layout.LayoutInResources : [],
  });
  const normalizeFields = (fields) => fields.map((fieldItem, index) => ({
    ...fieldItem,
    FieldIndex: index,
    Category: Number.isInteger(fieldItem.Category) ? fieldItem.Category : 0,
  }));
  const listExportInfo = {
    Item: {
      ListModel: normalizeListModel(data.Item.ListModel),
      Defs: [],
      Layouts: data.Item.Layouts.map(normalizeLayout),
      PublicForms: [],
      RemindRules: [],
      FlowMappings: [],
      ListDatas: {},
    },
    Childs: data.Childs.map((child) => ({
      ListModel: normalizeListModel(child.ListModel),
      Defs: normalizeFields(child.Defs),
      Layouts: child.Layouts.map(normalizeLayout),
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
  const listExportResult = {
    AppID: APP_ID,
    MainListType: "classes",
    ReplaceIds: data.ReplaceIds,
    ReportIds: [],
    FormKeys: [],
    Data: JSON.stringify(listExportInfo),
    SimplePortal: null,
  };
  return {
    Title: APP_TITLE,
    Description: APP_DESCRIPTION,
    IconUrl: "{\"b\":\"#E6F7FF\",\"i\":\"fa-regular fa-building-shield\",\"c\":\"#008DA6\"}",
    IsListSet: true,
    Resource: `${GZIP_PREFIX}${zlib.gzipSync(Buffer.from(JSON.stringify(listExportResult), "utf8")).toString("base64")}`,
  };
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

function assertEnvReadable(filePath) {
  const flags = execFileSync("ls", ["-lO", filePath], { encoding: "utf8" });
  if (/\bdataless\b/.test(flags)) throw new Error(`${filePath} is marked dataless and cannot be read for signing.`);
}

async function signIfConfigured(wrapper) {
  loadDotenvFile(fs, ".env.local", { assertReadable: assertEnvReadable });
  const env = resolveYeeflowEnvironment(process.env);
  const signingWrapper = env.tenantId ? { ...wrapper, TenantID: env.tenantId } : wrapper;
  if (!env.apiKey) {
    return {
      wrapper: { ...signingWrapper, Sign: Buffer.alloc(32).toString("base64") },
      status: "skipped_missing_api_key",
      signByteLength: 32,
      verifyStatus: null,
      apiBaseUrl: env.apiBaseUrl,
    };
  }
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

async function main() {
  ensureDir(TMP_DIR);
  loadDotenvFile(fs, ".env.local", { assertReadable: assertEnvReadable });
  const env = resolveYeeflowEnvironment(process.env);
  const generated = buildDecodedData();
  const apiIdResult = await remapGeneratedIdsToApiIds(generated, env);
  const data = apiIdResult.data;
  const appPackage = appPackageInfoFromDecodedData(data);
  const decodedResource = {
    AppID: APP_ID,
    MainListType: "classes",
    Data: JSON.stringify(data),
    ReplaceIds: data.ReplaceIds,
    ReportIds: [],
    FormKeys: [],
    SimplePortal: null,
  };
  const validationYapWrapper = buildYapWrapper(data);
  const appPackageText = JSON.stringify(appPackage);
  const resourceBase64 = zlib.brotliCompressSync(Buffer.from(appPackageText, "utf8")).toString("base64");
  const signResult = await signIfConfigured(wrapperForAppPackage(resourceBase64, {
    packageId: apiIdResult.packageId,
    rootListId: data.Item.ListModel.ListID,
  }));
  fs.writeFileSync(OUT_DECODED_DATA, `${JSON.stringify(data, null, 2)}\n`);
  fs.writeFileSync(OUT_DECODED_RESOURCE, `${JSON.stringify(decodedResource, null, 2)}\n`);
  fs.writeFileSync(OUT_VALIDATION_YAP_WRAPPER, `${JSON.stringify(validationYapWrapper, null, 2)}\n`);
  fs.writeFileSync(OUT_APP_PACKAGE, `${JSON.stringify(appPackage, null, 2)}\n`);
  fs.writeFileSync(OUT_YAPK, `${JSON.stringify(signResult.wrapper, null, 2)}\n`);
  fs.writeFileSync(OUT_YAP, `${JSON.stringify(validationYapWrapper, null, 2)}\n`);
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
    apiIds: {
      source: "Yeeflow generate-unique-ids API",
      remappedGeneratedIdCount: apiIdResult.remappedIdCount,
      requestedIncludingPackageId: apiIdResult.apiIdSummary.requested,
      received: apiIdResult.apiIdSummary.received,
      minLength: apiIdResult.apiIdSummary.minLength,
      maxLength: apiIdResult.apiIdSummary.maxLength,
      unsafeIntegerCount: apiIdResult.apiIdSummary.unsafeIntegerCount,
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
    apiIds: report.apiIds,
    dataLists: report.coverage.dataLists.length,
    pages: report.coverage.pages.length,
    vendorForms: report.coverage.vendorForms.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "fail", error: error.message }, null, 2));
  process.exit(1);
});
