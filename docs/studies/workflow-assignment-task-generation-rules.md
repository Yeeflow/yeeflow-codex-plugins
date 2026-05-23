# Workflow Assignment Task Generation Rules

## Scope

These rules cover Yeeflow approval workflow `MultiAssignmentTask` assignee configuration learned from `Test ABC.yap`.

Proof boundary:

- Shapes in this document are `export-proven` unless explicitly marked otherwise.
- Validator checks are warning-first and `validator-backed` only after local validation.
- Assignment task runtime routing is not `runtime-proven` until a focused runtime baseline passes.
- Help Center behavior can guide terminology and expected behavior, but generated assignee configurations should use export-proven shapes unless a shape is explicitly marked product-documented but not export-proven.

## Export-Proven Storage

Assignment task assignees are stored on `MultiAssignmentTask` nodes under:

```text
properties.usertaskassignment
```

The value is an array of assignee entries.

Every entry found in `Test ABC.yap` includes:

- `type`
- `method`
- `title`

Some methods also include:

- `value`
- `position`

Common task approval settings found alongside assignees:

- `properties.approveway`
- `properties.approvepercentage`
- `properties.taskurl`
- `properties.isenabledemail`
- `properties.isallowreassign`
- `properties.isallowsign`
- `properties.allowskip`

## Export-Proven Methods

| Method | Type | Meaning | Required fields found | Runtime dependencies | Generation safety |
|---|---|---|---|---|---|
| `direct` | `user` | specific direct user | `value`, `title` | valid target-tenant user | tenant-sensitive; avoid broad generation |
| `expression` | `user` | expression editor user assignee | `value`, `title` | applicant/user context or expression result | export-proven shape, runtime routing unproven |
| `position` | `position` | direct job position | `position`, `title` | valid position assignment | requires target org/reference data |
| `positionorg` | `position` | job position by selected department | `position`, `value`, `title` | valid department and position assignment | requires target org/reference data |
| `positionorgexpr` | `position` | job position by applicant/current department | `position`, `value`, `title` | applicant context, department hierarchy, position assignment | requires runtime proof |
| `positionloc` | `position` | job position by selected location | `position`, `value`, `title` | valid location and position assignment | requires target org/reference data |
| `positionlocexpr` | `position` | job position by applicant/current location | `position`, `value`, `title` | applicant context, location data, position assignment | requires runtime proof |

## Safe Generation Rules

Use these rules for generated packages:

- Do not hardcode tenant-specific direct users by default.
- Use `type=user`, `method=direct` only when the user explicitly supplies or authorizes a valid target-tenant user mapping.
- Redact private IDs in docs and never commit user/org lookup output.
- Prefer applicant/current-user expression routing or an explicit user-selection field when a package must be portable across tenants.
- Use job-position, department, and location assignment only when target-tenant org/reference data is available and authorized.
- Use `yeeflow-api-operator` for read-only org/reference lookup when real users/departments/locations/positions are needed and local credentials are available.
- Do not paste API keys into chat and do not save raw API responses.
- Keep generated packages free of private user, department, location, position, tenant, and email data unless explicitly required and safe.

## Runtime-Proof Requirements

Runtime routing claims require a focused baseline that proves:

- imported workflow designer accepts the generated assignment task assignee configuration
- request submission creates a pending task
- the pending task routes to the intended safe assignee class
- approval/complete outcomes route through expected sequence flows
- no private identities are exposed in reusable docs

Do not claim runtime behavior from export study alone.

## Product-Documented But Not Export-Proven Here

These are described by Help Center behavior references but were not found in `Test ABC.yap`:

- multiple direct users in one task
- mixed users, user groups, and job positions in one assignee list
- user group assignee
- workflow variable assignee
- selected department manager as a distinct direct manager shape
- position by department plus location in one entry
- appointed order serialization for sequential vs parallel assignee processing
- completion modes beyond `allapprove` with `approvepercentage=100`

Do not generate these as schema-safe until an export proves their package shape. Do not claim routing-safe until runtime proof exists.

## Validator Rules

Validators should remain warning-first for this feature in compatibility mode:

- warn when `MultiAssignmentTask.properties.usertaskassignment` is missing, not an array, or empty
- warn when an assignee entry is not an object
- warn when `type` or `method` is missing
- warn when method is outside the export-proven method list
- warn when position-based assignments lack `position`
- warn when static direct/department/location assignments lack `value`
- warn when expression-based assignments lack an expression-button-shaped `value`
- warn that direct user assignment is tenant-sensitive

Hard errors should wait until generated-final invalid shapes are proven to fail import/publish/runtime safely and consistently.

## References

Normalized export references:

```text
docs/studies/normalized/workflow-assignment-task-assignees/
```

Study doc:

```text
docs/studies/workflow-assignment-task-assignee-settings.md
```
