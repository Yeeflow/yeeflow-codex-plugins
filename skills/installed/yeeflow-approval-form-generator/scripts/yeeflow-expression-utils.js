#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const DEFAULT_FUNCTIONS_PATH = path.join(__dirname, "yeeflow-expression-functions.normalized.json");
const DEFAULT_OPERATORS_PATH = path.join(__dirname, "yeeflow-expression-operators.normalized.json");
const VARIABLE_VALUE_TYPES = new Set(["number", "text", "date", "boolean", "string", "user"]);

let cachedReferences = null;

function loadExpressionReferences(options = {}) {
  const functionsPath = options.functionsPath || DEFAULT_FUNCTIONS_PATH;
  const operatorsPath = options.operatorsPath || DEFAULT_OPERATORS_PATH;
  if (cachedReferences && cachedReferences.functionsPath === functionsPath && cachedReferences.operatorsPath === operatorsPath) {
    return cachedReferences;
  }
  const functionsReference = JSON.parse(fs.readFileSync(functionsPath, "utf8"));
  const operatorsReference = JSON.parse(fs.readFileSync(operatorsPath, "utf8"));
  const functions = functionsReference.functions || {};
  const operators = new Set(operatorsReference.allowedOperators || []);
  cachedReferences = { functionsPath, operatorsPath, functionsReference, operatorsReference, functions, operators };
  return cachedReferences;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function issue(issues, level, code, message, path, detail) {
  issues.push({ level, code, message, path: path || "$", detail });
}

function normalizeExpression(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed || trimmed[0] !== "[") return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function validateExpressionTokens(expr, options = {}) {
  const references = options.references || loadExpressionReferences(options);
  const expression = normalizeExpression(expr);
  const issues = [];
  const pathPrefix = options.path || "$";

  if (!Array.isArray(expression)) {
    issue(issues, "error", "EXPRESSION_NOT_ARRAY", "Yeeflow expression must be an array of tokens.", pathPrefix);
    return { valid: false, issues, variables: [], inferredValueType: "unknown" };
  }

  expression.forEach((token, index) => {
    validateExpressionToken(token, { references, issues, path: `${pathPrefix}[${index}]` });
  });

  const variables = collectExpressionVariables(expression);
  return {
    valid: !issues.some((entry) => entry.level === "error"),
    issues,
    variables,
    inferredValueType: inferExpressionValueType(expression, { references }),
  };
}

function validateExpressionToken(token, context = {}) {
  const references = context.references || loadExpressionReferences();
  const issues = context.issues || [];
  const tokenPath = context.path || "$";

  if (Array.isArray(token)) {
    token.forEach((child, index) => validateExpressionToken(child, { references, issues, path: `${tokenPath}[${index}]` }));
    return issues;
  }
  if (!isObject(token)) {
    issue(issues, "warning", "EXPRESSION_TOKEN_LITERAL_PARAM", "Expression token is a primitive value. Export-backed function params sometimes use this, but top-level tokens should be objects.", tokenPath, { valueType: typeof token });
    return issues;
  }

  if (token.exprType === "variable") return validateVariableToken(token, { issues, path: tokenPath });
  if (token.exprType === "application") return validateApplicationVariableToken(token, { issues, path: tokenPath });
  if (token.exprType === "variable_ctx") return validateContextVariableToken(token, { issues, path: tokenPath });
  if (Object.prototype.hasOwnProperty.call(token, "key") && Object.prototype.hasOwnProperty.call(token, "label") && Object.keys(token).every((key) => ["key", "label"].includes(key))) return issues;
  if (token.type === "func") return validateFunctionToken(token, { references, issues, path: tokenPath });
  if (token.type === "op") return validateOperatorToken(token, { references, issues, path: tokenPath });

  if (token.type === "str") {
    if (!Object.prototype.hasOwnProperty.call(token, "value")) issue(issues, "error", "EXPRESSION_STR_MISSING_VALUE", "String literal token must include value.", `${tokenPath}.value`);
    return issues;
  }
  if (token.type === "num") {
    if (!Object.prototype.hasOwnProperty.call(token, "value")) issue(issues, "error", "EXPRESSION_NUM_MISSING_VALUE", "Number literal token must include value.", `${tokenPath}.value`);
    else if (String(token.value).trim() === "" || Number.isNaN(Number(token.value))) issue(issues, "error", "EXPRESSION_NUM_BAD_VALUE", "Number literal value must be numeric.", `${tokenPath}.value`, { value: token.value });
    return issues;
  }
  if (token.type === "bool") {
    if (typeof token.value !== "boolean") issue(issues, "error", "EXPRESSION_BOOL_BAD_VALUE", "Boolean literal value must be true or false.", `${tokenPath}.value`, { value: token.value });
    return issues;
  }

  issue(issues, "warning", "EXPRESSION_TOKEN_UNKNOWN_SHAPE", "Expression token shape is not in the normalized expression reference.", tokenPath, { tokenType: token.type, exprType: token.exprType });
  return issues;
}

function validateVariableToken(token, context = {}) {
  const issues = context.issues || [];
  const tokenPath = context.path || "$";
  const required = ["exprType", "valueType", "id", "type", "name"];
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(token, key) || token[key] === "") issue(issues, "error", "EXPRESSION_VARIABLE_MISSING_PROPERTY", "Variable token is missing a required property.", `${tokenPath}.${key}`, { property: key });
  }
  if (token.exprType !== "variable") issue(issues, "error", "EXPRESSION_VARIABLE_BAD_EXPRTYPE", "Variable token exprType must be variable.", `${tokenPath}.exprType`);
  if (token.type !== "expr") issue(issues, "error", "EXPRESSION_VARIABLE_BAD_TYPE", "Variable token type must be expr.", `${tokenPath}.type`);
  if (!VARIABLE_VALUE_TYPES.has(token.valueType)) issue(issues, "error", "EXPRESSION_VARIABLE_BAD_VALUETYPE", "Variable token valueType must be number, text, date, boolean, string, or user.", `${tokenPath}.valueType`, { valueType: token.valueType });
  const extra = Object.keys(token).filter((key) => !required.includes(key));
  if (extra.length) issue(issues, "warning", "EXPRESSION_VARIABLE_EXTRA_PROPERTIES", "Training reference says variable tokens should not include extra properties.", tokenPath, { properties: extra });
  return issues;
}

