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

Use `formatNumber` only after calculation when the target is display text. Keep numeric controls numeric while workflow rules or ContentList mappings still need numeric values.

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

Screenshot evidence confirms Dynamic display rules are configured from the selected control settings panel. Generators should preserve the export-backed wrapper shape around the nested expression.

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

Screenshot evidence confirms Custom validation is a control-level Validation section entry point. Use this for conditional or cross-field validation only; keep simple required validation in native properties.

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

Lookup/data filter screenshots show condition-builder rows with field, operator, value, expression-toggle, delete, and drag controls. The nested expression token model is reusable, but the outer condition row object should be copied from an export-backed lookup/filter pattern.

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

Workflow screenshots show transition conditions are configured on selected sequence/transition arrows. Generated workflow conditions must remain boolean expressions and must not use raw JavaScript.

## String Formatting

Use `concat` or `&` for generated request numbers and display text. Use `formatNumber` for currency-like display strings and `dateFormat` for date labels.

Common recipes:

- request number: prefix + `dateFormat(now(), "YYYYMMDD")` + `UniqueID()`
- normalized text: `upper(trim(value))`
- cleanup: `replace(value, " ", "-", 1)` when all spaces should be replaced

## List/Sublist Summaries

Use `arraySum`, `arrayCount`, `arrayAverage`, `arrayMin`, and `arrayMax` for list/sublist summary formulas when the list variable and column names are resolved.

For nested objects, use `getAttr(object, "path.to.value", defaultValue)` only after object-shaped values are proven in the target export. For duplicate cleanup, use `removeDuplicates(arrayValue)` only after the array variable is resolved.
