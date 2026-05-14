# Yeeflow Expression Use Cases

## Calculated Controls

Use calculated controls for formulas such as `Subtotal = Quantity * Unit Price`. Avoid editable inputs for calculated-looking values.

Recommended expression:

```json
[
  { "exprType": "variable", "valueType": "number", "id": "Quantity", "type": "expr", "name": "Workflow Variables:Quantity" },
  { "type": "op", "op": "*" },
  { "exprType": "variable", "valueType": "number", "id": "UnitPrice", "type": "expr", "name": "Workflow Variables:Unit Price" }
]
```

## Dynamic Display Conditions

Use boolean/comparison expressions in `attrs.control_display` wrapper structures learned from exports. The expression itself should use standard variable/operator tokens.

Example: show reason when amount exceeds threshold:

```json
[
  { "exprType": "variable", "valueType": "number", "id": "Amount", "type": "expr", "name": "Workflow Variables:Amount" },
  { "type": "op", "op": ">" },
  { "type": "num", "value": "10000" }
]
```

## Custom Validation

Use expression tokens when a validation rule needs comparison or empty checks. Keep simple required validation in native required flags when possible.

Example: date must not be earlier than today:

```json
[
  { "type": "func", "func": "dateDiff", "params": [[{ "exprType": "variable", "valueType": "date", "id": "RequiredDate", "type": "expr", "name": "Workflow Variables:Required Date" }], [{ "type": "func", "func": "now", "params": [] }], [{ "type": "str", "value": "day" }], [{ "type": "bool", "value": false }]] },
  { "type": "op", "op": ">=" },
  { "type": "num", "value": "0" }
]
```

## Lookup And Data Filters

For lookup filters, preserve the wrapper shape from the target lookup/filter property and validate the expression token array inside it.

Example: only active records:

```json
[
  { "exprType": "variable", "valueType": "boolean", "id": "Active", "type": "expr", "name": "Workflow Variables:Active" },
  { "type": "op", "op": "==" },
  { "type": "bool", "value": true }
]
```

## Workflow Transition Conditions

Use expression tokens for generated conditional routing only when the target workflow condition wrapper is export-backed. Use simple approval outcome conditions for approve/reject paths.

Example: route to Finance when total amount is at least 5000:

```json
[
  { "exprType": "variable", "valueType": "number", "id": "TotalAmount", "type": "expr", "name": "Workflow Variables:Total Amount" },
  { "type": "op", "op": ">=" },
  { "type": "num", "value": "5000" }
]
```

## String Formatting

Use `concat` or `&` for generated request numbers and display text. Use `formatNumber` for currency-like display strings and `dateFormat` for date labels.

## List/Sublist Summaries

Use `arraySum`, `arrayCount`, `arrayAverage`, `arrayMin`, and `arrayMax` for list/sublist summary formulas when the list variable and column names are resolved.
