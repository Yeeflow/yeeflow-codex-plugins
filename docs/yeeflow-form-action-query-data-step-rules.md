# Yeeflow Form Action Query Data Step Rules

Use these rules when generating Yeeflow front-end form actions that read records from a list/report/library source into form variables.

## Scope

Export-backed from `Form Actions Phase 1 Test v1 Runtime.yap`:

- query data from a packaged data list
- query multiple items
- query single item
- sort results
- map multiple results to a form `list` variable
- map single result fields to workflow variables
- store total query count in a temp variable
- store selected multiple-query fields in a temp collection variable
- use `arraySum` against the temp query collection

Generated-runtime-proven by `Form Actions Phase 2 Query Submit Test v1`:

- query multiple from a packaged data list
- query multiple result collection mapped into a form list/sub list variable
- query result count copied into a display/workflow variable
- query single from a packaged data list
- query single selected-field mapping into workflow variables
- temp query collection aggregation with `arraySum`
- temp query collection display with `JSONStringfy`

Still runtime-sensitive / deferred:

- filters
- document library sources
- form report sources
- data report sources
- paging beyond `querydata_pagesize`
- empty-result handling
- `vLookup` function token shape

The first generated runtime test attempted an `Active == true` filter. Runtime still returned the inactive `SRC-003` record, so do not mark Query data filters as proven yet. Generate filters only when required and document them as runtime-sensitive until the exact designer/runtime shape is resolved.

## Step Type

Use:

```json
{ "type": "querydata" }
```

The step lives in:

```text
page.formdef.actions[].steps[]
```

## Source List

Source list shape:

```json
{
  "querydata_list": {
    "AppID": 41,
    "ListSetID": "2055176306075381761",
    "ListID": "2055176313546620929",
    "ListType": 1
  }
}
```

Rules:

- Use confirmed app/list metadata only.
- Prefer internal packaged source lists for generated test apps.
- Do not guess external list/report/library ids.

## Multiple Query To List Variable

Use when the UI needs to display query rows.

Required pattern:

```json
{
  "querydata_type": "multiple",
  "querydata_fieldmap": {
    "Title": "field_Title",
    "Text1": "field_RequestTitle"
  },
  "querydata_listname": "FormActions",
  "querydata_vartype": "list",
  "querydata_listname_parent": "__variables_",
  "querydata_fields": null
}
```

Rules:

- `querydata_listname` is the form-level list variable id without prefix.
- `querydata_listname_parent = "__variables_"` means the target is a workflow/form variable.
- `querydata_fieldmap` maps source `FieldName` values to target list row field ids.
- Every target field id must exist in `variables.listref[]` and the rendered list control.

## Single Query To Variables

Use when the form needs a few values from one source item.

Pattern:

```json
{
  "querydata_type": "single",
  "querydata_fieldmap": {
    "Title": "QueryTitle",
    "Text1": "QueryRequestTitle"
  },
  "querydata_listname": "",
  "querydata_vartype": "",
  "querydata_listname_parent": ""
}
```

Rules:

- Map source fields directly to workflow variables when values must be submitted, persisted, or used by workflow.
- Use temp variables for transient display-only values.
- Add filters in future generated apps when business logic requires a specific source row.

## Multiple Query To Temp Collection

Use when the query result collection is needed for a client-side aggregate or display.

Pattern:

```json
{
  "querydata_type": "multiple",
  "querydata_fieldmap": null,
  "querydata_listname": "var_CollectionofQueryItems",
  "querydata_vartype": "text",
  "querydata_listname_parent": "__temp_",
  "querydata_fields": [
    { "FieldName": "Title", "Type": "input", "DisplayName": "Title" },
    { "FieldName": "Decimal1", "Type": "input_number", "DisplayName": "Amount" }
  ]
}
```

Rules:

- Use explicit `querydata_fields[]`.
- Reference the temp collection in expressions as `__temp_<querydata_listname>`.
- Copy any final persisted or workflow-relevant value into a workflow variable.

## Total Count

Observed count target:

```json
{
  "querydata_totalcount": "var_TotalQueryItems",
  "querydata_totalparent": "__temp_"
}
```

Rules:

- Use temp variables for display-only query counts.
- Use workflow variables when the count must be submitted, persisted, or used by workflow routing.

## Sorts And Page Size

Observed sort:

```json
{
  "querydata_sorts": [
    { "SortName": "Created", "SortByDesc": true }
  ],
  "querydata_pagesize": 200
}
```

Rules:

- Use explicit sort for deterministic single-item query behavior.
- Keep page sizes modest for generated runtime tests.

## Validation Recommendations

Warn when:

- `querydata_list` is missing.
- `querydata_type` is not `single` or `multiple`.
- `querydata_fieldmap` maps to missing variables/list row fields.
- `querydata_listname_parent` points to an unknown namespace.
- multiple query collection target is missing.
- `querydata_fields` is empty when an aggregate expression depends on selected fields.
- result count target variable is missing.

Use errors only for structurally invalid JSON.

## Runtime Baseline Status

`Form Actions Phase 2 Query Submit Test v1` proved the generated query data surface except filters:

- Source list and target list opened without `datas/query` 400.
- `Load Multiple Test Requests` populated a form sub list with three selected-field rows and set Loaded Count to `3`.
- `Load Single Test Request` mapped the first returned item into display/workflow variables.
- `arraySum(__temp_var_CollectionofQueryItems, "Amount", [], [])` returned `2300`.
- `JSONStringfy(__temp_var_CollectionofQueryItems)` displayed the returned collection JSON.

Known partial:

- The `Active == true` Query data filter was ignored by runtime. The result included inactive `SRC-003`, so filter shape remains a follow-up learning item.
- `vLookup` remains UI-observed only and is not generation-safe.
