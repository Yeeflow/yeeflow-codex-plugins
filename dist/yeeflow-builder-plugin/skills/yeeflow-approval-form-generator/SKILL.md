---
name: yeeflow-approval-form-generator
description: generate, inspect, validate, package, and improve yeeflow approval form definitions, decoded .ywf def json, .ywf exports, and .yap application exports using a staged native-first workflow with metadata mapping, validators, and safe stop conditions.
---

# Yeeflow Approval Form Generator

Business Travel workflow-publish practice: import success and approval workflow publish success are separate gates. The fixed Business Travel package is user-proven for import, app open, workflow open, and workflow publish. Before packaging new approval forms, ensure every variable referenced by form controls, sub-list summaries, sequence-flow `conditioninfo`, Set Variable `variablesetting[]`, and assignment `usertaskassignment[]` expressions exists in `DefResource.variables`. Sequence flows must not reference deleted variables. Set Variable targets must exist and use the target variable's `idx`, `id`, `name`, and `type`. Direct job-position assignments require numeric position IDs; placeholders like `__POSITION_ID_REQUIRED_*__` are blocking errors. If a real tenant position ID is unavailable, stop for mapping or document a user-approved fallback. Do not claim workflow execution, routing, request submission, data mutation, or true Finance Manager assignment from publish proof alone.

## Application Navigation References

When an approval form is included in application navigation, reference it from the root app `Data.Item.ListModel.LayoutView.sort[]` using `Type = 105` and `ListID = Data.Forms[].Key`. App-level approval forms in generated packages keep `ListID = 0` on the form record; the navigation item points to the form key, not a child data-list ID.

Approval form menu items can be top-level resources or children inside a top-level `Type = "classes"` navigation group. Use optional `DisplayName` for custom menu text, omit it for title fallback, use `Icon: ""` for no-icon, and keep `IsHidden` boolean when present. Validate references before wrapper build.

Use this skill when the user asks to generate, inspect, validate, package, troubleshoot, or improve Yeeflow approval form definitions, decoded `.ywf` Def JSON, `.ywf` wrappers, or `.yap` application exports.

Data Filter controls can be used in approval forms at the product level, but the Sales and CRM exports only prove dashboard page usage. Until an approval-form export proves the exact host schema, treat approval-form Data Filter placement, lookup/lookup-list filtering, Apply button wiring, Remove filters reset behavior, and runtime refresh behavior as product-documented only. Reuse `docs/studies/data-filter-controls.md` for the shared concept: filter variables are the bridge between filters and downstream data-bound controls; Search, Radio, Hierarchy, and Sorting are dashboard export-proven from the CRM sample; every generated filter variable reference must resolve before handoff.

Pivot Table is a Data Analytics control and is not supported on Approval Forms. Keep Pivot Table generation on Dashboard pages, and only use Data List forms when a product-backed design explicitly calls for it and validation can prove the host/source/field references. If a user asks for approval analytics, place the Pivot Table on a dashboard or supported reporting surface instead of the submission, task, or approval form page.

When approval-form changes target an existing imported app, confirm whether the user wants a new cloned `.yap` or an upgrade `.yapk`. For `.yapk`, start from a Version management baseline and preserve existing form/workflow IDs; do not regenerate fresh IDs for existing objects. The first studied `.yapk` resource is opaque and signature-like, so offline app-content form mutation inside `.yapk` is not generation-safe until Yeeflow encoding/signing is proven.

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

AI action export learning: `AI Agent and Copilot Local Resource Baseline8.yap` proves the workflow graph `AI` node can call an app-contained AI Agent with `properties.type = "agent"`, `properties.data.AgentID`, input variable mappings, output variable mappings, and optional context enrichment. The export proof is from Scheduled Workflow (`WorkflowType = 3`), but approval/list workflows should validate the same node shape if reused. Do not execute AI actions in runtime tests unless the Agent, input data, and call scope are explicitly safe.

