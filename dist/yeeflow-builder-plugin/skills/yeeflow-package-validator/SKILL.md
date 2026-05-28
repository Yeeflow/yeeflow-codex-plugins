---
name: yeeflow-package-validator
description: Standardize Yeeflow package validation before import or runtime testing. Use when Codex generates or edits a .yap package, validates Yeeflow data lists, forms, workflows, dashboards, custom code, or expressions, diagnoses package import/materialization issues, or decides whether runtime import is safe.
---

# Yeeflow Package Validator

Business Travel runtime-practice update: `yap-v1-schema_v2.json` and the Business Travel repair pass make `ListModel.Flags = 1` mandatory for generated root and child list-like resources. `ListModel.Status` is schema-fixed to `1` when present, and `ListModel.Type` must be one of `1`, `16`, `32`, `64`, `128`, or `1024`. Import, app open, workflow open, and workflow publish are user-proven for the fixed Business Travel package only. Workflow publish blockers must still be caught separately for new packages: sequence-flow conditions, Set Variable targets, task-assignment expressions, form bindings, and summaries must reference declared workflow variables; direct position assignees require numeric position IDs and must never use placeholders such as `__POSITION_ID_REQUIRED_*__`. Workflow execution, request submission, routing, data mutation, and true Finance Manager assignment remain unproven.

YAPK-from-scratch validation update: validate generated `.yapk` content before signing. Decoded `AppPackageInfo` must pass package/app creation checks, graph checks, workflow publish-readiness checks, and placeholder scans before Brotli/base64/sign. Treat `YAPK_CONTENT_VALIDATION_FAILED_BEFORE_SIGNING` as blocking. `setsign` and `verifysign` prove wrapper/resource integrity only; they do not prove generated-app correctness, workflow publish-readiness, workflow execution, or tenant-specific routing.

## Core Rule

Validate before import. Do not runtime-test a package with blocking structural, graph, wrapper, workflow, list, field, materialization, FlowKey, or unsafe `.yapk` issues.

New application creation may output `.yap`. Existing app upgrade `.yapk` validation should defer to `yeeflow-yapk-package-generator`. Product schema defines `.yapk` as `AppExportPackageInfo` with `Resource` described as Brotli-compressed `AppPackageInfo`. Treat `.yapk` content generation as proof-boundary-sensitive until the exact generated content type passes Resource decode/edit/encode/sign/verify/runtime-upgrade.

Validation is not runtime proof. When validating a newly learned capability, report whether the package is export-proven, validator-backed, import-proven, configuration-visible, render-only, partial, or runtime-proven. Use validator hard errors only for proven invalid generated shapes; otherwise prefer warnings/dependencies and require a focused runtime baseline before broad runtime claims.

Data Filter validation: use `scripts/inspect-data-filter-controls.mjs` with dashboard packages and enforce the rules from `docs/studies/data-filter-controls.md`. Value-producing Data Filter bindings must resolve to `page.filterVars[]`; downstream `__filter_` expression tokens in `attrs.data.filter[]`, `attrs.data.fulltext[]`, `attrs.data.sortingfilter[]`, and `exts[].attr.settings.Conditions[]` must resolve; click-apply filters must reference an existing Apply button; explicit Remove filters targets must resolve when present; Search, Radio, Hierarchy, and Sorting variants are dashboard export-proven from the CRM sample; unknown filter control types and unsupported variable shapes should warn first unless export evidence proves them invalid. `docs/studies/data-filter-controls-runtime-proof.md` adds generated dashboard import/open/render proof for Search, Radio, Range, Sorting, Apply button, and downstream table/chart surfaces, but does not upgrade Remove filters reset, Hierarchy interaction, all operators, approval-form filters, or data-list-form filters to runtime-proven.

Pivot Table validation: use `scripts/inspect-pivot-table-controls.mjs` with dashboard packages and enforce the rules from `docs/studies/pivot-table-control.md`. Pivot Table dashboard controls must have a matching `page.exts[]` `PivotTable` entry; the data source must resolve to a supported list-like source; row, column, and value fields must resolve to source fields; `SUM`, `AVG`, `MIN`, and `MAX` require compatible numeric/currency fields where detectable; date grouping must only be applied to date/time fields; and filter condition fields plus `__filter_<filterVarId>` variable references must resolve. Generated-final validation should fail unresolved Pivot Table references, unsupported Approval Form/Public Form hosts, and incompatible generated aggregations. Unknown schema variants should warn first in compatibility/source-export mode unless a focused export proves them invalid. This is export-proven and validator-backed, not runtime proof.

