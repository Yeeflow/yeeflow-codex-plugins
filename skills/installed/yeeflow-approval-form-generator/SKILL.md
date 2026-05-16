---
name: yeeflow-approval-form-generator
description: generate, inspect, validate, package, and improve yeeflow approval form definitions, decoded .ywf def json, .ywf exports, and .yap application exports using a staged native-first workflow with metadata mapping, validators, and safe stop conditions.
---

# Yeeflow Approval Form Generator

Use this skill when the user asks to generate, inspect, validate, package, troubleshoot, or improve Yeeflow approval form definitions, decoded `.ywf` Def JSON, `.ywf` wrappers, or `.yap` application exports.

## Core Workflow

Always work in stages:

```text
business requirement
-> requirement decomposition
-> metadata extraction/mapping
-> decoded Def JSON draft
-> structural validation
-> app-context validation
-> wrapper build
-> sandbox import by user/operator
-> runtime test
-> export-back learning
```

Do not generate raw `.ywf` directly from business text. Generate and validate decoded Def JSON first.

## Native-First Rule

Prefer Yeeflow native configuration in this order:

1. standard controls
2. attrs/defaults/readonly/validation
3. calculated fields and list summaries
4. lookup configuration and filters
5. form actions
6. workflow actions
7. AI actions
8. custom code control

Use custom code only when the requirement is justified client-side behavior that native Yeeflow features cannot model safely.

## Generated Approval Form UI/UX Standard

When the active workspace contains `docs/yeeflow-application-design-system.md` and `docs/yeeflow-approval-form-design-standards.md`, use them as the default approval-form design standard. Use `docs/yeeflow-approval-form-ui-ux-patterns.md` for export-level evidence. The first official UI/UX reference export is `UI and UX design (1).yap`.

Generated submission and task pages should use:

- `attrs.container.cw = "2"`
- zero padding with `--sp--s0` on all sides
- a top-level `Main` container
- a `Content` container inside `Main`
- a `Form body` container inside `Content` for request/review fields
- a `Form bottom` container at the end of `Content`
- `workflowControlPanel` and `workflowHistory` inside `Form bottom` by default

Some forms may omit Action Panel or Flow History only when the user explicitly asks or a real export proves the omission.

Use `docs/yeeflow-root-style-token-reference.md` for approval-form token guidance. Generated forms should prefer Yeeflow-native tokens for backgrounds, neutral borders, headings, spacing, and semantic decision/status colors. Let native `workflowControlPanel` and `workflowHistory` styles apply unless a real export proves a style override.

Generated approval forms should apply the design system by default: business content in `Form body`, Action Panel and Flow History in `Form bottom`, readonly task-page mirroring where useful, meaningful `nv_label`, and token-aligned colors and spacing without changing core workflow logic.

For higher-quality generated forms, also use the Runtime V2/V3 CAPEX form rules in `docs/yeeflow-form-design-quality-rules.md` when present. Put page background on `page.formdef.attrs.background`, keep `Main` structural, add `Form header` for request summaries, use inline text/icon widths, follow the Text Style Sample standard for native Text controls (`type: "heading"`, `attrs.heads.ty = [null, "h5-medium"]` or a custom typography object, `attrs.heads.color = "var(--c--text)"`, and inline `attrs.common.positioning`), avoid old generated Text shapes with pair-shaped colors, use square icon badge wrappers, two-column `flex_grid` field sections with `displayLabel = [null, false]`, and native calculated controls for formula fields such as `Subtotal = Quantity * Unit Price`.

Global page background rule: for every generated approval submission page and task page, put any full-page background on `page.formdef.attrs.background`. Do not set full-page background color on the `Main` container. Use backgrounds on `Form header`, cards, sections, summary panels, or field groups only when those specific containers should be visible surfaces.

## Approval Form Design Quality Gate

Before a generated approval form can be accepted for `.yap` generation, run a design-quality review. Warn or fail readiness when:

