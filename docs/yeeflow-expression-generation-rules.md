# Yeeflow Expression Generation Rules

Use `yeeflow-expression-functions.normalized.json`, `yeeflow-expression-function-knowledge-base.normalized.json`, `yeeflow-expression-operators.normalized.json`, and `yeeflow-expression-utils.js` before generating expressions.

## Default Rules

- Generate expression arrays, not raw JavaScript.
- Use exact token keys from the reference: `exprType`, `valueType`, `id`, `type`, `name`, `op`, `func`, `params`, and `value`.
- Use variable tokens with `exprType: "variable"` and `type: "expr"`.
- Use workflow variable tokens with `exprType: "variable"` and value types `number`, `text`, `date`, or `boolean`.
- User/profile context exports may use application variable tokens such as `exprType: "application"`, `id: "CurrentUser"`, `valueType: "string"`, `type: "expr"`, and `name: "Context:Current User"`. Use only export-backed context tokens.
- Do not invent function names or operators.
- Use `iif` for conditional values.
- Use `isNullOrEmpty` for empty checks.
- Use `dateDiff`, `dateAdd`, and `dateFormat` for date logic.
- Use `arraySum`, `arrayCount`, `arrayAverage`, `arrayMin`, and `arrayMax` for list/sublist summaries.
- Use `concat` or `&` for string assembly.
- Use `formatNumber`, `fixed`, or `round` for numeric display.
- Use explicit readable lookup summary variables for user-facing output. Do not persist raw lookup row IDs into text fields unless the row ID is intentional.
- Use enriched `businessScenarios` and `keywords` only to select from known functions. They do not authorize inventing new functions or unsupported token shapes.
- Treat screenshot-observed functions such as `addWorkDays` and `addWorkHours` as metadata-pending until export-backed parameters are available.
- Runtime note from `Expression Runtime Test v1`: do not assign raw serialized expression token arrays directly to `SetVariableTask` text values for request numbers. Yeeflow displayed the raw JSON literally. Use an export-backed value shape such as the FlowNo expression-button pattern until a real SetVariable expression-token assignment is studied.
- Runtime note from `Expression Runtime Test v1`: workflow transition conditions need their exact outer wrapper from a working export. A locally valid numeric token array is not enough to claim workflow branch routing is runtime-proven.
- Runtime note from `Expression User Profile Test v1`: `getUserAttr`, `getOrgAttr`, `getLocAttr`, `dateFormat`, and nested `dateAdd` can render in generated approval forms and task pages. Tenant-missing profile values should use safe fallbacks. The decoded export used `getOrgAttr` for department/organization attributes; do not generate `getDeptAttr` until it is export-backed.

## Function Selection By Business Intent

| Business intent | Generate with | Notes |
| --- | --- | --- |
| Display a currency or amount string | `formatNumber(amount, 2, 1)` | Returns text. Use only for display/persistence summaries, not numeric calculations. |
| Add a deadline offset | `dateAdd(startDate, "day", offset)` | Units from the enriched reference include `year`, `month`, `day`, `hour`, `minute`, `second`. |
| Detect overdue work | `dateDiff(dueDate, now(), "day", false) < 0` | Confirm the sign expectation in the target runtime before using for blocking validation. |
| Conditional text/value | `iif(condition, thenValue, elseValue)` | Use direct comparison instead of `iif` when a context expects boolean routing. |
| Required-field validation | `isNullOrEmpty(value) == false` | Prefer native required when the field is always required. |
| Request number | `concat(prefix, dateFormat(now(), "YYYYMMDD"), UniqueID())` or `&` tokens | Preserve exact `UniqueID` capitalization. |
| List total | `arraySum(lineItems, "LineTotal")` | Resolve list variable and column names first. |
| List count | `arrayCount(lineItems)` | Use optional column/filter params only when column names are proven. |
| Safe object lookup | `getAttr(object, "path.to.value", defaultValue)` | Useful for nested objects, but only when object-shaped values are proven. |
| Current user email/name/profile | `getUserAttr(Context:Current User, attr, fallback)` | Attribute params are descriptor objects such as `{ "key": "Email", "label": "Email" }`. |
| Department/parent department | `getOrgAttr(getUserAttr(Context:Current User, Department, fallback), attr, fallback)` | Exact exported function is `getOrgAttr`, not `getDeptAttr`. |
| Location name/manager | `getLocAttr(getUserAttr(Context:Current User, Location, fallback), attr, fallback)` | Environment-dependent when tenant location data is empty. |
| Boarding anniversary | `dateFormat(dateAdd(getUserAttr(Context:Current User, Boarding Date, fallback), "year", 1), "MMM DD, YYYY")` | Runtime-tested shape; value quality depends on the current user's Boarding Date data. |
| Text cleanup | `trim`, `replace`, `lower`, `upper` | Use for normalized summaries and comparisons. |
| Duplicate removal | `removeDuplicates(arrayValue)` | Use after the array variable is resolved. |

