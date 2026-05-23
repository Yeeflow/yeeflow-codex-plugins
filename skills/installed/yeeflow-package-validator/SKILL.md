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

For workflow actions, validate `MailTask` recipient/subject/body presence, warn on fixed literal recipients, validate `QueryData` target list references and multi-result output variables, and validate `AI` agent-mode actions resolve `properties.data.AgentID` to an included app AI Agent. `Spark & AI (1).yap` adds proven checks for data-list workflow AI usage: `inputVariables[]` and `outputVariables[]` should be arrays, image inputs can be `type = "img"` with list-field mappings using `valueType = "icon-upload"` or `file-upload`, and data-list workflows should be registered on the host list through `FlowMappings[]` with `Setting.NewTrigger = true` when they are new-item triggered. The Asia Tech manual workflow comparison adds that Add Item new-item triggers should use `FlowMappings.FieldName = null` and `Data.Forms[].Settings = null`; non-null field bindings belong only to separately proven flow-status conditions. For import/open-safe generated baselines, a resolved local `AI` action with no credentials is a runtime-sensitive dependency rather than a package-blocking error; unresolved Agent references, unresolved `QueryData` targets, unresolved app-resource tool list references, unsafe real recipients, embedded secrets, and credential-bearing external actions remain blockers. Treat AI execution, image analysis, and row-update tools as runtime-sensitive unless explicitly configured for a safe sandbox.
<!-- scheduled-workflow-ai-assistant-learning:end -->

<!-- workflow-assignment-task-assignee-learning:start -->
## Workflow Assignment Task Assignee Validation Addendum

Validate `MultiAssignmentTask.properties.usertaskassignment[]` warning-first. `Test ABC.yap` export-proves methods `direct`, `expression`, `position`, `positionorg`, `positionorgexpr`, `positionloc`, and `positionlocexpr`; each entry should include `type`, `method`, and `title`, with `value` for direct/static/expression forms and `position` for position-based forms. Warn for missing/empty/opaque assignee config, unknown methods, missing position references, missing static values, expression values that are not expression-button-shaped strings, and direct-user tenant sensitivity. Do not hard-error compatibility exports or claim runtime routing proof until a focused runtime baseline passes.
<!-- workflow-assignment-task-assignee-learning:end -->

<!-- application-settings-navigation-user-groups-learning:start -->
## Application Settings Validation Addendum

Validate application settings from the root app `Data.Item.ListModel.LayoutView` JSON string. Menu structure lives in `sort[]`; menu layout lives in `attrs["navigator-menu"].position`; header appearance lives in `attrs.appearance`.

Use hard errors for generated-final malformed structures: unparseable `LayoutView`, invalid layout position values, nested navigation groups, depth greater than two, group missing text, non-object menu items, resource children on non-group items, missing resource references, non-boolean `IsHidden`, non-boolean `hideTitle`, and invalid header height types. Use warnings for runtime-sensitive or partially understood shapes such as unstudied positive header heights, null icons, member-looking app-group fields, process/link menu items, and group IDs missing from `ReplaceIds`.

Runtime-proven layout values for generated packages are `default`, `left`, `onheader`, and `none`. Runtime-proven no-icon is `Icon: ""`; custom `DisplayName`, omitted `DisplayName` resource-name fallback, `Type: "classes"` groups, and `list[]` child resources are runtime-proven. App user groups are `Data.AppGroups[]` records with `ID`, `Name`, and `Description`; empty groups are settings-visible runtime-proven and group IDs belong in `ReplaceIds`, but member schema is not export-proven. Generated packages must not embed real user emails or private identities in app group metadata.

Workflow assignment task assignee validation should remain warning-first in compatibility mode. `Test ABC (1).yap` export-proves multiple `MultiAssignmentTask.properties.usertaskassignment[]` entries, user-group expression, position all-users expression, `issequential=true`, absent-`issequential` parallel/default shape, `approveway` variants, custom percentage, and email notification fields. Validators should warn for unknown assignee methods, unknown `approveway`, invalid `issequential`, missing custom percentage, and incomplete email notification shape, but should not hard-error existing exports solely from this study.
<!-- application-settings-navigation-user-groups-learning:end -->