function validateContextVariableToken(token, context = {}) {
  const issues = context.issues || [];
  const tokenPath = context.path || "$";
  for (const key of ["exprType", "valueType", "id", "type", "name", "ctx"]) {
    if (!Object.prototype.hasOwnProperty.call(token, key) || token[key] === "") issue(issues, "error", "EXPRESSION_CONTEXT_VARIABLE_MISSING_PROPERTY", "Context variable token is missing a required property.", `${tokenPath}.${key}`, { property: key });
  }
  if (!VARIABLE_VALUE_TYPES.has(token.valueType)) issue(issues, "error", "EXPRESSION_CONTEXT_VARIABLE_BAD_VALUETYPE", "Context variable valueType must be number, text, date, boolean, string, or user.", `${tokenPath}.valueType`, { valueType: token.valueType });
  return issues;
}

function validateApplicationVariableToken(token, context = {}) {
  const issues = context.issues || [];
  const tokenPath = context.path || "$";
  for (const key of ["exprType", "valueType", "id", "type", "name"]) {
    if (!Object.prototype.hasOwnProperty.call(token, key) || token[key] === "") issue(issues, "error", "EXPRESSION_APPLICATION_VARIABLE_MISSING_PROPERTY", "Application/context token is missing a required property.", `${tokenPath}.${key}`, { property: key });
  }
  if (token.exprType !== "application") issue(issues, "error", "EXPRESSION_APPLICATION_VARIABLE_BAD_EXPRTYPE", "Application/context token exprType must be application.", `${tokenPath}.exprType`);
  if (token.type !== "expr") issue(issues, "error", "EXPRESSION_APPLICATION_VARIABLE_BAD_TYPE", "Application/context token type must be expr.", `${tokenPath}.type`);
  if (!VARIABLE_VALUE_TYPES.has(token.valueType)) issue(issues, "error", "EXPRESSION_APPLICATION_VARIABLE_BAD_VALUETYPE", "Application/context token valueType must be number, text, date, boolean, string, or user.", `${tokenPath}.valueType`, { valueType: token.valueType });
  return issues;
}

function validateFunctionToken(token, context = {}) {
  const references = context.references || loadExpressionReferences();
  const issues = context.issues || [];
  const tokenPath = context.path || "$";
  if (!token.func) {
    issue(issues, "error", "EXPRESSION_FUNCTION_MISSING_NAME", "Function token must include func.", `${tokenPath}.func`);
    return issues;
  }
  const meta = references.functions[token.func];
  if (!meta) {
    issue(issues, "error", "EXPRESSION_FUNCTION_UNKNOWN", "Function name is not present in the normalized expression reference.", `${tokenPath}.func`, { func: token.func });
  }
  if (!Array.isArray(token.params)) {
    issue(issues, "error", "EXPRESSION_FUNCTION_PARAMS_NOT_ARRAY", "Function params must be an array.", `${tokenPath}.params`, { func: token.func });
    return issues;
  }
  if (meta && (token.params.length < meta.minParams || token.params.length > meta.maxParams)) {
    issue(issues, "warning", "EXPRESSION_FUNCTION_PARAM_COUNT", "Function param count is outside the normalized reference range.", `${tokenPath}.params`, { func: token.func, count: token.params.length, min: meta.minParams, max: meta.maxParams });
  }
  token.params.forEach((param, index) => {
    if (Array.isArray(param)) {
      param.forEach((child, childIndex) => validateExpressionToken(child, { references, issues, path: `${tokenPath}.params[${index}][${childIndex}]` }));
    } else if (isObject(param)) {
      validateExpressionToken(param, { references, issues, path: `${tokenPath}.params[${index}]` });
    } else {
      issue(issues, "warning", "EXPRESSION_FUNCTION_PRIMITIVE_PARAM", "Function param is a primitive value. Keep only when export-backed for this function.", `${tokenPath}.params[${index}]`, { func: token.func, valueType: typeof param });
    }
  });
  return issues;
}

