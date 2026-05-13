#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const PLACEHOLDER_RE = /^__.*REQUIRED.*__$/;
const NUMERIC_OPS = new Set(["n.>", "n.>=", "n.<", "n.<=", "n.=", "n.!=", ">", ">=", "<", "<="]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function usage(exitCode = 1) {
  const out = [
    "Usage:",
    "  node validate-ywf-def.js <decoded-def.json> --mode <draft|final> [--dependency-map <mapping.json>]",
    "",
    "Examples:",
    "  node validate-ywf-def.js ./travel-request-def.json --mode draft",
    "  node validate-ywf-def.js ./travel-request-def.json --mode final",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(out);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = { input: null, mode: "draft", dependencyMap: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") usage(0);
    if (arg === "--mode") {
      args.mode = argv[++i];
    } else if (arg === "--dependency-map") {
      args.dependencyMap = argv[++i];
    } else if (!args.input) {
      args.input = arg;
    } else {
      usage();
    }
  }
  if (!args.input || !["draft", "final"].includes(args.mode)) usage();
  return args;
}

function readJson(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  return JSON.parse(text);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isSequenceFlow(shape) {
  return shape && shape.stencil && shape.stencil.id === "SequenceFlow";
}

function shapeId(shape) {
  return shape && (shape.resourceid || shape.resourceId || shape.id);
}

function refId(ref) {
  if (!ref) return undefined;
  if (typeof ref === "string") return ref;
  return ref.resourceid || ref.resourceId || ref.id;
}

function addIssue(list, code, message, path, detail) {
  list.push({ code, message, path: path || null, detail });
}

function deepWalk(value, visitor, pointer = "$", parent = null) {
  visitor(value, pointer, parent);
  if (Array.isArray(value)) {
    value.forEach((item, index) => deepWalk(item, visitor, `${pointer}[${index}]`, value));
  } else if (isObject(value)) {
    Object.entries(value).forEach(([key, child]) => {
      deepWalk(child, visitor, `${pointer}.${key}`, value);
    });
  }
}

function collectPlaceholders(value) {
  const found = new Map();
  deepWalk(value, (node, pointer) => {
    if (typeof node === "string" && PLACEHOLDER_RE.test(node)) {
      if (!found.has(node)) found.set(node, []);
      found.get(node).push(pointer);
    }
  });
  return [...found.entries()].map(([placeholder, paths]) => ({ placeholder, paths }));
}

function validateDecodedDef(def, options = {}) {
  const mode = options.mode || "draft";
  const dependencyMap = options.dependencyMap || null;
  const errors = [];
  const warnings = [];
  const summary = {
    variables: 0,
    listrefs: 0,
    pages: 0,
    controls: 0,
    workflowNodes: 0,
    sequenceFlows: 0,
    approvalTasks: 0,
    contentListNodes: 0,
    lookupControls: 0,
  };

  if (!isObject(def)) {
    addIssue(errors, "DEF_NOT_OBJECT", "Decoded Def JSON must be an object", "$");
    return finish();
  }

  validateBasicStructure();

  const basicVars = asArray(def.variables && def.variables.basic);
  const listrefs = asArray(def.variables && def.variables.listref);
  const pages = asArray(def.pageurls);
  const childshapes = asArray(def.childshapes);
  const variableById = new Map();
  const listrefById = new Map();
  const rowFieldsByListVar = new Map();
  const requestPageIds = new Set();
  const approvalPageIds = new Set();
  const controls = [];
  const controlEntries = [];
  const placeholders = collectPlaceholders(def);

  summary.variables = basicVars.length;
  summary.listrefs = listrefs.length;
  summary.pages = pages.length;
  summary.workflowNodes = childshapes.filter((s) => !isSequenceFlow(s)).length;
  summary.sequenceFlows = childshapes.filter(isSequenceFlow).length;
  summary.approvalTasks = childshapes.filter((s) => s.stencil && s.stencil.id === "MultiAssignmentTask").length;
  summary.contentListNodes = childshapes.filter((s) => s.stencil && s.stencil.id === "ContentList").length;

  validateVariables();
  validatePagesAndControls();
  validateLookupControls();
  validateTaskUrls();
  validateWorkflowGraph();
  validateApprovalTasks();
  validateSequenceFlowConditions();
  validateContentLists();
  validateSetVariableTasks();
  validatePlaceholderPolicy();

  return finish();

  function finish() {
    const status = errors.length > 0 ? "fail" : warnings.length > 0 ? "pass_with_warnings" : "pass";
    return {
      status,
      mode,
      errors,
      warnings,
      placeholders,
      summary,
    };
  }

  function validateBasicStructure() {
    const required = [
      ["defkey", def.defkey],
      ["variables.basic", def.variables && def.variables.basic],
      ["variables.listref", def.variables && def.variables.listref],
      ["pageurls", def.pageurls],
      ["childshapes", def.childshapes],
      ["graphposition", def.graphposition],
      ["graphzoom", def.graphzoom],
    ];
    for (const [key, value] of required) {
      if (value === undefined || value === null) {
        addIssue(errors, "MISSING_REQUIRED_SECTION", `Missing required section: ${key}`, `$.${key}`);
      }
    }
    if (def.variables && !Array.isArray(def.variables.basic)) {
      addIssue(errors, "VARIABLES_BASIC_NOT_ARRAY", "variables.basic must be an array", "$.variables.basic");
    }
    if (def.variables && !Array.isArray(def.variables.listref)) {
      addIssue(errors, "VARIABLES_LISTREF_NOT_ARRAY", "variables.listref must be an array", "$.variables.listref");
    }
    if (!Array.isArray(def.pageurls)) {
      addIssue(errors, "PAGEURLS_NOT_ARRAY", "pageurls must be an array", "$.pageurls");
    }
    if (!Array.isArray(def.childshapes)) {
      addIssue(errors, "CHILDSHAPES_NOT_ARRAY", "childshapes must be an array", "$.childshapes");
    }
    if (isObject(def.graphposition)) {
      for (const key of ["x", "y", "width", "height"]) {
        if (typeof def.graphposition[key] !== "number") {
          addIssue(errors, "GRAPHPOSITION_MISSING_DIMENSION", `graphposition.${key} must be a number for workflow designer layout`, `$.graphposition.${key}`);
        }
      }
    }
  }

  function validateVariables() {
    const ids = new Set();
    const idxs = new Set();
    basicVars.forEach((variable, index) => {
      const p = `$.variables.basic[${index}]`;
      if (!variable || typeof variable.id !== "string") {
        addIssue(errors, "VARIABLE_MISSING_ID", "variables.basic entry must have a string id", p);
        return;
      }
      if (ids.has(variable.id)) addIssue(errors, "DUPLICATE_VARIABLE_ID", `Duplicate variables.basic id: ${variable.id}`, p);
      ids.add(variable.id);
      variableById.set(variable.id, variable);
      if (variable.idx) {
        if (idxs.has(variable.idx)) addIssue(errors, "DUPLICATE_VARIABLE_IDX", `Duplicate variables.basic idx: ${variable.idx}`, p);
        idxs.add(variable.idx);
      }
    });

    const listrefIds = new Set();
    listrefs.forEach((listref, index) => {
      const p = `$.variables.listref[${index}]`;
      if (!listref || typeof listref.id !== "string") {
        addIssue(errors, "LISTREF_MISSING_ID", "variables.listref entry must have a string id", p);
        return;
      }
      if (listrefIds.has(listref.id)) addIssue(errors, "DUPLICATE_LISTREF_ID", `Duplicate listref id: ${listref.id}`, p);
      listrefIds.add(listref.id);
      listrefById.set(listref.id, listref);

      const rowIds = new Set();
      asArray(listref.fields).forEach((field, fieldIndex) => {
        const fieldPath = `${p}.fields[${fieldIndex}]`;
        if (!field || typeof field.id !== "string") {
          addIssue(errors, "LISTREF_FIELD_MISSING_ID", "listref field must have a string id", fieldPath);
          return;
        }
        if (rowIds.has(field.id)) {
          addIssue(errors, "DUPLICATE_LISTREF_ROW_FIELD", `Duplicate row field id ${field.id} in ${listref.id}`, fieldPath);
        }
        rowIds.add(field.id);
      });
    });

    basicVars.forEach((variable, index) => {
      if (variable && variable.type === "list") {
        if (!variable.value || !listrefById.has(variable.value)) {
          addIssue(errors, "LIST_VARIABLE_BAD_LISTREF", `List variable ${variable.id} must point to an existing listref id`, `$.variables.basic[${index}].value`);
        } else {
          rowFieldsByListVar.set(variable.id, new Set(asArray(listrefById.get(variable.value).fields).map((f) => f.id)));
        }
      }
    });
  }

  function validatePagesAndControls() {
    let hasRequest = false;
    let hasApproval = false;
    let requestHasPanel = false;
    let requestHasHistory = false;
    let approvalHasPanel = false;
    let approvalHasHistory = false;

    pages.forEach((page, pageIndex) => {
      const pagePath = `$.pageurls[${pageIndex}]`;
      if (!page || !page.id) addIssue(errors, "PAGE_MISSING_ID", "Page must have id", pagePath);
      if (mode === "final" && page && page.id && !UUID_RE.test(String(page.id))) {
        addIssue(errors, "PAGE_ID_NOT_UUID", "Page id should be UUID-shaped for import-ready approval form packages", `${pagePath}.id`);
      }
      if (page && typeof page.pagetype !== "number") {
        addIssue(errors, "PAGE_MISSING_PAGETYPE", "Page must include page-level pagetype for publish-time pageUrl registration", `${pagePath}.pagetype`);
      }
      if (page.type === 1) {
        hasRequest = true;
        requestPageIds.add(page.id);
        if (!Object.prototype.hasOwnProperty.call(page, "name")) {
          addIssue(errors, "REQUEST_PAGE_MISSING_NAME", "Request page should include name field, matching real exports", `${pagePath}.name`);
        }
      }
      if (page.type === 2) {
        hasApproval = true;
        approvalPageIds.add(page.id);
      }
      if (!page.formdef) {
        addIssue(errors, "PAGE_MISSING_FORMDEF", "Every page must have formdef", pagePath);
        return;
      }
      if (!Array.isArray(page.formdef.children)) {
        addIssue(errors, "FORMDEF_CHILDREN_NOT_ARRAY", "Every formdef must have children array", `${pagePath}.formdef.children`);
        return;
      }
      if (page.formdef.pagetype !== page.type) {
        addIssue(errors, "FORMDEF_PAGETYPE_MISMATCH", "formdef.pagetype must match page type", `${pagePath}.formdef.pagetype`, {
          pageType: page.type,
          formdefPagetype: page.formdef.pagetype,
        });
      }
      if (page.formdef.ver !== 2) {
        addIssue(errors, "FORMDEF_VERSION_UNSUPPORTED", "formdef.ver should be 2, matching current real approval exports", `${pagePath}.formdef.ver`);
      }
      if (page.formdef.exts !== undefined && !Array.isArray(page.formdef.exts)) {
        addIssue(errors, "FORMDEF_EXTS_NOT_ARRAY", "formdef.exts must be an array when present", `${pagePath}.formdef.exts`);
      }
      walkControls(page.formdef.children, { page, pagePath, listContext: null });
      if (page.type === 1) {
        deepWalk(page.formdef.children, (node) => {
          if (isObject(node) && node.type === "workflowControlPanel") requestHasPanel = true;
          if (isObject(node) && node.type === "workflowHistory") requestHasHistory = true;
        });
      }
      if (page.type === 2) {
        deepWalk(page.formdef.children, (node) => {
          if (isObject(node) && node.type === "workflowControlPanel") approvalHasPanel = true;
          if (isObject(node) && node.type === "workflowHistory") approvalHasHistory = true;
        });
      }
    });

    if (!hasRequest) addIssue(errors, "REQUEST_PAGE_MISSING", "Request page type 1 must exist", "$.pageurls");
    if (!hasApproval) addIssue(errors, "APPROVAL_PAGE_MISSING", "Approval page type 2 must exist", "$.pageurls");
    if (!requestHasPanel) addIssue(errors, "REQUEST_PANEL_MISSING", "Request page must include workflowControlPanel for Save as draft / Submit actions", "$.pageurls");
    if (!requestHasHistory) addIssue(warnings, "REQUEST_HISTORY_MISSING", "Request page should include workflowHistory", "$.pageurls");
    if (!approvalHasPanel) addIssue(errors, "APPROVAL_PANEL_MISSING", "Approval page must include workflowControlPanel", "$.pageurls");
    if (!approvalHasHistory) addIssue(errors, "APPROVAL_HISTORY_MISSING", "Approval page must include workflowHistory", "$.pageurls");

    summary.controls = controls.length;
    const controlIds = new Map();
    for (const entry of controlEntries) {
      const controlId = entry.control && entry.control.id;
      if (!controlId) continue;
      if (controlIds.has(controlId)) {
        addIssue(errors, "DUPLICATE_CONTROL_ID", `Duplicate form control id: ${controlId}`, entry.path, { firstPath: controlIds.get(controlId) });
      } else {
        controlIds.set(controlId, entry.path);
      }
    }
  }

  function walkControls(nodes, context) {
    asArray(nodes).forEach((control, index) => {
      const controlPath = `${context.pagePath}.formdef.children${context.suffix || ""}[${index}]`;
      if (!isObject(control)) return;
      controls.push(control);
      controlEntries.push({ control, path: controlPath, page: context.page, listContext: context.listContext });

      if (typeof control.binding === "string") {
        validateBinding(control.binding, controlPath, context.listContext);
      }
      validateApprovalFormUsabilityControl(control, controlPath, context.page);

      if (control.type === "list") {
        validateListControl(control, controlPath);
      }

      if (control.attrs && Array.isArray(control.attrs["list-fields"])) {
        const listContext = control.binding;
        control.attrs["list-fields"].forEach((field, fieldIndex) => {
          const fieldPath = `${controlPath}.attrs["list-fields"][${fieldIndex}]`;
          if (field && field.control) {
            controls.push(field.control);
            if (typeof field.control.binding === "string") {
              validateBinding(field.control.binding, `${fieldPath}.control`, listContext);
            }
            validateCalculationExpressions(field.control.attrs && field.control.attrs.calculated, `${fieldPath}.control.attrs.calculated`, listContext);
          }
        });
      }

      validateCalculationExpressions(control.attrs && control.attrs.calculated, `${controlPath}.attrs.calculated`, context.listContext);

      for (const child of childControlCollections(control)) {
        walkControls(child.children, {
          page: context.page,
          pagePath: context.pagePath,
          listContext: context.listContext,
          suffix: `${context.suffix || ""}[${index}].${child.suffixKey}`,
        });
      }
    });
  }

  function childControlCollections(control) {
    const collections = [];
    if (Array.isArray(control.children)) collections.push({ children: control.children, suffixKey: "children" });
    if (isObject(control.children) && Array.isArray(control.children.children)) collections.push({ children: control.children.children, suffixKey: "children.children" });
    if (Array.isArray(control.columns)) collections.push({ children: control.columns, suffixKey: "columns" });
    return collections;
  }

  function isLookupControl(control) {
    const attrs = control && control.attrs ? control.attrs : {};
    return control && (control.type === "lookup" || control.type === "lookup-list" || attrs.listid || attrs.listId || attrs.listfield || Array.isArray(attrs.addition));
  }

  function validateLookupControls() {
    const controlsByBinding = new Map();
    for (const entry of controlEntries) {
      if (entry.control && typeof entry.control.binding === "string" && !controlsByBinding.has(entry.control.binding)) {
        controlsByBinding.set(entry.control.binding, entry);
      }
    }

    for (const entry of controlEntries) {
      const control = entry.control;
      if (!isLookupControl(control)) continue;
      summary.lookupControls += 1;
      const attrs = control.attrs || {};
      const lookupPath = entry.path;

      if (!control.binding || !variableById.has(control.binding)) {
        addIssue(errors, "LOOKUP_BINDING_UNKNOWN", "Lookup control binding must reference variables.basic", `${lookupPath}.binding`);
      } else {
        const variable = variableById.get(control.binding);
        if (variable.type !== "lookup") {
          addIssue(errors, "LOOKUP_BINDING_NON_LOOKUP_VARIABLE", "Lookup control should bind to a variables.basic entry with type \"lookup\"", `${lookupPath}.binding`, {
            binding: control.binding,
            variableType: variable.type,
          });
        }
      }

      for (const [key, value] of [["appid", attrs.appid], ["listsetid", attrs.listsetid], ["listid", attrs.listid || attrs.listId], ["listfield", attrs.listfield]]) {
        if (value === undefined || value === null || value === "") {
          addIssue(errors, "LOOKUP_SOURCE_METADATA_MISSING", `Lookup control must include attrs.${key}`, `${lookupPath}.attrs.${key}`);
        }
      }

      if (attrs["sort-first"] !== undefined) {
        const sort = attrs["sort-first"];
        if (!isObject(sort)) {
          addIssue(errors, "LOOKUP_SORT_BAD_SHAPE", "Lookup attrs[\"sort-first\"] must be an object when present", `${lookupPath}.attrs["sort-first"]`);
        } else {
          if (!sort.SortName) addIssue(errors, "LOOKUP_SORT_FIELD_MISSING", "Lookup sort-first must include SortName", `${lookupPath}.attrs["sort-first"].SortName`);
          if (sort.SortByDesc !== undefined && typeof sort.SortByDesc !== "boolean") {
            addIssue(warnings, "LOOKUP_SORT_DIRECTION_NOT_BOOLEAN", "Lookup sort-first.SortByDesc should be boolean", `${lookupPath}.attrs["sort-first"].SortByDesc`);
          }
        }
      }

      if (attrs.multiple === true || attrs.multiple === "true") {
        addIssue(warnings, "LOOKUP_MULTI_SELECT_UNCONFIRMED", "Multi-select lookup controls need a real export example before generator use", `${lookupPath}.attrs.multiple`);
      }

      for (const [index, addition] of asArray(attrs.addition).entries()) {
        const additionPath = `${lookupPath}.attrs.addition[${index}]`;
        if (!isObject(addition)) {
          addIssue(errors, "LOOKUP_ADDITION_BAD_SHAPE", "Lookup additional field mapping must be an object", additionPath);
          continue;
        }
        if (!addition.FieldName) addIssue(errors, "LOOKUP_ADDITION_SOURCE_FIELD_MISSING", "Lookup additional mapping must include source FieldName", `${additionPath}.FieldName`);
        if (!addition.FieldID) addIssue(errors, "LOOKUP_ADDITION_SOURCE_FIELD_ID_MISSING", "Lookup additional mapping must include source FieldID", `${additionPath}.FieldID`);
        if (!addition.RelationName) {
          addIssue(errors, "LOOKUP_ADDITION_TARGET_VARIABLE_MISSING", "Lookup additional mapping must include RelationName target variable", `${additionPath}.RelationName`);
        } else if (!variableById.has(addition.RelationName)) {
          addIssue(errors, "LOOKUP_ADDITION_TARGET_VARIABLE_NOT_FOUND", "Lookup additional mapping RelationName must reference variables.basic", `${additionPath}.RelationName`, {
            relationName: addition.RelationName,
          });
        } else {
          const targetControl = controlsByBinding.get(addition.RelationName);
          if (!targetControl) {
            addIssue(warnings, "LOOKUP_DERIVED_TARGET_CONTROL_NOT_FOUND", "Lookup additional target variable exists but no visible control is bound to it", additionPath, {
              relationName: addition.RelationName,
            });
          } else if (targetControl.control.readonly !== true) {
            addIssue(warnings, "LOOKUP_DERIVED_TARGET_CONTROL_EDITABLE", "Control populated by lookup additional mapping should usually be readonly", targetControl.path, {
              relationName: addition.RelationName,
              controlType: targetControl.control.type,
              controlLabel: targetControl.control.label,
            });
          }
        }
        if (addition.RelationFieldIsMultiple === true || addition.RelationFieldIsMultiple === "true") {
          addIssue(warnings, "LOOKUP_ADDITION_MULTI_SELECT_UNCONFIRMED", "Additional field mappings for multi-select lookup need a real export example before generator use", `${additionPath}.RelationFieldIsMultiple`);
        }
      }
    }
  }

  function validateApprovalFormUsabilityControl(control, controlPath, page) {
    if (!control || !page || page.type !== 1) return;
    const attrs = control.attrs || {};
    if (control.readonly === true && (control.binding === "Applicant" || control.label === "Applicant")) {
      if (control.value !== "CurrentUser") {
        addIssue(errors, "APPLICANT_CURRENT_USER_VALUE_MISSING", "Readonly Applicant control should use value \"CurrentUser\"", `${controlPath}.value`);
      }
      if (attrs.default !== "currentUser") {
        addIssue(errors, "APPLICANT_CURRENT_USER_DEFAULT_MISSING", "Readonly Applicant control should use attrs.default \"currentUser\"", `${controlPath}.attrs.default`);
      }
    }

    if (control.readonly === true && (control.binding === "SubmissionDate" || control.label === "Submission Date")) {
      if (attrs.default !== "currentDate") {
        addIssue(errors, "SUBMISSION_DATE_CURRENT_DATE_DEFAULT_MISSING", "Readonly Submission Date control should use attrs.default \"currentDate\"", `${controlPath}.attrs.default`);
      }
      if (attrs.date_type !== "0") {
        addIssue(errors, "SUBMISSION_DATE_DATE_TYPE_MISSING", "Readonly Submission Date control should use attrs.date_type \"0\"", `${controlPath}.attrs.date_type`);
      }
    }

    if (control.type === "datepicker" && typeof control.value === "string" && /^\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2}:\d{2})?$/.test(control.value) && attrs.default !== "currentDate") {
      addIssue(warnings, "DATEPICKER_STATIC_DEFAULT_WITHOUT_CURRENT_DATE", "Datepicker has a static timestamp value but lacks attrs.default \"currentDate\"", `${controlPath}.value`);
    }
  }

  function validateBinding(binding, controlPath, listContext) {
    if (variableById.has(binding)) return;
    if (listContext && rowFieldsByListVar.get(listContext) && rowFieldsByListVar.get(listContext).has(binding)) return;
    addIssue(errors, "CONTROL_BINDING_UNKNOWN", `Control binding ${binding} does not reference a variable or valid list row field`, `${controlPath}.binding`);
  }

  function validateListControl(control, controlPath) {
    if (typeof control.binding !== "string" || !variableById.has(control.binding)) {
      addIssue(errors, "LIST_CONTROL_UNKNOWN_BINDING", "List control binding must reference variables.basic", `${controlPath}.binding`);
      return;
    }
    const listVar = variableById.get(control.binding);
    if (listVar.type !== "list") {
      addIssue(errors, "LIST_CONTROL_NON_LIST_BINDING", `List control ${control.binding} must bind to a variable of type list`, `${controlPath}.binding`);
      return;
    }
    const listref = listrefById.get(listVar.value);
    if (!listref) {
      addIssue(errors, "LIST_CONTROL_MISSING_LISTREF", `List control ${control.binding} points to missing listref ${listVar.value}`, `${controlPath}.binding`);
      return;
    }
    if (!control.attrs || !Array.isArray(control.attrs["list-fields"])) {
      addIssue(errors, "LIST_CONTROL_MISSING_FIELDS", "List control must have attrs[\"list-fields\"]", `${controlPath}.attrs`);
      return;
    }
    if (!Array.isArray(control.attrs["list-variables"])) {
      addIssue(errors, "LIST_CONTROL_MISSING_VARIABLES", "List control must have attrs[\"list-variables\"]", `${controlPath}.attrs`);
    }
    const expected = new Set(asArray(listref.fields).map((f) => f.id));
    const actual = new Set(control.attrs["list-fields"].map((f) => f && f.id).filter(Boolean));
    const listVariables = new Set(asArray(control.attrs["list-variables"]).map((f) => f && f.id).filter(Boolean));
    expected.forEach((id) => {
      if (actual.has(id)) return;
      if (listVariables.has(id)) {
        addIssue(warnings, "LIST_FIELD_HIDDEN_FROM_UI", `List control ${control.binding} does not render row field ${id} in list-fields, but it exists in list-variables`, `${controlPath}.attrs["list-fields"]`);
      } else {
        addIssue(errors, "LIST_FIELD_MISSING", `List control ${control.binding} is missing row field ${id}`, `${controlPath}.attrs["list-fields"]`);
      }
    });
    actual.forEach((id) => {
      if (!expected.has(id)) addIssue(errors, "LIST_FIELD_EXTRA", `List control ${control.binding} has row field not in listref: ${id}`, `${controlPath}.attrs["list-fields"]`);
    });
  }

  function validateCalculationExpressions(expr, exprPath, listContext) {
    if (!expr) return;
    deepWalk(expr, (node, pointer) => {
      if (!isObject(node) || node.exprType !== "variable") return;
      const id = node.id;
      if (!id) return;
      if (variableById.has(id)) return;
      if (listContext && rowFieldsByListVar.get(listContext) && rowFieldsByListVar.get(listContext).has(id)) return;
      addIssue(errors, "CALC_UNKNOWN_VARIABLE", `Calculation references unknown variable ${id}`, `${exprPath}${pointer.slice(1)}`);
    });
    deepWalk(expr, (node, pointer) => {
      if (!isObject(node) || node.exprType !== "variable_ctx") return;
      const ctx = node.ctx;
      const id = node.id;
      if (!rowFieldsByListVar.has(ctx) || !rowFieldsByListVar.get(ctx).has(id)) {
        addIssue(errors, "CALC_UNKNOWN_ROW_FIELD", `Calculation references unknown row field ${ctx}.${id}`, `${exprPath}${pointer.slice(1)}`);
      }
    });
  }

  function validateTaskUrls() {
    childshapes.forEach((shape, index) => {
      if (!shape || !shape.stencil) return;
      const type = shape.stencil.id;
      const taskurl = shape.properties && shape.properties.taskurl;
      const p = `$.childshapes[${index}].properties.taskurl`;
      if (type === "StartNoneEvent") {
        if (!requestPageIds.has(taskurl)) addIssue(errors, "START_TASKURL_BAD_PAGE", "StartNoneEvent.properties.taskurl must reference a request page id", p);
      }
      if (type === "MultiAssignmentTask") {
        if (!approvalPageIds.has(taskurl)) addIssue(errors, "APPROVAL_TASKURL_BAD_PAGE", "MultiAssignmentTask.properties.taskurl must reference an approval page id", p);
      }
    });
  }

  function validateWorkflowGraph() {
    const nodeById = new Map();
    const seqById = new Map();
    const sourceBySeqId = new Map();
    childshapes.forEach((shape) => {
      const id = shapeId(shape);
      if (!id) return;
      if (isSequenceFlow(shape)) seqById.set(id, shape);
      else nodeById.set(id, shape);
    });

    childshapes.forEach((shape, index) => {
      if (!shape || isSequenceFlow(shape)) return;
      const p = `$.childshapes[${index}]`;
      const id = shapeId(shape);
      if (!shape.id || shape.id !== shape.resourceid) {
        addIssue(errors, "GRAPH_NODE_ID_MISSING_OR_MISMATCHED", "Workflow node must include id matching resourceid for designer layout", `${p}.id`, {
          id: shape.id,
          resourceid: shape.resourceid,
        });
      }
      if (!isObject(shape.position) || typeof shape.position.x !== "number" || typeof shape.position.y !== "number") {
        addIssue(errors, "GRAPH_NODE_POSITION_MISSING", "Workflow node must include top-level position {x, y} for designer layout", `${p}.position`, { nodeId: id });
      }
      for (const outgoing of asArray(shape.outgoing)) {
        const id = refId(outgoing);
        if (!seqById.has(id)) addIssue(errors, "OUTGOING_SEQUENCE_MISSING", `Outgoing SequenceFlow ${id} does not exist`, `$.childshapes[${index}].outgoing`);
        else sourceBySeqId.set(id, shapeId(shape));
        if (!outgoing || outgoing.id !== outgoing.resourceid) {
          addIssue(errors, "OUTGOING_SEQUENCE_REF_INCOMPLETE", "Outgoing SequenceFlow reference should include matching id and resourceid", `$.childshapes[${index}].outgoing`);
        }
      }
      for (const incoming of asArray(shape.incoming)) {
        const id = refId(incoming);
        if (!seqById.has(id)) addIssue(errors, "INCOMING_SEQUENCE_MISSING", `Incoming SequenceFlow ${id} does not exist`, `$.childshapes[${index}].incoming`);
        if (!incoming || incoming.id !== incoming.resourceid) {
          addIssue(errors, "INCOMING_SEQUENCE_REF_INCOMPLETE", "Incoming SequenceFlow reference should include matching id and resourceid", `$.childshapes[${index}].incoming`);
        }
      }
    });

    childshapes.forEach((shape, index) => {
      if (!isSequenceFlow(shape)) return;
      const p = `$.childshapes[${index}]`;
      const id = shapeId(shape);
      if (!shape.id || shape.id !== shape.resourceid) {
        addIssue(errors, "SEQUENCE_ID_MISSING_OR_MISMATCHED", "SequenceFlow must include id matching resourceid for designer layout", `${p}.id`, {
          id: shape.id,
          resourceid: shape.resourceid,
        });
      }
      const explicitSource = refId(shape.source);
      if (!explicitSource || !nodeById.has(explicitSource)) {
        addIssue(errors, "SEQUENCE_EXPLICIT_SOURCE_MISSING", `SequenceFlow ${id} source.resourceid must reference an existing non-SequenceFlow node`, `${p}.source`);
      }
      const target = refId(shape.target);
      if (!target || !nodeById.has(target)) {
        addIssue(errors, "SEQUENCE_TARGET_MISSING", `SequenceFlow ${id} target.resourceid must reference an existing non-SequenceFlow node`, `${p}.target`);
      }
      const inferredSource = sourceBySeqId.get(id);
      if (!inferredSource) {
        addIssue(errors, "SEQUENCE_SOURCE_MISSING", `SequenceFlow ${id} should have an inferred source from a node outgoing reference`, p);
      } else if (explicitSource && inferredSource !== explicitSource) {
        addIssue(errors, "SEQUENCE_SOURCE_MISMATCH", `SequenceFlow ${id} explicit source does not match node outgoing reference`, `${p}.source`, {
          explicitSource,
          inferredSource,
        });
      }
      const targetNode = target && nodeById.get(target);
      const targetIncoming = asArray(targetNode && targetNode.incoming).map(refId);
      if (targetNode && !targetIncoming.includes(id)) {
        addIssue(errors, "SEQUENCE_TARGET_INCOMING_MISSING", `SequenceFlow ${id} target node must include the flow in incoming`, `${p}.target`, {
          target,
        });
      }
    });

    const starts = [...nodeById.values()].filter((shape) => shape.stencil && shape.stencil.id === "StartNoneEvent");
    if (starts.length === 0) {
      addIssue(errors, "START_MISSING", "StartNoneEvent must exist", "$.childshapes");
      return;
    }
    const reachable = new Set();
    const queue = starts.map(shapeId);
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || reachable.has(current)) continue;
      reachable.add(current);
      const node = nodeById.get(current);
      for (const outgoing of asArray(node && node.outgoing)) {
        const seq = seqById.get(refId(outgoing));
        const target = seq && refId(seq.target);
        if (target && !reachable.has(target)) queue.push(target);
      }
    }
    const endReachable = [...reachable].some((id) => nodeById.get(id) && nodeById.get(id).stencil.id === "EndNoneEvent");
    if (!endReachable) addIssue(errors, "END_NOT_REACHABLE", "EndNoneEvent must be reachable from StartNoneEvent", "$.childshapes");
    const hasApproval = [...nodeById.values()].some((shape) => shape.stencil.id === "MultiAssignmentTask");
    const rejectReachable = [...reachable].some((id) => nodeById.get(id) && nodeById.get(id).stencil.id === "EndRejectEvent");
    if (hasApproval && !rejectReachable) {
      addIssue(errors, "REJECT_END_NOT_REACHABLE", "EndRejectEvent should be reachable from StartNoneEvent when approval tasks exist", "$.childshapes");
    }
  }

  function validateApprovalTasks() {
    const seqById = new Map(childshapes.filter(isSequenceFlow).map((shape) => [shapeId(shape), shape]));
    childshapes.forEach((shape, index) => {
      if (!shape || !shape.stencil || shape.stencil.id !== "MultiAssignmentTask") return;
      const p = `$.childshapes[${index}]`;
      const props = shape.properties || {};
      if (!props.approveway) addIssue(errors, "APPROVAL_MISSING_APPROVEWAY", "Approval task must have approveway", `${p}.properties.approveway`);
      if (props.approvepercentage === undefined) addIssue(errors, "APPROVAL_MISSING_PERCENTAGE", "Approval task must have approvepercentage", `${p}.properties.approvepercentage`);
      if (!Array.isArray(props.usertaskassignment)) addIssue(errors, "APPROVAL_ASSIGNMENT_NOT_ARRAY", "usertaskassignment must be an array", `${p}.properties.usertaskassignment`);
      if (!props.taskurl) addIssue(errors, "APPROVAL_MISSING_TASKURL", "Approval task must have taskurl", `${p}.properties.taskurl`);

      let approved = false;
      let rejected = false;
      for (const outgoing of asArray(shape.outgoing)) {
        const seq = seqById.get(refId(outgoing));
        const text = JSON.stringify((seq && seq.properties && seq.properties.conditioninfo) || []);
        if (text.includes("Task outcome:Approved") || text.includes("已同意") || text.includes("Approved")) approved = true;
        if (text.includes("Task outcome:Rejected") || text.includes("Rejected")) rejected = true;
      }
      if (!approved) addIssue(errors, "APPROVAL_APPROVED_PATH_MISSING", "Approval task must have at least one Approved outgoing condition", `${p}.outgoing`);
      if (!rejected && props.allowNoRejectedPath !== true) {
        addIssue(errors, "APPROVAL_REJECTED_PATH_MISSING", "Approval task must have at least one Rejected outgoing condition unless explicitly marked otherwise", `${p}.outgoing`);
      }
    });
  }

  function validateSequenceFlowConditions() {
    childshapes.forEach((shape, index) => {
      if (!isSequenceFlow(shape)) return;
      const conditions = asArray(shape.properties && shape.properties.conditioninfo);
      conditions.forEach((condition, conditionIndex) => {
        const p = `$.childshapes[${index}].properties.conditioninfo[${conditionIndex}]`;
        const text = JSON.stringify(condition);
        const isApprovalOutcome = text.includes("&quot;type&quot;:&quot;task&quot;") || text.includes(":Outcome") || text.includes(":结果");
        if (isApprovalOutcome) {
          if (condition.op !== "s.=") addIssue(errors, "APPROVAL_CONDITION_BAD_OP", "Approval outcome condition should use op: s.=", `${p}.op`);
          if (!text.includes("Outcome") && !text.includes("结果")) addIssue(errors, "APPROVAL_CONDITION_MISSING_OUTCOME", "Approval outcome condition should include task Outcome reference", p);
          if (!text.includes("Task outcome:Approved") && !text.includes("Task outcome:Rejected") && !text.includes("任务结果:已同意")) {
            addIssue(errors, "APPROVAL_CONDITION_MISSING_RESULT", "Approval outcome condition should include Task outcome:Approved or Task outcome:Rejected", p);
          }
        }
        const isNumeric = condition.group === "number" || (typeof condition.op === "string" && condition.op.startsWith("n."));
        if (isNumeric) {
          if (condition.group !== "number") addIssue(warnings, "NUMERIC_CONDITION_MISSING_GROUP", "Numeric threshold condition should include group: number", `${p}.group`);
          if (!NUMERIC_OPS.has(condition.op)) addIssue(errors, "NUMERIC_CONDITION_BAD_OP", "Numeric threshold condition has unsupported operator", `${p}.op`);
          const leftValue = condition.left && (condition.left.value || condition.left);
          const rightValue = condition.right && (condition.right.value !== undefined ? condition.right.value : condition.right);
          if (!leftValue || leftValue.valueType !== "number" || !variableById.has(leftValue.id)) {
            addIssue(errors, "NUMERIC_CONDITION_BAD_LEFT", "Numeric threshold left value must reference an existing number variable", `${p}.left`);
          }
          if (typeof rightValue !== "number" && !(typeof rightValue === "string" && rightValue.trim() !== "" && !Number.isNaN(Number(rightValue)))) {
            addIssue(errors, "NUMERIC_CONDITION_BAD_RIGHT", "Numeric threshold right value must be numeric", `${p}.right`);
          }
        }
      });
    });
  }

  function validateContentLists() {
    childshapes.forEach((shape, index) => {
      if (!shape || !shape.stencil || shape.stencil.id !== "ContentList") return;
      const p = `$.childshapes[${index}]`;
      const props = shape.properties || {};
      for (const key of ["type", "appid", "listsetid", "listid", "listtype"]) {
        if (props[key] === undefined || props[key] === null || props[key] === "") {
          addIssue(errors, "CONTENTLIST_MISSING_TARGET", `ContentList must have properties.${key}`, `${p}.properties.${key}`);
        }
      }
      if (["add", "edit"].includes(props.type) && !Array.isArray(props.listdatas)) {
        addIssue(errors, "CONTENTLIST_MISSING_LISTDATAS", "ContentList add/edit operations must have listdatas", `${p}.properties.listdatas`);
      }
      if (["edit", "remove"].includes(props.type) && !Array.isArray(props.wheres)) {
        addIssue(errors, "CONTENTLIST_MISSING_WHERES", "ContentList edit/remove operations must have wheres", `${p}.properties.wheres`);
      }
      asArray(props.listdatas).forEach((entry, entryIndex) => {
        validateDataExpression(entry && entry.Data, `${p}.properties.listdatas[${entryIndex}].Data`);
      });
      asArray(props.wheres).forEach((where, whereIndex) => {
        validateDataExpression(where && where.right, `${p}.properties.wheres[${whereIndex}].right`);
      });
    });
  }

  function validateDataExpression(value, valuePath) {
    if (value === null || value === undefined) return;
    if (typeof value === "number" || typeof value === "boolean") return;
    if (Array.isArray(value)) {
      deepWalk(value, (node, pointer) => {
        if (!isObject(node) || node.exprType !== "variable") return;
        if (!variableById.has(node.id)) {
          addIssue(errors, "EXPRESSION_ARRAY_UNKNOWN_VARIABLE", `Expression array references unknown variable ${node.id}`, `${valuePath}${pointer.slice(1)}`);
        }
      });
      return;
    }
    if (typeof value !== "string") {
      addIssue(errors, "CONTENTLIST_DATA_BAD_TYPE", "ContentList Data must be literal, expression-button string, or expression array", valuePath);
      return;
    }
    if (!value.startsWith("<input")) return;
    if (!value.includes("expr=\"__\"")) {
      addIssue(warnings, "EXPRESSION_BUTTON_MISSING_EXPR", "Expression-button string usually includes expr=\"__\"", valuePath);
    }
    const typeMatch = value.match(/&quot;type&quot;:&quot;([^&]+)&quot;/);
    const type = typeMatch && typeMatch[1];
    if (type !== "variable") return;
    const idMatch = value.match(/&quot;id&quot;:&quot;([^&]+)&quot;/);
    const varId = idMatch && idMatch[1];
    if (!varId) {
      addIssue(errors, "EXPRESSION_BUTTON_MISSING_VARIABLE_ID", "Variable expression-button string must include a variable id", valuePath);
      return;
    }
    if (!variableById.has(varId)) {
      addIssue(errors, "EXPRESSION_BUTTON_UNKNOWN_VARIABLE", `Expression-button references unknown variable ${varId}`, valuePath);
      return;
    }
    if (value.includes("&quot;t&quot;:&quot;list&quot;")) {
      const propMatch = value.match(/&quot;prop&quot;:&quot;([^&]+)&quot;/);
      const prop = propMatch && propMatch[1];
      if (!rowFieldsByListVar.has(varId)) {
        addIssue(errors, "EXPRESSION_BUTTON_LIST_VAR_NOT_LIST", `Expression-button treats ${varId} as list, but variable is not a valid list variable`, valuePath);
      } else if (!prop || !rowFieldsByListVar.get(varId).has(prop)) {
        addIssue(errors, "EXPRESSION_BUTTON_UNKNOWN_ROW_FIELD", `Expression-button references unknown row field ${varId}.${prop}`, valuePath);
      }
    }
  }

  function validateSetVariableTasks() {
    childshapes.forEach((shape, index) => {
      if (!shape || !shape.stencil || shape.stencil.id !== "SetVariableTask") return;
      const settings = asArray(shape.properties && shape.properties.variablesetting);
      settings.forEach((setting, settingIndex) => {
        const p = `$.childshapes[${index}].properties.variablesetting[${settingIndex}]`;
        if (!setting.id || !variableById.has(setting.id)) {
          addIssue(errors, "SETVARIABLE_UNKNOWN_VARIABLE", `SetVariableTask references unknown variable ${setting && setting.id}`, `${p}.id`);
        }
        if (typeof setting.value === "string" && setting.value.includes("&quot;prop&quot;:&quot;FlowNo&quot;")) {
          return;
        }
        validateDataExpression(setting.value, `${p}.value`);
      });
    });
  }

  function validatePlaceholderPolicy() {
    if (mode === "final" && placeholders.length > 0) {
      placeholders.forEach((entry) => {
        addIssue(errors, "UNRESOLVED_PLACEHOLDER_FINAL", `Final mode cannot contain unresolved placeholder ${entry.placeholder}`, entry.paths[0]);
      });
    }
    if (dependencyMap) {
      const dependencyPlaceholders = new Set();
      deepWalk(dependencyMap, (node) => {
        if (typeof node === "string" && PLACEHOLDER_RE.test(node)) dependencyPlaceholders.add(node);
      });
      placeholders.forEach((entry) => {
        if (!dependencyPlaceholders.has(entry.placeholder)) {
          addIssue(warnings, "PLACEHOLDER_NOT_IN_DEPENDENCY_MAP", `Placeholder ${entry.placeholder} is not present in dependency mapping`, entry.paths[0]);
        }
      });
    }
  }
}

function main() {
  const args = parseArgs(process.argv);
  let def;
  let dependencyMap = null;
  try {
    def = readJson(args.input);
  } catch (error) {
    const report = {
      status: "fail",
      mode: args.mode,
      errors: [{ code: "INVALID_JSON", message: `Failed to read or parse JSON: ${error.message}`, path: args.input }],
      warnings: [],
      placeholders: [],
      summary: {},
    };
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  if (args.dependencyMap) {
    try {
      dependencyMap = readJson(args.dependencyMap);
    } catch (error) {
      const report = {
        status: "fail",
        mode: args.mode,
        errors: [{ code: "INVALID_DEPENDENCY_MAP", message: `Failed to read dependency map: ${error.message}`, path: args.dependencyMap }],
        warnings: [],
        placeholders: [],
        summary: {},
      };
      console.log(JSON.stringify(report, null, 2));
      process.exit(1);
    }
  }

  const report = validateDecodedDef(def, { mode: args.mode, dependencyMap });
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "fail" ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = { validateDecodedDef };
