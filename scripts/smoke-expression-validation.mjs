#!/usr/bin/env node

import assert from "node:assert/strict";
import expressionUtils from "../yeeflow-expression-utils.js";

const {
  buildComparison,
  buildFunctionToken,
  buildVariableToken,
  validateExpressionTokens,
} = expressionUtils;

function v(id, name, valueType) {
  return buildVariableToken({ id, name, valueType });
}

function ok(name, expr) {
  const report = validateExpressionTokens(expr, { path: name });
  assert.equal(report.valid, true, `${name}: ${JSON.stringify(report.issues, null, 2)}`);
}

const amount = v("Amount", "Amount", "number");
const quantity = v("Quantity", "Quantity", "number");
const unitPrice = v("UnitPrice", "Unit Price", "number");
const status = v("Status", "Status", "text");
const dueDate = v("DueDate", "Due Date", "date");
const active = v("Active", "Active", "boolean");
const lineItems = v("LineItems", "Line Items", "number");
const currentUser = { id: "CurrentUser", exprType: "application", valueType: "string", type: "expr", name: "Context:Current User" };

function attr(key, label = key) {
  return { key, label };
}

function getUserAttr(userExpr, key, label = key, fallback = "N/A") {
  return buildFunctionToken("getUserAttr", [[userExpr], attr(key, label), fallback ? [{ type: "str", value: fallback }] : []]);
}

function getOrgAttr(orgExpr, key, label = key, fallback = "N/A") {
  return buildFunctionToken("getOrgAttr", [[orgExpr], attr(key, label), fallback ? [{ type: "str", value: fallback }] : []]);
}

ok("simple arithmetic", [quantity, { type: "op", op: "*" }, unitPrice]);
ok("string concat", [{ type: "str", value: "REQ-" }, { type: "op", op: "&" }, buildFunctionToken("UniqueID", [])]);
ok("boolean comparison", buildComparison(active, "==", { type: "bool", value: true }));
ok("logical and/or", [amount, { type: "op", op: ">" }, { type: "num", value: "1000" }, { type: "op", op: "and" }, status, { type: "op", op: "!=" }, { type: "str", value: "" }]);
ok("dateAdd", [buildFunctionToken("dateAdd", [[buildFunctionToken("now", [])], [{ type: "str", value: "day" }], [{ type: "num", value: "3" }]])]);
ok("dateDiff", [buildFunctionToken("dateDiff", [[dueDate], [buildFunctionToken("now", [])], [{ type: "str", value: "day" }], [{ type: "bool", value: false }]])]);
ok("dateFormat", [buildFunctionToken("dateFormat", [[buildFunctionToken("now", [])], [{ type: "str", value: "YYYYMMDD" }]])]);
ok("iif", [buildFunctionToken("iif", [[amount, { type: "op", op: ">" }, { type: "num", value: "5000" }], [{ type: "str", value: "Finance Review" }], [{ type: "str", value: "Manager Review" }]])]);
ok("isNullOrEmpty", [buildFunctionToken("isNullOrEmpty", [[status]])]);
ok("arraySum", [buildFunctionToken("arraySum", [[lineItems], [{ type: "str", value: "LineTotal" }], [], []])]);
ok("formatNumber", [buildFunctionToken("formatNumber", [[amount], [{ type: "num", value: "2" }], [{ type: "num", value: "1" }]])]);
ok("UniqueID", [buildFunctionToken("UniqueID", [])]);
ok("current user name", [getUserAttr(currentUser, "Name_CN", "Name")]);
ok("current user department name", [getOrgAttr(getUserAttr(currentUser, "DepartmentID", "Department"), "Name", "Name")]);
ok("current user manager name", [getUserAttr(getUserAttr(currentUser, "LineManager", "Line Manager"), "Name_CN", "Name", "")]);
ok("boarding date formatted", [buildFunctionToken("dateFormat", [[getUserAttr(currentUser, "LatestHireDate", "Boarding Date")], [{ type: "str", value: "MMM DD, YYYY" }]])]);
ok("boarding date plus one year", [buildFunctionToken("dateAdd", [[getUserAttr(currentUser, "LatestHireDate", "Boarding Date")], [{ type: "str", value: "year" }], [{ type: "num", value: "1" }]])]);

console.log("Expression validation smoke tests passed.");