Seed/add-readiness validation: `docs/studies/pivot-table-control-runtime-proof.md` strongly indicates that v1 missing seed rows and Add failed came from crossed data-list field storage metadata caused by cloning `Defs[]` by array position. Generated-final validation must hard-error `FIELD_NAME_FIELDTYPE_MISMATCH`: `Text*` fields need text storage, `Datetime*` fields need date/datetime storage, `Decimal*` fields need decimal/number storage, `Bigint*` fields need integer storage, and `Bit*` fields need boolean storage. Use the app-creation rules inspector and aggregate import-readiness gate before handing off analytics/demo packages with seed data.

LayoutView add-form readiness: `docs/studies/data-list-layoutview-add-form-runtime-fix.md` proves a generated Data List can import/open but leave the default `+ New item` modal loading forever when `ListModel.LayoutView` contains only `opentype.add` / `modalsize.add` and no concrete `add` layout reference. The user-confirmed fixed package proves Add modal rendering for the focused generated Container/Button action package when `LayoutView.add/edit/view` resolve to concrete Type `1` layouts and object-shaped display-settings `sort` is omitted. Generated-final validation must hard-error `LAYOUTVIEW_ADD_LAYOUT_MISSING` when a generated Data List lacks a resolvable `LayoutView.add` custom form target, and hard-error unsupported display-settings sort object entries such as `{ SortName, SortByDesc }`. Type `0` view layout sort objects are separate and remain valid only inside `Layouts[].LayoutView`, not `ListModel.LayoutView`. Do not classify Add form save/data mutation or other resource hosts as proven from this package.

Collection/Kanban action validation: use `docs/studies/collection-kanban-actions.md` and `scripts/inspect-collection-kanban-actions.mjs` for dashboard Collection/Kanban local item actions. Generated-final validation should hard-error unresolved item-template `attrs.control_action` references, unresolved page/temp variable references, unresolved current-item fields, unresolved `listitem` target layouts, and unresolved `setdatalist` fields. Validate local `attrs.actions[]` as arrays, prefer local action `type = "coll"`, require nonempty steps, allow export-proven step types (`listitem`, `deleteitem`, `setdatalist`, `setvar`, `confirm`, `otheraction`) and keep unstudied/screenshot-only step types warning-first until export-proven. Bulk selection patterns should validate declared selected IDs/count variables, dynamic display references, and page-level bulk actions. Runtime mutation proof currently covers only the user-tested v2 generated package.

Collection/Kanban runtime-proof validation note: `docs/studies/collection-kanban-actions-runtime-proof.md` records the user-confirmed correct-project v2 runtime pass. Keep the validator gate strict on action bindings, variable references, target layouts, and update fields. Do not reuse earlier wrong-project runtime claims; the runtime proof is limited to the tested v2 package and actions.

Correct-project v2 validation note: `/Users/Renger/Downloads/collection-kanban-actions-runtime-proof.v2.yap` reported zero errors from package validation, graph validation, import-readiness, Collection/Kanban action inspection, and Kanban/Collection Dynamic inspection before the user runtime pass. Warnings are acceptable only when documented as non-blocking and not promoted beyond the tested scope.

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
- `FieldName` storage prefixes aligned with `FieldType`, so generated seed rows and Add new item use runtime-compatible list field storage
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

For Data List permissions and notifications, use `docs/studies/data-list-document-library-permissions-notifications.md`, `scripts/inspect-data-list-permissions.mjs`, and `scripts/inspect-data-list-notifications.mjs`. Validate `ListModel.Perm`, `IsBreakInherit`, `IsItemPerm`, `AdvanceList`, and view-level `Layouts[].IsItemPerm` warning-first. Validate `RemindRules[]` warning-first: parse stringified `Rules` and `Receiver`, recognize notification Type `1` item-added, Type `2` regular reminder, Type `3` date-field reminder, Type `4` item-changed, and recipient Type `1` user, Type `2` department, Type `3` user group, plus `Receiver.ListDefs[]` list-field recipients. Detailed administrator/basic/advanced permission audience matrices are UI-confirmed but not export-located in `Data Lists (1).yap`; do not hard-fail missing detailed audiences or treat them as generation-ready.

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