- normal value-entry fields are direct children of section containers instead of a two-column `flex_grid` or equivalent grid control
- textarea, upload, list/sublist, rich text, or long helper/guidance controls are squeezed into normal two-column cells instead of full-row layout
- Text controls do not follow the learned Text standard or are not inline width by default
- Action Panel or Flow History are outside `Form bottom`
- `Main` is styled as the page background instead of remaining structural
- section containers or important controls lack meaningful `nv_label`
- submit and review pages do not preserve the same business section structure where practical
- applicant/profile snapshot or lookup-autofill target fields are editable without an explicit business reason

Default field layout rule: generate normal fields inside grid controls. Use direct section children only for headings, helper text, summary panels, full-row controls, nested grids, and Form bottom workflow controls.

Requester/applicant defaulting rule: when a required applicant/user control is generated with Default value = Current User (`attrs.default = "currentUser"` and `value = "CurrentUser"`), do not also generate a form-action Set variable step that defaults the same applicant variable from Current User. Applicant snapshot/profile actions should read from the fixed requester/applicant variable after initialization; reviewer/task viewers must not overwrite applicant data from their own Current User context.

Submit-time validation rule: core business checks that must happen before workflow submission should be wired through `formdef.formAction.onSubmit`. The submit action may call a reusable check action first, then conditionally warn/confirm and run a native `type: "submit"` step. Never generate an `otheraction` step that calls its own parent action.
Readonly default rule: generated applicant snapshot fields and autofilled fields should use control-level `readonly: true`. The applicant/requester picker may be editable on the submit page only when the requester is allowed to choose or confirm the applicant; task pages should render applicant identity and snapshot fields readonly.

CAPEX runtime baseline: `IT Hardware CAPEX Request v4 Text Standard` is the latest rich generated approval-form proof. It preserves the working CAPEX workflow and ContentList persistence shape, uses Runtime V2 form design rules, replaces old generated Text controls with Text Style Sample patterns, and passed import/open/designer verification for the Text Typography and Text shadow popups. Use `docs/generated-it-hardware-capex-request-text-standard-baseline.md` plus `docs/it-hardware-capex-request-runtime-v2-ui-study.md` before generating similar enterprise request forms.

## Hard Stop Conditions

Stop and report blockers. Do not build final `.ywf` when:

- placeholders remain
- structural validation fails
- app-context validation fails
- app/list/field IDs are missing
- a generated approval form targets a newly generated data list using pre-import/generated `ListID` values instead of exported-back list metadata
- FlowKey does not equal `defkey`
- WorkflowType does not equal `workflowType`
- custom code is unreviewed or unjustified
- sensitive credential/token resources are involved
- workflow action properties do not satisfy the normalized action reference from `workflow-action-configurations.normalized.json`
- production use is requested without sandbox import/export round-trip proof

Never guess app IDs, listset IDs, list IDs, field internal names, users, groups, positions, document template IDs, AI agent IDs, or connection IDs.

## Proven V1 Patterns

This skill can help generate or validate:

- one-step approvals
- two-step approvals
- structured request and approval pages
- responsive grid UI
- current user/current date defaults
- workflow action panel and history
- page registration/publish metadata
- runtime import may leave app-level approval forms unpublished; for sandbox proof, publish the imported form in Yeeflow Form Builder before submit/approve testing
- workflow graph layout metadata
- ContentList parent persistence
- ContentList persistence to a newly generated dedicated data list after importing/exporting the list back and patching to the real metadata
- workflow action validation against the normalized node/action configuration reference
- data-list lookup controls with additional-field mappings into readonly approval form variables
- number fields using number variables and `input_number` controls
- single-select fields using text variables and `radio` controls, including dropdown style via `attrs.displayStyle = "dropdown"`
- switch fields using boolean variables and `switch` controls
- conditional display rules on target controls via `attrs.control_display[]`
- type-compatible `ContentList` mappings for text, number, choice, and switch fields
- line-item tables
- parent/detail persistence
- optional custom code controls when justified
- `.yap` metadata extraction
- `.ywf` wrapper build with round-trip validation

## References

Load only the reference needed for the task:

