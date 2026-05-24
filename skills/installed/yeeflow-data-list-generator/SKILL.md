---
name: yeeflow-data-list-generator
description: generate, inspect, validate, package, debug, and improve yeeflow data list definitions, .ydl exports, list metadata, lookup relationships, custom list forms, views, and data-list sample data
---

# Yeeflow Data List Generator

## Application Navigation References

When a generated application exposes data lists through the app navigation menu, reference each list from the root app `Data.Item.ListModel.LayoutView.sort[]` using `Type = 1`, the list `ListID`, root `ListSetID`, `Title`, optional `DisplayName`, optional `Icon`, and boolean `IsHidden` when needed. Omit `DisplayName` to allow Yeeflow to use the data list title as the menu label. Use `Icon: ""` for no-icon.

Data-list menu items can be top-level resources or children of a top-level custom group. Groups are app-level navigation items with `Type = "classes"` and cannot be nested; maximum menu depth is two layers. Validate navigation references with the package validator before building a wrapper.

Use this skill when the user asks to inspect, validate, generate, package, debug, or improve Yeeflow data-list `.ydl` exports or decoded data-list JSON.

For existing-app upgrades, data-list changes should be packaged as `.yapk` only from a Yeeflow Version management baseline and only when the upgrade package structure is safe. Preserve existing list IDs and app identity. Do not apply new-app `.yap` fresh-ID rules to existing list objects, and do not claim offline `.yapk` list mutation is safe while the studied `.yapk` `Resource` remains opaque/signed.

## Standard Workflow

Follow the staged path:

```text
business requirement
  -> decomposition
  -> normalized data-list spec
  -> decoded .ydl draft
  -> structural validation
  -> app-context/dependency validation when needed
  -> wrapper build
  -> sandbox import by user/operator
  -> export-back learning
```

Prefer native Yeeflow list features first: fields, Rules, lookups, views, custom list forms, sample data, and list workflows only when truly needed.

## Hard Stop Conditions

Do not build a final `.ydl` when:

- placeholders remain
- `validate-ydl-list.js --mode generator --stage final` fails
- required app/list/field metadata is missing
- generated main/list metadata is missing `MainListType` or `ListModel.ListType`
- duplicate `FieldName` or `InternalName` values exist
- lookup targets or target display fields are unresolved
- sample lookup values are unknown or unsafe
- sample lookup values do not map to valid referenced target rows
- external resolved lookup IDs would be included in `Resource.ReplaceIds`
- production IDs are guessed
- custom form bindings are unresolved
- workflow, AI, HTTP/API, credential, user, file, or external dependencies are unresolved
- list workflow actions do not satisfy the normalized action reference from `workflow-action-configurations.normalized.json`
- no sandbox import/export round trip has proven production readiness

Do not import anything, operate Yeeflow UI, or modify original exports unless the user explicitly asks.

## Scripts

Use bundled scripts from `scripts/`:

- `inspect-ydl-package.js`: decode `.ydl` and inventory fields, views, forms, workflows, lookups, sample data.
- `extract-ydl-metadata.js`: extract machine-readable metadata from one or more `.ydl` files.
- `validate-ydl-list.js`: validate decoded data-list JSON or `.ydl` wrapper.
- `validate-ydl-against-yap.js`: validate list dependencies against `.yap` metadata or compatible metadata.
- `build-ydl-wrapper.js`: build `.ydl` wrapper only after final validation passes.

Common commands:

```bash
node scripts/validate-ydl-list.js ./draft.json --mode generator --stage draft
node scripts/validate-ydl-list.js ./final.json --mode generator --stage final --dependency-map ./dependencies.json
node scripts/build-ydl-wrapper.js ./final.json ./output.ydl --title "List Name" --description "Sandbox generated list" --dependency-map ./dependencies.json
```

When a generated data list includes workflow actions, run workflow-aware validators and stop on missing required action properties, invalid enum/type values, invalid `QueryData` filters, invalid `SequenceFlow` conditions, invalid `Loop`/`Delay` condition shapes, or unsafe external/credential-related actions. Never bundle credentials, API keys, tokens, connection secrets, or tenant-specific sensitive values.

Scheduled Workflow export learning: `AI Agent and Copilot Local Resource Baseline8.yap` proves `QueryData` can be used from an app-level Scheduled Workflow (`WorkflowType = 3`) to query a local data list and write multiple results into a text workflow variable with `result.listParent = "__variables_"`, `result.listName`, `result.vartype = "text"`, and `result.fields[]`. Validate that the queried list and selected fields resolve before generating or runtime-testing.