`docs/studies/data-list-field-creation-runtime-proof.md` upgrades only a focused generated Data List path to runtime-import/open/field-creation proof: representative columns rendered and `Runtime Extra Field` saved without the duplicate-value error. Keep validator warnings for runtime-sensitive field semantics such as lookup value resolution, calculated results, file/image upload behavior, picker selection, sub-list row entry, metadata, and Document Library behavior unless a future focused runtime proof covers them.

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

`Workflow Actions Runtime Baseline (2)_Task forms.yap` adds approval workflow task-form validation guidance. Validate `Data.Forms[].DefResource.pageurls[]`: submission pages use `type=1`, task pages use `type=2`, and generated `MultiAssignmentTask`/`CandidateTask` nodes must resolve to task pages. AP Approval demo runtime practice adds a generated-final hard gate: task nodes must carry `properties.pagetype = 1`, task page references must be mirrored across `taskurl`, `taskUrl`, and `TaskUrl`, and referenced task pages must have outer `pagetype = 1`. Missing/null TaskUrl, unresolved task form IDs, or task pages with outer `pagetype = 2` are hard errors for generated approval workflow packages. Warn when a task form is likely incompatible with the task type. Warn when custom `action_button.attrs.control_action` values are missing, unresolved, or point to an action whose Submit form operation does not match the button label. `Workflow Action Approval Test.ywf` corrects the Add others/Add assignee binding and should be used as the positive reference: Add others resolves to `submitType = "5"`, Reject resolves to `submitType = "2"`, Reassign resolves to `submitType = "4"`, and Complete resolves to a complete/default submit action by task context. The focused `Workflow Task Form Runtime Baseline` imported, opened, rendered the task-form selector and workflow designer, and published successfully, so the task-form configuration family is import/open/designer/publish-proven. Warn when reassign/add-assignee Submit form steps lack a user-valued expression, when comment/remark expressions reference missing variables, or when custom complete/approval operations are paired with the wrong `tasktype`. Treat Action Panel buttons as derived from task context; do not require explicit child buttons under `workflowControlPanel`. Do not claim task operation execution, task-owner field persistence, reassign/add-assignee behavior, Complete task execution, or email delivery until a safe operation-level baseline observes them.

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

<!-- app-creation-rules-learning:start -->
## App Creation Rule Validation Addendum

Use `docs/studies/yeeflow-app-creation-rules.md` and `scripts/inspect-app-creation-rules.mjs` for product-team app creation rules. In generated-final mode, hard-error duplicate `DisplayName`, `FieldName`, and `InternalName` within one list; identifier length above 255; invalid `InternalName` characters; generated non-system `FieldName` missing a numeric suffix; any `FieldName` numeric suffix that does not equal `FieldIndex`; and `FieldName`/`FieldType` storage-family mismatches that can break seeded rows and Add new item behavior.

Hard-error invalid process keys (`Data.Forms[].Key`, `FlowKey`, and decoded `defkey`) when they contain anything outside `[a-zA-Z0-9_]` or exceed 255 characters. For approval forms, hard-error missing or malformed `NoRule`, missing `{index}` in `NoRule.Prefix`, and invalid `StartIndex`, `CustomLength`, or `AutoIncrement`. Unknown list field `Type` values remain warning-first unless a focused runtime/import failure proves a specific type invalid.

Runtime proof update: `docs/studies/yeeflow-app-creation-rules-runtime-proof.md` confirms a fixed workflow field-rule package with these checks imported, opened, and allowed a new data-list field to be saved without the previous duplicate-value error. Keep validator output precise: this proves the field-rule guardrails for the tested package, not workflow routing, data-list workflow execution, or Form Report runtime behavior.
<!-- app-creation-rules-learning:end -->

<!-- data-list-document-library-fields-learning:start -->
## Data List And Document Library Field Type Learning

Use `docs/studies/data-list-document-library-field-types.md`, `docs/studies/normalized/data-list-fields/`, and `scripts/inspect-data-list-fields.mjs` before generating or validating broad Data List custom fields. `Data Lists (2).yap` export-proves the target Type `1` data lists `Data list with fields part A` and `Data list with fields part B` with 90 custom fields across `input`, `textarea`, `richtext`, `hyperlink`, `input_number`, `currency`, `percent`, `calculated-column`, `rate`, `switch`, `checkbox`, `radio`, `tag`, `datepicker`, `time`, `identity-picker`, `organization-picker`, `cost-center-picker`, `signer`, `file-upload`, `icon-upload`, `lookup`, `metadata`, `mutiple-metadata`, `location-picker`, `autonumber`, and `list`. `select` and `flowstatus` remain product-rule-backed/unproven in this export.

