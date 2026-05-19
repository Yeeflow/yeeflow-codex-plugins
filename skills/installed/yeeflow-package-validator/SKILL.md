---
name: yeeflow-package-validator
description: Standardize Yeeflow package validation before import or runtime testing. Use when Codex generates or edits a .yap package, validates Yeeflow data lists, forms, workflows, dashboards, custom code, or expressions, diagnoses package import/materialization issues, or decides whether runtime import is safe.
---

# Yeeflow Package Validator

## Core Rule

Validate before import. Do not runtime-test a package with blocking structural, graph, wrapper, workflow, list, field, materialization, FlowKey, or unsafe `.yapk` issues.

New application creation may output `.yap`. Existing app upgrade `.yapk` remains read-only and server-generated until Yeeflow signing and Resource mechanics are proven.

## Validation Workflow

1. Identify the package type and source of truth. Preserve generated `.yap` files unless the task explicitly asks to regenerate them.
2. Run available repo validators for package, graph, workflow, data list, wrapper round trip, materialization, expressions, dashboards, and custom code.
3. Inspect field/list integrity and FlowKey safety.
4. Classify every finding as blocking, warning, or informational.
5. Decide whether import/runtime testing is safe.
6. Report exact commands, files checked, findings, and next actions.

Use [package-validation-lifecycle.md](references/package-validation-lifecycle.md) for the detailed sequence.

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

Validate app-level OtherModules for Connections, Agents, and Knowledges. Count AI Agent resources as Agents module entries with Type = 0 and Copilots as Type = 1. Validate Settings/Draft JSON, Components arrays, tool Settings.Data.Value references, connected-Agent references, connection references, and redaction-sensitive Config keys.

Use hard errors only for generated-final invalid JSON, missing generated IDs, unresolved generated-final tool references, or embedded secret/token/password/API-key values. Use warnings/dependencies for connection-backed tools, credentialstype/run-as settings, OpenAPI operations, application-resource access, and runtime-sensitive external calls.
<!-- agent-copilot-application-resource-learning:end -->

<!-- scheduled-workflow-ai-assistant-learning:start -->
## Scheduled Workflow Validation Addendum

Validate app-level Scheduled Workflow resources as `Data.Forms[]` entries with `WorkflowType = 3`, `ListID = 0`, parseable JSON `Settings`, and parseable JSON `DefResource`. `Settings` should include `TimeZone`, `Times[]`, `StartDate`, `Frequency`, and `Interval`; weekly schedules use `Values[]`, and daily working-day schedules use `IsWorkday: true`.

For workflow actions, validate `MailTask` recipient/subject/body presence, warn on fixed literal recipients, validate `QueryData` target list references and multi-result output variables, and validate `AI` agent-mode actions resolve `properties.data.AgentID` to an included app AI Agent. For import/open-safe generated baselines, a resolved local `AI` action with no credentials is a runtime-sensitive dependency rather than a package-blocking error; unresolved Agent references, unresolved `QueryData` targets, unsafe real recipients, embedded secrets, and credential-bearing external actions remain blockers. Treat AI execution and email delivery as runtime-sensitive unless explicitly configured with safe test credentials/recipients.
<!-- scheduled-workflow-ai-assistant-learning:end -->
