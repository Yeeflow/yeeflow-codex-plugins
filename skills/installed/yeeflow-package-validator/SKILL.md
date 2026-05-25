---
name: yeeflow-package-validator
description: Standardize Yeeflow package validation before import or runtime testing. Use when Codex generates or edits a .yap package, validates Yeeflow data lists, forms, workflows, dashboards, custom code, or expressions, diagnoses package import/materialization issues, or decides whether runtime import is safe.
---

# Yeeflow Package Validator

## Core Rule

Validate before import. Do not runtime-test a package with blocking structural, graph, wrapper, workflow, list, field, materialization, FlowKey, or unsafe `.yapk` issues.

New application creation may output `.yap`. Existing app upgrade `.yapk` remains read-only and server-generated until Yeeflow signing and Resource mechanics are proven.

Validation is not runtime proof. When validating a newly learned capability, report whether the package is export-proven, validator-backed, import-proven, configuration-visible, render-only, partial, or runtime-proven. Use validator hard errors only for proven invalid generated shapes; otherwise prefer warnings/dependencies and require a focused runtime baseline before broad runtime claims.

## Validation Workflow

1. Identify the package type and source of truth. Preserve generated `.yap` files unless the task explicitly asks to regenerate them.
2. Run available repo validators for package, graph, workflow, data list, wrapper round trip, materialization, expressions, dashboards, and custom code.
3. Inspect field/list integrity and FlowKey safety.
4. Classify every finding as blocking, warning, or informational.
5. Decide whether import/runtime testing is safe.
6. Report exact commands, files checked, findings, and next actions.

Use [package-validation-lifecycle.md](references/package-validation-lifecycle.md) for the detailed sequence.

## Planning Coverage Inputs

When a generated package comes from a full application build, compare validation scope against its `Capability Coverage Plan` when available. The validator guidance should make sure selected capabilities are actually checked and partial/deferred capabilities are not accidentally promoted to runtime-ready claims.

Planning-sensitive checks include signed `System.Int64` ID boundaries, AI Agent/Copilot numeric `Publisher`, document-library Type `16` and folder rules, Doc library control references, data-list and scheduled workflow designer metadata, `QueryData`/`AI`/`MailTask` references, application settings navigation/header/user-group structures, app-resource access tool permissions, and secret/private-data scans. This is a validation-scope check, not a reason to add new hard errors unless the invalid shape is already proven.

## Required Validation Areas

Load [yap-materialization-rules.md](references/yap-materialization-rules.md) when package materialization or import safety is in scope. Check:

- `validate-yap-package`
- `validate-yap-graph`
- `validate-ywf-def`
- `validate-ydl-list`
- workflow action config validation
- expression smoke tests
- wrapper round trip
- materialization inspection
- custom code inspection
- dashboard inspection
- FlowKey safety
- prefix or `pr<id>x` corruption checks
- app-wide unique `FieldID`
- `field.ListID` equals parent data list `ListID`
- unique `FieldName`, `InternalName`, and `DisplayName` inside each list
- no remapping of `TenantID`, `CreatedBy`, or `ModifiedBy`
- no numeric-looking generated ID exceeds signed `System.Int64` range (`9223372036854775807`), especially `LayoutID`
- generated app-contained AI Agent/Copilot resources use numeric `Publisher`, normally `0`, rather than `null`
- data-list workflow DefResource includes designer-open metadata: pageurls array, variables.basic/listref/filter arrays, flowPage array, graphposition, graphzoom, graphver, childshape id/resourceid, node position, and SequenceFlow source/target id/resourceid
- generated data-list Add Item triggers keep `FlowMappings.Setting.NewTrigger = true`, `FlowMappings.FieldName = null`, and `Data.Forms[].Settings = null`
- app-resource access tool `resources.dataLists.items[]` entries use compact `id` plus numeric bitmask `permissions`
- application settings validate root `LayoutView.sort[]`, navigation groups, app-resource menu references, `attrs["navigator-menu"].position`, header `attrs.appearance`, and `Data.AppGroups[]`

For document libraries, also check:

- `ListModel.Type = 16`
- root app navigation references the library as `Type = 16` for mixed/richer apps; document-library-only packages may use the sample-proven root `LayoutView = {"sortVer":1}` with no Type `103` page or nav, reported as warnings
- top-level `Resource.SimplePortal = null`
- default fields exist: `Title`, `Bigint1`, `Text1`, `Bigint2`, `Text2`, `Text3`, and `Text4`
- `Text4` uses `Type = "file-upload"` and library upload rules
- `Title` keeps document-library native metadata and is not forced into normal data-list `Status = 0`
- field `ListID` values match the parent library `ListID`
- `FieldID` values are unique across the app
- Type `0` view field references resolve when view JSON is present
- Type `1` custom form bindings resolve to library fields
- partial document-library `ListModel.LayoutView` assignments are warnings; the runtime-proven minimal base is the `New Document Library` shape with default Type `0` view `LayoutView = ""` and the single `New file` form unassigned, while configured libraries assign `add`, `edit`, and `view` together
- multiple Type `16` document libraries with simple custom fields and configured Type `0` views are runtime-accepted by the `Enterprise Document Center` v2 pass
- root-level folder rows are runtime-accepted when `Text1 = "folder"`, `Bigint1 = "0"`, `Bigint2 = ""`, `Text2 = ""`, `Text3` carries the export-style unique name, `Text4` is omitted, and folder IDs are included in `ReplaceIds`
- nested folder rows should warn unless their nonzero `Bigint1` parent resolves to another folder row
- folder rows should warn if they include uploaded file payloads or document binaries
- generated packages do not embed raw file/document payloads unless focused runtime export-back proof exists

For Doc library controls on dashboards and form-hosted JSON surfaces, also check:

- controls use `type = "document-library"`
- `attrs.data.list.ListID` resolves to an included Type `16` document library
- `attrs.data.list.Type` is `16`
- `attrs.listarr[].Field` values resolve to target library fields
- `attrs.data.folder.path` folder IDs resolve to `ListDatas` rows in the target library when present
- folder rows referenced by controls use `Text1 = "folder"` and contain no `Text4` upload payload
- `attrs.caption.layout` resolves to a layout on the target document library when present; accept concrete large numeric layout IDs for enum placeholders such as `{LayoutID}`
- caption `display`, `add`, and `search` values are booleans when present
- dynamic `attrs.data.customPath` is an expression-token array when present; warn rather than claim runtime proof
- document-library custom-form controls are runtime-proven for root-bound display and disabled search/add; approval-form controls remain partial until live published request-page proof; data-list custom-form controls remain validation-only

For shared data views on list-like resources, also check:

- each data-list, document-library, or Form Report child resource has at least one view where the resource shape expects views
- exactly one default view is present where possible, detected by `IsDefault = true`
- view names and parsed `Ext1.Url` keys are unique within a resource
- known view type codes are `0` list, `999` gallery, `104` kanban, and `100` calendar
- visible columns in `LayoutView.layout[]`, fixed filters in `LayoutView.filter[]`, user filters in `LayoutView.query[]`, sort fields in `LayoutView.sort[]`, and type-specific field selectors resolve to resource fields or known system fields
- unknown view types, opaque permission audiences, and Type `16`/Type `32` advanced view settings should warn rather than fail until matching exports prove the exact schema
- Form Report `LayoutView.Attr_IsViewDetail` is recognized as the detail-page access flag, but row-click/detail behavior is not runtime proof

For Form Reports, also check:

- `Data.FormNewReports[]` entries parse `Settings` JSON with `Fields`, `Filters`, and `SubListID`
- `Data.FormNewReports[].DefKey` resolves to an included approval form key
- matching `Data.Childs[]` resource exists with `ListModel.Type = 32` and `ListModel.ListID = FormNewReports[].ID`
- Form Report child resources do not define workflows, public edit/create forms, or sample data mutation surfaces
- field keys/internal names are unique inside the report
- fields reference source approval variables or selected sub-list fields
- variable-to-report-field mappings are compatible when known
- additional settings are present for number, percent, currency, switch, date/time, picker, metadata, and lookup report fields
- no more than one sub-list is selected; warn if multiple-sub-list generation is attempted
- if a sub-list is selected, selected sub-list field mappings exist
- inherited permissions and view detail-page access flags are recognized
- unknown custom permission audiences, export audience details, row multiplication, row-click behavior, Excel export execution, and data-source use are warnings/runtime-sensitive, not runtime proof