Field generation must still pass the app-creation gates: unique `DisplayName`, `FieldName`, and `InternalName`; `InternalName` matching `[A-Za-z0-9_]`; identifier length <= 255; generated non-system `FieldName` suffix matching `FieldIndex`; and generated seed/add-ready fields keeping `FieldName` storage prefix aligned with `FieldType`. Accept export-proven single metadata fields as `Type = "metadata"` with Bigint storage, even though the earlier product-team 28-type list only named `mutiple-metadata`.

Use export-proven settings where relevant: choice `Rules.choices` and `color_choices`; numeric/currency/percent `displayThousandths`, `rounded-to`, `number_min`, `number_max`, `currencyCode`, `displayFormat`; picker `identity-maxselection`, `multiple`, `metadata-treeselect`, `parentId`; upload `maxsize`, `file_multiple`, `file_typeslimit`, `file_types`, `picture_size_limit`, `controlmultiple`; lookup `appid`, `listsetid`, `listid`, `listfield`, additions, filters, sorting, search, display style, and multiple; calculated columns `calculated_result` plus `calculated`; metadata `source` plus `categoryId`; tag `source`, `category`, `customTags`; autonumber `minDigits`, `startNum`, `prefix`, `suffix`; sub-list `list-variables[]`.

Document Library custom-field applicability is product/user-understanding-backed only in this pass because no Type `16` document library was present. Keep Type `16` default fields and document upload rules from existing document-library studies, and do not claim runtime data-entry behavior for these field settings until focused import/open/field-creation tests pass.
<!-- data-list-document-library-fields-learning:end -->

<!-- data-list-custom-form-fields-learning:start -->
## Data List Custom List Form Validation

Use `docs/studies/data-list-custom-form-fields.md` and `scripts/inspect-data-list-custom-forms.mjs` for Data List custom form validation. `Data Lists (3).yap` export-proves custom list forms as Type `1` layouts with embedded JSON in `LayoutInResources[0].Resource`, display assignment through `ListModel.LayoutView.add/edit/view`, and list-bound controls under a `container` -> `container` -> `flex_grid` shell.

Validate custom list forms separately from approval submission/task forms. Check that embedded form resources parse; `children`, `filterVars`, and `tempVars` are arrays; control ids are unique; list-bound `binding` and `fieldID` resolve to the same `Defs[]` field; `action_button.attrs.control_action` resolves to `actions[].id`; `formAction` hooks resolve; `setvar` action list-field targets resolve; temp variable references resolve; and sub-list parent controls include `attrs.list-variables[]` plus `attrs.list-fields[]`.

Validate display settings in `ListModel.LayoutView` separately from embedded form layout content. New/Edit/View assignments in `add`, `edit`, and `view` must resolve to `default` or an existing custom form `LayoutID`. Known opening modes are `modal` for Pop-up window and `slide` for Slide in; missing New/Edit mode defaults to Pop-up window and missing View mode defaults to Slide in. Known sizes are `0` Medium, `1` Small, `2` Large, and `3` Full screen; missing size is Default. Unknown modes/sizes and Full page size assumptions should warn first unless future product evidence proves they break import/open.

Nested sub-list controls use `attrs.list_field = true`, `attrs.list_field_binding`, `attrs.list_control_id`, and scoped bindings such as `field_1`; do not hard-fail them as missing top-level list fields. Unknown action step types, unknown control shapes, and Document Library applicability should warn until export/runtime proof exists. Runtime form rendering, save behavior, action execution, sub-list row entry, and Document Library custom forms are not proven by this export.
<!-- data-list-custom-form-fields-learning:end -->

<!-- data-list-public-form-learning:start -->
## Data List Public Form Validation

Use `docs/studies/data-list-public-forms.md` and `scripts/inspect-data-list-public-forms.mjs` for Data List Public Form validation. Public Forms live in `Data.Childs[].PublicForms[]`; each entry should include parseable JSON-string `Resource` with `pagetype = 3`, `children[]`, `attrs`, `tempVars`, and `ver`.