`Spark & AI (1).yap` now proves the same `AI` workflow node family in a data-list workflow (`WorkflowType = 1`) triggered by host-list `FlowMappings[].Setting.NewTrigger = true`. That export adds two important list-workflow details: image input mapping from a current-row `icon-upload` field into Agent input `type = "img"`, and item-ID mapping from native `ListDataID` into a text input so the Agent can update the originating row through an application-resource access tool. Approval-form workflows may reuse the node family, but do not claim image-input or same-row update proof for approval forms until a focused approval export shows it.

When an approval form depends on master/reference data, treat the dependency as part of the form design:

- lookup controls must resolve to a real local generated list or an explicit external dependency map
- target display fields must exist
- local target lists should include sample/reference rows when runtime lookup selection is part of the smoke test
- do not use free-text controls as a substitute for controlled catalog/visitor/product/equipment selection when the business process requires a master-data list

Use custom code only when the requirement is justified client-side behavior that native Yeeflow features cannot model safely.

Doc library control note: the product exposes the `Doc library` control on approval forms, data-list forms, document-library forms, and dashboards. Dashboard controls are runtime-proven. The form-host study showed approval-form Doc library controls render in Form Builder preview, but live request-page proof remained partial because the generated `Document Review` workflow assignment task did not set the task assignee and task form setting correctly. Treat that as a workflow/task-node generation follow-up, not a Doc library control schema failure. If adding a Doc library control to an approval form, reuse the studied `type = "document-library"` / `attrs.data.list` / optional `attrs.data.folder` pattern, validate locally, configure assignment task assignee and task form settings from a proven workflow pattern, and do not claim published approval-form runtime proof until import, publish, and live request-page open all pass.

Form Report note: Form Reports are app-level resources based on approval forms, not part of the approval workflow graph. `AI Training-2 (1).yap` export-proves `Data.FormNewReports[].DefKey` references `Data.Forms[].Key`, and report fields map to approval variables and optional selected sub-list fields. When generating an approval form intended for reports, keep variable IDs stable for report generation, model sub-list/listref fields deliberately, and use `yeeflow-form-report-generator` for the Type `32` report resource. Do not claim submitted-row reporting, row-click detail behavior, or export permission runtime behavior without a focused Form Report runtime baseline.

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

AP Approval demo hardening update: generated approval forms should be published by default unless the user explicitly requests draft mode. Set `Data.Forms[].Deployed = true`, `Data.Forms[].Status = 1`, and any present DefResource `deployed`, `status`, and `published` flags to published values. Submit pages should contain submitter inputs and business context only; do not show internal approval routing, budget owner, finance approver, reviewer decision notes, or approval routing details on submit pages unless requested. Task pages may show reviewer decision sections and routing context.

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

Editable requester/applicant rule: when proxy submission is allowed and the requester/applicant picker remains editable, bind that control's change/action trigger to rerun applicant snapshot initialization and dependent quota/policy calculations. Do not rely only on page load; a changed applicant must refresh profile fields, eligibility, quota queries, and persisted snapshot values.

Routing-driver field rule: any form field or variable that drives workflow routing should be required, readonly auto-derived, or protected by a workflow fallback route. Derived flags such as `HasCustomPackageProduct` should be calculated from the source controls/sublist and displayed readonly instead of left for the requester to manually set. If the value can be empty or unexpected at runtime, the workflow should route to a safe review/fallback path rather than dead-ending.

Configuration-list guidance rule: if a generated approval form includes a configuration list such as Attachment Requirement Rules, the form action model must either query/use it for visible guidance or validation, or the list should be deferred out of v1. Do not show a maintained configuration list that the form never reads.

Submit-time validation rule: core business checks that must happen before workflow submission should be wired through `formdef.formAction.onSubmit`. The submit action may call a reusable check action first, then conditionally warn/confirm and run a native `type: "submit"` step. Conditional warning/confirm/check steps before submit usually require step-level `continue: true`, the export-backed shape for designer checkbox `Continue next step when condition is not met`; otherwise the valid path can skip the warning but stop before submit. Never generate an `otheraction` step that calls its own parent action.

Set variables rule: use multi-value Set Variables only for independent assignments. Keep dependent calculations in ordered steps when later values depend on earlier variables, query results, or summary recalculations.

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

## Approval Workflow Task Forms