- `references/operating-playbook.md`: master workflow, stop conditions, readiness levels.
- `references/requirement-decomposition-template.md`: intake and decomposition before generation.
- `references/baseline-v6-template.md`: proven request/approval page, defaults, graph, and page metadata patterns.
- `references/custom-code-decision-guide.md`: when to use or avoid custom code.
- `references/yap-structure-study.md`: `.yap` package structure and app/list relationship patterns.
- `references/field-type-pattern-study.md`: number, radio/dropdown, switch, conditional display, and v11 generated `.yap` proof.
- `references/validation-guide.md`: structural and app-context validator usage.
- In the active generator workspace, also use `docs/workflow-action-configuration-reference.md`, `docs/workflow-action-generation-rules.md`, and `workflow-action-configurations.normalized.json` as the official workflow action configuration reference when present.
- In the active generator workspace, use `control-configurations.normalized.json`, `docs/yeeflow-control-configuration-reference.md`, and `docs/yeeflow-control-field-generation-rules.md` as the approval form control schema reference.
- In the active generator workspace, use `yeeflow-control-field-schema-utils.js`, `field-configurations.normalized.json`, and `docs/yeeflow-control-to-field-mapping.md` when approval controls must persist into data-list fields.
- In the active generator workspace, use `docs/yeeflow-text-control-generation-standards.md`, `docs/yeeflow-form-design-quality-rules.md`, and `docs/it-hardware-capex-request-runtime-v2-ui-study.md` as the latest approval-form design quality baseline when generating rich request forms.
- In the active generator workspace, use `yeeflow-expression-functions.normalized.json`, `yeeflow-expression-function-knowledge-base.normalized.json`, `yeeflow-expression-operators.normalized.json`, `yeeflow-expression-utils.js`, `docs/yeeflow-expression-editor-reference.md`, `docs/yeeflow-expression-generation-rules.md`, and `docs/yeeflow-expression-editor-ui-contexts.md` before generating calculated controls, dynamic display rules, custom validation rules, lookup filters, workflow transition conditions, request numbers, or default-value formulas. Use enriched function metadata for function selection, but do not generate screenshot-observed metadata-pending functions such as `addWorkDays` or `addWorkHours`.
- User/profile expression update: `Expression User Profile Test v1` proved generated approval submission and task pages can render `getUserAttr`, `getOrgAttr`, `getLocAttr`, `dateFormat`, and nested `dateAdd` expressions, complete approval, and persist readable profile summaries with ContentList. Use the export-backed current-user token with `exprType: "application"`, preserve exact `getOrgAttr` naming for department/organization attributes, use descriptor-object attribute parameters, and add safe fallback arrays for optional tenant profile values. Do not use `getDeptAttr` unless a future export proves it.
- Yeeflow page/control JSON may store config values as `[null, value]`; validator logic should unwrap that representation before primitive or enum checks.
- `references/metadata-and-wrapper-guide.md`: metadata replacement and wrapper build usage.
- `references/data-list-approval-integration-pattern.md`: staged generated data list plus approval form persistence integration.
- `references/examples-summary.md`: proven examples and what each demonstrates.

## Generated Storage List Rule

When an approval form writes to a newly generated data list:

1. Generate and build the `.ydl` first.
2. The user imports the data list into the sandbox and exports it back.
3. Extract the exported-back `AppID`, `ListSetID`, `ListID`, `FieldName`, `InternalName`, and `FieldID` values.
4. Patch the approval form `ContentList` target and field mappings from that exported-back metadata.
5. Validate with `validate-ywf-def.js --mode final`.
6. Validate with `validate-ywf-def-against-yap.js` against the generated-list metadata.
7. Build the `.ywf` only after both validators pass and no placeholders remain.

Do not build a production-like final `.ywf` that targets pre-import generated data-list IDs.

## Lookup Control Rules

Use lookup controls when the requester should select an existing app/list record. Confirmed data-list lookup controls require source `appid`, `listsetid`, `listid`, and display field metadata.

For additional field mappings:

- mappings live in lookup `attrs.addition[]`
- each source field must resolve by source field name and/or field ID
- each target must be a workflow/form variable
- displayed derived target controls should usually be readonly
- lookup/autofill target controls such as product name, product type, unit price, and calculated amount should be readonly by default
- validate lookup source, display field, sort field, additional source fields, and target variables against metadata before wrapper build

## Control Schema Rules

Before generating approval form controls, check the normalized control reference. Safe default controls are `input`, `textarea`, `input_number`, `currency`, `radio`, `switch`, `datepicker`, `lookup`, `list`, `container`, `section`, `heading`, `workflowControlPanel`, and `workflowHistory`.

