# Yeeflow Expression Editor UI Contexts

This reference is based on the supplied screenshots from the Yeeflow designer. It documents where expressions are configured and what generators should assume before export-backed wrapper shapes are available.

## Calculation Control Expression

Entry point:

- select a Calculation control
- open the Content tab
- use the `Expression` field and `Edit` button

Expected expression:

- a value-producing expression token array
- usually numeric for subtotal/total formulas, but can return text/date/boolean depending on the bound variable

Typical variables:

- workflow variables such as Quantity, Unit Price, Amount, Date, Status
- list/sublist variables when the calculation summarizes line items

Generator guidance:

- use calculated controls for fields named like Subtotal, Total, Balance, Duration, Difference, or Amount when a formula is implied
- represent `Quantity * Unit Price` as variable tokens with the `*` operator
- use `arraySum` for list/sublist totals only when the list variable and column names are resolved

Validator guidance:

- require a non-empty expression on generated Calculation controls unless explicitly deferred
- validate nested function params and variable tokens
- warn on primitive function params unless export-backed for the function

## Expression Editor Toolbar

Observed toolbar entries:

- number literal: `123`
- text literal
- expression/context variable selector
- function selector
- concatenation: `&`
- arithmetic: `+`, `-`, `*`, `/`, `%`
- grouping: `(`, `)`
- logical: `and`, `or`
- comparison: `==`, `!=`, `>`, `>=`, `<`, `<=`
- boolean literals: `true`, `false`
- empty literal: `[empty]`
- copy/paste controls

Generator guidance:

- generate the normalized token arrays directly; do not generate raw JavaScript formulas
- use only operators present in the normalized operator reference
- treat `%` as UI-observed but do not generate it until it is present in the normalized operators or export-backed

## Function Tab

Entry point:

- open Expression Editor
- choose the Function tab/icon

Observed categories:

- All
- String
- Logical
- Date
- Mathematical
- Other

Observed function list included:

- `abs`
- `addWorkDays`
- `addWorkHours`
- `arrayAverage`
- `arrayConcat`

Generator guidance:

- use `yeeflow-expression-functions.normalized.json` and `yeeflow-expression-function-knowledge-base.normalized.json` for generation-safe functions
- `addWorkDays` and `addWorkHours` are observed in the UI but metadata-pending; do not generate them yet
- choose functions by business intent using category, keywords, and businessScenarios metadata

## Expression / Context Variable Selector

Entry point:

- open Expression Editor
- click the expression/context selector

Observed variable groups:

- Context
- Workflow Variables
- Static Variables
- Temp variables
- Filter variables

Expected token:

```json
{
  "exprType": "variable",
  "valueType": "text",
  "id": "field_1",
  "type": "expr",
  "name": "Workflow Variables:field1"
}
```

Generator guidance:

- use exact variable token shape with all five required properties
- use `valueType` only as `number`, `text`, `date`, or `boolean`
- set `name` to the correct group-qualified label when known
- do not reference unresolved filter/temp variables outside the context where they exist

## Dynamic Display Rules

Entry point:

- select a control
- open Content or Appearance settings
- click `Dynamic display rules`

Expected expression:

- boolean/comparison expression nested inside the control display rule wrapper

Common use cases:

- show justification when amount is greater than a threshold
- show details when a switch is true
- show vendor fields when procurement type equals single source

Generator guidance:

- preserve the export-backed `attrs.control_display` wrapper shape for the target control
- validate the nested expression token array independently
- use simple comparison expressions before complex function expressions

## Custom Validation Rules

Entry point:

- select a field control
- open the Validation section
- click `Custom validation`

Expected expression:

- boolean validation condition, normally true when the field value is valid

Common use cases:

- required-if validation using `isNullOrEmpty`
- required date must be greater than or equal to today
- amount must be positive or below an allowed threshold

Generator guidance:

- use native required flags for simple required fields
- use custom validation only when a business rule cannot be expressed by built-in validation
- keep validation messages and wrappers export-backed before generation

## Lookup / Data Filter Conditions

Entry point:

- select a Lookup control or data-bound control
- open the data source/filter settings
- click `Data filters` / `Condition`

Expected expression:

- condition-builder object with nested expression tokens for the chosen side of a condition

Common use cases:

- filter lookup records where Active equals true
- filter records by category, current user, or context variable
- constrain lookup source data before user selection

Generator guidance:

- preserve lookup filter wrapper shape from the target export
- validate source list fields before referencing them
- use readable lookup autofill variables for user-facing persistence rather than raw row IDs

## Workflow Transition Condition Editor

Entry point:

- open Workflow designer
- select a sequence/transition arrow
- use the right-side `Condition` button

Expected expression:

- boolean condition controlling whether the transition is taken

Common use cases:

- route to Finance when total amount is at least a threshold
- route to Security when security review is required
- route approve/reject paths based on task outcome

Generator guidance:

- generate workflow conditions only when the transition-condition wrapper is export-backed
- keep approve/reject outcome transitions in the proven simple condition pattern
- use `iif` for conditional values, but use direct boolean comparisons for routing decisions
