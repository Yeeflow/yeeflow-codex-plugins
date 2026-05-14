const fs = require("fs");
const path = require("path");
const { validateExpressionTokens } = require("./yeeflow-expression-utils");

const DEFAULT_REFERENCE_PATH = path.join(__dirname, "workflow-action-configurations.normalized.json");
const SECRET_KEY_RE = /(token|secret|password|credential|clientsecret|api[_-]?key|accesskey|authorization|bearer|pwd)/i;
const UNSAFE_ACTION_RE = /^(AI|AzureOpenAI|Connector|HttpRequest|AcrobatSign|DocuSign|PandaDoc)$/i;

let cachedReference = null;

function loadWorkflowActionReference(referencePath = DEFAULT_REFERENCE_PATH) {
  if (cachedReference && cachedReference.__path === referencePath) return cachedReference;
  const parsed = JSON.parse(fs.readFileSync(referencePath, "utf8"));
  Object.defineProperty(parsed, "__path", { value: referencePath, enumerable: false });
  cachedReference = parsed;
  return parsed;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function shapeType(shape) {
  return shape && shape.stencil && (shape.stencil.id || shape.stencil) || shape && shape.type || "unknown";
}

function shapeId(shape) {
  return safeString(shape && (shape.resourceid || shape.resourceId || shape.id));
}

function getByPath(root, dottedPath) {
  const parts = safeString(dottedPath).split(".").filter(Boolean);
  let current = root;
  for (const part of parts) {
    if (!isObject(current) && !Array.isArray(current)) return { exists: false, value: undefined };
    if (!Object.prototype.hasOwnProperty.call(current, part)) return { exists: false, value: undefined };
    current = current[part];
  }
  return { exists: true, value: current };
}

function valueMissing(value) {
  return value === undefined || value === null || value === "";
}

function valueMatchesType(value, valueType) {
  if (valueMissing(value)) return true;
  if (valueType === "enum") return true;
  if (valueType === "array") return Array.isArray(value);
  if (valueType === "object") return isObject(value);
  if (valueType === "boolean") return typeof value === "boolean";
  if (valueType === "number") return typeof value === "number" || (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value)));
  if (valueType === "string") return typeof value === "string";
  return true;
}

function issue(issues, level, code, message, detail) {
  issues.push({ level, code, message, ...redact(detail || {}) });
}

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!isObject(value)) return value;
  const out = {};
  for (const [key, child] of Object.entries(value)) {
    out[key] = SECRET_KEY_RE.test(key) ? "__REDACTED__" : redact(child);
  }
  return out;
}

function strictLevel(options, compatibilityLevel = "warning") {
  if (options.mode === "generator" && options.stage === "final") return "error";
  if (options.mode === "final") return "error";
  return compatibilityLevel;
}

function validateWorkflowActionShapes(shapes, options = {}) {
  const reference = options.reference || loadWorkflowActionReference(options.referencePath);
  const issues = [];
  const summary = {
    checkedNodes: 0,
    supportedNodes: 0,
    unsupportedNodes: 0,
    partialNodes: 0,
    unsafeNodes: 0,
  };

  asArray(shapes).forEach((shape, index) => {
    if (!shape) return;
    const type = shapeType(shape);
    const action = reference.actions && reference.actions[type];
    const pointer = options.pointerForIndex ? options.pointerForIndex(index, shape) : `$.childshapes[${index}]`;
    summary.checkedNodes += 1;
    if (!action) {
      summary.unsupportedNodes += 1;
      issue(issues, strictLevel(options, "warning"), "WORKFLOW_ACTION_UNSUPPORTED", "Workflow node type is not present in the normalized action configuration reference.", {
        path: pointer,
        nodeType: type,
        nodeId: shapeId(shape),
      });
      return;
    }
    summary.supportedNodes += 1;
    if (action.risk !== "standard") summary.partialNodes += 1;
    if (action.risk === "external_or_credential_sensitive" || UNSAFE_ACTION_RE.test(type)) summary.unsafeNodes += 1;
    validateConfiguredProperties(issues, action, shape, type, pointer, options);
    validateKnownConditionalShapes(issues, action, shape, type, pointer, options);
  });

  return { issues, summary };
}

