# Workflow Assignment Task Assignee Settings

## Purpose

This focused export-learning study documents how Yeeflow approval workflow assignment tasks store assignee settings in `Test ABC.yap`.

Proof boundary:

- `product-documented`: described in Yeeflow Help Center behavior references.
- `export-proven`: found in `Test ABC.yap`.
- `validator-backed`: checked by local validation after this study.
- `runtime-proven`: not claimed in this study.
- `unproven`: not found or not tested.

This branch does not generate a runtime baseline, does not submit approval requests, and does not run live workflow tasks.

## Sources

Source export:

```text
/Users/Renger/Downloads/Test ABC.yap
```

Reference:

- Yeeflow Help Center: Assignment task action
  https://support.yeeflow.com/en/articles/8661647-assignment-task-action
- Related Yeeflow Help Center behavior reference: Add assignee with Assignee Editor
  https://support.yeeflow.com/en/articles/8661658-add-assignee-with-assignee-editor

Source priority:

1. `Test ABC.yap` is the source of truth for actual export/package structure.
2. Help Center articles are product-behavior and terminology references.
3. Existing validators and skills are implementation references.
4. Yeeflow API lookup is only for safe read-only org/reference support if needed.

## Redaction Policy

The raw export and decoded payloads are not committed. Decoding was performed under ignored `tmp/`.

Normalized references redact private org data with placeholders:

- `<REDACTED_USER_ID>`
- `<REDACTED_USER_EMAIL>`
- `<REDACTED_DEPARTMENT_ID>`
- `<REDACTED_LOCATION_ID>`
- `<REDACTED_POSITION_ID>`
- `<REDACTED_TENANT_ID>`
- `<REDACTED_WORKFLOW_NODE_ID>`
- `<REDACTED_TASK_FORM_PAGE_ID>`
- `<REDACTED_ASSIGNEE_LABEL>`

Raw user names, emails, phones, tenant IDs, department IDs, location IDs, position IDs, workflow node IDs, and task form page IDs must not be copied into reusable docs or normalized references.

## Located Workflow

`Test ABC.yap` decoded successfully with large numeric IDs preserved as strings.

Export-proven structure:

- Application shell: `Test ABC`
- Forms found: `1`
- Approval workflow forms found: `1`
- Approval form name: `ABC`
- Workflow type: `2`
- Workflow nodes found: `29`
- Assignment task nodes found: `9`
- Assignment task node type: `MultiAssignmentTask`
- Sequence flow nodes found: `18`
- Start/end nodes found: `2`

Each assignment task stores assignees under:

```text
properties.usertaskassignment
```

The value is an array. Every assignment task in this export has one assignee entry; mixed multi-source assignment is product-documented but not export-proven in this sample.

Common task fields seen on each `MultiAssignmentTask`:

- `properties.duedatedefinition`
- `properties.approveway`
- `properties.approvepercentage`
- `properties.isenabledemail`
- `properties.isallowreassign`
- `properties.isallowsign`
- `properties.allowskip`
- `properties.name`
- `properties.usertaskassignment`
- `properties.taskurl`

Common approval settings in this export:

- `approveway`: `allapprove`
- `approvepercentage`: `100`
- `isenabledemail`: `false`
- `isallowreassign`: `false`
- `isallowsign`: `false`
- `allowskip`: `true`
- `taskurl`: redacted task form page reference

## Assignment Task Inventory

