---
name: yeeflow-expression-generator
description: generate, inspect, validate, and document Yeeflow expression editor token arrays for calculated controls, dynamic display rules, validation rules, lookup/data filters, workflow conditions, default values, request numbers, and subtotal/total/date/string formulas.
---

# Yeeflow Expression Generator

Use this skill when generating or validating Yeeflow expression editor output across approval forms, dashboards, data-list forms, lookup filters, workflow transitions, workflow action conditions, default values, request numbers, and calculated controls.

## Source Of Truth

Use the active workspace references first:

- `yeeflow-expression-functions.normalized.json`
- `yeeflow-expression-operators.normalized.json`
- `yeeflow-expression-utils.js`
- `docs/yeeflow-expression-editor-reference.md`
- `docs/yeeflow-expression-generation-rules.md`
- `docs/yeeflow-expression-use-cases.md`
- `docs/yeeflow-expression-function-reference.md`

This skill is based on the read-only training reference `expression training data generator.txt`. Do not bundle that raw uploaded file.

## Core Token Rules

- Expressions are Yeeflow JSON token arrays, not JavaScript formulas.
- String literal: `{ "type": "str", "value": "abc" }`
- Number literal: `{ "type": "num", "value": "123" }`
- Boolean literal: `{ "type": "bool", "value": true }`
- Operator: `{ "type": "op", "op": "*" }`
- Function: `{ "type": "func", "func": "dateFormat", "params": [[...], [...]] }`
- Variable:

```json
{
  "exprType": "variable",
  "valueType": "number",
  "id": "Amount",
  "type": "expr",
  "name": "Workflow Variables:Amount"
}
```

Variable `valueType` may only be `number`, `text`, `date`, or `boolean`.

## Operators

Use only:

- arithmetic: `+`, `-`, `*`, `/`
- grouping: `(`, `)`
- logical: `and`, `or`
- comparison: `>`, `>=`, `<`, `<=`, `==`, `!=`
- concatenation: `&`

## Generation Defaults

- Use `iif` for conditional values.
- Use `isNullOrEmpty` for empty checks.
- Use `dateDiff`, `dateAdd`, and `dateFormat` for date logic.
- Use `arraySum`, `arrayCount`, `arrayAverage`, `arrayMin`, and `arrayMax` for list/sublist summaries.
- Use `concat` or `&` for request-number and display-string assembly.
- Use `formatNumber`, `fixed`, or `round` for numeric display.
- Use readable lookup summary/autofill variables for user-facing persistence; do not persist raw lookup row IDs into text fields unless that is intentional.

## Stop Conditions

Stop before generation when:

- required variables are unresolved
- the target wrapper/context shape is not export-backed
- a requested function/operator is not in the normalized references
- a variable token needs a value type other than `number`, `text`, `date`, or `boolean`
- expression JSON cannot pass `yeeflow-expression-utils.js`

## Checks

Run:

```bash
node --check yeeflow-expression-utils.js
node scripts/smoke-expression-validation.mjs
```

Then run the relevant form/app/list/workflow validators for the generated package.
