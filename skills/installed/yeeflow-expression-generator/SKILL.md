---
name: yeeflow-expression-generator
description: generate, inspect, validate, and document Yeeflow expression editor token arrays for calculated controls, dynamic display rules, validation rules, lookup/data filters, workflow conditions, default values, request numbers, and subtotal/total/date/string formulas.
---

# Yeeflow Expression Generator

Use this skill when generating or validating Yeeflow expression editor output across approval forms, dashboards, data-list forms, lookup filters, workflow transitions, workflow action conditions, default values, request numbers, and calculated controls.

## Source Of Truth

Use the active workspace references first:

- `yeeflow-expression-functions.normalized.json`
- `yeeflow-expression-function-knowledge-base.normalized.json`
- `yeeflow-expression-operators.normalized.json`
- `yeeflow-expression-utils.js`
- `docs/yeeflow-expression-editor-reference.md`
- `docs/yeeflow-expression-generation-rules.md`
- `docs/yeeflow-expression-use-cases.md`
- `docs/yeeflow-expression-function-reference.md`
- `docs/yeeflow-expression-reference-reconciliation.md`
- `docs/yeeflow-expression-editor-ui-contexts.md`

This skill is based on read-only expression training references. Do not bundle raw uploaded training files or screenshots.

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
- Use enriched `businessScenarios`, `keywords`, parameter names, and bilingual descriptions from the function knowledge base to select among known functions.
- Preserve exact runtime function names. Do not rename `strIndex`, `UniqueID`, or `subString`.
- Treat `addWorkDays` and `addWorkHours` as screenshot-observed but metadata-pending. Do not generate them until parameter metadata or export-backed token examples are available.
- Runtime-proven in `Expression Runtime Test v1 Patch`: calculated controls, dynamic display rules, lookup filters, lookup addition/autofill variables, FlowNo request numbers, simple approval tasks, and ContentList persistence can work together in one generated app.
- Runtime-proven in `Expression User Profile Test v1`: user/profile expressions can render in generated approval submission pages and task pages, approval can complete, and readable calculated/profile summary variables can be persisted through ContentList. Use `getUserAttr`, `getOrgAttr`, and `getLocAttr` exactly as exported; the department/organization function is `getOrgAttr`, not `getDeptAttr`.
- For current-user expressions, use the export-backed application token `{ "id": "CurrentUser", "exprType": "application", "valueType": "string", "type": "expr", "name": "Context:Current User" }`.
- For profile attribute functions, attribute parameters are descriptor objects such as `{ "key": "Email", "label": "Email" }`, and fallback/default parameters are expression arrays such as `[{ "type": "str", "value": "N/A" }]`.
- User/profile values can be tenant-data dependent. Generate safe fallbacks for optional location, phone, office, manager, and boarding-date fields; document when runtime proof used a tenant where those values were blank.
- Do not serialize expression token arrays directly into `SetVariableTask` text values for request-number generation. Runtime displayed raw JSON literally. Use the proven FlowNo expression-button value shape until a SetVariable expression-token wrapper is export-backed.
- Treat workflow transition branch conditions as wrapper-sensitive. Locally valid numeric condition tokens are not enough; use simple workflow routing unless the exact transition condition wrapper is studied from a successful export/runtime package.
- Runtime-proven in `Expression Sublist Summary Workflow Test v1`: generated sub list row expressions can use `exprType: "variable_ctx"` with `ctx` equal to the parent list variable id and `id` equal to the row field id. Use this for current-object row formulas such as `Current object:Quantity * Current object:Unit Price`.
- Runtime-proven in `Expression Sublist Summary Workflow Test v1`: sub list summaries configured on `attrs["list-fields-summary"]` can bind numeric totals to top-level number variables with `{ "prefix": "__variables_", "value": "TotalAmount" }`, and those summary-bound variables can drive workflow branch conditions.
- Runtime-proven workflow numeric conditions for summary variables use `conditioninfo[]` wrappers with `op` values such as `n.>` and `n.<=`, `left.value` as a number variable token, and `right.value` as a numeric expression token array such as `[{ "type": "num", "value": "5000" }]`.
- Form Actions Phase 1 export-backed: form action `setvar` values, multi-set values, step conditions, and confirm dialog messages use Yeeflow expression-token arrays. Temp variables are declared in `variables.tempVars[]` and referenced as variable tokens with `id: "__temp_<tempVarId>"`, such as `__temp_var_DialogResult`. Keep form action `setvar` distinct from workflow graph `SetVariableTask`; their wrappers differ.
- Form Actions Phase 1 generated runtime: `setvar` and `confirm` tokens rendered and executed. When a form-action test also includes approval tasks, use requester/current-user expression assignment rather than tenant-specific direct-user IDs; invalid direct-user assignments can block publish before expression behavior can be tested.
- Form Actions Phase 2 export-backed: Query data steps can store selected multiple-query results in temp collection variables and then aggregate them with `arraySum`. The export-backed query collection display function is spelled `JSONStringfy`; do not rename it to `JSONStringify` until an export proves that alias. `vLookup` was only seen in labels and remains deferred. Do not use `arraySub`; use `arraySum`.

