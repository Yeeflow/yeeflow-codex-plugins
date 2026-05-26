# Data Filter Controls Export Study

Proof boundary: dashboard Data Filter usage in `Sales_Management_AD.yap` is export-proven only. Help Center behavior is product-documented. Approval-form and data-list-form applicability is product-documented only in this pass. Runtime behavior is not runtime-proven.

## Source

- Export path: `/Users/Renger/Downloads/Sales_Management_AD.yap`
- Repository branch: `codex/data-filter-controls-learning`
- Target dashboard pages: `Dashboard`, `Data Report`
- Original export handling: decoded read-only into ignored `.tmp/` only; raw `.yap` and decoded payloads are not committed.
- Privacy handling: normalized references use placeholders for app/list/page/control IDs, data sources, labels, and fields where needed.

## Help Center Context

Reviewed collection: <https://support.yeeflow.com/en/collections/7191652-data-filters>

The Help Center currently lists 14 Data Filter articles: overview, apply type, Search Filter, Select Filter, Checkbox Filter, Radio Filter, Range Filter, Check Range, Date Filter, Relative Period, Apply Button, Remove Filters, Hierarchy filter, and Sorting filter.

Product-documented concepts:

- Data Filter controls can be added to approval forms, list forms, and dashboards.
- Most value-producing filters bind to a filter variable. The filter variable stores the selected filter condition and can be used by data-bound controls.
- Data-bound consumers include data tables, collections/news/gallery-style controls, document library controls, lookup/lookup list controls in approval forms, and dashboard/data-list-form analytics controls such as Pie Chart, Column Chart, Line Chart, Gauge, Funnel Chart, Color Block Heatmap, Summary, and Pivot Table.
- Apply type has two documented modes: `Value change` and `Click on Apply Button`. In exports studied here, `attrs.apply_t = "2"` maps to `Click on apply button`; missing/unspecified apply type is treated as default/unspecified and should not be overclaimed as runtime behavior.
- Apply Button and Remove Filters are special filter-related controls rather than normal value-producing filters.
- Checkbox-style multi-value variables should be consumed with multi-value-compatible operators such as In/Not In; Date Filter variables internally carry the date-range semantics and are product-documented as used with an Equal condition on a date field.

## Export Inventory

| Page | Page ID | Total controls inspected | Data Filter controls | Types found | Filter variables | Apply types found | Apply buttons | Remove filters | Consumers using filter variables | Affected data sources | Unresolved references | Proof |
| --- | --- | ---: | ---: | --- | ---: | --- | ---: | ---: | ---: | --- | --- | --- |
| Dashboard | `<page-id>` | 51 | 8 | Checkbox filter, Date filter, Range filter, Check range, Relative period, Select filter, Apply button, Remove filters | 10 | Click on apply button; default/unspecified | 1 | 1 | 2 | `<list:5>` | 2 stale chart references to undeclared `filter_4` / `filter_5` | export-proven with warnings |
| Data Report | `<page-id>` | 56 | 3 | Checkbox filter, Date filter | 7 | default/unspecified | 0 | 0 | 7 | `<list:5>`, `<list:7>` | none found | export-proven |

Export-proven from this sample:

- Checkbox filter, exported as `check-filter`
- Select filter, exported as `select-filter`
- Range filter, exported as `range-filter`
- Check range, exported as `check-range`
- Date filter, exported as `date-filter`
- Relative period, exported as `relative-period`
- Apply button, exported as `apply-button`
- Remove filters, exported in this sample as `remove-filers`

Product-documented or previous/UI-reference-backed only in this sample:

- Search filter: product-documented and previously dashboard-runtime-proven in `generated-dashboard-filter-controls-v5.yap`, but not present in this export.
- Radio filter: product-documented and previously dashboard-runtime-proven in `generated-dashboard-filter-controls-v5.yap`, but not present in this export.
- Hierarchy filter: product-documented only here.
- Sorting filter: product-documented only here.

## Export Schema Pattern

Dashboard pages are Type `103` layouts with embedded page JSON in `Data.Item.Layouts[].LayoutInResources[0].Resource`. The embedded page JSON declares filter variables at:

```text
$.filterVars[]
```

Observed variable entries are minimal:

```json
{ "id": "filter_<name>", "idx": "<optional-uuid-like-id>" }
```

