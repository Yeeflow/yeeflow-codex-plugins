# Yeeflow Form Action Generation Rules

These rules cover Yeeflow Form Actions learned from manually updated runtime exports.

Phase 1 source: `Expression Sublist Summary Workflow Test v1.yap`.

Phase 2 source: `Form Actions Phase 1 Test v1 Runtime.yap`.

## Scope

Phase 1 covers:

- action buttons
- button click triggers
- page-load triggers
- temp variables
- `setvar` action steps
- `confirm` action steps

Phase 1 does not yet promote `listitem` action steps to general generation, although the export contains one example.

Phase 2 covers:

- `querydata` action steps
- query multiple items
- query single item
- query result count temp variables
- query result collection temp variables
- query result mapping to form `list` variables
- `arraySum` over query result collections
- `submit` action steps
- Save changes submit mode

## Form Action Location

Form actions live on a page form definition:

```json
{
  "formdef": {
    "actions": [
      { "id": "uuid", "name": "Action name", "steps": [] }
    ],
    "formAction": {
      "onLoad": "uuid"
    }
  }
}
```

Use UUIDs for action ids and business-readable action names.

## Button Click Trigger

Action buttons trigger form actions through `attrs.control_action`:

```json
{
  "type": "action_button",
  "label": "Set default request title",
  "attrs": {
    "button-style": "3",
    "common": {
      "positioning": { "widthtype": [null, "2"] }
    },
    "control_action": "uuid"
  }
}
```

Rules:

- The target action must exist in the same page `formdef.actions[]`.
- Action buttons should use inline width by default.
- Generated action buttons must have meaningful `nv_label` values.
- Avoid attaching action wiring until the action validates.

## Page Load Trigger

Page load uses:

```json
{
  "formAction": {
    "onLoad": "uuid"
  }
}
```

Use page-load actions for safe initialization:

- default title
- temp status text
- default notes
- requester/current-user display values

Do not use page-load for data writes or external calls in Phase 1.

## Set Variable Step

Single variable:

```json
{
  "type": "setvar",
  "name": "Set request title",
  "attrs": {
    "setvar_var": { "exprType": "variable", "valueType": "text", "id": "RequestTitle", "type": "expr", "name": "Workflow Variables:Request Title" },
    "setvar_val": [{ "type": "str", "value": "Default title" }]
  }
}
```

Multiple variables:

```json
{
  "type": "setvar",
  "name": "Set default values",
  "attrs": {
    "setvar_multi": true,
    "setvar_array": [
      {
        "var": { "exprType": "variable", "valueType": "text", "id": "Notes", "type": "expr", "name": "Workflow Variables:Notes" },
        "value": [{ "type": "str", "value": "Default notes" }]
      }
    ]
  }
}
```

Rules:

- Values are expression-token arrays.
- Targets may be workflow variables or temp variables.
- Temp variable target ids use `__temp_` prefix in expression tokens.
- A step may include `condition` expression tokens.

## Show Confirm Dialog Step

```json
{
  "type": "confirm",
  "attrs": {
    "confirm_qs": [{ "type": "str", "value": "Confirm this action?" }],
    "confirm_rs": { "exprType": "variable", "valueType": "string", "id": "__temp_var_DialogResult", "type": "expr", "name": "var_DialogResult" }
  }
}
```

Rules:

- Store confirm result in a temp variable.
- Show the result with a Text/heading control using `attrs.headc.title.variable`.
- Runtime result semantics need the focused Phase 1 generated test before broad promises.

## Query Data Step

Use the detailed rules in `docs/yeeflow-form-action-query-data-step-rules.md`.

Export-backed `querydata` step shape:

```json
{
  "type": "querydata",
  "attrs": {
    "querydata_list": { "AppID": 41, "ListSetID": "2055176306075381761", "ListID": "2055176313546620929", "ListType": 1 },
    "querydata_type": "multiple",
    "querydata_fieldmap": { "Title": "field_Title" },
    "querydata_listname": "FormActions",
    "querydata_vartype": "list",
    "querydata_listname_parent": "__variables_",
    "querydata_fields": null,
    "querydata_totalcount": "var_TotalQueryItems",
    "querydata_totalparent": "__temp_",
    "querydata_pagesize": 200
  }
}
```

Rules:

- Use `querydata_type = "multiple"` when mapping rows into a form list/sub list or temp collection.
- Use `querydata_type = "single"` when mapping the first matching item into workflow/temp variables.
- Use explicit `querydata_fieldmap` and verify every mapped target variable or list row field exists.
- Store display-only counts in temp variables via `querydata_totalcount` and `querydata_totalparent = "__temp_"`.
- Store transient query collections in temp variables only when they are used for display or client-side expressions.
- Copy business-relevant values into workflow variables before submit when persistence or workflow routing is required.