## Editor Contexts

Use the context-specific wrapper only when export-backed. The nested expression token array can be validated consistently, but each Yeeflow setting stores it in its own surrounding object.

- Calculation control: Content tab `Expression` field and `Edit` button.
- Dynamic display: control settings `Dynamic display rules`.
- Custom validation: field Validation section `Custom validation`.
- Lookup/data filters: Lookup control data source/filter `Condition`.
- Workflow transition: selected sequence/transition arrow `Condition`.
- Sub list row calculated field: list child field `Control type = Calculation`, with row values exposed through current-object tokens (`exprType: "variable_ctx"`).
- Sub list summary binding: list control Summary Editor binds aggregate values to workflow variables, which can then be used by dynamic display, validation, ContentList, and workflow conditions.
- Function tab: categories include All, String, Logical, Date, Mathematical, and Other.
- Variable selector: observed groups include Context, Workflow Variables, Static Variables, Temp variables, and Filter variables.
- Form actions: button click actions use `action_button.attrs.control_action`, page load actions use `page.formdef.formAction.onLoad`, Set variable steps store expressions in `setvar_val` or `setvar_array[].value`, Confirm steps store message tokens in `confirm_qs`, and Phase 2 Query data result expressions can read temp query collections such as `__temp_var_CollectionofQueryItems`.

## User/Profile Expression Recipes

Use these only with export-backed token shapes:

- current user email: `getUserAttr(Context:Current User, Email, N/A)`
- current user display name: `getUserAttr(Context:Current User, Name, N/A)` using the exported `Name_CN` key
- department name: `getOrgAttr(getUserAttr(Context:Current User, Department, N/A), Name, N/A)`
- parent department name: `getOrgAttr(getOrgAttr(getUserAttr(Context:Current User, Department, N/A), Parent, N/A), Name, N/A)`
- line manager name: `getUserAttr(getUserAttr(Context:Current User, Line Manager, N/A), Name, N/A)`
- location name: `getLocAttr(getUserAttr(Context:Current User, Location, N/A), Name, N/A)`
- boarding anniversary: `dateFormat(dateAdd(getUserAttr(Context:Current User, Boarding Date, N/A), "year", 1), "MMM DD, YYYY")`

When persisting profile-derived output, persist readable summary variables. Do not write object-shaped user, organization, or location values directly to text fields.

## Stop Conditions

Stop before generation when:

- required variables are unresolved
- the target wrapper/context shape is not export-backed
- a requested function/operator is not in the normalized references
- a requested function is only screenshot-observed and lacks parameter metadata
- a variable token needs a value type other than `number`, `text`, `date`, or `boolean`
- expression JSON cannot pass `yeeflow-expression-utils.js`
- a generated current-object row expression references a row field that is not in the same `variables.listref[]`
- a summary-bound workflow condition references a target variable that is not a number variable

## Checks

Run:

```bash
node --check yeeflow-expression-utils.js
node scripts/smoke-expression-validation.mjs
```

Then run the relevant form/app/list/workflow validators for the generated package.