## Common Patterns

Subtotal:

```json
[
  { "exprType": "variable", "valueType": "number", "id": "Quantity", "type": "expr", "name": "Workflow Variables:Quantity" },
  { "type": "op", "op": "*" },
  { "exprType": "variable", "valueType": "number", "id": "UnitPrice", "type": "expr", "name": "Workflow Variables:Unit Price" }
]
```

Show field when switch is true:

```json
[
  { "exprType": "variable", "valueType": "boolean", "id": "RequiresJustification", "type": "expr", "name": "Workflow Variables:Requires Justification" },
  { "type": "op", "op": "==" },
  { "type": "bool", "value": true }
]
```

Route workflow when amount is high:

```json
[
  { "exprType": "variable", "valueType": "number", "id": "TotalAmount", "type": "expr", "name": "Workflow Variables:Total Amount" },
  { "type": "op", "op": ">=" },
  { "type": "num", "value": "5000" }
]
```

Generated request number:

```json
[
  { "type": "str", "value": "REQ-" },
  { "type": "op", "op": "&" },
  { "type": "func", "func": "dateFormat", "params": [[{ "type": "func", "func": "now", "params": [] }], [{ "type": "str", "value": "YYYYMMDD" }]] },
  { "type": "op", "op": "&" },
  { "type": "str", "value": "-" },
  { "type": "op", "op": "&" },
  { "type": "func", "func": "UniqueID", "params": [] }
]
```

For app-level request numbers in workflow actions, this token recipe is only the expression logic. Do not serialize this array into a `SetVariableTask` value unless that exact assignment shape has been proven by export/runtime. In the first runtime test, the safe generated package used Yeeflow's FlowNo expression-button value shape for `Request No`.

Overdue check:

```json
[
  { "type": "func", "func": "dateDiff", "params": [[{ "exprType": "variable", "valueType": "date", "id": "DueDate", "type": "expr", "name": "Workflow Variables:Due Date" }], [{ "type": "func", "func": "now", "params": [] }], [{ "type": "str", "value": "day" }], [{ "type": "bool", "value": false }]] },
  { "type": "op", "op": "<" },
  { "type": "num", "value": "0" }
]
```

Amount formatting:

```json
[
  { "type": "func", "func": "formatNumber", "params": [[{ "exprType": "variable", "valueType": "number", "id": "Amount", "type": "expr", "name": "Workflow Variables:Amount" }], [{ "type": "num", "value": "2" }], [{ "type": "num", "value": "1" }]] }
]
```

Required-field validation with explicit false check:

```json
[
  { "type": "func", "func": "isNullOrEmpty", "params": [[{ "exprType": "variable", "valueType": "text", "id": "Reason", "type": "expr", "name": "Workflow Variables:Reason" }]] },
  { "type": "op", "op": "==" },
  { "type": "bool", "value": false }
]
```

List total:

```json
[
  { "type": "func", "func": "arraySum", "params": [[{ "exprType": "variable", "valueType": "number", "id": "LineItems", "type": "expr", "name": "Workflow Variables:Line Items" }], [{ "type": "str", "value": "LineTotal" }]] }
]
```

Text cleanup:

```json
[
  { "type": "func", "func": "upper", "params": [[{ "type": "func", "func": "trim", "params": [[{ "exprType": "variable", "valueType": "text", "id": "ProductCode", "type": "expr", "name": "Workflow Variables:Product Code" }]] }]] }
]
```

Current user email:

```json
[
  {
    "type": "func",
    "func": "getUserAttr",
    "params": [
      [{ "id": "CurrentUser", "exprType": "application", "valueType": "string", "type": "expr", "name": "Context:Current User" }],
      [{ "key": "Email", "label": "Email" }],
      [{ "type": "str", "value": "N/A" }]
    ]
  }
]
```

Current user department name:

```json
[
  {
    "type": "func",
    "func": "getOrgAttr",
    "params": [
      [{ "type": "func", "func": "getUserAttr", "params": [[{ "id": "CurrentUser", "exprType": "application", "valueType": "string", "type": "expr", "name": "Context:Current User" }], [{ "key": "DepartmentID", "label": "Department" }], [{ "type": "str", "value": "N/A" }]] }],
      [{ "key": "Name", "label": "Name" }],
      [{ "type": "str", "value": "N/A" }]
    ]
  }
]
```

## Validation Standard

Run expression smoke tests after changing helpers or references:

```bash
node scripts/smoke-expression-validation.mjs
```

Generated packages should run existing package/form/list/workflow validators. Expression-related findings are warning-first unless JSON is structurally invalid, a generated final package references an unknown function/operator, or a variable token is missing required fields.
