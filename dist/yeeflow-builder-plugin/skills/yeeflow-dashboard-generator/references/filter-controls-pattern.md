# Filter Controls Pattern

Use this after the local data-bound chart widget pattern is already proven.

Source of truth: `Generated Dashboard Chart Widgets v4.yap`.

Generated validation package: `generated-dashboard-filter-controls-v5.yap`.

Runtime result: proven. `generated-dashboard-filter-controls-v5.yap` imported into `https://codex.yeeflow.com/`, opened, rendered search/radio/range filters, rendered summary/table/chart content, and opened the local `Event Planning` source list with sample rows.

## App Shape

- one root app/listset
- one Type `103` dashboard layout
- one local child data list
- two summary controls
- one dashboard data table
- three chart widgets
- one filter container
- one search filter
- one radio filter
- one range filter
- no approval forms
- no AI modules, connections, document libraries, or external dependencies

## Filter Variables

The dashboard page declares filter variables in `filterVars`:

- `filter_Search`
- `filter_Radio_Vendor`
- `filter_Range_BudgetNumber`

Filter controls bind to these variables with `binding: "__filter_" + filterVarId`.

## Filter Controls

Search filter:

- `type: "search-filter"`
- `label: "Search filter"`
- `binding: "__filter_filter_Search"`
- studied export has empty `attrs`

Radio filter:

- `type: "radio-filter"`
- `label: "Radio filter"`
- `binding: "__filter_filter_Radio_Vendor"`
- `attrs.data.list` points to the local source list
- `attrs.display_f: "Text7"`
- `attrs.value_f: "Text7"`
- `attrs.displayStyle: "dropdown"`
- `attrs.data.sort[0].SortName: "Text7"`

Range filter:

- `type: "range-filter"`
- `label: "Range filter"`
- `binding: "__filter_filter_Range_BudgetNumber"`
- numeric display and behavior settings live in `attrs`
- studied values include `number_max: 100000`, `number_step: 1000`, `prefix.value: "USD "`, `displayThousandths: "1"`, and `rounded-to: "0"`

## Chart Conditions

Filter controls affect charts through `page.exts[].attr.settings.Conditions`.

Variable expression shape:

```json
{
  "exprType": "variable",
  "valueType": "string",
  "id": "__filter_filter_Search",
  "type": "expr",
  "name": "filter_Search"
}
```

Rules:

- expression `name` must match a page `filterVars[].id`
- expression `id` must be `__filter_` plus the expression `name`
- condition `left` must be a field on the referenced source list
- nested condition groups use `conditions[]` and must be validated recursively

Observed chart condition counts:

- pie chart: 3 conditions, bound to search, radio, and range filters
- column chart: 4 top-level conditions, including radio/range filters plus nested static RSVP conditions
- line chart: 2 conditions, bound to radio and range filters

## ReplaceIds

`Resource.ReplaceIds` remains local numeric resource ids only.

Do not include UUID-like filter control ids or chart/summary/page-builder control ids in `ReplaceIds` unless a future export proves Yeeflow treats them as remappable resources.

## Validator Rules

Validators should catch:

- page `filterVars` is an array
- filter control `binding` resolves to a page `filterVars[].id`
- radio filter `attrs.data.list.ListID` resolves to a packaged list
- condition `left` fields resolve to the referenced source list fields
- condition variable expression `name` resolves to page `filterVars`
- condition variable expression `id` equals `__filter_` plus `name`
- nested condition groups are checked recursively

## Stop Conditions

Stop before generation if:

- a filter control binding cannot be matched to `filterVars`
- a chart condition references a missing filter variable
- a condition left field does not exist on the source list
- a radio filter source list is missing from `Data.Childs[]`
- package validation, graph validation, or wrapper round-trip checks fail
- runtime testing is required but has not been explicitly authorized

## Runtime Checklist

For each newly generated dashboard `.yap` in this learning loop, import-test after local validation when the user has authorized runtime testing.

Confirm:

- import metadata parses expected name and description
- app appears in Shared Workspace
- dashboard opens
- filter controls render
- summary/table/chart content renders
- source list opens without a visible `datas/query` failure
- deeper interactive filter behavior is tested before claiming dynamic filtering is fully proven