Data-list workflow export learning: `Spark & AI (1).yap` proves list workflows are registered on the host list through `FlowMappings[]`, with new-item trigger shape `Setting.NewTrigger = true`, and the workflow definition itself remains a `Data.Forms[]` entry with `WorkflowType = 1` and nonzero `ListID`. The Asia Tech manual workflow comparison proves Add Item / new-item triggers should keep `FlowMappings.FieldName = null` and `Data.Forms[].Settings = null`; do not bind a normal field as the trigger condition. The same export proves a workflow `AI` node can call an app-contained Agent, map an `icon-upload` list field into an Agent input `type = "img"`, and pass native `ListDataID` into a text input for same-row update behavior. Treat any generated list workflow that can call live AI or update rows through an Agent tool as runtime-sensitive until proven safe in an isolated sandbox package.

Data-list workflow Assignment Task learning: `Purchase Requests.ydl` proves a data-list workflow can use the same `MultiAssignmentTask` action family as approval workflows, while adding list-item context to assignee expressions. The studied export uses `FlowMappings[].Setting.NewTrigger = true`, `WorkflowType = 1`, a Start action with email notification fields but no terminate/recall fields, and an Assignment Task with a Created By list-field expression resolving `LineManager`. Its task form mixes normal task-form controls with list-bound controls using `isListControl = true`, `identifier`, `InternalName`, `fieldID`, and `____customListFields_` binding. Preserve custom list fields as read-only when the task should not update source list data; default/native fields such as Created By appear read-only in the studied export, but broader native-field behavior remains runtime-pending. Use `docs/studies/workflow-approval-vs-data-list-actions.md` and normalized refs under `docs/studies/normalized/workflow-task-forms/` before generating data-list workflow Assignment Tasks.

Scheduled workflow comparison: `Workflow Actions Runtime Baseline (1).yap` proves scheduled workflow Start and Assignment Task shapes without data-list list-field expression sources. Do not transfer `Created By` or custom list-field assignee context from data-list workflows into scheduled workflows unless a scheduled export or focused runtime baseline proves that host context.

## References

Load only the relevant reference:

- `references/operating-playbook.md`: end-to-end rules and readiness levels.
- `references/ydl-structure-study.md`: wrapper format and decoded structure.
- `references/baseline-asset-inventory-v5.md`: proven single-list custom form baseline.
- `references/related-list-lookup-pattern.md`: staged lookup and sample-data rules.
- `references/approval-form-integration-pattern.md`: generated storage list handoff to approval-form `ContentList` persistence.
- `references/knowledge-base-list-pattern.md`: Knowledge Base category/article list and lookup pattern.
- `references/validation-guide.md`: validator and builder usage.
- In the active generator workspace, use `docs/workflow-action-configuration-reference.md`, `docs/workflow-action-generation-rules.md`, and `workflow-action-configurations.normalized.json` as the official workflow action configuration reference when validating list workflows.
- In the active generator workspace, use `field-configurations.normalized.json`, `docs/yeeflow-field-configuration-reference.md`, and `docs/yeeflow-control-field-generation-rules.md` as the data-list field schema reference.
- In the active generator workspace, use `yeeflow-expression-functions.normalized.json`, `yeeflow-expression-function-knowledge-base.normalized.json`, `yeeflow-expression-operators.normalized.json`, `yeeflow-expression-utils.js`, `docs/yeeflow-expression-generation-rules.md`, and `docs/yeeflow-expression-editor-ui-contexts.md` before generating data-list calculated fields, custom form calculated controls, lookup filters, list workflow conditions, or request-number/default-value formulas. Use enriched function metadata for selection, but keep metadata-pending functions such as `addWorkDays` and `addWorkHours` deferred.
- In the active generator workspace, use `control-configurations.normalized.json`, `docs/yeeflow-control-to-field-mapping.md`, and `yeeflow-control-field-schema-utils.js` when translating approval-form controls into persisted data-list fields.
- In the active generator workspace, use `docs/yeeflow-form-design-quality-rules.md` when data-list custom forms need to align with rich approval-form section/grid/text/icon standards.
- For generated data-list persistence, prefer Text fallback for requester/user values unless a focused native data-list identity/user field export proves the persisted shape.
- When app-level approval forms use advanced native controls, read `docs/ai-training-approval-form-control-study.md` for export-backed approval variable/control anatomy before choosing persisted data-list field fallbacks. It improves mapping context for file/image, user/department/location/cost center, metadata, lookup, lookup-list, and sublist controls, but those persisted field shapes remain runtime-sensitive unless a focused data-list export proves them.
- `references/metadata-guide.md`: `.ydl` and `.yap` metadata lessons.
- `references/examples-summary.md`: proven examples and intentionally omitted bulky artifacts.