## Severity

Use [validation-error-severity.md](references/validation-error-severity.md) to decide what blocks import. When uncertain, mark the finding as blocking until a proven Yeeflow import/runtime counterexample exists.

## Reporting

Report validation as:

- package path and package type
- validators and inspections run
- blocking issues
- warnings
- accepted risks
- runtime import decision
- exact follow-up needed

Do not claim runtime proof from local validation alone.

<!-- agent-copilot-application-resource-learning:start -->
## AI Agent/Copilot Validation Addendum

Validate app-level OtherModules for Connections, Agents, and Knowledges. Count AI Agent resources as Agents module entries with Type = 0 and Copilots as Type = 1. Validate Settings/Draft JSON, Components arrays, tool Settings.Data.Value references, connected-Agent references, connection references, publisher metadata, and redaction-sensitive Config keys.

Use hard errors only for generated-final invalid JSON, missing generated IDs, missing/null/non-numeric generated AI resource `Publisher`, unresolved generated-final tool references, invalid app-resource access list entries or non-numeric permissions, list-workflow designer shape gaps, signed `System.Int64` overflow IDs, or embedded secret/token/password/API-key values. Use warnings/dependencies for connection-backed tools, credentialstype/run-as settings, OpenAPI operations, application-resource access, and runtime-sensitive external calls.
<!-- agent-copilot-application-resource-learning:end -->

<!-- scheduled-workflow-ai-assistant-learning:start -->
## Scheduled Workflow Validation Addendum

Validate app-level Scheduled Workflow resources as `Data.Forms[]` entries with `WorkflowType = 3`, `ListID = 0`, parseable JSON `Settings`, and parseable JSON `DefResource`. `Settings` should include `TimeZone`, `Times[]`, `StartDate`, `Frequency`, and `Interval`; weekly schedules use `Values[]`, and daily working-day schedules use `IsWorkday: true`.

`Workflow Actions Runtime Baseline (1).yap` proves scheduled workflow Start/Assignment action coverage: `StartNoneEvent` has no incoming flow, has email-notification fields, and omits approval-only terminate/recall fields; scheduled `MultiAssignmentTask` can use the same `properties.usertaskassignment[]` family with an Applicant Line Manager expression. Validate this warning-first and do not require data-list field expression sources in scheduled workflows unless another scheduled export proves them.

For workflow actions, validate `MailTask` recipient/subject/body presence, warn on fixed literal recipients, validate `QueryData` target list references and multi-result output variables, and validate `AI` agent-mode actions resolve `properties.data.AgentID` to an included app AI Agent. `Spark & AI (1).yap` adds proven checks for data-list workflow AI usage: `inputVariables[]` and `outputVariables[]` should be arrays, image inputs can be `type = "img"` with list-field mappings using `valueType = "icon-upload"` or `file-upload`, and data-list workflows should be registered on the host list through `FlowMappings[]` with `Setting.NewTrigger = true` when they are new-item triggered. The Asia Tech manual workflow comparison adds that Add Item new-item triggers should use `FlowMappings.FieldName = null` and `Data.Forms[].Settings = null`; non-null field bindings belong only to separately proven flow-status conditions. For import/open-safe generated baselines, a resolved local `AI` action with no credentials is a runtime-sensitive dependency rather than a package-blocking error; unresolved Agent references, unresolved `QueryData` targets, unresolved app-resource tool list references, unsafe real recipients, embedded secrets, and credential-bearing external actions remain blockers. Treat AI execution, image analysis, and row-update tools as runtime-sensitive unless explicitly configured for a safe sandbox.
<!-- scheduled-workflow-ai-assistant-learning:end -->