Generated value-entry controls should have `binding` when the value must persist. Use `attrs.control_validation` for validation rules, `attrs.control_display` for dynamic display/style only when copied from a studied export, and `attrs.control_event_rule` only after the target action shape is modeled and validated. Signer, metadata, multi-metadata, lookup-list, and environment pickers are schema-supported but runtime-unproven unless a focused export/import proves the exact shape. File upload and icon upload are runtime-proven for workflow-form render/upload/submit/task-display when using the Stage 3 export-backed shape, but binary data-list persistence remains deferred.

AI Training control-study update: when the active workspace includes `docs/ai-training-approval-form-control-study.md`, use it as the broad approval-control anatomy reference. It confirms `binding -> variables.basic[].id`, type-compatible variables for text/number/boolean/date/file/img/user/groupselect/location/costcenter/metadata/lookup/list controls, `daterange` From/To binding via `attrs["binding-date-range"]`, `radio` dropdown via `attrs.displayStyle = "dropdown"`, `checkbox` multi-choice/dropdown via `attrs.choices` plus `attrs.color_choices`, `currency` number attrs, file/icon upload attrs, picker multiple attrs, metadata `source/categoryId`, lookup source/search/display attrs, and sublist `variables.listref` plus list-field child-control wiring. Treat advanced controls from this export as runtime-sensitive until a focused generated package imports and opens successfully.

Approval Form Controls Test v2 runtime update: the generated advanced-input package proved `percent`, `time`, `hyperlink`, `rate`, and `calculated` controls through import, app open, form render, submit, reviewer task open, approval, and `ContentList` record creation. The proven value shapes are: percent number displayed as `25.00%`; time displayed as `10:30:00`; hyperlink stored in a text-backed hyperlink field and displayed as an open link; rate stored as a numeric value such as `3.5`; calculated can reference a number and percent, with `200 * 25% = 50`. `daterange` is still partial: generated from/to values rendered, accepted input, and displayed on the task page, but both mapped date fields still need a list-view persistence proof before promoting it to fully proven.

Approval Form Controls Test v3 runtime update: the generated upload/media package proved `file-upload` and `icon-upload` through import, app open, form publish/open, actual upload of `yeeflow-upload-stage3-test.txt` and `yeeflow-upload-stage3-test.png`, submit, submitted-page display, reviewer task display, approval completion, and text-summary `ContentList` record creation. Use the AI Training shapes: file upload with `attrs.ver`, `attrs.file_multiple`, `attrs.file_maxcount`, and `attrs.upload_btn`; icon upload with `attrs.controlmultiple` and `attrs.maxselection`. Treat workflow-form usage as proven, but do not claim binary file/image persistence into data-list fields until a separate isolated proof exists.

Approval Form Controls Test v4 runtime update: the generated picker package proved editable single-select `identity-picker` workflow-form usage through import, app open, list open without `datas/query` 400, user selector open, selection of `Renger from Yeeflow`, submitted-page display, reviewer-task display, approval completion, and text-summary `ContentList` record creation. `organization-picker`, `cost-center-picker`, and `location-picker` rendered and opened in the sandbox, but remain partially proven and environment-sensitive: department showed `Default` but did not retain after confirmation, cost center returned no rows, and location returned no matching results. Generate these tenant-metadata pickers as optional, prefer safe text-summary persistence, and do not claim direct picker field persistence or guaranteed selection until a focused working export/import proves the required tenant metadata and retention attrs.

Approval Form Controls Test v6 runtime update: the generated lookup/list package proved internal packaged single-select `lookup` and workflow-form `list` / `listref` controls through import, app open, source and target lists opening without `datas/query` 400, lookup picker open, packaged product selection, lookup display, `attrs.addition[]` autofill into readonly variables, list row add/edit, submit, submitted-page display, reviewer-task display, approval completion, and `ContentList` target row creation. Generate business lookups with the source list packaged in the same `.yap` when possible, and validate source list/display/search/addition fields before build. Do not map a raw lookup variable directly into a plain text field when the expected value is the display name: v6 showed that plain text persistence stores the internal local row ID. Persist readable values through lookup addition/autofill variables or explicit summary variables unless storing the row ID is intentional. For list/listref controls, workflow-form render/add/edit/review is proven, but direct child-row-to-data-list persistence is still deferred; persist a text summary or use a separately modeled child list until direct row persistence is export-proven.