Value-producing filter controls bind through:

```text
<control>.binding = "__filter_" + filterVars[].id
```

The associated filter variable is therefore resolved by stripping the `__filter_` prefix from the control binding and matching it to `page.filterVars[].id`.

Downstream consumers reference filter variables in expression-token arrays:

```json
{
  "exprType": "variable",
  "valueType": "string",
  "id": "__filter_<filterVarId>",
  "type": "expr",
  "name": "<filterVarId>"
}
```

Consumer condition locations found:

- Data table/list-like dashboard control: `$.children[*].attrs.data.filter[]`
- Dashboard report/chart extensions: `$.exts[].attr.settings.Conditions[]`

The export uses condition fields such as `left`, `op`, `pre`, `right`, and `showCus`. Nested condition groups should be checked recursively.

## Export-Proven Controls

### Checkbox Filter

- Product name: Checkbox filter
- Export type: `check-filter`
- Binding path: `<control>.binding`
- Associated variable path: `$.filterVars[]`
- Option source path: `attrs.data.list`
- Option settings: `attrs.display_f`, `attrs.value_f`, `attrs.ps`, optional `attrs.data.filter[]`
- Display settings found: `layout`, `search-enable`, `more-enable`, `dropdown-enable`, `more-text`, `less-text`, label/field styling
- Apply type found: one `Click on apply button` through `attrs.apply_t = "2"` plus default/unspecified examples
- Downstream usage: table/data-list filters and dashboard report/chart extension conditions reference the variable with `__filter_` expression tokens
- Validation rule: binding must resolve to `page.filterVars[]`; option source list should resolve; downstream operators should be compatible with multi-select conditions
- Generation rule: generate checkbox filters only when a multi-select filter is needed and use multi-value-compatible downstream operators

### Select Filter

- Product name: Select filter
- Export type: `select-filter`
- Binding path: `<control>.binding`
- Option source path: `attrs.data.list`
- Option fields: `attrs.display_f`, `attrs.value_f`
- Apply type found: default/unspecified
- Downstream usage: one data table/list-like dashboard control consumes the selected value through a filter variable
- Validation rule: binding, option source list, display field, value field, and downstream filter variable references must resolve
- Generation rule: use for single-value selection when a source list field provides stable display/value fields

### Range Filter

- Product name: Range filter
- Export type: `range-filter`
- Binding path: `<control>.binding`
- Settings found: `attrs.number_max`, slider/input/value styling
- Apply type found: default/unspecified
- Downstream usage: no downstream consumer in this export used the range variable
- Validation rule: binding must resolve; variable shape/operator compatibility remains warning-first until a consumer example is export-proven
- Generation rule: do not generate downstream range conditions from this sample alone unless another export/runtime proof maps the operator shape

### Check Range

- Product name: Check range
- Export type: `check-range`
- Binding path: `<control>.binding`
- Settings found: `attrs.options[]` with min/max range entries and optional `attrs.prefix`
- Apply type found: default/unspecified
- Downstream usage: no downstream consumer in this export used the check-range variable
- Validation rule: binding must resolve; option range entries should include min/max when generated
- Generation rule: keep downstream condition wiring unproven until a consumer condition is captured

### Date Filter

- Product name: Date filter
- Export type: `date-filter`
- Binding path: `<control>.binding`
- Settings found: `attrs.layout`, edit/label/common styling
- Apply type found: default/unspecified
- Downstream usage: `Data Report` report extensions consume the date filter variable in date-field conditions; `Dashboard` data table/list-like control also consumes a date-like variable
- Validation rule: binding and downstream filter variable references must resolve; date-filter downstream operators should be warning-first unless a target consumer/operator shape is export-proven
- Generation rule: use a date field condition and bind the `right` expression token to the date filter variable

### Relative Period

- Product name: Relative period
- Export type: `relative-period`
- Binding path: `<control>.binding`
- Settings found: `attrs.choice-options[]`, layout and choice styling
- Apply type found: default/unspecified
- Downstream usage: no downstream consumer in this export used the relative-period variable
- Validation rule: binding must resolve; supported choice-option tokens should remain export-backed
- Generation rule: do not invent relative-period condition schema beyond the exported control settings until a consumer example is captured

### Apply Button