function validateConfiguredProperties(issues, action, shape, type, pointer, options) {
  const severity = strictLevel(options, "warning");
  for (const prop of action.properties || []) {
    const found = getByPath(shape, prop.path);
    const propPath = `${pointer}.${prop.path}`;
    if (prop.required && valueMissing(found.value)) {
      issue(issues, severity, "WORKFLOW_ACTION_REQUIRED_PROPERTY_MISSING", "Workflow node is missing a required property from the action configuration reference.", {
        path: propPath,
        nodeType: type,
        nodeId: shapeId(shape),
        property: prop.path,
      });
      continue;
    }
    if (!found.exists || valueMissing(found.value)) continue;
    if (!valueMatchesType(found.value, prop.valueType)) {
      issue(issues, severity, "WORKFLOW_ACTION_PROPERTY_TYPE_INVALID", "Workflow node property has an invalid value type for the action configuration reference.", {
        path: propPath,
        nodeType: type,
        nodeId: shapeId(shape),
        property: prop.path,
        expectedType: prop.valueType,
        actualType: Array.isArray(found.value) ? "array" : typeof found.value,
      });
    }
    if (prop.valueType === "enum" && prop.enumValues && prop.enumValues.length) {
      const allowed = new Set(prop.enumValues.map((entry) => safeString(entry.value)));
      if (!allowed.has(safeString(found.value))) {
        issue(issues, severity, "WORKFLOW_ACTION_ENUM_INVALID", "Workflow node property uses a value outside the action configuration enum.", {
          path: propPath,
          nodeType: type,
          nodeId: shapeId(shape),
          property: prop.path,
          value: safeString(found.value),
          allowed: [...allowed],
        });
      }
    }
  }
}

function validateKnownConditionalShapes(issues, action, shape, type, pointer, options) {
  if (UNSAFE_ACTION_RE.test(type) || action.risk === "external_or_credential_sensitive") {
    validateUnsafeAction(issues, shape, type, pointer, options);
  }
  if (type === "ContentList") validateContentList(issues, shape, pointer, options);
  if (type === "QueryData") validateQueryData(issues, shape, pointer, options);
  if (type === "SequenceFlow") validateSequenceFlow(issues, shape, pointer, options);
  if (type === "Delay") validateDelay(issues, shape, pointer, options);
  if (type === "Loop") validateLoop(issues, shape, pointer, options);
}

function validateUnsafeAction(issues, shape, type, pointer, options) {
  const level = strictLevel(options, "dependency");
  issue(issues, level, "WORKFLOW_ACTION_EXTERNAL_OR_CREDENTIAL_DEPENDENCY", "Workflow action depends on external services, connections, AI, HTTP, signing, or credentials and must not bundle sensitive values.", {
    path: pointer,
    nodeType: type,
    nodeId: shapeId(shape),
  });
  walk(shape.properties || {}, (value, childPath, key) => {
    if (!SECRET_KEY_RE.test(key || "") || valueMissing(value)) return;
    issue(issues, "error", "WORKFLOW_ACTION_SENSITIVE_VALUE_PRESENT", "Credential-like workflow action property is populated; generated packages must use safe placeholders or omit sensitive values.", {
      path: `${pointer}.properties${childPath}`,
      nodeType: type,
      nodeId: shapeId(shape),
      property: key,
    });
  });
}

function validateContentList(issues, shape, pointer, options) {
  const props = shape.properties || {};
  const severity = strictLevel(options, "warning");
  const type = safeString(props.type);
  if (safeString(props.listtype) === "select") {
    for (const key of ["appid", "listsetid", "listid"]) {
      if (valueMissing(props[key])) issue(issues, severity, "CONTENTLIST_SELECTED_TARGET_PROPERTY_MISSING", "ContentList selected-list operation is missing target metadata.", {
        path: `${pointer}.properties.${key}`,
        nodeType: "ContentList",
        nodeId: shapeId(shape),
      });
    }
  }
  if (["add", "edit"].includes(type)) {
    if (!Array.isArray(props.listdatas)) {
      issue(issues, severity, "CONTENTLIST_LISTDATAS_INVALID", "ContentList add/edit operation requires properties.listdatas array.", {
        path: `${pointer}.properties.listdatas`,
        nodeId: shapeId(shape),
      });
    } else {
      props.listdatas.forEach((entry, index) => {
        const target = entry && (entry.Columns || entry.Column || entry.FieldName || entry.fieldName);
        if (!target) issue(issues, severity, "CONTENTLIST_MAPPING_TARGET_MISSING", "ContentList mapping is missing a target column/field.", {
          path: `${pointer}.properties.listdatas[${index}]`,
          nodeId: shapeId(shape),
        });
        if (!entry || !Object.prototype.hasOwnProperty.call(entry, "Data")) issue(issues, severity, "CONTENTLIST_MAPPING_VALUE_MISSING", "ContentList mapping is missing Data value/expression.", {
          path: `${pointer}.properties.listdatas[${index}].Data`,
          nodeId: shapeId(shape),
        });
      });
    }
  }
  if (["edit", "remove"].includes(type) && !Array.isArray(props.wheres)) {
    issue(issues, severity, "CONTENTLIST_WHERES_INVALID", "ContentList edit/remove operation requires properties.wheres array.", {
      path: `${pointer}.properties.wheres`,
      nodeId: shapeId(shape),
    });
  }
  validateConditionArray(issues, props.wheres, `${pointer}.properties.wheres`, "CONTENTLIST_WHERE_CONDITION_INVALID", severity);
}

