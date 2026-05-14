# Yeeflow Expression Generation Rules

Use `yeeflow-expression-functions.normalized.json`, `yeeflow-expression-operators.normalized.json`, and `yeeflow-expression-utils.js` before generating expressions.

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

## Validation Standard

Run expression smoke tests after changing helpers or references:

```bash
node scripts/smoke-expression-validation.mjs
```

Generated packages should run existing package/form/list/workflow validators. Expression-related findings are warning-first unless JSON is structurally invalid, a generated final package references an unknown function/operator, or a variable token is missing required fields.