| Task | Node index | Assignee classification | Export-proven entry shape | Expression source | Static references | Approval mode | Runtime dependencies | Confidence |
|---:|---:|---|---|---|---|---|---|---|
| 1 | 9 | applicant department manager | `type=user`, `method=expression`, `value`, `title` | `Applicant:Department:Manager`; outer expression resolves applicant department then `Manager` | none | `allapprove`, `100` | applicant user context, department hierarchy/manager data, user directory data | export-proven |
| 2 | 11 | direct job position | `type=position`, `method=position`, `position`, `title` | none | `<REDACTED_POSITION_ID>` | `allapprove`, `100` | position assignments | export-proven |
| 3 | 13 | direct job position | `type=position`, `method=position`, `position`, `title` | none | `<REDACTED_POSITION_ID>` | `allapprove`, `100` | position assignments | export-proven |
| 4 | 15 | position by selected department | `type=position`, `method=positionorg`, `position`, `value`, `title` | none | `<REDACTED_POSITION_ID>`, `<REDACTED_DEPARTMENT_ID>` | `allapprove`, `100` | position assignments, department hierarchy | export-proven |
| 5 | 18 | position by applicant department | `type=position`, `method=positionorgexpr`, `position`, `value`, `title` | `Applicant:Department`; expression references applicant user context and `OrganizationID` | `<REDACTED_POSITION_ID>` | `allapprove`, `100` | applicant user context, position assignments, department hierarchy | export-proven |
| 6 | 20 | position by selected location | `type=position`, `method=positionloc`, `position`, `value`, `title` | none | `<REDACTED_POSITION_ID>`, `<REDACTED_LOCATION_ID>` | `allapprove`, `100` | position assignments, location assignments | export-proven |
| 7 | 22 | position by applicant location | `type=position`, `method=positionlocexpr`, `position`, `value`, `title` | `Applicant:Location`; expression references applicant user context and `LocationID` | `<REDACTED_POSITION_ID>` | `allapprove`, `100` | applicant user context, position assignments, location assignments | export-proven |
| 8 | 24 | applicant line manager | `type=user`, `method=expression`, `value`, `title` | `Applicant:Line Manager`; expression references applicant user context and `LineManager` | none | `allapprove`, `100` | applicant user context, user directory data | export-proven |
| 9 | 27 | specific user | `type=user`, `method=direct`, `value`, `title` | none | `<REDACTED_USER_ID>` | `allapprove`, `100` | valid target-tenant user | export-proven |

## Normalized References

Created under:

```text
docs/studies/normalized/workflow-assignment-task-assignees/
```

Files:

- `assignment-assignee-inventory.normalized.json`
- `assignment-assignee-specific-user.normalized.json`
- `assignment-assignee-applicant-line-manager.normalized.json`
- `assignment-assignee-department-manager.normalized.json`
- `assignment-assignee-job-position.normalized.json`
- `assignment-assignee-position-by-department.normalized.json`
- `assignment-assignee-position-by-applicant-department.normalized.json`
- `assignment-assignee-position-by-location.normalized.json`
- `assignment-assignee-position-by-applicant-location.normalized.json`

Not created because not found in this export:

- specific multiple users
- generic workflow-variable assignee
- user group assignee
- position by department plus location in one assignee entry
- mixed static plus expression assignee list
- selected department manager as a static department manager entry distinct from position-by-department

## Export-Proven Assignee Patterns

### Specific User

Proof level: `export-proven`

Shape:

```json
{
  "type": "user",
  "method": "direct",
  "value": "<REDACTED_USER_ID>",
  "title": "<REDACTED_ASSIGNEE_LABEL>"
}
```

Generation note: tenant-sensitive. Do not generate with hardcoded private user IDs unless the target tenant mapping is explicitly authorized and validated. Prefer applicant/current-user expression assignment or a safe user-selection field for generic packages.

### Applicant Line Manager

Proof level: `export-proven`

Shape:

```json
{
  "type": "user",
  "method": "expression",
  "value": {
    "kind": "expressionButton",
    "label": "Applicant:Line Manager",
    "dataShape": {
      "type": "user",
      "param": {
        "id": {
          "parseStatus": "opaque",
          "expressionSourceHints": {
            "props": ["ApplicantUserID"],
            "usesApplicantUserId": true
          }
        }
      },
      "prop": "LineManager"
    }
  },
  "title": "<REDACTED_ASSIGNEE_LABEL>"
}
```

Generation note: depends on runtime applicant context and user profile manager data. Export-proven only; routing behavior requires focused runtime proof.

### Applicant Department Manager

Proof level: `export-proven`

Shape:

```json
{
  "type": "user",
  "method": "expression",
  "value": {
    "kind": "expressionButton",
    "label": "Applicant:Department:Manager",
    "dataShape": {
      "type": "org",
      "param": {
        "id": {
          "parseStatus": "opaque",
          "expressionSourceHints": {
            "props": ["ApplicantUserID", "OrganizationID"],
            "usesApplicantUserId": true
          }
        }
      },
      "prop": "Manager"
    }
  },
  "title": "<REDACTED_ASSIGNEE_LABEL>"
}
```