function validateQueryData(issues, shape, pointer, options) {
  const props = shape.properties || {};
  const severity = strictLevel(options, "warning");
  if (!valueMissing(props.filters) && !Array.isArray(props.filters)) {
    issue(issues, severity, "QUERYDATA_FILTERS_NOT_ARRAY", "QueryData properties.filters must be an array when present.", {
      path: `${pointer}.properties.filters`,
      nodeId: shapeId(shape),
    });
  }
  validateConditionArray(issues, props.filters, `${pointer}.properties.filters`, "QUERYDATA_FILTER_CONDITION_INVALID", severity);
  if (props.datasource !== undefined) {
    if (!Array.isArray(props.datasource)) {
      issue(issues, severity, "QUERYDATA_DATASOURCE_NOT_ARRAY", "QueryData properties.datasource must be an array when present.", {
        path: `${pointer}.properties.datasource`,
        nodeId: shapeId(shape),
      });
    } else {
      props.datasource.forEach((sort, index) => {
        if (!isObject(sort) || valueMissing(sort.SortName || sort.sortName) || valueMissing(sort.SortByDesc !== undefined ? sort.SortByDesc : sort.sortByDesc)) {
          issue(issues, severity, "QUERYDATA_SORT_SHAPE_INVALID", "QueryData datasource sort entry should include SortName and SortByDesc.", {
            path: `${pointer}.properties.datasource[${index}]`,
            nodeId: shapeId(shape),
          });
        }
      });
    }
  }
  const resultType = props.result && props.result.type;
  if (safeString(resultType) === "multiple") {
    if (!props.result.listName) issue(issues, severity, "QUERYDATA_MULTIPLE_RESULT_TARGET_MISSING", "QueryData multiple result requires result.listName.", {
      path: `${pointer}.properties.result.listName`,
      nodeId: shapeId(shape),
    });
    if (props.result.fields !== undefined && !Array.isArray(props.result.fields)) {
      issue(issues, severity, "QUERYDATA_RESULT_FIELDS_INVALID", "QueryData result.fields must be an array when present.", {
        path: `${pointer}.properties.result.fields`,
        nodeId: shapeId(shape),
      });
    }
  }
}

function validateSequenceFlow(issues, shape, pointer, options) {
  const severity = strictLevel(options, "warning");
  const conditions = shape.properties && shape.properties.conditioninfo;
  if (conditions === undefined || conditions === null) return;
  if (!Array.isArray(conditions)) {
    issue(issues, severity, "SEQUENCEFLOW_CONDITIONINFO_NOT_ARRAY", "SequenceFlow properties.conditioninfo must be an array when present.", {
      path: `${pointer}.properties.conditioninfo`,
      nodeId: shapeId(shape),
    });
    return;
  }
  validateConditionArray(issues, conditions, `${pointer}.properties.conditioninfo`, "SEQUENCEFLOW_CONDITION_INVALID", severity);
}

function validateDelay(issues, shape, pointer, options) {
  const props = shape.properties || {};
  const severity = strictLevel(options, "warning");
  const type = safeString(props.type);
  if (type === "duration") {
    if (valueMissing(props.duration && props.duration.count)) issue(issues, severity, "DELAY_DURATION_COUNT_MISSING", "Delay duration mode requires duration.count.", { path: `${pointer}.properties.duration.count`, nodeId: shapeId(shape) });
    if (valueMissing(props.duration && props.duration.unit)) issue(issues, severity, "DELAY_DURATION_UNIT_MISSING", "Delay duration mode requires duration.unit.", { path: `${pointer}.properties.duration.unit`, nodeId: shapeId(shape) });
  } else if (type === "until") {
    const subType = safeString(props.until && props.until.subType);
    if (!subType) issue(issues, severity, "DELAY_UNTIL_SUBTYPE_MISSING", "Delay until mode requires until.subType.", { path: `${pointer}.properties.until.subType`, nodeId: shapeId(shape) });
    if (subType === "specific" && valueMissing(props.until && props.until.specific && props.until.specific.date)) issue(issues, severity, "DELAY_UNTIL_SPECIFIC_DATE_MISSING", "Delay specific-until mode requires until.specific.date.", { path: `${pointer}.properties.until.specific.date`, nodeId: shapeId(shape) });
    if (subType === "dynamic" && valueMissing(props.until && props.until.dynamic && props.until.dynamic.time)) issue(issues, severity, "DELAY_UNTIL_DYNAMIC_TIME_MISSING", "Delay dynamic-until mode requires until.dynamic.time.", { path: `${pointer}.properties.until.dynamic.time`, nodeId: shapeId(shape) });
  } else if (type === "condition") {
    validateConditionArray(issues, props.condition && props.condition.conditions, `${pointer}.properties.condition.conditions`, "DELAY_CONDITION_SHAPE_INVALID", severity, true);
  }
}