## Generation Rules

- Use `AppID: 41` for sandbox/test packages unless target metadata says otherwise.
- Generate large numeric string IDs for sandbox `ListSetID`, `ListID`, `FieldID`, `LayoutID`, and sample `ListDataID`.
- For child lists inside a `.yap`, allocate `FieldID` values from a global app-level field ID allocator; do not reset or reuse the same field IDs per list.
- For child lists inside a `.yap`, every field's `ListID` must equal the parent data-list `ListID`; changing `FieldID` must not change `field.ListID`.
- For production or existing apps, use confirmed metadata only.
- HARD RULE: preserve `FieldName: "Title"` as Yeeflow's native primary/display field in every generated data list. `Title` must keep `Status: 0`, `IsSystem: true`, and `IsIndex: true`. Do not treat `Title` as a normal custom business field.
- Generated fields must keep `FieldName`, `InternalName`, and `DisplayName` unique inside each list. Duplicate display names are a Yeeflow materialization risk for generated app packages.
- HARD RULE: every generated list must pass standalone `validate-ydl-list.js --mode generator --stage final`. App-level `.yap` package validation does not replace list-level validation.
- Generated list metadata must include required list type metadata (`MainListType` for wrappers or `ListModel.ListType` for extracted list objects).
- Generated fields must have unique `FieldName` and `InternalName` values. Duplicate internal names are blocking because they can pass broad package checks while breaking list import/query behavior.
- Business concepts such as "Request No.", "Name", "Equipment Name", or "Center / Department Name" may be displayed on `Title`, but the underlying `Title` metadata must remain native/system/indexed. Use `Text1`, `Text2`, etc. for additional business text fields.
- Use `Decimal` + `input_number` fields for persisted numbers; `Decimal1` is the proven generated slot in Visitor Access Management v11.
- Use `Bit` + `switch` fields for persisted booleans; `Bit1` is the proven generated slot in Visitor Access Management v11.
- Use calculated data-list fields only when the field formula is export-backed. When an approval form has calculated display values such as `Subtotal = Quantity * Unit Price`, prefer persisting the source quantity/unit price plus a Decimal result only if `ContentList` mapping is type-compatible and validated.
- For approval-form sub list/listref totals, prefer persisting summary-bound top-level variables such as `TotalAmount`, `TotalQuantity`, and `AverageUnitPrice` into Decimal fields. `Expression Sublist Summary Workflow Test v1` proved this path for generated app packages. Direct child-row-to-data-list persistence remains deferred until a focused export/runtime proof exists.
- Use Yeeflow expression-token arrays for calculated/default/filter formulas. Do not generate JavaScript formulas or invented expression function names.
- Use text/radio-compatible fields for single-select storage; selected option values are stored as text.
- Custom forms must follow the Asset Inventory v5 pattern:
  - `Layout.Type = 1`
  - `Layout.LayoutView = null`
  - `Layout.Ext2 = "{\"src\":true}"`
  - `Layout.IsItemPerm = false`
  - `LayoutInResources[0].ID = LayoutID`
  - `LayoutInResources[0].RefId = LayoutID`
  - `LayoutInResources[0].Resource` is a JSON string with `children`, `attrs`, `title`, `filterVars`, `ver`, `tempVars`
  - `Item.ListModel.LayoutView.add/edit/view` points to the custom form `LayoutID`
- Single lookup sample values are plain target record `ListDataID` strings.
- For staged standalone related lists, import/export the reference list first, patch the dependent lookup to real metadata, and exclude external lookup IDs from `Resource.ReplaceIds`.
- For app-level `.yap` internal lookup samples, target sample record IDs are local IDs, should be included in `ReplaceIds`, and dependent lookup sample values may reference those local IDs.
- Lookup dependencies must resolve to a target list and display/search field. Standalone generated lists need a dependency map for external lookups; app-level internal lookups should resolve inside the package.
- Sample lookup values must map to actual referenced target rows. If the master/reference list is local, include sample/reference rows; if it is external, provide a dependency map or omit unsafe sample lookup values.
- Master/reference lists referenced by generated forms, dashboards, or workflows must be usable runtime lists, not placeholders. Include sample data where needed for local validation and runtime smoke testing.
- For generated lists intended as approval-form storage targets, build/import/export the `.ydl` first, then use exported-back list and field metadata to patch the approval form `ContentList` target.