Validate Public Forms separately from Custom List Forms and approval forms. Check that list-bound controls resolve to fields in the same list, control ids are unique, `Resource.children` is an array, known public-field disallow rules are enforced, and a collection form includes a `submit-button`. Hard-error generated-final public forms that include Id/Created/Modified default fields, login-dependent fields, known UI-unavailable field types, or unresolved `binding`/`fieldID` references. Treat unknown controls/settings warning-first until product or runtime proof says they break import/open.

The export-proven top-level public field allowlist from `Data Lists (4).yap` is `input`, `textarea`, `richtext`, `input_number`, `percent`, `currency`, `switch`, `radio`, `checkbox`, `datepicker`, `time`, `file-upload`, `icon-upload`, `rate`, `hyperlink`, `signer`, and `list`, with `Title` as a special primary-field exception. Public share URLs and codes must be redacted in committed docs, normalized refs, and validation reports.

For generated Public Form runtime packages, warn on thin/non-export-shaped grid attrs if they make designer settings unreliable. Prefer `flex_grid` with `ver: 1`, structured `columns`/`rows`, `cgap`, and `cgapU`; use `displayLabel: [null, false]` for layout-only grids; and prefer a centered submit container with inline submit width `common.positioning.widthtype: [null, "2"]`. `docs/studies/data-list-public-form-runtime-proof.md` proves import/open/designer/control-render for this focused pattern only, not anonymous submit or data mutation.
<!-- data-list-public-form-learning:end -->

<!-- yap-schema-standard-learning:start -->
## YAP Schema Standard Validation

Use `docs/studies/yap-schema-standard.md` and `scripts/inspect-yap-schema-standard.mjs` for product-team YAP schema checks. Hard-error malformed wrappers, missing `[______gizp______]` `Resource` prefix, malformed decoded `Resource`, missing `ListExportInfo.Item`, missing `Defs`/`Layouts`, `Defs: null`, `Layouts: null`, and non-array `Defs`/`Layouts` on root or child list-export items. Empty `[]` is valid.

Preserve the existing hard errors for invalid process keys, invalid approval/process `NoRule`, and missing `{index}` in `NoRule.Prefix`. Validate AI Agent/Copilot Access app resource permission bitmasks for approval forms, data lists, document libraries, and AI agents. Warn, do not hard-fail, for `formReports` and `dataReports` permission bit conflicts until product team clarifies schema Read `8` versus rules-doc Submit `1`.

Do not enforce schema `additionalProperties: false` as a global hard error yet; treat unknown product fields as warnings because the provided schema is partial relative to known exports.
<!-- yap-schema-standard-learning:end -->
<!-- projects-center-import-failure-hardening:start -->
## Generated App Import-Readiness Validation

For newly generated `.yap` files, do not accept compatibility validation as the final result. Run strict generator/final package validation, strict graph validation, materialization inspection, schema-standard inspection, app-creation rules inspection, data-view/dashboard/page reference checks, wrapper round trip, placeholder scan, and safety scan. `scripts/inspect-yap-import-readiness.mjs` is the preferred aggregate gate when available.

Generated-final structural errors include missing/invalid Type `1` `ListModel.ListType`, unsafe native `Title` metadata, unresolved data-view columns or stale system pseudo-fields, mismatched `LayoutInResources` IDs, unresolved dashboard dynamic-display/filter references, unresolved collection `ListDataID` context filters, and `ReplaceIds` entries for `TenantID`, `CreatedBy`, or `ModifiedBy`. Warning-level results are acceptable only when classified as non-import-blocking runtime/export-derived warnings.
<!-- projects-center-import-failure-hardening:end -->

<!-- container-button-action-settings-learning:start -->
## Container/Button Action Validation

Use `scripts/inspect-container-button-actions.mjs` with dashboard packages that contain actionable Containers or Buttons. `AP Approval Demo v3.yap` export-proves shared action settings for dashboard `container` and `action_button` controls, with action codes `2` Link, `5` Add list item, `6` Open dashboard, and `8` Open approval form.

Generated-final validation must fail unresolved Container/Button action targets: Link without URL/expression URL; Add list item without a resolvable `attrs.data.list.ListID`; passvalues that reference fields missing from the target list; selected `layout` IDs that do not resolve; Open dashboard without a resolvable Type `103` `PageID`; Open approval form without a resolvable approval form `ProcKey`; unknown generated action types; unknown open modes; and invalid custom size objects. Compatibility/source-export mode should warn first for unknown variants.