`Workflow Actions Runtime Baseline (2)_Task forms.yap` export-proves that app-level approval forms can store a submission form and multiple task forms under `Data.Forms[].DefResource.pageurls[]`. The studied submission form uses `pageurls[].type = 1`; task forms use `pageurls[].type = 2`. Assignment Task nodes associate to task forms through `MultiAssignmentTask.properties.taskurl`.

AP Approval demo publish fix: runtime practice confirmed that task pages used by Assignment Task publish correctly when the referenced task page has outer `pagetype = 1`, the task node also carries `properties.pagetype = 1`, and the task page reference is mirrored across `properties.taskurl`, `properties.taskUrl`, and `properties.TaskUrl`. Treat missing/null TaskUrl, unresolved task page IDs, and referenced task pages with outer `pagetype = 2` as generated-final hard errors. Apply the same rule to Claim Task / `CandidateTask` nodes.

Generation guidance:

- Distinguish submission forms from task forms. Task forms are separate pages used by Assignment Task and Claim Task actions.
- Every generated Assignment Task should reference an existing task form through `properties.taskurl`; a task form may be reused by multiple task nodes when the task responsibilities match.
- Every generated Assignment Task and Claim Task should mirror its task form reference across `properties.taskurl`, `properties.taskUrl`, and `properties.TaskUrl`.
- Every generated Assignment Task and Claim Task node should carry `properties.pagetype = 1`.
- Referenced task page entries should remain `type = 2` task forms while using outer `pagetype = 1`.
- A copied submission-form task page can set all copied value-entry controls to `readonly=true` for approve/reject or complete-only review tasks.
- Task-specific pages may keep copied request fields readonly and add editable task-owner controls for finance/admin updates, comments, reassignment users, or add-assignee users.
- The standard Action Panel is `type = "workflowControlPanel"`; its displayed Approve/Reject/Complete/Reassign/Add assignee buttons are derived from the associated task type/options rather than serialized as explicit child buttons in the export.
- Custom task buttons use `type = "action_button"` with `attrs.control_action` pointing to a `formdef.actions[].id`.
- Submit form task operations must match task type: approve/reject/reassign/add assignee for Approval tasks and complete for Complete tasks.
- Export-proven Submit form task operation markers include no `submitType` for default approve/complete by host task context, `submitType = "2"` for reject, `submitType = "4"` for reassign with `forword`/`remark`, and `submitType = "5"` for add assignee with `forword`/`remark`/`assignee`. Preserve the export spelling `forword`.
- Use `Workflow Action Approval Test.ywf` as the corrected positive reference for Add others/Add assignee custom buttons: the button's `attrs.control_action` should resolve to the `Add assignee button clicked` form action whose Submit form step uses `submitType = "5"`. Do not bind Add others to reject/reassign/approve actions.
- The focused `Workflow Task Form Runtime Baseline` package imported, opened, rendered the form designer, listed the submission form plus `WARTB Task`, `WARTB Task2`, `WARTB Task3`, and `WARTB Task4`, rendered `WARTB Task3` custom buttons, opened the workflow designer, and published successfully. Treat this as import/open/designer/publish proof for task-form configuration only.
- Do not claim custom task-button execution, reassign/add-assignee behavior, or Complete task execution without focused runtime proof.

## Custom Code Controls In Approval Forms

Custom code remains the last implementation layer after standard controls, attrs/defaults/readonly/validation, calculated fields, lookup configuration, form actions, workflow actions, and AI actions.

Generation rules:

- Place the control inside the target page's `formdef.children` tree with `type: "codein"`.
- Include a valid script in `attrs["codein-script"]`, or use a future export-backed script reference pattern if one is proven.
- Configure `attrs["codein-script-param"]` with every required script parameter.
- Bind approval-form writable output parameters to workflow/form variables with `{ "type": 1, "value": { "prefix": "__variables_", "value": "<VariableId>" } }`.
- Ensure target variables exist in `variables.basic[]`, are editable where the script writes to them, and use a text-compatible type for JSON/string outputs unless runtime proof supports another type.
- Do not use custom code for approval routing, authoritative calculations, critical validation, or persistence when workflow/form native patterns can handle them.
- If a custom code control writes values, include a runtime test for render, interaction, target variable update, submission, task-page behavior, and final persistence if mapped through workflow actions.
- Do not place mutating custom code on readonly task pages unless the requirement explicitly calls for task-page interaction and a runtime test covers it.

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

