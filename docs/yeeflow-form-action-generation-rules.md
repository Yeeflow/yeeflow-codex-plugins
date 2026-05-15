# Yeeflow Form Action Generation Rules

These rules cover Phase 1 Yeeflow Form Actions learned from the manually updated `Expression Sublist Summary Workflow Test v1.yap` export.

## Scope

Phase 1 covers:

- action buttons
- button click triggers
- page-load triggers
- temp variables
- `setvar` action steps
- `confirm` action steps

Phase 1 does not yet promote `listitem` action steps to general generation, although the export contains one example.

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