The aggregate import-readiness gate includes the Container/Button action inspector. It should not fail unrelated non-Pivot packages solely because the optional Pivot Table inspector cannot find a literal page named `Dashboard`, but it must still fail generated-final unresolved Container/Button action targets.

Focused runtime proof in `docs/studies/container-button-action-runtime-proof.md` confirms representative generated current-app action navigation after local validation. Validator-backed checks still do not prove save/submit/workflow execution, cross-app targets, form-action binding, permissions, or all open-mode/size combinations.
<!-- container-button-action-settings-learning:end -->

<!-- sub-list-dynamic-content-learning:start -->
## Sub List Dynamic Content Validation

Use `scripts/inspect-sub-list-dynamic-controls.mjs` for packages that contain Approval Form or custom-form Sub List controls. Validate that `type = "list"` controls bind to a list variable whose value resolves to a listref, displayed fields and summaries resolve to row fields, Dynamic content layout has a `list-body` template, and row field controls inside the template keep `attrs.list_field_binding` equal to the parent Sub List binding.

Validate Sub List list actions separately from normal form actions. `attrs.actions[]` on the Sub List is the local action store; action buttons inside `list-body`, row-menu `dropbar`, or `list-footer` should resolve to those local action IDs. Export-proven step types are `list_new`, `list_import`, `list_dup`, `list_del`, and `list_move`; Insert before/after use `list_new` with `attrs.position = "0"` or `"1"`, Move up uses `list_move` without attrs, and Move down uses `list_move` with `attrs.moveMode = "2"`. Preserve `.dynamic-list .list-footer` CSS when present, but do not require it globally.

Runtime-proof candidate validation: `generate-sub-list-dynamic-actions-runtime-proof.mjs` emits a minimal Approval Form package with one Dynamic Sub List and local actions `list_new`, `list_dup`, `list_del`, and `list_import`. For this package, require zero generated-final errors, a passing `scripts/inspect-sub-list-dynamic-controls.mjs` summary with one Dynamic Sub List, valid row field bindings inside `list-body`, valid footer/action button references, and schema-standard wrapper success before manual import. Validator success is still not runtime action proof.

Table-style Dynamic Sub List validation: warn when a generated Dynamic Sub List with multiple row fields leaves its caption visible, lacks a grid/flex_grid as the first `list-body` layout structure, or uses a body grid whose child count does not match configured column tracks. Header/body layout grids should hide captions and use export-shaped responsive column settings; malformed grid shapes can render as one column and can make Designer Appearance settings fail to expand.

Row operation menu validation: warn when menu buttons do not resolve to local Sub List actions, when menu labels duplicate, or when Delete appears in the menu and as a visible last-column row action. Do not hard-error these while V1.4 Insert/Move runtime behavior is pending.

Data List custom form Print Page validation: `Sales Quotation.yap` export-proves a Type `1` custom form target named `Print Page`, a read-only/display-oriented Dynamic Sub List bound to a Sub List field, and a `View Quotation` form action step `type = "print"` with `attrs.printtype = "select"`, a resolvable `attrs.layout`, and `attrs.listdataid[]` carrying current `ListDataID`. Generated-final packages should hard-error missing or unresolved print target layouts and missing current-record context when the schema clearly requires it. Warn when the resolved target is not print-named, when print Dynamic Sub List field bindings do not resolve to `Rules["list-variables"]`, or when read-only print forms expose Add/Import/Edit row actions unexpectedly.
<!-- sub-list-dynamic-content-learning:end -->

<!-- kanban-collection-dynamic-controls-learning:start -->
## Kanban/Collection Dynamic Control Validation

Use `scripts/inspect-kanban-collection-dynamic-controls.mjs` and `docs/studies/kanban-collection-dynamic-controls.md` for dashboard Kanban/Collection packages and Data List custom forms with Dynamic controls. Validate that Kanban and Collection `attrs.data.list.ListID` resolves to an included source list; Kanban `attrs.data.cateField` resolves to a source field; Dynamic controls inside Kanban/Collection item templates use source `3` and bind to source-list fields; and Dynamic controls on Data List custom forms use source `4` and bind to host-list fields.

Specialized Dynamic controls should match field families: Dynamic user to identity/person fields, Dynamic image to image fields, Dynamic file to attachment/file fields. Use warnings for historical exports and hard errors for clear generated-final mismatches. Do not treat validator success as runtime proof for Kanban rendering, drag/drop, click behavior, image/file preview, or Data List form runtime behavior.