Generation note: depends on applicant department and department manager configuration. The Help Center describes parent-department fallback behavior when a lower department has no manager, but that fallback is product-documented, not export-proven by this package.

### Direct Job Position

Proof level: `export-proven`

Shape:

```json
{
  "type": "position",
  "method": "position",
  "position": "<REDACTED_POSITION_ID>",
  "title": "<REDACTED_ASSIGNEE_LABEL>"
}
```

Generation note: requires a valid target-tenant position. Use only when authorized org/reference data is available.

### Job Position By Selected Department

Proof level: `export-proven`

Shape:

```json
{
  "type": "position",
  "method": "positionorg",
  "position": "<REDACTED_POSITION_ID>",
  "value": "<REDACTED_DEPARTMENT_ID>",
  "title": "<REDACTED_ASSIGNEE_LABEL>"
}
```

Generation note: requires a valid target-tenant position and department pairing.

### Job Position By Applicant Department

Proof level: `export-proven`

Shape:

```json
{
  "type": "position",
  "method": "positionorgexpr",
  "position": "<REDACTED_POSITION_ID>",
  "value": {
    "kind": "expressionButton",
    "label": "Applicant:Department",
    "dataShape": {
      "type": "user",
      "prop": "OrganizationID"
    }
  },
  "title": "<REDACTED_ASSIGNEE_LABEL>"
}
```

Generation note: depends on applicant context, department hierarchy, and position assignment data.

### Job Position By Selected Location

Proof level: `export-proven`

Shape:

```json
{
  "type": "position",
  "method": "positionloc",
  "position": "<REDACTED_POSITION_ID>",
  "value": "<REDACTED_LOCATION_ID>",
  "title": "<REDACTED_ASSIGNEE_LABEL>"
}
```

Generation note: requires valid target-tenant location and position data.

### Job Position By Applicant Location

Proof level: `export-proven`

Shape:

```json
{
  "type": "position",
  "method": "positionlocexpr",
  "position": "<REDACTED_POSITION_ID>",
  "value": {
    "kind": "expressionButton",
    "label": "Applicant:Location",
    "dataShape": {
      "type": "user",
      "prop": "LocationID"
    }
  },
  "title": "<REDACTED_ASSIGNEE_LABEL>"
}
```

Generation note: depends on applicant context, location setup, and position assignment data.

## Help Center Comparison

| Help Center concept | Export-proven field/shape from `Test ABC.yap` | Match status | Notes | Proof level |
|---|---|---|---|---|
| Assignment Task action creates approval/complete work for assigned users | `MultiAssignmentTask` nodes with `properties.usertaskassignment`, approval settings, and task form `taskurl` | matched | Export has approval-style tasks; task type field is not present in these nodes. | product-documented + export-proven |
| Task assignee can be single or multiple users | Every export task has `usertaskassignment` array with one entry | partially matched | Array shape supports multiple entries, but multiple users were not present. | product-documented + export-proven partial |
| Specific direct user | `type=user`, `method=direct`, `value`, `title` | matched | Values are redacted. | product-documented + export-proven |
| Expression-based assignee | `type=user`, `method=expression`, rich HTML expression button in `value` | matched | Export includes applicant line manager and applicant department manager expressions. | product-documented + export-proven |
| Applicant/requester line manager | expression label `Applicant:Line Manager`, `prop=LineManager` | matched | Depends on applicant user context and manager profile data. | product-documented + export-proven |
| Applicant/requester department manager | expression label `Applicant:Department:Manager`, outer `type=org`, `prop=Manager` | matched | Parent-department fallback is product-documented but not visible in export schema. | product-documented + export-proven |
| Selected department manager | no distinct static department-manager entry found | not found in export | Static department reference appears only as position-by-department, not direct manager. | product-documented + unproven |
| Direct job position | `type=position`, `method=position`, `position`, `title` | matched | Two tasks use this shape. | product-documented + export-proven |
| Job position by selected department | `type=position`, `method=positionorg`, `position`, `value`, `title` | matched | `value` is the selected department reference. | product-documented + export-proven |
| Job position by applicant/current department | `type=position`, `method=positionorgexpr`, expression label `Applicant:Department` | matched | Uses applicant context and `OrganizationID`. | product-documented + export-proven |
| Job position by selected location | `type=position`, `method=positionloc`, `position`, `value`, `title` | matched | `value` is the selected location reference. | product-documented + export-proven |
| Job position by applicant/current location | `type=position`, `method=positionlocexpr`, expression label `Applicant:Location` | matched | Uses applicant context and `LocationID`. | product-documented + export-proven |
| Job position by department plus location | no combined department/location shape found | not found in export | Do not generate until export/runtime evidence exists. | product-documented terminology only if applicable + unproven |
| User group assignee | no user group assignment entry found | not found in export | Mentioned in Assignee Editor behavior reference, but not export-proven here. | product-documented + unproven |
| Workflow variable assignee | no workflow-variable assignee entry found | not found in export | Mentioned in Assignee Editor behavior reference, but not export-proven here. | product-documented + unproven |
| Appointed order sequential/parallel | no `issequential` field found in this export's task properties | not found in export | Existing action reference lists `properties.issequential`, but this sample did not include it. | product-documented + implementation-reference |
| Completion condition all/any/custom percentage | `approveway=allapprove`, `approvepercentage=100` | partially matched | Other modes are in existing action reference, not in this export. | product-documented + export-proven partial |
| Task form association | `properties.taskurl` points to a redacted task form page id | matched | Task form settings are secondary in this study. | product-documented + export-proven |
| Reassign/add-assignee buttons | `isallowreassign=false`; no add-assignee field observed | partially matched | Sign/additional assignee behavior not proven by this export. | product-documented + export-proven partial |
| Email/notification settings | `isenabledemail=false`; notification fields absent | partially matched | Notification settings are secondary in this study. | product-documented + export-proven partial |