## Document Library Carry-Forward

Document libraries reuse many data-list mechanics but are not normal data lists. When an app package includes a document library, route app-level generation through `yeeflow-application-generator` and validate the resource as Type `16`.

- `ListModel.Type = 16` identifies document libraries.
- Document libraries use the same `Defs[]`, Type `0` views, and Type `1` custom form storage model where export-proven.
- Preserve document default fields exactly from `Projects Center.yap`: `Title`, `Bigint1`, `Text1`, `Bigint2`, `Text2`, `Text3`, and `Text4`.
- `Text4` Upload File is `FieldType = "Text"` and `Type = "file-upload"` with `Rules.isLabrary = true`.
- Do not enforce generated data-list `Title.Status = 0` on document libraries; the studied document libraries use `Status = 1`.
- `Document Library Sample.yap` plus the runtime-passed one-library clone prove the minimal base definition is the `New Document Library` shape: default Type `0` view `LayoutView = ""`, one unassigned `New file` upload form, and no uploaded rows. Do not use the earlier generated `Baseline Documents` package as the base definition.
- The `Enterprise Document Center` v2 runtime pass accepted multiple generated Type `16` libraries with simple custom fields and configured Type `0` views.
- Do not require root app navigation or Type `103` pages for document-library-only packages; validate them as warnings in that narrow sample-proven shape.
- Root-level folder rows are runtime-proven for generated document libraries when represented in `ListDatas` with `ListDataID`, `Title`, `Bigint1 = "0"`, `Text1 = "folder"`, blank `Bigint2`/`Text2`, `Text3 = "0_<lowercase folder title>"`, no `Text4`, and blank generated custom-field values.
- Treat nested generated folder-row support through nonzero `Bigint1` / ParentID as unproven until export-backed and runtime-tested.
- Dashboard Doc library controls can display Type `16` libraries and root folders through `type = "document-library"`, `attrs.data.list`, and `attrs.data.folder.path = "0/<folder ListDataID>"`. Document-library custom-form hosting is runtime-proven for a root-bound embedded control with disabled search/add. Data-list custom-form hosting is still validation-only; do not claim it until an imported generated data-list form is reachable and the embedded Doc library control renders at runtime.
- Do not include raw uploaded document data or private file metadata in generated packages.

## YAP App Materialization Rules

When data lists are embedded in a generated `.yap` application:

- Every `FieldID` must be unique across the whole `.yap`.
- Every `field.ListID` must equal the parent list `ListID`.
- Every list must contain fields owned by that list before import.
- The app generator must not remap `field.ListID` when remapping `FieldID`.
- Run standalone `validate-ydl-list`, app-level `validate-yap-package`, and `scripts/inspect-yap-materialization.mjs` before runtime import.

## Benefit / Quota Usage Lists

For family quota, annual benefit, budget usage, entitlement consumption, or similar audit lists, include fields that support reliable query and reporting:

- native `Title` as usage record/application display
- source application number
- request/form/workflow correlation key when later update/release is needed
- applicant identifier
- applicant readable name
- readable cycle/year label
- numeric cycle number when the cycle is employee-anniversary or otherwise not a simple calendar year
- amount
- usage status such as In Progress, Occupied, Approved, Confirmed, Released, Rejected, or Not Applicable
- source application status
- submitted/approved/released timestamps when useful for audit
- source application id/link/notes when available

Quota check queries should match applicant identity + cycle number/year + active/occupied status, then aggregate amount with `arraySum`.

If quota is occupied on submission, the list must support the full lifecycle:

- create a usage row at submission/start with an in-progress/occupied status
- include in-progress/occupied and approved/confirmed statuses in future quota queries
- update or release the matching row on rejection/cancel/final approval when a runtime-safe workflow action exists
- exclude released/rejected rows from remaining-quota calculations

If update/delete is not runtime-proven, include enough fields for HR manual release and document the fallback rather than pretending the lifecycle is complete.

## Generated List Runtime Purpose

Before adding a list to a v1 app package, state:

- who maintains it
- who reads it
- which form/workflow/action writes or updates it
- whether it drives calculation, routing, reporting, audit, or configuration

Do not generate idle configuration or audit lists in v1. Use them or defer them.

## Generated Data List UI/UX Standard