Sublist summary expression runtime update: `Expression Sublist Summary Workflow Test v1` proved generated row-level calculated fields, summary display, summary-to-variable binding, and summary-bound workflow routing. For calculated row fields, define the row field in `variables.listref[].fields[]`, render it in the submit-page list control with `control.type = "calculated"`, set `attrs.list_field = true`, `attrs.list_field_binding` to the parent list variable id, `attrs.list_control_id` to the parent list control id, and store the row expression in `attrs.calculated`. Current-row values use `exprType: "variable_ctx"`, for example `LineQuantity * LineUnitPrice` with `ctx: "LineItems"`. Put summaries on parent list `attrs["list-fields-summary"]`; use `total` and `avg` for number fields and bind numeric totals with `{ "prefix": "__variables_", "value": "TotalAmount" }`. Summary-bound number variables are runtime-proven for `InclusiveGateway` numeric branch conditions with `n.>` and `n.<=`. Runtime entry note: summary values recalculate after row fields are committed, so tests should blur/tab out of edited cells before asserting totals. `Implant Application Request (1).ywf` proved a generator hazard: FlowKey `EFI` can be replaced inside the `prefix` property name during import/export, producing `pr<runtimeFlowKey>x` and breaking the binding. Avoid form keys that appear inside reserved JSON property names, and inspect summary binding objects for a literal `prefix` key before packaging/runtime claims. If a form action immediately uses the total for quota, submit blocking, routing, or persistence, also recalculate the top-level total in that action with `arraySum(<ListVariableId>, "<SubtotalFieldId>", [], [])` before using it.

Before broad control generation, consult `approval-form-control-runtime-coverage.json` and `docs/approval-form-control-runtime-coverage-matrix.md` when present. They are the current source of truth for proven, partial, environment-dependent, deferred, persistence-safe, and summary/autofill-required controls.

Form Actions Phase 1 update: the manually updated `Expression Sublist Summary Workflow Test v1.yap` export proves the first approval-form form-action structures. Use `docs/form-actions-phase-1-study.md`, `docs/yeeflow-form-action-generation-rules.md`, and `docs/yeeflow-temp-variable-generation-rules.md` before generating form actions. Form actions live on `page.formdef.actions[]`; page load wiring uses `page.formdef.formAction.onLoad`; button click wiring uses `action_button.attrs.control_action`; temp variables live in `variables.tempVars[]` and are referenced in expression tokens as `__temp_<id>`. Phase 1 safe study patterns include `setvar` and `confirm` steps. Treat `listitem` form action steps as observed but deferred until a focused generated runtime test proves them. Form action buttons should use inline width, meaningful `nv_label`, and native button style codes (`"2"` primary, `"3"` soft secondary, `"4"` outline primary, `"5"` neutral outline, `"6"` dashed utility).

Form Actions Phase 2 query/submit update: the manually updated `Form Actions Phase 1 Test v1 Runtime.yap` export proves approval-form `querydata` and `submit` step structures. The generated `Form Actions Phase 2 Query Submit Test v1` package runtime-proved query multiple into a form list variable, query result count, query single field mapping, `arraySum` over a temp query collection, `JSONStringfy` collection display, default Submit form, Save changes, reviewer approval, and ContentList persistence. The patched export and corrected retest prove Query data filters use `attrs.querydata_filters` plural, not `attrs.querydata_filter` singular; Active Bit ON uses `right: "true"`, returning 2 active rows and `arraySum` 2000. `vLookup` was only seen in labels and remains deferred. Submit steps use `type: "submit"`; Save changes is `attrs.submitType = "3"`. Do not use `arraySub`.

## Expression Rules