<!-- workflow-assignment-task-assignee-learning:start -->
## Workflow Assignment Task Assignee Validation Addendum

Validate `MultiAssignmentTask.properties.usertaskassignment[]` warning-first. `Test ABC.yap` export-proves methods `direct`, `expression`, `position`, `positionorg`, `positionorgexpr`, `positionloc`, and `positionlocexpr`; each entry should include `type`, `method`, and `title`, with `value` for direct/static/expression forms and `position` for position-based forms. `Test ABC (1).yap` adds multiple assignee entries, user-group expression, position all-users expression, `issequential`, `approveway` variants, custom percentage, and email notification fields. `Test ABC (2).yap` adds absent `tasktype` approval/default, `tasktype="complete"`, due-date fields, working-calendar flag, and `notifyrules[]` reminder timing. `Test ABC (3).yap` adds approval-form Start action `terminate`, `terminate-conditions`, `revoke-conditions`, and Start email notification. `Purchase Requests.ydl` adds data-list workflow Start email settings without terminate/recall fields, list-item assignee expressions such as Created By -> LineManager, and data-list task form controls with `isListControl` plus `____customListFields_` bindings. Warn for missing/empty/opaque assignee config, unknown methods, missing position references, missing static values, expression values that are not expression-button-shaped strings, list-item assignee expressions that lack runtime proof, direct-user tenant sensitivity, unknown task type, malformed due-date/reminder settings, malformed Start action condition settings, email-enabled nodes missing recipient/subject/body fields, and unresolved data-list task-form field bindings. Do not hard-error compatibility exports or claim routing, Complete task execution, due-date scheduling, recall/terminate behavior, data-list list-field routing, task-form save/edit behavior, or email delivery proof until a focused runtime baseline passes.

`Workflow Actions Runtime Baseline (2)_Task forms.yap` adds approval workflow task-form validation guidance. Validate `Data.Forms[].DefResource.pageurls[]` warning-first: submission pages use `type=1`, task pages use `type=2`, and `MultiAssignmentTask.properties.taskurl` should resolve to a task page. Warn when a task form is missing, unresolved, or likely incompatible with the task type. Warn when custom `action_button.attrs.control_action` values are missing, unresolved, or point to an action whose Submit form operation does not match the button label. `Workflow Action Approval Test.ywf` corrects the Add others/Add assignee binding and should be used as the positive reference: Add others resolves to `submitType = "5"`, Reject resolves to `submitType = "2"`, Reassign resolves to `submitType = "4"`, and Complete resolves to a complete/default submit action by task context. The focused `Workflow Task Form Runtime Baseline` imported, opened, rendered the task-form selector and workflow designer, and published successfully, so the task-form configuration family is import/open/designer/publish-proven. Warn when reassign/add-assignee Submit form steps lack a user-valued expression, when comment/remark expressions reference missing variables, or when custom complete/approval operations are paired with the wrong `tasktype`. Treat Action Panel buttons as derived from task context; do not require explicit child buttons under `workflowControlPanel`. Do not claim task operation execution, task-owner field persistence, reassign/add-assignee behavior, Complete task execution, or email delivery until a safe operation-level baseline observes them.

`Workflow Actions Runtime Baseline (3)_Claim task.yap` adds Claim Task validation guidance. Validate `CandidateTask` warning-first: receiver/candidate config should live in `properties.usertaskassignment[]`, task forms should resolve through `properties.taskurl`, explicit `tasktype` should be `approve` or `complete`, due-date/email fields should preserve their studied shapes, and data-list Created By/list-item receiver expressions should remain expression-button strings. Warn on the config-reference typo `properties.tasktype ` with a trailing space because the export uses `properties.tasktype`. Do not treat Claim Task claim-pool behavior, group expansion, list-field expansion, claim locking, quick completion, or email delivery as validator/runtime proof.