Form Actions Phase 2 query/submit update: the manually updated `Form Actions Phase 1 Test v1 Runtime.yap` export proves approval-form `querydata` and `submit` step structures. The generated `Form Actions Phase 2 Query Submit Test v1` package runtime-proved query multiple into a form list variable, query result count, query single field mapping, `arraySum` over a temp query collection, `JSONStringfy` collection display, default Submit form, Save changes, reviewer approval, and ContentList persistence. The patched export and corrected retest prove Query data filters use `attrs.querydata_filters` plural, not `attrs.querydata_filter` singular; Active Bit ON uses `right: "true"`, returning 2 active rows and `arraySum` 2000. `Implant Application Request (5).ywf` proved that variable/calculated right operands in Query data filters must be expression-editor token arrays with `showCus: false`; do not place frontend `<input type="button" ...>` expression-button HTML strings in `right` with direct-value mode, because runtime compares against that literal string. `vLookup` was only seen in labels and remains deferred. Submit steps use `type: "submit"`; Save changes is `attrs.submitType = "3"`. Do not use `arraySub`.

## Expression Rules

Generated approval forms must use Yeeflow expression editor token arrays for formulas and rule conditions. Variables must use the exact token shape `exprType: "variable"`, `type: "expr"`, `id`, `name`, and `valueType`; allowed value types are only `number`, `text`, `date`, and `boolean`. Use only functions/operators from the normalized expression references. Do not generate JavaScript formulas, invented functions, or raw lookup display assumptions. Run `node scripts/smoke-expression-validation.mjs` when expression helpers or references change, and run `validate-ywf-def.js` on generated form definitions.

For sub list row calculations, use `exprType: "variable_ctx"` current-object tokens rather than top-level workflow variable tokens. Use the parent list variable id as `ctx` and the row field id as `id`.

## Form Actions Phase 1/2

For generated form actions, use the runtime/export-backed rules from `docs/yeeflow-form-action-generation-rules.md`: action buttons use `attrs.control_action`, page load uses `formdef.formAction.onLoad`, temp variables live under `variables.tempVars[]`, and temp variable expression tokens use `__temp_` ids. Phase 1 generated-safe steps are `setvar` and `confirm`; Phase 2 export-backed steps are `querydata` and `submit`.

Runtime baseline status: button styles, button-click triggers, page-load triggers, temp variable display, `setvar`, `confirm`, Query data multiple/single mapping, query count, Query data filter via `querydata_filters`, `arraySum`, `JSONStringfy`, default Submit form, Save changes, task open, approval completion, and ContentList persistence are proven in the focused generated tests.

Workflow transition condition update: approval-form workflows can use latest SequenceFlow condition operand wrappers from `Implant Application Request (4).ywf`. Direct variable/field selectors use operand `type: 1`, direct/static/option/date values use `type: 0`, and expression-editor operands use `type: 2` on either left or right. Use this when approval-form routing depends on calculated dates, thresholds, quota values, or dynamic comparisons; keep simple approve/reject task outcome conditions export-backed.

Do not hardcode tenant-specific direct-user assignees in generated approval tasks. Avoid `method: "users"` or `method: "direct"` with local user IDs/titles unless the user explicitly supplies a target-tenant-valid mapping. Prefer requester/current-user expression assignment from an export-backed workflow variable.

