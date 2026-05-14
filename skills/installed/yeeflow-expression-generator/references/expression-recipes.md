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

Amount formatting:

```json
[
  { "type": "func", "func": "formatNumber", "params": [[{ "exprType": "variable", "valueType": "number", "id": "Amount", "type": "expr", "name": "Workflow Variables:Amount" }], [{ "type": "num", "value": "2" }], [{ "type": "num", "value": "1" }]] }
]
```

Required-if validation:

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