## Query Result Expressions

Phase 2 export-backed:

- `arraySum(__temp_var_CollectionofQueryItems, "Amount", [], [])`
- `JSONStringfy(__temp_var_CollectionofQueryItems)`

The export-backed collection display function is spelled `JSONStringfy`. Do not silently rename it to `JSONStringify` until another export proves that spelling as a runtime function token.

The export labels a button/action as `Calculate with vLookup function`, but no `vLookup` function token appears in the export. Treat `vLookup` as UI-observed only.

The aggregate function is `arraySum`, not `arraySub`.

## Submit Form Step

Use the detailed rules in `docs/yeeflow-form-action-submit-step-rules.md`.

Default submit:

```json
{ "type": "submit" }
```

Save changes:

```json
{
  "type": "submit",
  "name": "Submit with draft",
  "attrs": {
    "submitType": "3",
    "closeForm": true,
    "ignoreValid": true
  }
}
```

Rules:

- Use default submit for normal form submit / task approve / task complete.
- Use Save changes for draft-like behavior, not workflow progression.
- Do not generate Submit form steps on dashboards.
- Keep Reject, Task forward, and Add task assignee submit modes deferred until export-backed.

## Button Style Defaults

Observed `action_button.attrs["button-style"]` values:

- `"2"`: primary
- `"3"`: soft secondary
- `"4"`: outline primary
- `"5"`: neutral outline
- `"6"`: dashed/utility, including add/import/next patterns

Use icons with:

- `attrs["icon-type"] = "3"`
- `attrs.icon = "fa-regular fa-plus"` for add
- `attrs.icon = "fa-regular fa-arrow-right"` for next
- `attrs["icon-posi"] = "1"` for before text
- `attrs["icon-posi"] = "2"` for after text

## Validation Policy

Use warnings first:

- unknown action reference
- missing page-load action target
- action with empty steps
- unknown step type
- missing Set variable target
- missing Confirm dialog message
- missing temp variable declaration
- action button without meaningful `nv_label`
- Query data step missing source list
- Query data step missing or invalid query type
- Query data field mapping references missing variables or list row fields
- Query result target variable missing
- Submit form step used in dashboard context
- Save changes step generated without a draft/save purpose
- accidental `arraySub` expression usage; use `arraySum`

Only promote these to hard errors after generated runtime proof.

## Runtime Baseline Status

`Form Actions Phase 1 Test v1 Runtime` proved the Phase 1 form-action surface after the workflow assignee was manually corrected in the designer:

- button style gallery renders
- button click `control_action` triggers fire
- page-load `formAction.onLoad` runs
- temp variables display and update
- `setvar` updates temp variables and workflow text variables
- `confirm` opens a dialog and stores the result in a temp variable
- submit, reviewer task open, and approval complete

The same runtime found an assignment-generation rule: do not hardcode tenant-specific direct-user assignees such as `method: "users"` with a local user ID and `title: "User:Renger"`. Use a requester/current-user expression assignment unless an export-backed valid user mapping is intentionally supplied for the target tenant.

ContentList persistence remained pending in the first runtime app; the regenerated package switches to the proven workflow-variable button mapping pattern for the next persistence test.

`Form Actions Phase 2 Query Submit Test v1` proved the generated Phase 2 package runtime path. The final corrected retest used `attrs.querydata_filters` plural for Query data filters:

- Query data multiple button action populated a form sub list and count value.
- Query data single button action mapped selected fields into workflow/display variables.
- Query data `Active == true` filters excluded inactive source rows.
- Loaded Count was `2` from two active rows out of three source rows.
- `arraySum` over the filtered temp query collection returned `2000`.
- `JSONStringfy` displayed the filtered temp query collection.
- Save changes returned success without advancing workflow.
- Custom Submit form action submitted the workflow.
- Reviewer task opened, approval completed, and ContentList created a readable target-list record.

Filter correction:

- Query data `Active == true` filter was ignored by runtime in the generated package because the generator wrote `attrs.querydata_filter`, which did not populate the Query data step's actual `Data filter -> Condition` setting.
- User follow-up confirmed that manually setting the Query data step `Data filter -> Condition` to `Active Equals ON` filters the result correctly.
- The patched export and corrected generated retest prove the working JSON path is `attrs.querydata_filters` plural. For an Active Bit field, the exported working condition is `{ "left": "Bit1", "op": "0", "right": "true", "pre": "and", "showCus": true }`.
- Do not generate `attrs.querydata_filter` singular as the final filter implementation.
- `vLookup` remains deferred because only labels, not function tokens, have been observed.