Assignment task update: `Test ABC.yap` proves `MultiAssignmentTask.properties.usertaskassignment[]` shapes for direct user, applicant line manager, applicant department manager, direct job position, job position by selected department, job position by applicant department, job position by selected location, and job position by applicant location. `Test ABC (1).yap` adds export-proven multiple-assignee arrays, mixed direct users/positions/expressions, user-group expression, position all-users expression, Sequential Appointed Order via `issequential=true`, Parallel/default by absent `issequential`, `approveway` variants, custom percentage, and email notification fields. `Test ABC (2).yap` adds approval/default task type by absent `tasktype`, Complete task type via `tasktype="complete"`, due-date fields `duedatedefinition`, `duedatetype`, `duedateexpress`, `isfromworkcalendar`, and due-date reminder `notifyrules[]`. `Test ABC (3).yap` adds approval-form Start action `terminate`, `terminate-conditions`, `revoke-conditions`, and Start notification settings. `Purchase Requests.ydl` proves data-list workflow Start action differs: email fields are present but terminate/recall fields are absent, and Assignment Task can use list-item context such as Created By -> LineManager in an expression assignee. `Workflow Actions Runtime Baseline (1).yap` proves scheduled workflow comparison: Start email fields are present without terminate/recall fields, and one scheduled `MultiAssignmentTask` uses Applicant Line Manager expression without data-list field context. Use `docs/studies/workflow-assignment-task-assignee-settings.md`, `docs/studies/workflow-assignment-task-complete-task-and-due-date.md`, `docs/studies/workflow-start-action-settings.md`, `docs/studies/workflow-approval-vs-data-list-actions.md`, `docs/studies/workflow-scheduled-vs-approval-data-list-actions.md`, `docs/studies/workflow-assignment-task-generation-rules.md`, `docs/studies/workflow-assignment-task-runtime-test-plan.md`, `docs/studies/yeeflow-api-operator-assignment-routing-coverage.md`, and normalized refs under `docs/studies/normalized/workflow-assignment-task-assignees/`, `docs/studies/normalized/workflow-assignment-task/`, `docs/studies/normalized/workflow-start-action/`, `docs/studies/normalized/workflow-expressions/`, and `docs/studies/normalized/workflow-task-forms/` before generating workflow task assignees or Start settings. These shapes are export-proven only; runtime routing, scheduled workflow execution, Complete task execution, due-date scheduling, recall/terminate behavior, data-list list-field routing, task-form save/edit behavior, and email delivery are not proven until a focused baseline passes. If real users/departments/locations/positions/groups are needed, use `yeeflow-api-operator` only for authorized read-only lookup and never commit private org data. API-assisted lookup may confirm that static exported values are user, department, location, position, group, group-member, or position-assignment references, but it does not prove workflow routing, group expansion, appointed-order behavior, or notification delivery.

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

<!-- workflow-claim-task-learning:start -->
## Approval Workflow Claim Task Guidance

Use `docs/studies/workflow-claim-task-action.md` for Claim Task generation/validation. In approval-form workflows, Claim Task is export-proven as `CandidateTask`. The studied approval export found user-group receiver expressions, `properties.taskurl` references to task pages, and explicit `tasktype` values `approve` and `complete`. The approval Claim Task approve example used two outgoing flows; the complete example used one outgoing flow.

Claim Task receiver/candidate config lives in `properties.usertaskassignment[]`, but it should be described as receivers/candidates until a user claims the task. Do not treat it as direct assignee ownership. Do not generate `properties.tasktype ` with a trailing space. Do not claim claim-pool behavior, claim locking, approve/reject/complete execution after claim, quick completion, or email delivery without focused runtime proof.
<!-- workflow-claim-task-learning:end -->

<!-- workflow-set-variable-learning:start -->
## Approval Workflow Set Variable Guidance

Use `docs/studies/workflow-set-variable-action.md` for workflow Set variable generation/validation. In approval-form workflows, Set variable is export-proven as `SetVariableTask`. Current-workflow settings use `properties.formtype = "current"` and one or more `properties.variablesetting[]` rows. Another approval workflow settings use `properties.formtype = "custom"`, target metadata in `properties.data.AppID`, `properties.data.ListSetID`, `properties.data.ProcKey`, and a submitted target request/form instance in `properties.formids`.

Each `variablesetting[]` row targets a workflow variable on the left side and stores an expression-token array in `value` on the right side. Static strings/numbers, workflow-variable expressions, operators, and functions such as `iif`/`isNullOrEmpty` are export-proven. Do not claim runtime mutation or another approval workflow updates until a focused runtime baseline executes safely.
<!-- workflow-set-variable-learning:end -->

<!-- workflow-set-data-list-learning:start -->
## Approval Workflow Set Data List Guidance