function validateOperatorToken(token, context = {}) {
  const references = context.references || loadExpressionReferences();
  const issues = context.issues || [];
  const tokenPath = context.path || "$";
  if (!references.operators.has(token.op)) {
    issue(issues, "error", "EXPRESSION_OPERATOR_UNKNOWN", "Operator is not present in the normalized expression reference.", `${tokenPath}.op`, { op: token.op });
  }
  return issues;
}

function inferExpressionValueType(expr, options = {}) {
  const references = options.references || loadExpressionReferences(options);
  const expression = normalizeExpression(expr);
  if (!Array.isArray(expression) || !expression.length) return "unknown";
  const hasConcat = expression.some((token) => isObject(token) && token.type === "op" && token.op === "&");
  if (hasConcat) return "text";
  const hasComparison = expression.some((token) => isObject(token) && token.type === "op" && [">", ">=", "<", "<=", "==", "!=", "and", "or"].includes(token.op));
  if (hasComparison) return "boolean";
  const last = [...expression].reverse().find((token) => isObject(token));
  if (!last) return "unknown";
  if (last.exprType === "variable" || last.exprType === "variable_ctx") return last.valueType || "unknown";
  if (last.type === "str") return "text";
  if (last.type === "num") return "number";
  if (last.type === "bool") return "boolean";
  if (last.type === "func" && references.functions[last.func]) return references.functions[last.func].returnValueType || "unknown";
  return "unknown";
}

function collectExpressionVariables(expr) {
  const expression = normalizeExpression(expr);
  const variables = [];
  function walk(value) {
    if (Array.isArray(value)) return value.forEach(walk);
    if (!isObject(value)) return;
  if (value.exprType === "variable" || value.exprType === "variable_ctx") {
      variables.push({
        id: value.id,
        name: value.name,
        valueType: value.valueType,
        exprType: value.exprType,
        ctx: value.ctx,
      });
    }
    if (value.exprType === "application") {
      variables.push({
        id: value.id,
        name: value.name,
        valueType: value.valueType,
        exprType: value.exprType,
        ctx: value.ctx,
      });
    }
    Object.values(value).forEach(walk);
  }
  walk(expression);
  return variables;
}

function buildVariableToken(variable) {
  if (!variable || !variable.id || !variable.name || !VARIABLE_VALUE_TYPES.has(variable.valueType)) {
    throw new Error("buildVariableToken requires id, name, and valueType number/text/date/boolean/string/user");
  }
  return {
    exprType: "variable",
    valueType: variable.valueType,
    id: variable.id,
    type: "expr",
    name: variable.name.includes(":") ? variable.name : `Workflow Variables:${variable.name}`,
  };
}

function buildFunctionToken(func, params = []) {
  const references = loadExpressionReferences();
  if (!references.functions[func]) throw new Error(`Unknown Yeeflow expression function: ${func}`);
  return { type: "func", func, params };
}

function buildComparison(left, op, right) {
  const references = loadExpressionReferences();
  if (!references.operators.has(op)) throw new Error(`Unknown Yeeflow expression operator: ${op}`);
  return [left, { type: "op", op }, right];
}

function buildCalculatedExpressionFromSpec(spec = {}) {
  if (spec.kind === "subtotal") {
    return [buildVariableToken(spec.quantity), { type: "op", op: "*" }, buildVariableToken(spec.unitPrice)];
  }
  throw new Error(`Unsupported calculated expression spec kind: ${spec.kind || "unknown"}`);
}

module.exports = {
  loadExpressionReferences,
  normalizeExpression,
  validateExpressionTokens,
  validateExpressionToken,
  validateVariableToken,
  validateApplicationVariableToken,
  validateFunctionToken,
  validateOperatorToken,
  inferExpressionValueType,
  collectExpressionVariables,
  buildVariableToken,
  buildFunctionToken,
  buildComparison,
  buildCalculatedExpressionFromSpec,
};
