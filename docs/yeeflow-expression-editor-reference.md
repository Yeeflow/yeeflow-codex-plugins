# Yeeflow Expression Editor Reference

This reference is normalized from `/Users/Renger/Downloads/expression training data generator.txt`. The uploaded file is treated as read-only training evidence, not bundled source data.

## Core Token Model

Yeeflow expressions are JSON arrays of tokens. When a control or workflow setting expects expression editor output, generate expression arrays, not arbitrary JavaScript or raw text formulas.

Common token shapes:

```json
[
  { "exprType": "variable", "valueType": "number", "id": "Amount", "type": "expr", "name": "Workflow Variables:Amount" },
  { "type": "op", "op": "*" },
  { "type": "num", "value": "0.8" }
]
```

Literal tokens:

- string: `{ "type": "str", "value": "abc" }`
- number: `{ "type": "num", "value": "123" }`
- boolean: `{ "type": "bool", "value": true }`
- empty string: `{ "type": "str", "value": "" }`

Variable token:

```json
{
  "exprType": "variable",
  "valueType": "text",
  "id": "field_1",
  "type": "expr",
  "name": "Workflow Variables:field1"
}
```

All five variable properties are required. `valueType` may only be `number`, `text`, `date`, or `boolean`.

Function token:

```json
{ "type": "func", "func": "dateFormat", "params": [[{ "type": "func", "func": "now", "params": [] }], [{ "type": "str", "value": "YYYYMMDD" }]] }
```

Function params are arrays. In most cases, each param is itself an expression-token array. A few export examples use primitive strings or booleans inside params; validators should warn before rejecting these unless a focused export proves the context.

## Operators

Allowed operators from the training reference:

- arithmetic: `+`, `-`, `*`, `/`
- grouping: `(`, `)`
- logical: `and`, `or`
- comparison: `>`, `>=`, `<`, `<=`, `==`, `!=`
- string concatenation: `&`

Do not invent operator names.

## Usage Contexts

The same token model can appear in:

- calculated controls
- dynamic display rules
- custom validation rules
- lookup/data filters
- workflow sequence/transition conditions
- workflow action conditions
- default values
- generated request numbers
- subtotal and total calculations
- date calculations
- string formatting

Different contexts may wrap expression tokens inside larger Yeeflow condition objects. Preserve the local wrapper shape from the studied export and validate the nested expression token array separately.

## Serialization

For model-training samples, the assistant content must be a minified JSON string containing the expression array. For generated `.yap`/`.ywf` resources, keep the native shape expected by the target property: a JSON array when the export uses arrays, or a minified string only when the export-backed property stores it as a string.