## Validator Recommendations

Warning-first validator support is appropriate:

- identify `MultiAssignmentTask` nodes
- warn when `properties.usertaskassignment` is missing, not an array, or empty
- warn when an assignee entry is not an object
- warn when `type` or `method` is missing
- warn when method is outside the export-proven set: `direct`, `expression`, `position`, `positionorg`, `positionorgexpr`, `positionloc`, `positionlocexpr`
- warn when position-based assignment lacks `position`
- warn when static direct/department/location assignment lacks `value`
- warn when expression assignment lacks an expression-button-shaped `value`
- warn that direct user assignment is tenant-sensitive

Do not add hard errors in compatibility mode from this study. Existing packages may omit optional fields or use unstudied tenant-specific shapes.

## Generation Rules

- Treat these shapes as export-proven schema references, not runtime-proven routing behavior.
- Do not invent assignee methods beyond the export-proven set.
- Specific direct-user assignment requires explicit authorized target-tenant user mapping or safe read-only directory lookup.
- Position, department, and location assignment requires valid target-tenant org/reference data.
- If org/reference lookup is authorized, use `yeeflow-api-operator` read-only lookup and never commit raw API responses or private org data.
- For generic generated packages, prefer applicant/current-user expression routing or user-selection field patterns over hardcoded direct users.
- Do not claim selected department manager, user group, workflow variable, multiple users, or mixed assignee lists as generation-safe from this export alone.

## Runtime-Test Plan

A focused runtime baseline is recommended before merge if these rules will be promoted beyond export-proven/validator-backed guidance.

Suggested minimal runtime baseline:

1. Build a small approval app with one request form and one task form.
2. Include one assignment task per assignee class to test, starting with:
   - applicant line manager
   - applicant department manager
   - direct job position
   - job position by applicant department
   - job position by applicant location
3. Use safe target-tenant org data selected through authorized read-only lookup or user-provided non-private setup.
4. Locally validate package, graph, workflow action configuration, and secret scans before import.
5. Import/open only after local validation passes.
6. Submit only disposable requests with explicitly safe assignees.
7. Record whether tasks route to expected safe users/positions without exposing identities.

Do not execute workflow, send notifications, or expose user identities unless the runtime test scope is explicitly safe.

## Known Gaps

- Runtime routing is not proven.
- Multiple direct users are not found in this export.
- Mixed assignee sources in one task are not found in this export.
- User group assignee is not found in this export.
- Workflow variable assignee is not found in this export.
- Position by department plus location is not found in this export.
- Selected department manager as a direct static manager shape is not found in this export.
- Parent-department manager fallback is product-documented but not export-proven.
- Notification, due-date, quick-completion, and task-form settings are secondary in this study and not fully normalized here.