`Workflow Actions Runtime Baseline (4)_Set variable.yap` adds Set variable validation guidance. Validate `SetVariableTask` warning-first: `properties.formtype` should be `current` or `custom`, `properties.variablesetting[]` should be a nonempty array, and each assignment should include `idx`, `id`, `name`, `type`, and an expression-token-array `value`. For `formtype="custom"`, warn if `properties.data.AppID`, `properties.data.ListSetID`, `properties.data.ProcKey`, or `properties.formids` is missing. Warn that data-list `exprType="list_field"` values are export-proven only as right-side expressions; Set variable should not be used as proof of list-field mutation.

`Workflow Actions Runtime Baseline (5)_Set data list.yap` adds Set data list validation guidance. Validate `ContentList` warning-first: `properties.listtype` should be `current` or `select`, `properties.type` should be `add`, `edit`, or `remove`, selected-list mode should include `appid`, `listsetid`, and `listid`, and add/edit should include `properties.listdatas[]`. Each mapping should include `Columns`, `Per`, and expression-token-array `Data`; export-proven `Per` codes are `0`, `1`, `2`, `3`, and `4`. Edit/remove should include nonempty `properties.wheres[]`; warn strongly when filters are missing or empty because update/delete is high-impact. Data-list `exprType="list_field"` values and sub-list/detail mappings are export-proven schema only. Do not treat record mutation, current-list update, document-library mutation, numeric operation execution, or sub-list row iteration as runtime proof.

`Workflow Actions Runtime Baseline (6)_Signal event.yap` adds Signal event validation guidance. Validate `SignalEvent` warning-first: it should have no incoming flow, at least one outgoing flow, and nonempty `properties.eventdefinitions[]` containing `CancelEventDefinition` and/or `RevokeEventDefinition`. Graph validation should allow `SignalEvent` as a no-incoming event-source component root alongside `StartNoneEvent`. Warn if Signal event appears outside approval-form workflows until an export proves another host, and reuse Set data list broad-filter checks for downstream cleanup branches. Do not treat recall/terminate firing or cleanup mutation as runtime proof.
<!-- workflow-assignment-task-assignee-learning:end -->

<!-- application-settings-navigation-user-groups-learning:start -->
## Application Settings Validation Addendum

Validate application settings from the root app `Data.Item.ListModel.LayoutView` JSON string. Menu structure lives in `sort[]`; menu layout lives in `attrs["navigator-menu"].position`; header appearance lives in `attrs.appearance`.

Use hard errors for generated-final malformed structures: unparseable `LayoutView`, invalid layout position values, nested navigation groups, depth greater than two, group missing text, non-object menu items, resource children on non-group items, missing resource references, non-boolean `IsHidden`, non-boolean `hideTitle`, and invalid header height types. Use warnings for runtime-sensitive or partially understood shapes such as unstudied positive header heights, null icons, member-looking app-group fields, process/link menu items, and group IDs missing from `ReplaceIds`.

Runtime-proven layout values for generated packages are `default`, `left`, `onheader`, and `none`. Runtime-proven no-icon is `Icon: ""`; custom `DisplayName`, omitted `DisplayName` resource-name fallback, `Type: "classes"` groups, and `list[]` child resources are runtime-proven. App user groups are `Data.AppGroups[]` records with `ID`, `Name`, and `Description`; empty groups are settings-visible runtime-proven and group IDs belong in `ReplaceIds`, but member schema is not export-proven. Generated packages must not embed real user emails or private identities in app group metadata.

Workflow assignment task assignee validation should remain warning-first in compatibility mode. `Test ABC (1).yap` export-proves multiple `MultiAssignmentTask.properties.usertaskassignment[]` entries, user-group expression, position all-users expression, `issequential=true`, absent-`issequential` parallel/default shape, `approveway` variants, custom percentage, and email notification fields. Validators should warn for unknown assignee methods, unknown `approveway`, invalid `issequential`, missing custom percentage, and incomplete email notification shape, but should not hard-error existing exports solely from this study.

For assignment-routing API coverage, `yeeflow-api-operator` can safely confirm documented read-only categories for users, user detail, departments, locations, location detail, positions, position assignments, groups, and group members. This supports validation/planning only; do not turn API-readable org data into hard package errors or runtime-routing claims.
<!-- application-settings-navigation-user-groups-learning:end -->