When the active workspace contains `docs/yeeflow-application-design-system.md` and `docs/yeeflow-data-list-form-design-standards.md`, use them as the default generated data-list form standard. Use `docs/yeeflow-data-list-ui-ux-patterns.md` for export-level evidence. The first official UI/UX reference export is `UI and UX design (1).yap`.

Generated data lists should include two custom list forms by default:

- `Edit Item`
- `View Item`

New and Edit display settings should use `Edit Item`; View should use `View Item`. Both custom forms should use `attrs.container.cw = "2"`, zero padding with `--sp--s0` on all sides, and a `Main` -> `Content` container shell named with `nv_label`.

Global page background rule: for generated `Edit Item` and `View Item` custom forms, set full-page background on the custom form page `attrs.background`, not on `Main.attrs.common.background`. Keep `Main` structural. Use backgrounds on `Content`, field groups, cards, headers, and readonly sections only when those containers are intended as visible surfaces.

Use `docs/yeeflow-root-style-token-reference.md` for custom form token guidance. Prefer `--c--background`, `--c--neutral-light-active`, `--c--neutral-light-hover`, `--fs--base`, and spacing tokens such as `--sp--s150` and `--sp--s200` where the form schema supports style values. Avoid arbitrary custom colors and do not inject the full root stylesheet.

When the workspace includes `docs/yeeflow-text-control-generation-standards.md`, generated data-list custom form headings, helper text, card titles, and empty states must follow the Text Style Sample standard: native `heading` Text controls, inline width, `attrs.heads.ty = [null, token]` or a custom typography object, and plain string `attrs.heads.color`.

## Custom Code Controls In Data-List Forms

Use Custom Code controls in data-list custom forms only when native fields, lookup fields, form layout, validation, calculated fields, or list rules cannot deliver the required interaction.

Generation rules:

- Place the control in the custom form page JSON under `Childs[].Layouts[].LayoutInResources[0].Resource`.
- Use `type: "codein"` and include a valid script in `attrs["codein-script"]`, or use a future export-backed script reference pattern if one is proven.
- Configure `attrs["codein-script-param"]` with all required input parameters from the script.
- Bind writable outputs to list fields with `{ "type": 1, "value": { "prefix": "__list_", "value": "<FieldName>" } }`.
- Ensure every writable output field exists in the current list and is text-compatible for JSON/string outputs unless runtime proof supports another field type.
- Keep native `Title` semantics intact. If a custom code control writes to `Title`, document the reason and verify it does not break display/query behavior.
- Public-form usage is not proven by the Smart Lookup Picker export. Do not generate public-form custom code unless a focused public-form export/runtime test proves script loading, permissions, query access, and writeback.
- Run custom-code inspection and list validation before wrapper build.

CAPEX design carry-forward: the `IT Hardware CAPEX Request v4 Text Standard` baseline confirms that generated app packages should keep data-list custom forms aligned with the same page-background, `Main`/`Content`, Text, icon, and field-grid rules used by rich approval forms. Keep normal fields in clear grouped layouts and use Text/Decimal/Bit fallback persistence for runtime-sensitive controls unless native field proof exists.

Form Actions carry-forward: approval-form exports and generated runtime tests prove front-end form action concepts such as action buttons, page-load actions, temp variables, Set variable, Confirm dialog, Query data multiple/single mapping, query count, Query data filters via `attrs.querydata_filters`, `arraySum`, `JSONStringfy`, Submit form, and Save changes. Data-list custom forms may use similar concepts, but do not generate custom-form actions from approval-form evidence alone. Wait for a data-list custom form export that proves the exact custom-form action wrapper before promoting the pattern. Query data rules still help data-list form planning: use explicit selected fields/mappings and never rely on temp variables for persisted data unless copied into real fields.

Generated list forms should use meaningful `nv_label` names for `Main`, `Content`, `Field group`, and `Readonly section`. Keep `Edit Item` input-optimized and `View Item` display-optimized unless the user explicitly scopes out custom forms.

## Field Schema Rules

Before generating data-list fields, check the normalized field reference. Safe default field/control types are `input`, `textarea`, `input_number`, `currency`, `radio`, `switch`, `datepicker`, and `lookup` when the lookup target is local and resolved.