Use `docs/studies/workflow-set-data-list-action.md` for workflow Set data list generation/validation. In approval-form workflows, Set data list is export-proven as `ContentList` with `properties.listtype="select"`, target metadata (`appid`, `listsetid`, `listid`), operation type (`add`, `edit`, or `remove`), `listdatas[]` field mappings, and `wheres[]` filters for update/delete.

Use Set data list for data-list record/field mutation and Set variable for workflow-variable mutation. Add/edit mappings use `Columns`, `Per`, and expression-token-array `Data`. Preserve numeric operation codes `Per="0".."4"` when field metadata supports number operations. Approval-form sub-list/detail-row mappings can be represented through workflow variable references, but row iteration and record creation remain not runtime-proven in this learning pass. Do not execute add/update/delete or claim mutation behavior without a focused runtime baseline on disposable data.
<!-- workflow-set-data-list-learning:end -->

<!-- workflow-signal-event-learning:start -->
## Approval Workflow Signal Event Guidance

Use `docs/studies/workflow-signal-event-action.md` for approval workflow Signal event generation/validation. Signal event is export-proven as `SignalEvent` in approval-form workflows. It is a special event source with no incoming flow, one or more outgoing flows, and `properties.eventdefinitions[]` selecting `CancelEventDefinition` and/or `RevokeEventDefinition`.

Use Signal event for recall/terminate compensation branches, for example to connect to Set data list / `ContentList` cleanup actions. Start action controls submitter-facing terminate/recall availability; Signal event listens for those events. Warn if a Signal event listens for cancel/revoke while the approval Start settings appear to make that event unavailable. Do not use Signal event in data-list or scheduled workflows until export-proven, and do not claim recall/terminate execution or downstream cleanup mutation without focused runtime proof.
<!-- workflow-signal-event-learning:end -->

<!-- app-creation-rules-learning:start -->
## App Creation Rule Guardrails

Generated approval forms must use process keys containing only letters, numbers, and underscores, with a maximum length of 255 characters. Keep `Data.Forms[].Key`, optional `FlowKey`, and decoded `DefResource.defkey` aligned to that rule.

Emit `Forms[].NoRule` as an object, not a boolean/string/array: `Prefix`, `StartIndex`, `CustomLength`, and `AutoIncrement` are required, and `Prefix` must include `{index}`. A malformed `NoRule` is product-team-confirmed import-breaking, so treat it as a generation-blocking validation error. Do not claim runtime import/open proof until a regenerated package with valid `NoRule` is imported successfully.
<!-- app-creation-rules-learning:end -->

<!-- yap-schema-standard-learning:start -->
## YAP Schema Standard Guardrails

Approval-form packages must also satisfy the YAP schema-standard wrapper and list-export rules in `docs/studies/yap-schema-standard.md`. The generated `.yap` wrapper must use a `[______gizp______]` `Resource`; decoded `Resource.Data` must contain `ListExportInfo.Item`; and every root/child `ListExportItem` must include `Defs` and `Layouts` arrays. Use `[]` for empty collections and never emit `Defs: null` or `Layouts: null`.

Keep `NoRule` as the required process number format object with `{index}` in `Prefix`, and keep form/process keys alphanumeric/underscore only. Run `scripts/inspect-yap-schema-standard.mjs` plus package validation before import attempts.
<!-- yap-schema-standard-learning:end -->

<!-- container-button-action-settings-learning:start -->
## Open Approval Form Actions

Dashboard Container/Button `Open approval form` actions are export-proven in `docs/studies/container-button-action-settings.md` with `attrs["action-type"] = "8"` and `attrs.data.form.ProcKey`. Use this action type when a dashboard should start a workflow/request such as AP approval, invoice/payment request, purchase request, leave request, or budget approval.

Generated Open approval form actions must resolve to an included approval form key and should preserve approval-form publish/readiness rules for final packages. Optional `setVars` can initialize approval variables only when every referenced variable exists on the target form.