function validateLoop(issues, shape, pointer, options) {
  const props = shape.properties || {};
  const severity = strictLevel(options, "warning");
  if (!valueMissing(props.loopType) && !["list", "values", "number"].includes(safeString(props.loopType))) {
    issue(issues, severity, "LOOP_TYPE_INVALID", "Loop loopType must be list, values, or number.", { path: `${pointer}.properties.loopType`, nodeId: shapeId(shape), value: props.loopType });
  }
  if (!valueMissing(props.loopType)) {
    const loopValue = props.loopValue || {};
    for (const key of ["prefix", "type", "value"]) {
      if (valueMissing(loopValue[key])) issue(issues, severity, "LOOP_VALUE_PROPERTY_MISSING", "Loop requires loopValue prefix/type/value when loopType is configured.", {
        path: `${pointer}.properties.loopValue.${key}`,
        nodeId: shapeId(shape),
      });
    }
  }
  validateConditionStringOrArray(issues, props.continueCondition, `${pointer}.properties.continueCondition`, "LOOP_CONTINUE_CONDITION_INVALID", severity);
  validateConditionStringOrArray(issues, props.breakCondition, `${pointer}.properties.breakCondition`, "LOOP_BREAK_CONDITION_INVALID", severity);
}

function validateConditionStringOrArray(issues, value, pointer, code, severity) {
  if (valueMissing(value)) return;
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      issue(issues, severity, code, "Condition field should be a condition array or JSON-encoded condition array.", { path: pointer });
      return;
    }
  }
  validateConditionArray(issues, parsed, pointer, code, severity, false);
}

function validateConditionArray(issues, value, pointer, code, severity, requirePresent = false) {
  if (valueMissing(value)) {
    if (requirePresent) issue(issues, severity, code, "Condition array is required for the selected action mode.", { path: pointer });
    return;
  }
  if (!Array.isArray(value)) {
    issue(issues, severity, code, "Condition configuration must be an array.", { path: pointer });
    return;
  }
  if (looksLikeExpressionTokenArray(value)) {
    const expressionReport = validateExpressionTokens(value, { path: pointer });
    expressionReport.issues.forEach((entry) => {
      issue(issues, entry.level === "error" ? severity : "warning", entry.code, entry.message, {
        path: entry.path,
        detail: entry.detail || null,
      });
    });
    return;
  }
  value.forEach((condition, index) => {
    if (!isObject(condition)) {
      issue(issues, severity, code, "Condition entry must be an object.", { path: `${pointer}[${index}]` });
      return;
    }
    const text = JSON.stringify(condition);
    const isTaskOutcome = /Outcome|Task outcome|任务结果|已同意|Rejected|Approved/.test(text);
    if (isTaskOutcome) return;
    const hasOp = !valueMissing(condition.op || condition.operator);
    const hasLeft = !valueMissing(condition.left || condition.field || condition.FieldName || condition.fieldName);
    const hasRight = Object.prototype.hasOwnProperty.call(condition, "right") || Object.prototype.hasOwnProperty.call(condition, "value") || Object.prototype.hasOwnProperty.call(condition, "Value");
    if (!hasOp || !hasLeft || !hasRight) {
      issue(issues, severity, code, "Condition entry should include operator plus left/right operands.", {
        path: `${pointer}[${index}]`,
        hasOp,
        hasLeft,
        hasRight,
      });
    }
  });
}

function looksLikeExpressionTokenArray(value) {
  return Array.isArray(value) && value.some((entry) => isObject(entry) && (
    entry.type === "op" ||
    entry.type === "func" ||
    entry.type === "str" ||
    entry.type === "num" ||
    entry.type === "bool" ||
    entry.exprType === "variable" ||
    entry.exprType === "variable_ctx"
  ));
}

function walk(value, visitor, pointer = "", key = "") {
  visitor(value, pointer, key);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visitor, `${pointer}[${index}]`, String(index)));
  else if (isObject(value)) Object.entries(value).forEach(([childKey, child]) => walk(child, visitor, `${pointer}.${childKey}`, childKey));
}

module.exports = {
  loadWorkflowActionReference,
  validateWorkflowActionShapes,
};