Always preserve the native `Title` field metadata: `FieldName: Title`, `Status: 0`, `IsSystem: true`, and `IsIndex: true`. Keep choice options non-empty for `radio`/`checkbox`; keep switch defaults boolean-like; keep lookup `Rules` complete with app/listset/list/display-field metadata. Approval Form Controls Test v2 proves data-list persistence/display for `Decimal` fields with `percent` and `rate` control types, `Datetime` fields with `time`, and `Text` fields with `hyperlink` in generated app packages. Approval Form Controls Test v6 proves that readable approval-form lookup persistence should use `attrs.addition[]`/autofill variables or explicit summary text: raw lookup variables mapped into plain Text fields store the internal local row ID. Use fallback Text/Decimal fields for environment-dependent pickers, tag, metadata, and rich text until native runtime proof exists. Defer direct file/image binary fields, signer, lookup-list, nested list row persistence, embedded data-list display, and calculated-column generation unless a focused export/import proves the shape.

Sublist summary persistence update: generated approval apps can persist list summary aggregates into Decimal fields through ContentList after binding list summaries to top-level number variables. This is the preferred v1 storage pattern for totals and averages from line-item controls.

Multi-item request persistence update: when an approval form uses a workflow-form sublist/listref for multiple product/service/request lines, do not assume direct child-row-to-data-list persistence unless a focused runtime proof exists. For v1 app packages, persist the parent transaction with summary fields such as readable line summary text, total amount, and custom-package/high-value flags. If row-level reporting is required, model a separate child transaction list and add runtime proof for conditional row creation before promoting it to a baseline.

## Field Type And Sample Rules

Generated `.ydl` lists and `.yap` child lists can now use these proven field shapes:

| Intent | FieldName example | FieldType | Type | Sample value |
| --- | --- | --- | --- | --- |
| text | `Text13` | `Text` | `input` | string |
| number | `Decimal1` | `Decimal` | `input_number` | numeric value |
| single select storage | `Text15` | `Text` | `radio` | selected option text |
| boolean switch | `Bit1` | `Bit` | `switch` | `"1"` or `"0"` |
| percent | `Decimal2` | `Decimal` | `percent` | numeric value displayed as percent |
| rating | `Decimal4` | `Decimal` | `rate` | numeric value such as `3.5` |
| time | `Datetime1` | `Datetime` | `time` | time string/display such as `10:30:00` |
| hyperlink | `Text1` | `Text` | `hyperlink` | URL string rendered as an open link |

Custom list forms should use matching bound controls for these fields:

- number fields: `input_number`
- choice/dropdown storage: `radio` or dropdown-compatible radio attrs when supported by the form pattern
- switch fields: `switch`
- percent fields: `percent`
- rating fields: `rate`
- time fields: `time`
- URL fields: `hyperlink`

When an approval form writes to a generated data list, require compatible mappings:

- text variables -> `Text/input`
- number variables -> `Decimal/input_number`
- radio/dropdown text variables -> `Text/radio`
- boolean switch variables -> `Bit/switch`
- percent variables -> `Decimal/percent`
- rating variables -> `Decimal/rate`
- time/date variables -> `Datetime/time`
- URL text variables -> `Text/hyperlink`

## Approval Form Storage Integration

When a generated data list will store records created by a generated approval form:

1. Generate and validate the data list first.
2. Build the `.ydl` only after final validation passes.
3. The user imports the `.ydl` and exports the imported list back.
4. Extract exported-back `AppID`, `ListSetID`, `ListID`, `FieldName`, `InternalName`, and `FieldID` values.
5. Hand that metadata to the approval-form generator.
6. Patch the approval form `ContentList` target and mappings from exported-back metadata.
7. Build the final `.ywf` only after approval-form structural and app-context validations pass.

Do not let the approval form target pre-import generated list IDs for production-like testing.

For app-level generated runtime packages, local generated list IDs can be used inside the same `.yap` and should be included in the package replacement set. For production-like standalone approval/list integration, patch `ContentList` from exported-back list metadata. The Form Actions Phase 1 runtime test proved front-end form actions but did not yet prove ContentList persistence in that package; keep persistence claims tied to actual target-list row evidence.

## Staged Integration Checklist

- data list final validation passed
- `.ydl` wrapper round-trip validation passed
- user imported data list
- user exported data list back
- exported-back metadata extracted
- external lookup sample IDs excluded from `Resource.ReplaceIds`
- approval form `ContentList` target patched to exported-back list metadata
- approval form validates against generated-list metadata
- approval `.ywf` wrapper round-trip validation passed

## Output Expectations

When generating, report:

- requirement decomposition
- native feature plan
- normalized spec
- dependency map
- decoded draft/final path
- validation results
- wrapper build result if created
- stop conditions and sandbox limitations
