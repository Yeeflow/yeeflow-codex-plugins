# Expression Recipes

Subtotal:

```json
[
  { "exprType": "variable", "valueType": "number", "id": "Quantity", "type": "expr", "name": "Workflow Variables:Quantity" },
  { "type": "op", "op": "*" },
  { "exprType": "variable", "valueType": "number", "id": "UnitPrice", "type": "expr", "name": "Workflow Variables:Unit Price" }
]
```

Show conditional field:

```json
[
  { "exprType": "variable", "valueType": "boolean", "id": "Required", "type": "expr", "name": "Workflow Variables:Required" },
  { "type": "op", "op": "==" },
  { "type": "bool", "value": true }
]
```

Request number:

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