Generated approval forms must use Yeeflow expression editor token arrays for formulas and rule conditions. Variables must use the exact token shape `exprType: "variable"`, `type: "expr"`, `id`, `name`, and `valueType`; allowed value types are only `number`, `text`, `date`, and `boolean`. Use only functions/operators from the normalized expression references. Do not generate JavaScript formulas, invented functions, or raw lookup display assumptions. Run `node scripts/smoke-expression-validation.mjs` when expression helpers or references change, and run `validate-ywf-def.js` on generated form definitions.

For sub list row calculations, use `exprType: "variable_ctx"` current-object tokens rather than top-level workflow variable tokens. Use the parent list variable id as `ctx` and the row field id as `id`.

## Form Actions Phase 1/2

For generated form actions, use the runtime/export-backed rules from `docs/yeeflow-form-action-generation-rules.md`: action buttons use `attrs.control_action`, page load uses `formdef.formAction.onLoad`, temp variables live under `variables.tempVars[]`, and temp variable expression tokens use `__temp_` ids. Phase 1 generated-safe steps are `setvar` and `confirm`; Phase 2 export-backed steps are `querydata` and `submit`.

Runtime baseline status: button styles, button-click triggers, page-load triggers, temp variable display, `setvar`, `confirm`, Query data multiple/single mapping, query count, Query data filter via `querydata_filters`, `arraySum`, `JSONStringfy`, default Submit form, Save changes, task open, approval completion, and ContentList persistence are proven in the focused generated tests.

Do not hardcode tenant-specific direct-user assignees in generated approval tasks. Avoid `method: "users"` with local user IDs/titles such as `User:Renger` unless the user explicitly supplies a target-tenant-valid mapping. Prefer requester/current-user expression assignment from an export-backed workflow variable.

## Field Type Rules

Use the Visitor Access Management v11 baseline as the current generated proof for richer approval form fields.

Number fields:

- workflow variable `type = "number"`
- control `type = "input_number"`
- format/min attrs such as `displayThousandths`, `rounded-to`, and `number_min`
- default value, when needed, on the control as numeric `value`
- persist to `Decimal/input_number` data-list fields through `ContentList`

Single-select fields:

- workflow variable `type = "text"`
- radio layout control `type = "radio"` with `attrs.choices[]`
- dropdown layout uses the same `radio` control plus `attrs.displayStyle = "dropdown"`
- selected value is the option text
- persist to text/radio-compatible target fields

Switch fields:

- workflow variable `type = "boolean"`
- control `type = "switch"`
- default value is boolean `true` or `false`
- persist to `Bit/switch` data-list fields

Conditional display:

- store rules on the target control under `attrs.control_display[]`
- confirmed example: show `EscortUser` when `RequiresEscort == true`
- `controlId` should match the target control ID
- source variable and condition value type must be compatible

Approval page mirroring:

- mirror submitted business fields on approval pages as readonly unless explicitly request-only
- conditional fields can be mirrored with the same rule or shown unconditionally for reviewer context

Known gaps:

- persisted conditional field such as `EscortUser -> Text16`
- multi-select choice
- user picker
- lookup inside a line-item table

## Scripts

Use bundled scripts rather than rewriting validators/builders:

- `scripts/validate-ywf-def.js`: validate decoded Def JSON in draft/final mode.
- `scripts/validate-ywf-def-against-yap.js`: validate Def mappings against extracted `.yap` metadata.
- `scripts/inspect-yap-package.js`: inspect `.yap` package structure and inventory.
- `scripts/extract-yap-metadata.js`: extract app/list/form/field metadata from `.yap`.
- `scripts/apply-ywf-metadata.js`: safely replace placeholders using metadata mapping.
- `scripts/build-ywf-wrapper.js`: base64 wrap validated decoded Def and round-trip validate.

Workflow action validation now covers missing required node properties, invalid enum values, invalid value types, `ContentList` mappings, `QueryData` filters, `SequenceFlow` conditions, `Loop`/`Delay` condition shapes, and unsafe external or credential-related workflow actions. Do not bundle sensitive values.

## Output Contract

For new form generation, output:

A. Requirement interpretation  
B. Decomposition table  
C. Native feature plan  
D. Custom code decision  
E. Dependency list  
F. Decoded Def draft when ready  
G. Validation reports  
H. Wrapper build result only if final validation passes  
I. Risks, assumptions, and sandbox test checklist

If metadata is missing, stop at draft mode and produce a dependency map.
