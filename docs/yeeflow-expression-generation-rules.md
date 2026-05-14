# Yeeflow Expression Generation Rules

Use `yeeflow-expression-functions.normalized.json`, `yeeflow-expression-function-knowledge-base.normalized.json`, `yeeflow-expression-operators.normalized.json`, and `yeeflow-expression-utils.js` before generating expressions.

## Default Rules

- Generate expression arrays, not raw JavaScript.
- Use exact token keys from the reference: `exprType`, `valueType`, `id`, `type`, `name`, `op`, `func`, `params`, and `value`.
- Use variable tokens with `exprType: "variable"` and `type: "expr"`.
- Use only these variable `valueType` values: `number`, `text`, `date`, `boolean`.
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

## Validation Standard

Run expression smoke tests after changing helpers or references:

```bash
node scripts/smoke-expression-validation.mjs
```

Generated packages should run existing package/form/list/workflow validators. Expression-related findings are warning-first unless JSON is structurally invalid, a generated final package references an unknown function/operator, or a variable token is missing required fields.