## Timeline Dynamic Control Validation

Use `scripts/inspect-timeline-dynamic-controls.mjs` and `docs/studies/timeline-controls-dynamic-controls.md` for dashboard Vertical Timeline and Horizontal Timeline packages. Validate that `timeline-v` and `timeline-h` controls resolve `attrs.data.list.ListID` to an included source list, that timeline title/date/order fields in `attrs.data.title.variable[]` and `attrs.data.sort[]` resolve to source fields, and that item-template Dynamic controls use source `3` with resolvable `attrs["obj-f"]` bindings.

Apply the same specialized Dynamic control type checks inside timeline templates: Dynamic user should bind to identity/person fields, Dynamic image to image/icon-upload fields, Dynamic file to attachment/file fields, and Dynamic field to general fields. Use warnings for export-limited or historical variants; generated-final packages can hard-error clearly missing data sources, unresolved timeline/date fields, unresolved dynamic bindings, and clear field-family mismatches. Validator success is not runtime timeline proof.

For the focused Kanban/Collection/Timeline runtime proof generated by `generate-kanban-collection-timeline-runtime-proof.mjs`, require package validation, graph validation, schema-standard inspection, materialization inspection, Kanban/Collection Dynamic inspection, Timeline Dynamic inspection, wrapper decode, and import-readiness to report zero errors before manual import. Warnings for environment-dependent user/image/file fields are acceptable when rows intentionally omit private user IDs and binary payloads. The user-confirmed `kanban-collection-timeline-runtime-proof.v1.yap` result proves import/open/render stability for Kanban, Collection, Vertical Timeline, Horizontal Timeline, and Dynamic field values, plus empty-value stability for Dynamic user/image/file controls. It does not prove non-empty user/image/file display, preview/download, drag/drop, click/open behavior, or Data List form runtime behavior.
<!-- kanban-collection-dynamic-controls-learning:end -->

<!-- advanced-controls-learning:start -->
## Advanced Yeeflow Controls Learning

Company Overview (3).yap export-proves advanced Dashboard and Data List custom-form control patterns documented in docs/studies/advanced-controls.md and normalized under docs/studies/normalized/advanced-controls/. Treat this as export-proven and validator-backed only unless a later focused runtime pass proves rendering and interactions.

Planning guidance:

- Use Tab (aktabs / ak-tabs-tab) for multi-tab content grouping when users need related peer views without leaving the page.
- Use Toggle (toggle / toggle-panel) for collapsible multi-section content, FAQ blocks, grouped detail panels, and optional guidance.
- Use Timer for static or dynamic date countdown/deadline indicators such as SLA, due date, campaign, and task timers.
- Use Icon list for quick links, resource shortcuts, and compact navigation lists.
- Use Divider and Spacer for layout structure and visual rhythm between control groups.
- Use Alert for info, success, warning, and error messages where guidance or status communication matters.
- Use Progress bar and Progress circle for numeric progress, completion percentages, KPI capacity, score, and utilization.
- Use Steps bar for phase/status/workflow/approval/onboarding progress; prefer static steps or field-bound single-select/status sources where supported.
- Use QR Code for record/page/form/link sharing and mobile access.
- Use Barcode for encoded record, inventory, ticket, asset, static, or dynamic values.
- Use Embed for iframe/external content such as reports, maps, dashboards, docs, and videos when tenant/security context allows it.
- Use Document embed for attachment/file previews such as contracts, invoices, images, PDFs, Word documents, and PowerPoint decks.

Validation guidance:

- Tab items need valid ids/titles and child control containers.
- Toggle sections need valid ids/titles and child control containers.
- Timer needs a valid static date or dynamic date binding.
- Icon list items should define icon/text/link settings where required.
- Progress bar/circle values must be numeric or resolve to numeric fields/variables.
- Steps bar static steps need valid items; bound sources should resolve to single-select/status fields where applicable.
- QR Code value/URL should be static, dynamic, current-item, current-page, or current-form source; implicit host-current URL behavior remains runtime-sensitive.
- Barcode value must be static or dynamic and barcode type should be supported (CODE128/CODE128A observed).
- Embed code/src/url must be configured and generated-final packages must not contain unsafe placeholder URLs.
- Document embed must bind to attachment/file fields and respect single/multiple settings when configured.
- Generated-final packages should hard-error unresolved required bindings, invalid URLs, incompatible numeric/file/status fields, unsupported barcode types, and unsupported host placement. Historical exports should warn when uncertain.