- Product name: Apply button
- Export type: `apply-button`
- Binding path: none found; it is referenced by filter controls through `attrs.apply_btn`
- Export-proven association: one `check-filter` uses `attrs.apply_t = "2"` and `attrs.apply_btn = <apply-button-control-id>`
- Behavior boundary: product-documented as the trigger for click-apply filters; actual runtime refresh behavior is not proven in this pass
- Validation rule: every `attrs.apply_btn` must resolve to an existing `apply-button` control id
- Generation rule: when any filter uses click-apply mode, generate an Apply button and wire every click-apply filter to it

### Remove Filters

- Product name: Remove filters
- Export type found: `remove-filers`
- Binding path: none found
- Explicit reset targets: none visible in this sample
- Behavior boundary: product-documented reset behavior; export proves the special control exists but not whether this instance clears all filters or selected filters
- Validation rule: explicit reset targets must resolve when present; missing/unknown target structure should warn, not fail
- Generation rule: include only when a dashboard has multiple filters and a reset action is useful; keep exact target/reset schema warning-first until a target-bearing export is captured

## Downstream Consumers

`Dashboard` contains one data table/list-like consumer that resolves three filter variables:

- checkbox filter variable to a text field with operator `9`
- date filter variable to a date-like field with operator `0`
- select filter variable to a text field with operator `0`

`Dashboard` also contains one chart/report extension with two unresolved stale filter variable references (`filter_4`, `filter_5`). Those references do not resolve to `Dashboard` page `filterVars[]`, so they should be treated as an export warning and a generated-package validator error.

`Data Report` contains seven dashboard report/chart extension consumers. They use three resolved filter variables:

- `filter_customers`
- `filter_productline`
- `filter_orderdate`

Observed report/chart extension condition path:

```text
$.exts[].attr.settings.Conditions[]
```

Each dynamic filter condition uses `right` as an expression-token array whose `id` is `__filter_<filterVarId>` and whose `name` is the filter variable id.

## Generation Rules

- Define `page.filterVars[]` before any filter control or consumer references them.
- Bind value-producing Data Filter controls with `binding: "__filter_" + filterVarId`.
- Do not treat Apply button or Remove filters as value-producing filter controls.
- Use `attrs.apply_t = "2"` only with a valid `attrs.apply_btn` pointing to an `apply-button`.
- Use value-change/default mode for lightweight filters and click-apply mode when multiple or heavier filters should avoid repeated refreshes.
- Wire downstream `attrs.data.filter[]` or `exts[].attr.settings.Conditions[]` to filter variables through expression-token arrays.
- Validate the condition left field against the consumer data source.
- Generate only export-proven filter control types and settings. Do not invent schema for Search, Radio, Hierarchy, or Sorting filters from this sample.
- Treat `remove-filers` as the observed export spelling for this sample, while product terminology remains Remove filters.

## Validation Rules

- `page.filterVars` must be an array when present.
- Every value-producing Data Filter control binding must resolve to `page.filterVars[].id`.
- Every downstream `__filter_` expression must resolve to `page.filterVars[].id`.
- Expression `id` must equal `__filter_` plus expression `name`.
- Click-apply filters must reference an existing `apply-button` control.
- Remove filters reset targets must resolve when explicit targets are present.
- Unknown filter control types should warn first.
- Unsupported filter variable shapes should warn first unless an export proves the shape invalid.
- Generated final packages should treat unresolved filter variable references as validation errors.

## Normalized References

Created under `docs/studies/normalized/data-filter-controls/`:

- `data-filter-variable-definition.normalized.json`
- `data-filter-checkbox-control.normalized.json`
- `data-filter-select-control.normalized.json`
- `data-filter-range-control.normalized.json`
- `data-filter-check-range-control.normalized.json`
- `data-filter-date-control.normalized.json`
- `data-filter-relative-period-control.normalized.json`
- `data-filter-apply-button.normalized.json`
- `data-filter-remove-filters.normalized.json`
- `data-filter-consumer-condition.normalized.json`
- `data-filter-consumer-chart.normalized.json`
- `data-filter-consumer-table.normalized.json`
- `data-filter-click-apply-binding.normalized.json`
- `data-filter-value-change-binding.normalized.json`

No normalized refs were created for Search, Radio, Hierarchy, or Sorting filters because those controls were not found in this export.