Focused runtime proof in `docs/studies/container-button-action-runtime-proof.md` fixed and user-confirmed a generated approval form target that initially failed publish with `process request pageUrl is null key:CBAR`. For generated app-level approval forms opened by dashboard actions, ensure the request page has outer `type = 1` and `pagetype = 1`, embedded `formdef.id` equal to the page ID, embedded `formdef.pagetype = 1`, populated form name/title, array `filterVars`/`tempVars`, and Start node `taskurl`/`taskUrl`/`TaskUrl` aliases pointing at that request page. This proves representative open/navigation only; submit, routing, task execution, and workflow mutation remain unproven.
<!-- container-button-action-settings-learning:end -->

<!-- sub-list-dynamic-content-learning:start -->
## Sub List Dynamic Content And List Actions

Use `docs/studies/sub-list-dynamic-content.md`, `docs/studies/normalized/sub-list-dynamic-content/`, and `scripts/inspect-sub-list-dynamic-controls.mjs` when generating or validating Approval Form Sub List controls with Dynamic content layout.

Sub List controls are `type = "list"` controls bound to a `variables.basic[]` entry with `type = "list"` and a `value` that resolves to `variables.listref[]`. Dynamic content layout is selected with `attrs["list-display-preference"] = "dynamic"`. The item template lives under a `list-body` child; footer buttons and `list-summary` controls live under `list-footer`. Row field controls inside the template must set `attrs.list_field = true`, keep `attrs.list_field_binding` equal to the parent Sub List binding, and bind to a row field from the associated listref.

Sub List list actions are stored on the Sub List itself at `attrs.actions[]`, not in `formdef.actions[]`. Export-proven list steps are `list_new`, `list_import`, `list_dup`, `list_del`, and `list_move`; Insert before/after current item uses `list_new` with `attrs.position = "0"` or `"1"`, Move up uses `list_move` without attrs, and Move down uses `list_move` with `attrs.moveMode = "2"`. Action buttons inside the item template/footer should resolve to those local Sub List action IDs. A table-style Dynamic Sub List can use an independent header `flex_grid` above the Sub List plus a matching row grid inside the item template. Preserve `.dynamic-list .list-footer` custom CSS only when the generated layout needs that fixed-footer behavior.

This export proves Approval Form schema only. Do not claim runtime add/duplicate/delete/import/move/update execution, scrollbar behavior, current-object expression evaluation, or Data List custom form runtime support without a focused test/export.

Focused runtime package pending: `generate-sub-list-dynamic-actions-runtime-proof.mjs` creates `Sub List Dynamic Runtime Proof` with one app-level Approval Form, one Dynamic Sub List request-page control, a sibling header grid, row fields `Item Name`, `Quantity`, and `Notes`, and local Sub List actions `list_new`, `list_dup`, `list_del`, and `list_import`. The generated package is locally validator-backed and copied to `/Users/Renger/Downloads/sub-list-dynamic-actions-runtime-proof.v1.yap` for manual import/open testing. Until the manual run passes, treat this as a runtime-test candidate, not runtime proof.

Runtime follow-up correction: V1 rendered but the generated header Grid collapsed to one column and the Designer Appearance panel could not expand. For table-style Dynamic Sub Lists, use the corrected V1.1 YAPK structure: a containing section with a caption-off header `flex_grid`, then a caption-off Dynamic Sub List; inside `list-body`, start with a matching caption-off `flex_grid` and place row controls in aligned grid columns, preferably through containers for generated layouts. Do not place loose fields directly under `list-body` as the row layout. V1.2 YAPK generation is prepared from the corrected V1.1 baseline, but runtime confirmation is still pending.

V1.4 row-menu guidance: `Sub list Dynamic (1).yap` export-proves row operation menu actions for Duplicate, Insert before, Insert after, Move up, and Move down. For generated table-style Dynamic Sub Lists with a visible Delete column, keep Delete visible in the last column and omit Delete from the row menu by default. V1.4 is generated/signed/verified from the V1.3 baseline, but Insert/Move runtime behavior remains pending until user testing.

V1.5 correction: if a generated YAPK changes an Approval Form `DefResource`, also ensure the target form has fresh `DefResourceID` and `DeployedDefID` values. V1.4 decoded with the five-row-menu-item definition, but runtime still showed the old two-item menu, likely because the previous deployed form definition was reused.
<!-- sub-list-dynamic-content-learning:end -->