Proof boundary: Tab and Toggle dashboard usage, Additional-controls dashboard usage, and Company Overview / View page Data List form usage are export-proven only. Approval Form/Public Form support is product-understanding-backed unless separately export-proven. Runtime rendering, link navigation, QR/barcode scan behavior, iframe loading, document preview behavior, and dynamic value changes are not proven in this branch.
<!-- advanced-controls-learning:end -->

<!-- advanced-controls-runtime-proof:start -->
## Advanced Controls Runtime Proof Pattern

Use docs/studies/advanced-controls-runtime-proof.md and generate-advanced-controls-runtime-proof.mjs as the focused generated package pattern for advanced Yeeflow controls. The generated manual-test package is /Users/Renger/Downloads/advanced-controls-runtime-proof.v1.yap and is intentionally uncommitted. The user-confirmed runtime result passed for package import, dashboard open, rendering and basic interactions for the included controls, Embed safe render, Document embed empty state, and absence of missing binding/render/action errors.

Safe minimal generation pattern:

- Generate one compact dashboard named Advanced Controls Runtime Dashboard for Dashboard-host controls.
- Generate one Data List named Advanced Control Runtime Items when current-item bindings are needed.
- Use a View page for Data List form-host controls that are export-proven only on list forms, especially field-bound Steps bar and Document embed.
- Keep sample data synthetic and leave file-upload fields empty when testing Document embed safe empty state.
- Use static public Yeeflow URLs for QR Code and Embed tests; never use private tenant URLs.
- Use static safe Barcode values such as ACR-PROOF-001 and observed-supported barcode types such as CODE128/CODE128A.

Control-specific safe patterns:

- Tab: aktabs with ak-tabs-tab children, titles, one default tab, and nested content controls.
- Toggle: toggle with toggle-panel children, attrs.title.value, and nested controls.
- Timer: timer with attrs.set.date.value using a safe static future date.
- Icon list: icon_list with attrs.data.links[], safe icons, titles, and public links.
- Divider: line with explicit width, line-width, color token, and spacing.
- Alert: alert with attrs.alert.title and attrs.alert.desc; include info/success/warning/error variants when useful.
- Progress bar: progress with attrs.bar.per.value as a static numeric percentage for the runtime baseline.
- Spacer: gap with explicit attrs.space.
- Progress circle: progress-circle with static attrs.per values and common positioning.
- Steps bar: steps-bar with static steps-options on dashboards; on Data List View pages, bind current-step to a current item radio/status field only when the field resolves.
- QR Code: list-qrcode with attrs.qr-code-link.customUrl.url for static URL proof; implicit current URL modes remain host-sensitive.
- Barcode: barcode with attrs.value.value and attrs.type; prefer CODE128 for generated runtime smoke tests.
- Embed: embed with attrs.code containing a safe iframe to a public URL; iframe load success is not guaranteed until runtime-tested.
- Document embed: document-embed with attrs.doc-source bound to a file-upload field; empty-field rendering is a separate proof from non-empty document preview.

User-confirmed runtime result for the focused package:

- The package imported successfully and Advanced Controls Runtime Dashboard opened.
- Tab switching and Toggle expand/collapse worked.
- Timer, Icon list, Divider, Alert variants, Progress bar, Spacer, Progress circle, Steps bar, QR Code, Barcode, Embed, and Document embed rendered in the tested scope.
- Embed rendered safely without breaking the page.
- Document embed rendered a safe empty state.
- No missing binding, render, or action error appeared.

Validation and proof boundaries:

- The local gate should include validate-yap-package, validate-yap-graph, inspect-advanced-controls, inspect-yap-schema-standard, inspect-yap-materialization, inspect-app-creation-rules, inspect-yap-import-readiness, wrapper build/round-trip, git diff --check, and safety scan.
- Zero local validation errors only proves local readiness, not import/open/render behavior.
- Do not claim QR scan behavior, Barcode scan behavior, external iframe content loading, non-empty document preview, dynamic value changes, or Approval Form/Public Form host behavior unless those exact behaviors are tested.
- Keep generated .yap files, decoded payloads, screenshots, and private data out of commits.
<!-- advanced-controls-runtime-proof:end -->
