# Yeeflow Form Action Submit Step Rules

Use these rules when generating Yeeflow form action steps that submit, save, validate, reject, forward, or otherwise operate on the active form/task.

## Scope

Export-backed from `Form Actions Phase 1 Test v1 Runtime.yap`:

- minimal Submit form step
- Save changes submit-step mode
- designer-visible submit type values

Configured and studied in this export:

- Form Submit / Task Approve / Task Complete
- Save changes

Designer-visible but not configured/proven in this export:

- Execute form validation
- Reject
- Task forward
- Add task assignee

## Step Type

Submit form actions use:

```json
{ "type": "submit" }
```

The step lives in:

```text
page.formdef.actions[].steps[]
```

## Default Submit

Minimal observed shape:

```json
{
  "type": "submit"
}
```

Use this for normal form submit / task approve / task complete when no special options are needed.

Rules:

- Keep the native Action Panel available unless the user explicitly asks for custom submit buttons.
- Use a custom action button only when the app needs a specific form-action-driven submit experience.
- Do not confuse form action `submit` with workflow graph actions.

## Save Changes

Observed Save changes shape:

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

- Treat Save changes as a submit mode.
- Use it for draft-like or intermediate save behavior.
- Do not use Save changes for workflow progression.
- Generate `ignoreValid: true` only when draft behavior is intentional.
- Document whether the form closes after save.

## Context Support

Based on designer behavior and current docs:

- approval forms: supported
- data-list forms: supported
- public forms: supported
- dashboards: Submit form step is not supported

Dashboard form actions may still use non-submit step types in future phases if dashboard exports prove the wrapper shape.

## Task Context

Task-specific submit options remain deferred until export-backed:

- Reject
- Task forward
- Add task assignee

Do not generate these from labels alone. They likely require task-context settings, comments, target users, or routing properties.

## Validation Recommendations

Warn when:

- submit step has malformed `attrs`.
- `submitType` is not one of the observed/designer-visible values.
- Save changes uses `ignoreValid: true` without a draft/save purpose.
- Submit form step appears in a dashboard context.
- action button triggering submit has missing or generic `nv_label`.

Use errors only for structurally invalid JSON.
