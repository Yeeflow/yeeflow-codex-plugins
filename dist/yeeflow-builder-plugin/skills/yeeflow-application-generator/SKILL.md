---
name: yeeflow-application-generator
description: generate, inspect, validate, package, debug, and improve small yeeflow application-level .yap packages, including multi-list apps, app shells, app navigation, lookup relationships, approval forms, contentlist persistence, replaceids, exported-back .yap comparison, and sandbox app import/export learning.
---

# Yeeflow Application Generator

Business Travel runtime-practice rule: every generated root app/listset and child list-like resource must emit `ListModel.Flags = 1`. Emit `ListModel.Status = 1` when including Status, keep `ListModel.Type` inside the schema-v2 enum `1`, `16`, `32`, `64`, `128`, `1024`, and keep `Defs`/`Layouts` arrays. Before package handoff, validate that workflow variables are declared before use in controls, summaries, sequence-flow conditions, Set Variable targets, task-assignment expressions, and ContentList mappings. Do not emit placeholder user/group/position IDs into final packages; direct `method="position"` assignees require real numeric position IDs or a user-approved fallback. The fixed Business Travel package is user-proven for import/open/workflow publish only; do not infer workflow execution, routing, data mutation, or true Finance Manager assignment.

Pivot Table runtime-proof data-list rule: if a generated app includes seeded data for dashboards, charts, Pivot Tables, or demos, generate add-ready data lists using the v2 seed/add-ready pattern from `docs/studies/pivot-table-control-runtime-proof.md`. Clone field definitions by target `FieldName`, not by array position, so `FieldName`, `FieldType`, `Type`, and seed-row keys remain aligned. `FIELD_NAME_FIELDTYPE_MISMATCH` is a generated-final blocker because v1 showed that crossed storage metadata can import but leave seeded rows invisible and Add new item failing.

Use this skill for small Yeeflow `.yap` application packages that combine related data lists and approval forms. Keep v1 scoped to proven patterns: data lists, custom list forms, lookup relationships, simple approval forms, and `ContentList` persistence.

Approval task form hardening: generated approval workflow task pages used by Assignment Task / `MultiAssignmentTask` or Claim Task / `CandidateTask` must pass strict import/publish readiness before package handoff. Each task node must reference a real task page, set `properties.pagetype = 1`, and mirror the same task page ID across `properties.taskurl`, `properties.taskUrl`, and `properties.TaskUrl`. The referenced task `pageurls[]` entry must be `type = 2` with outer `pagetype = 1`. Missing/null TaskUrl, unresolved task form IDs, or task pages with outer `pagetype = 2` are hard errors for generated-final approval packages.

Generated approval forms are published by default unless the user explicitly asks for draft output: set `Data.Forms[].Deployed = true`, `Data.Forms[].Status = 1`, and any present DefResource publish flags (`deployed`, `status`, `published`) to published values. Submit pages should not expose internal routing details, budget owner, finance approver, or decision notes unless requested; task pages may show reviewer routing and decision sections.

For existing-app upgrades, do not reuse `.yap` new-app generation rules blindly. Yeeflow Version management downloads `.yapk` packages for Upgrade application. Studied `.yapk` wrappers preserve app identity fields such as `TenantID`, `AppID`, and `ListID`, but `PackageId`, `Sign`, and opaque high-entropy `Resource` values change across Yeeflow-generated versions. A metadata-only wrapper edit was rejected at runtime even with `Resource` and `Sign` preserved. Follow-up signing evidence shows the product `setsign`/`verifysign` utilities can sign and verify wrappers only when `Resource` is already a valid `.yapk` opaque payload; wrapper-only signed packages may be accepted but do not change app content when `Resource` is unchanged. Normal `.yap` Resource encodings are rejected by `setsign`, and single-byte `Resource` corruption is rejected. Until the Yeeflow Resource-generation API/encoding path is provided, only inspect/validate wrappers and produce change plans or `.yap` clones; do not generate or claim externally edited app-content `.yapk` packages as valid upgrades.

For component details, also use the installed skills:

- `yeeflow-data-list-generator` for `.ydl` child list structure, fields, views, custom forms, sample data, and lookup fields.
- `yeeflow-approval-form-generator` for approval form Def structure, request/approval pages, lookup controls, workflow graph, and `ContentList` mapping.
- For Knowledge Base-style local list plus dashboard packages, read `references/knowledge-base-app-pattern.md` and also use `yeeflow-dashboard-generator`.

## Standard Workflow

1. Decompose the app requirement into resources, relationships, and stop conditions.
2. Create a `Capability Coverage Plan` before choosing the final resource graph.
3. Create a normalized app spec before generating package JSON.
4. Generate or patch decoded `.yap` Resource/Data JSON only after the graph is clear.
5. Validate every generated child data list with `scripts/validate-ydl-list.js --mode generator --stage final`, using an app/dependency map when lookup relationships require it. App-level validation is not enough.
6. Validate child approval forms where practical.
7. Validate the assembled app with `scripts/validate-yap-package.js`.
8. Validate app relationships with `scripts/validate-yap-graph.js`.
9. Build the wrapper with `scripts/build-yap-wrapper.js` only after validation passes.
10. Report sandbox import checklist and require export-back learning before production-like use.

For package type selection, use `docs/yeeflow-application-package-generation-rules.md` when present.

Never import into Yeeflow or operate the UI unless the user explicitly asks. Preserve large numeric IDs as strings. Redact secret/token/client values.

## New Capability Runtime Gate

When implementing a capability learned from exports but not yet focused-runtime-tested, keep the generated package and claims inside the proven boundary. Do not promote export-only schemas into broad generation rules or runtime-ready package behavior.

Before generating with a newly learned feature, decide whether the work is:

- export-proven only
- validator-backed only
- planning-guidance only
- import-proven only
- configuration-visible only
- render-only proven
- partial runtime proof
- runtime-proven for a specific tested host/scope

If generated package import/rendering, workflow execution, app setting rendering, AI/email/external execution, custom code execution, document upload/persistence, user/group membership, permissions, or row mutation is involved, recommend a focused runtime baseline before merge or broad reuse. The baseline should use the smallest possible app, fresh IDs, local validation before build, and runtime testing only after the user requests it. If runtime is deferred, report the feature as export-proven/validator-backed/planning-guidance/import-proven/partial and list the focused runtime follow-up.

Shared data-view generation note: data lists, document libraries, and Form Reports expose list-like views through `Layouts[]`. `Data Lists (1).yap` export-proves data-list view metadata on `Title`, `Type`, `Ext1.Url`, `IsDefault`, and `IsItemPerm`, plus settings in parsed `LayoutView`. Known exported data-list view type codes are `0` list, `999` gallery, `104` kanban, and `100` calendar. Use `scripts/inspect-data-views.mjs` and `docs/studies/data-view-resource-settings.md` before generating advanced views. Treat non-list Type `16`/Type `32` advanced view settings as product-documented until a matching export proves the exact shape.

Data Filter controls note: use `docs/studies/data-filter-controls.md` and `scripts/inspect-data-filter-controls.mjs` before generating dashboard filters. Data Filter controls are reusable across approval forms, data list forms, and dashboard pages at the product level, but the Sales and CRM exports only prove dashboard page usage. Define `page.filterVars[]` before referencing them, bind value-producing filters with `binding = "__filter_" + filterVarId`, wire downstream data-bound controls to filter variables through expression-token arrays, and validate every reference before handoff. Use Search for fulltext paths, Select/Checkbox/Radio for option filters, Range/Check range for numeric bands, Date/Relative period for time filters, Hierarchy for hierarchical sources, and Sorting for preconfigured sort presets. Use `Value change`/default mode for lightweight filters and `Click on apply button` with a valid Apply button for multi/heavy filters. Apply button and Remove filters are special controls, not normal value-producing filters. `docs/studies/data-filter-controls-runtime-proof.md` proves generated dashboard import/open/render plus one Search click-apply and one Radio value-change interaction only; keep Remove filters reset, Hierarchy interaction, exhaustive filter semantics, approval-form usage, and data-list-form usage unproven at runtime. Do not generate unsupported filter types or host contexts without schema proof.

Pivot Table controls note: use `docs/studies/pivot-table-control.md`, `docs/studies/pivot-table-control-runtime-proof.md`, and `scripts/inspect-pivot-table-controls.mjs` before generating multidimensional dashboard analytics. Pivot Table is a Data Analytics control; dashboard usage is export-proven from the CRM sample, Data List form availability is product-understanding-backed, and Approval Forms / Data List Public Forms are not supported hosts. Generate the visible control as `type = "pivot-table"` and pair it with a matching embedded `exts[]` entry using `category = "___Pivot___"`, `key = "PivotTable"`, and `i` equal to the control id. Configure `attr.settings.rows[]`, `columns[]`, and `values[]` from fields on the selected Data List, Document Library, Form Report, or Data Report source; use `COUNT` / `COUNT_DISTINCT` for record counts and `SUM`, `AVG`, `MIN`, or `MAX` only for compatible numeric/currency fields. Date grouping values observed in export are `DAY`, `MONTH`, `QUARTER`, and `YEAR` and must only be used on date/time fields. Pivot Tables can consume Data Filter variables in conditions when the `__filter_<filterVarId>` reference resolves to the host page `filterVars[]`. Style header, body, subtotal, and grand total sections for readability, align numeric values consistently, include runtime-accepted synthetic seed rows when populated analytics proof is required, and validate source, field, aggregation, date-grouping, seed/add-readiness, and filter references before handoff.

Data List permissions and notifications note: use `docs/studies/data-list-document-library-permissions-notifications.md` before generating permission-sensitive lists. Export-proven Data List package fields include `ListModel.Perm`, `IsBreakInherit`, `IsItemPerm`, view-level `Layouts[].IsItemPerm`, and notification `RemindRules[]`. Detailed administrator/basic/advanced audience matrices are UI-confirmed but not export-located in the current package, so do not generate those rows as schema-proven. Document Library permissions/notifications are product-documented only until a Type `16` export proves the package shape. Form Reports must not receive Data List / Document Library manage-permission or custom-notification settings.

## Application Capability Planning Checklist

For full app generation, write a `Capability Coverage Plan` before implementation. Use `docs/studies/application-planning-capability-coverage.md` when present. The plan must select relevant capabilities, explicitly exclude irrelevant ones, defer partial or unproven features honestly, and assign each selected capability to the right generator, validator, and runtime-test path.

Consider these areas before package generation:

- Core resources: data lists, approval forms, dashboards, document libraries, reports, follow-up/task lists, master/reference lists, transaction lists, custom forms, and root app pages.
- AI experience: Copilot, quick prompts, local resource tools, connected Agents, image uploads, attachments, and whether Copilot behavior is import-only, config-visible, or runtime-executed.
- AI Agents: reusable Agents, input/output variables, image/file inputs, application-resource access, same-row updates through native `ListDataID`, record create/update/read behavior, draft generation, summaries, scoring, recommendations, and human review.
- Workflow and automation: approval workflows, data-list workflows with `FlowMappings[]`, scheduled workflows with `WorkflowType = 3`, triggers, `QueryData`, `AI`/AI Assistant, `MailTask`/Send email, HTTP/API/resource actions, and execution deferral.
- Document management: Type `16` libraries, canonical `New Document Library` base, default document fields, multiple libraries, generated root folders, custom fields/views/forms, and Doc library controls on dashboards/forms.
- Navigation and shell: custom `LayoutView.sort[]`, `Type: "classes"` groups with `list[]`, resource item labels/icons/no-icon, layout values `default`/`left`/`onheader`/`none`, header `attrs.appearance`, export-proven `height: 46`, `hideTitle: true`, and `Data.AppGroups[]`.
- Permissions and users: app user groups, role-based experiences, permission-sensitive resource exposure, and the current rule that member assignment is not export-proven and must not be generated with real users.
- Integrations: Connections, HTTP API, OAuth, OpenAPI/REST tools, external calls, post-import configuration, credential safety, and whether execution is deferred.
- Runtime and validation: expected import proof, runtime proof, render-only proof, validation-only areas, validators to run, and artifacts/private data that must never be committed.

If a package plan needs real users, departments, locations, or positions, route that lookup through `yeeflow-api-operator` only when local credentials exist and API lookup is authorized. Do not invent org/reference data when the API can safely confirm it, but do not make API access a prerequisite for normal package generation. Avoid embedding private user data in generated packages; use placeholders, empty groups, requester/current-user assignment, or post-import configuration unless the user explicitly approves a narrow safe use.

The plan should include these subsections:

- selected capabilities
- intentionally excluded capabilities
- deferred or unproven capabilities
- runtime test boundary
- safety boundary
- skill and validator dependencies

Before generating a package, self-check:

- Did the plan consider the learned capability set without overusing irrelevant capabilities?
- Did it mark partial or unproven capabilities honestly?
- Did it assign each selected capability to the right specialized skill?
- Did it include validation and runtime-test boundaries?
- Did it avoid real users, emails, tenant IDs, raw exports, decoded payloads, credentials, tokens, private files, and generated package artifacts in commit scope?

## Supported v1 Package Shape

Use v1 for apps like `Department Access Management`:

- root app/listset shell
- child data lists in `Data.Childs[]`
- data-list fields, views, sample records, and custom forms
- internal lookup relationships between lists
- one or more simple approval forms in `Data.Forms[]`
- export-proven Form Report resources in `Data.FormNewReports[]` plus Type `32` child resources when using `yeeflow-form-report-generator`
- approval form lookup controls
- lookup additional field mappings
- approval workflow `ContentList` create/update actions targeting included lists
- workflow action validation against the normalized node/action configuration reference
- generated multi-type approval/list fields, including text, number, radio/dropdown, switch, and conditional display
- simple root navigation and one Type `103` app page

## Form Report Resources

Use `yeeflow-form-report-generator` when an app needs Form Reports. `AI Training-2 (1).yap` export-proves Form Report as an app-level resource with `Data.FormNewReports[]`, a matching `Data.Childs[]` child resource where `ListModel.Type = 32`, and a required approval-form source via `DefKey` -> `Data.Forms[].Key`.

Generation guidance:

- Generate Form Reports only after the source approval form exists.
- One approval form may have multiple Form Reports.
- Do not generate a standalone Form Report without an approval source.
- Do not attach workflows, public edit/create forms, or direct item mutation behavior to Form Reports.
- Fields must come from approval variables, system fields, or the selected one sub-list fields.
- Keep report field keys unique and warn on duplicate display names.
- Use `Settings.SubListID = ""`/empty for no selected sub-list; use one `vlist_<variableId>` value for one selected sub-list.
- Treat selected-sub-list row multiplication, row-click detail behavior, Excel export execution, and Form Report as a dashboard/lookup/data-table data source as runtime-sensitive until a focused baseline proves them.

Generated child data lists must also be valid as standalone extracted list definitions:

- include required list type metadata such as `ListModel.ListType` or a wrapper `MainListType`
- keep `FieldName` and `InternalName` unique
- keep `DisplayName` unique inside each data list, or treat duplicates as a materialization-risk blocker for generated packages
- allocate `FieldID` values from a global app-level allocator; never reuse the same FieldID range across multiple child lists
- ensure every field's `ListID` equals the parent child-list `ListID` after any FieldID remapping
- resolve local lookup target lists and display fields
- provide valid referenced sample rows for lookup sample values
- include usable master/reference sample data when approval forms or dashboards depend on those lists
- include current-standard `Edit Item` and `View Item` custom forms; map New/Edit to `Edit Item` and View to `View Item`

## YAP App Materialization Rules

Generated `.yap` packages must pass materialization inspection before runtime import:

- Every `ListID` must be unique.
- Every `FieldID` must be unique across the whole application, not only inside each list.
- Every `field.ListID` must equal the parent data-list `ListID`.
- Every `FieldName`, `InternalName`, and `DisplayName` must be unique inside its own data list.
- Preserve real baseline `TenantID`, `CreatedBy`, and `ModifiedBy`; do not remap them into the generated ID family and do not include them in `Resource.ReplaceIds`.
- Build `ReplaceIds` from generated app-resource IDs only.
- Keep all numeric-looking generated IDs within signed `System.Int64` range (`<= 9223372036854775807`). Yeeflow import/materialization parses fields such as child-list `LayoutID` as `System.Int64`; 20-digit IDs such as `73221000000000001001` fail import.
- When generating app-contained AI Agent or Copilot records in `OtherModules Type = "Agents"`, set top-level `Publisher: 0` by default. `Publisher: null` caused generated AI-resource app import failure; the regenerated Asia Tech visitor Copilot package imported after changing Publisher to `0`.
- Root Type `103` dashboard/page layout ownership must connect to the root app/ListSet `ListID`, and root navigation must reference existing packaged resources.
- Run `scripts/inspect-yap-materialization.mjs` before runtime import.
- If app materialization fails, stop and fix the app shell/resource linkage before testing custom code controls or workflow behavior.

## Generated App UI/UX Standard

Use `docs/yeeflow-application-design-system.md` as the master reusable generated-app design system when present in the active workspace. Use `docs/yeeflow-application-ui-ux-standards.md`, `docs/yeeflow-application-layout-standards.md`, `docs/yeeflow-application-style-token-standards.md`, `docs/yeeflow-dashboard-ui-ux-patterns.md`, `docs/yeeflow-data-list-ui-ux-patterns.md`, and `docs/yeeflow-approval-form-ui-ux-patterns.md` as supporting references.

The first official reference export is `UI and UX design (1).yap`. It proves this native shell:

- dashboard pages set `attrs.hideHeaderAll = true`, page padding to `--sp--s0` on all sides, and use `Main` -> `Content` containers named through `nv_label`
- generated data lists include `Edit Item` and `View Item` custom forms; New/Edit map to `Edit Item`, View maps to `View Item`
- custom list forms use `attrs.container.cw = "2"`, zero padding, and `Main` -> `Content`
- approval form pages use `attrs.container.cw = "2"`, zero padding, `Main` -> `Content`, with business controls in `Form body` and workflow controls in `Form bottom`
- default approval forms include both `workflowControlPanel` and `workflowHistory` in `Form bottom` unless the user explicitly asks to omit them

Treat validator UI/UX standard findings as warnings until the first generated UI/UX standard package has passed runtime import/open and export-back comparison.

Runtime update: `Design System Request Tracker DSX` proved the generated design-system package pattern through import, dashboard render, Requests list query, Edit/View custom forms, approval form publish, submission form render, reviewer approval routing, approval completion, and workflow-created list record. Use its dashboard `LayoutInResources[0].ID = RefId = LayoutID` pattern for generated root app dashboards with embedded page JSON. Expect imported app-level approval forms to require publishing in Yeeflow Form Builder before submit/approve runtime testing.

Use `docs/yeeflow-root-style-token-reference.md` as the root style/design-token reference. Generated apps should use Yeeflow-native root style tokens such as `--c--primary`, `--c--success`, `--c--warning`, `--c--danger`, `--c--neutral-light-active`, `--fs--base`, and `--sp--s200` where supported. Avoid arbitrary custom colors and do not inject the full root stylesheet into generated apps. Do not require token references when a real Yeeflow export stores resolved hex values.

Generated apps should apply the Yeeflow Application Design System by default: use `Main` / `Content` containers, meaningful `nv_label` names, token-aligned colors and spacing, Edit/View custom forms for generated data lists, `Form body` / `Form bottom` approval pages, and clear dashboard sections plus Collection naming. Treat design-system validator findings as warnings until runtime import/open/export-back proof exists for the specific generated package.

Global page background rule: when any generated dashboard, data-list custom form, approval submission page, or approval task page needs a full-page background color, set it on the page/form background setting, not on `Main`. `Main` is a structural layout container. Only section/card/header-specific backgrounds should live on those specific containers.

Approval-form UI quality update: when the workspace includes `docs/yeeflow-form-design-quality-rules.md`, apply it to app-level approval forms. Rich request forms should set page-level background on `formdef.attrs.background`, add a `Form header` for request-summary panels, generate corrected inline text/icon controls, use the Text Style Sample native Text shape (`heading` controls, `[null, token]` typography, plain string `heads.color`), use square icon badge wrappers, organize normal fields with two-column `flex_grid` controls, full-span long controls, and use native `calculated` controls for formula fields where the expression is known.

Layout quality hardening: Grid/flex_grid controls used only to place child controls should turn captions off with `displayLabel: [null, false]` unless the user explicitly asks for a visible grid title. Use flex_grid for aligned fields, but use container/card blocks with row direction and spacing/gap for route summaries, KPI/status blocks, and horizontal business-context panels.

CAPEX runtime baseline: `IT Hardware CAPEX Request v4 Text Standard` was generated by `generate-it-hardware-capex-request-v3.mjs` after the Runtime V2 design study and Text Style Sample study. The package imported, opened, rendered the approval form, and the generated Text control Typography and Text shadow designer popups opened successfully. Treat `docs/generated-it-hardware-capex-request-text-standard-baseline.md`, `docs/it-hardware-capex-request-runtime-v2-ui-study.md`, and `docs/yeeflow-text-control-generation-standards.md` as the current rich approval-form UI baseline before generating similar business applications.

Approval control anatomy update: when the workspace includes `docs/ai-training-approval-form-control-study.md`, use that study before adding broad native approval controls to an app package. It documents the export-backed variable/control binding model for `input`, `textarea`, `richtext`, choices, switches, numeric/date controls, file/image upload, user/department/location/cost center/metadata pickers, lookup, lookup-list, sublist/listref, data-list display, tabs, and action buttons. Do not promote those advanced controls into a generated `.yap` without resolved local app/list dependencies, fresh IDs, validator review, and focused runtime proof.

Approval Form Controls Test v2 runtime update: app-level packages can now use the proven advanced-input batch when scoped and validated: `percent`, `time`, `hyperlink`, `rate`, and `calculated`. The v2 package imported, opened, rendered the form, submitted, opened the reviewer task, approved, and created the target `ContentList` record. Keep `daterange` in partial-proof status until both mapped date fields are exposed and verified in a generated list view.

Approval Form Controls Test v6 runtime update: app-level packages can now use internal packaged single-select approval-form `lookup` controls and workflow-form `list` / `listref` controls when scoped and validated. The v6 package imported, opened source and target lists without `datas/query` 400, selected a packaged lookup record, populated readonly fields via `attrs.addition[]`, added/edited a list row, submitted, opened the reviewer task, approved, and created the target `ContentList` record. Do not persist raw lookup variables into plain text fields when the expected value is readable display text: v6 proved that this stores the internal local row ID. Use lookup addition/autofill variables or explicit summary variables for readable persistence. Direct child-row-to-data-list persistence for list/listref remains deferred; use a text summary or a separately modeled child list until export-backed proof exists.

Sublist summary workflow runtime update: `Expression Sublist Summary Workflow Test v1` proved app-level generation for listref row calculations, list summary display, summary-to-variable binding, and workflow routing from a summary-bound numeric variable. It imported, opened, rendered row-level `Sub Total = Quantity * Unit Price`, displayed Quantity Sum / Unit Price Average / Sub Total Sum, bound Sub Total Sum to `TotalAmount`, routed `USD 17.00` to Line Manager Approval, routed `USD 6000.00` to Department Manager Approval, completed both approvals, and persisted readable ContentList rows. For v1 app packages, branch-specific ContentList nodes are acceptable for persisting route labels after the branch; direct child-row persistence remains deferred.

Employee Family Implant patch learning: when requirements allow multiple products/services/items on one request, model those selections as a workflow-form `list` / `listref` instead of single top-level product fields. Put the product lookup inside the row, autofill row product name/type/unit price into readonly row fields, calculate row subtotal with `variable_ctx` current-object tokens, bind subtotal summary to a top-level total with `attrs["list-fields-summary"]`, and use that top-level total for workflow routing, quota checks, and `ContentList` persistence. Persist a readable product summary text variable until direct child-row persistence is runtime-proven for the target app.

Employee Family Implant Test export update: for requester/applicant forms, prefer a required applicant identity control with `attrs.default = "currentUser"` and `value = "CurrentUser"` over a duplicate page-load Set variable default. Snapshot actions should start from the applicant variable and use `getUserAttr(RequesterApplicant, ...)`; Current User is only the control default source. Submit-time quota validation should be wired through `formdef.formAction.onSubmit`, call the reusable quota-check action first, and then conditionally submit. Conditional warning/confirm/check steps before submit usually need step-level `continue: true` (`Continue next step when condition is not met`) so the valid path reaches the submit step. Treat recursive `otheraction` self-calls as generator errors.

Sublist summary binding update: the manually reselected Product Selection summary in `Employee & Family Implant Application Management_Test.yap` still exports as `{ "prefix": "__variables_", "value": "TotalApplicationAmount" }`. Do not invent extra name/label/type metadata. Instead validate that the target variable exists and is numeric, the source row field exists and is numeric, and runtime tests blur/commit row edits before asserting the summary-bound total. A later comparison export, `Implant Application Request (1).ywf`, proved an import-time FlowKey collision: generated FlowKey `EFI` was replaced inside the JSON property name `prefix`, producing `pr<runtimeFlowKey>x` and breaking summary-to-variable binding, while a designer-created comparison sublist kept `prefix` and worked. Avoid FlowKeys/form keys that are substrings of reserved JSON property names such as `prefix`; inspect generated/wrapped/exported forms for corrupted summary binding keys before runtime claims. For policy-critical form actions such as quota checks, submit guards, workflow amount routing, and persistence, add an explicit preflight set-variable step that recalculates the top-level total with `arraySum(<ListVariableId>, "<SubtotalFieldId>", [], [])`; use this recalculated workflow variable even when summary binding is also present.

Expression generation update: when a package includes calculated controls, dynamic display rules, custom validation rules, lookup/data filters, workflow transition conditions, workflow action conditions, default values, request numbers, or subtotal/total/date/string formulas, use `yeeflow-expression-functions.normalized.json`, `yeeflow-expression-function-knowledge-base.normalized.json`, `yeeflow-expression-operators.normalized.json`, `yeeflow-expression-utils.js`, `docs/yeeflow-expression-editor-ui-contexts.md`, and the `yeeflow-expression-generator` skill. Generate Yeeflow expression-token arrays, not JavaScript formulas. Validate expressions before package build and keep unknown functions/operators as stop conditions for generated final packages. Use enriched business-scenario metadata for function selection, but do not generate UI-observed metadata-pending functions such as `addWorkDays` or `addWorkHours`.

For purchase/order-style approvals with line items, prefer native list summary binding over hand-built top-level total formulas. Bind subtotal sum to a top-level number variable and use that variable for ContentList persistence, dynamic display, validation, and workflow branch conditions.

Form Actions Phase 1 update: app-level approval packages may include native form actions only when using the export-backed Phase 1 patterns from `docs/form-actions-phase-1-study.md`. Keep form actions distinct from workflow graph actions. Use form actions for page initialization, temp UI state, Set variable defaults, and confirmation dialogs. Wire action buttons with `attrs.control_action`, page load with `formdef.formAction.onLoad`, and validate that every referenced action exists in `formdef.actions[]`. Do not promote `listitem` form action steps or dashboard/data-list form actions to generated baselines until a focused runtime test proves them.

Form Actions Phase 2 update: app-level approval packages can use Query data and Submit form actions with the runtime-proven generated patterns from `docs/generated-form-actions-phase-2-query-submit-test-v1-baseline.md`, `docs/form-actions-phase-2-query-data-filter-patch-study.md`, `docs/yeeflow-form-action-query-data-step-rules.md`, and `docs/yeeflow-form-action-submit-step-rules.md`. Query multiple can populate form list variables or temp collections; query single can map fields to workflow variables; counts can be stored in temp variables and copied to workflow variables; Query data filters use `attrs.querydata_filters` plural; variable/calculated filter right operands use expression-token arrays with `showCus: false`, while literal values use primitives with direct-value mode. Do not generate `<input ...>` expression-button HTML strings inside `querydata_filters[].right`. `arraySum` can aggregate a temp query collection. The collection display function token is `JSONStringfy`; `vLookup` is label-observed only and deferred. Submit form is `type: "submit"`; Save changes uses `attrs.submitType = "3"`. Do not generate `arraySub`.

Workflow transition condition update: `Implant Application Request (4).ywf` proves latest SequenceFlow `conditioninfo[]` rows support independent operand modes. Use direct-selector `left.type = 1` and direct/static `right.type = 0` for simple routes such as `ApplicationType == Family`; use `type = 2` on the side that needs expression editor for date tenure, numeric thresholds, dynamic cycle comparisons, or expression-to-expression routes. Prefer these wrapper objects over legacy HTML expression-button strings for newly generated workflow transitions.

User/profile expression runtime update: app-level approval packages can use `getUserAttr`, `getOrgAttr`, and `getLocAttr` for current-user profile summaries after `Expression User Profile Test v1`. The generated package imported, opened, rendered user/profile expressions on submission and task pages, completed approval, and created a readable ContentList record. Use the exact application current-user token shape, descriptor-object attribute parameters, fallback arrays, and `getOrgAttr` for department/organization values. Location and Boarding Date remain tenant-data dependent when the current user profile lacks those attributes.

Navigation contrast rule: when root `LayoutView.attrs.appearance` defines a header background and text color, generated apps should invert that pair for `LayoutView.attrs["navigator-menu"]`. Use the header text color as the navigator background and the header background as the navigator text/icon color. For the standard shell, use `appearance: { bgc: "var(--c--primary-light)", color: "var(--c--primary)" }` and `"navigator-menu": { bgc: "var(--c--primary)", color: "var(--c--primary-light)", position: "default" }`.

Theme color rule: generated `Data.AppThemes[].Config.neutral.lightmodel` should be `"Luminance"`, not `"Lightness"`.

Keep these out of scope in v1 unless the user asks for research only:

- dashboards beyond a minimal Type `103` shell page
- data reports and form reports
- AI Agents, Copilots, Connections, Knowledges
- document generation and templates
- external HTTP/API actions
- complex list workflows or scheduled workflows

## Scheduled Workflow Generation Boundary

`AI Agent and Copilot Local Resource Baseline8.yap` proves Scheduled Workflow app resources are `Data.Forms[]` entries with `WorkflowType = 3`, `ListID = 0`, JSON-string `Settings`, and JSON-string `DefResource`.

`Scheduled Workflow Safe Runtime Baseline` proves a generated import/open/designer baseline when the package uses one harmless local list, one local `Email generation` Agent, one Scheduled Workflow, a far-future non-deployed weekly schedule, `QueryData -> AI -> MailTask`, and a reserved safe test recipient placeholder. The Codex-observed runtime pass proved import, app open, local list render, Scheduled Workflow listing/detail, recurrence render, variables render, designer open, and non-executing `QueryData`, `AI`, and `MailTask` configuration panels. User-confirmed function test passed; exact execution scope not yet documented.

For generated Scheduled Workflow packages, validate schedule `Settings` (`TimeZone`, `Times[]`, `StartDate`, `Frequency`, `Interval`, optional `Values[]`, optional `IsWorkday`), workflow variables, `QueryData` list references, `AI` Agent references, and `MailTask` recipient safety. Do not generate a package that can send real email or call live AI automatically during import/open testing. Do not claim schedule trigger execution, manual run behavior, email delivery, AI Assistant execution, or workflow-triggered AI Agent execution from the safe runtime baseline unless the exact user-confirmed test scope is documented.

Data-list workflow AI update: `Spark & AI (1).yap` proves list/process workflows (`WorkflowType = 1`) can register against a host data list through `FlowMappings[]` with `Setting.NewTrigger = true` and call an app-contained Agent from a workflow `AI` node. The proven current-row mapping pattern passes an `icon-upload` field into Agent input `type = "img"` and passes native `ListDataID` into a text input so the Agent can update the same row through an application-resource access tool. Generated app packages may model this only when the host list, workflow registration, Agent, and tool-scoped target lists all exist locally and runtime execution remains safely disabled until sandbox proof.

Asia Tech visitor Copilot import learning: app-contained Agents/Copilot plus a data-list workflow imported successfully after two materialization fixes: generated child-list `LayoutID` values were kept inside `System.Int64`, and every AI Agent/Copilot resource used `Publisher: 0` instead of `null`. This proves import acceptance only; Copilot chat, Agent execution, image extraction, workflow execution, and row mutation still require controlled runtime tests.

Asia Tech visitor Copilot post-import learning: list workflow designer opening requires export-like DefResource metadata. Generate `pageurls: []`, `variables.basic/listref/filter` arrays, `flowPage: []`, `graphposition`, `graphzoom`, `graphver`, childshape `id` plus `resourceid`, node `position`, and SequenceFlow source/target `id` plus `resourceid`. The simplified graph shape imported but the designer failed with `Cannot read properties of undefined (reading 'find')`.

Asia Tech visitor Copilot trigger-condition learning: for data-list Add Item / new-item triggers, register the trigger through the host list `FlowMappings[]` row using `Setting = {"NewTrigger": true}` and `FieldName = null`. Keep `Data.Forms[].Settings = null` and `Data.Forms[].Deployed = true`. Do not bind `FlowMappings.FieldName` to a normal list field for a new-item trigger; doing so can make the frontend show an empty trigger condition and prevent the workflow designer from opening. Use flow-status `FieldName` only when a separate export-proven flow-status condition is intentionally generated.

For app-contained AI Agent/Copilot Access application resources tools, generate compact resource permissions: `resources.dataLists.items[] = [{ id: <ListID>, permissions: <bitmask> }]`. Permission bits are create/add = `1`, update/edit = `2`, delete = `4`, read/view = `8`; combine with bitwise OR, for example read/create/update = `11`. Do not emit verbose `AppID/ListID/ListSetID/Title` resource entries or string permission arrays.

## Document Library Resource Rules

Use these only after the document-library study docs and validators are present in the active workspace. `Projects Center.yap` proved that Yeeflow Document Library is a first-class app child resource, similar to a data list but not identical.

- Generate document libraries with `ListModel.Type = 16`.
- Keep the normal child-resource envelope: `ListModel`, `Defs`, `Layouts`, `ListDatas`, `FlowMappings`, `PublicForms`, and `RemindRules`.
- Link the library from root app navigation with `Type = 16` for mixed/richer apps. The focused `Document Library Sample.yap` proves document-library-only apps may omit root pages and navigation, using root `LayoutView = {"sortVer":1}`.
- Set top-level wrapper `Resource.SimplePortal = null` for generated document-library `.yap` packages. Both known-good document-library exports use `null`; generated `[]` wrappers failed at Yeeflow create.
- Use `CustomType = "ListSite_<root app ListID>"` for app-owned libraries.
- Preserve the default document fields: `Title` Name, `Bigint1` ParentID, `Text1` Type, `Bigint2` FileSize/Size, `Text2` Extension, `Text3` UniqueName, and `Text4` Upload File.
- `Text4` is export-backed as `FieldType = "Text"` plus `Type = "file-upload"` with `Rules.isLabrary = true`; do not invent an unproven Attachment field schema.
- Do not apply normal generated data-list `Title.Status = 0` rules to document libraries; studied document libraries keep `Title` native/system/indexed but use `Status = 1`.
- Support simple custom fields and Type `0` views using existing data-list rules where compatible. The `Enterprise Document Center` v2 runtime pass accepted multiple Type `16` libraries with simple custom fields and configured views.
- Root-level generated folder rows are runtime-proven when using the export-backed shape: put rows in `ListDatas`, set `ListDataID` to the object key, `Title` to the folder name, `Bigint1 = "0"`, `Text1 = "folder"`, `Bigint2 = ""`, `Text2 = ""`, `Text3 = "0_<lowercase folder title>"`, omit `Text4`, include blank generated custom-field values, and include folder IDs in `ReplaceIds`.
- Keep generated folders root-level unless nested folder behavior is separately export-backed and runtime-tested.
- For a minimal newly-created library baseline, use the runtime-proven `New Document Library` resource shape from `Document Library Sample.yap`: default Type `0` view `LayoutView = ""`, one unassigned `New file` form, no `ListModel.LayoutView` add/edit/view mapping, and no uploaded rows. Do not use the earlier generated `Baseline Documents` experiment as the base definition.
- Dashboard Doc library controls are export-proven in `Enterprise Document Center Folders Runtime.yap`. Generate them with `type = "document-library"` in a Type `103` dashboard page resource, target a Type `16` library through `attrs.data.list`, and target a root folder through `attrs.data.folder.path = "0/<folder ListDataID>"`. Caption/search/add true settings are export-proven when `attrs.caption.layout` points to the target library `New file` form. The form-host study proved document-library custom-form hosting for a root-bound control and disabled search/add settings; approval-form hosting is partial because controls rendered in Form Builder preview but the live request form still needs a fresh import/publish proof after adding a required task assignee. Data-list custom-form hosting remains validation-only until a reachable imported data-list form proves it. Keep dynamic folder paths unclaimed until runtime-tested.
- Do not fake uploaded document rows or private document payloads in baseline packages.
- Do not claim nested folder or upload runtime proof until Yeeflow import/open/upload/persistence behavior is tested.

## Hard Stop Conditions

Stop before final `.yap` build if any of these are true:

- unresolved resource graph
- any generated child data list fails standalone `validate-ydl-list`
- duplicate data-list field `FieldName` or `InternalName`
- duplicate data-list field `DisplayName` in a generated final package unless explicitly accepted as a materialization risk
- duplicate `FieldID` anywhere across the generated `.yap`
- any field whose `ListID` does not match its parent data-list `ListID`
- generated fake-ID remapping of `TenantID`, `CreatedBy`, or `ModifiedBy`
- any generated numeric-looking ID exceeds `9223372036854775807`
- generated app-contained AI Agent/Copilot resource has missing, null, empty, or non-numeric `Publisher`
- generated main/child lists are missing required list type metadata
- missing lookup target list or display/search field
- lookup target list, display field, dependency map, or sample lookup target row is unresolved
- a form lookup depends on a missing or empty master/reference list without an explicit external-data plan
- missing `ContentList` target list or target field
- invalid or incomplete root app shell
- missing root navigation or app page
- unresolved AI/connection/knowledge/document/external resources
- workflow action properties do not satisfy `workflow-action-configurations.normalized.json`
- expression formulas or conditions do not satisfy the normalized expression references
- placeholders remain in final mode
- validators fail
- sensitive credential-like resources would be copied
- production use is requested without sandbox import/export-back proof

## Current Advanced Baseline

Use Visitor Access Management v11 as the current advanced generated `.yap` baseline for small app packages.

Confirmed v11 settings:

- fresh `216...` local ID family
- fresh FlowKey/form key `VBB`
- `Data.Forms[].ListID = 0`
- `ProcModelID` carries the approval process ID
- app imported and passed runtime testing
- package, graph, approval form, and wrapper round-trip validations passed

Proven v11 field/control types:

- text/input
- number/input_number
- single select radio/dropdown using `radio` control plus `attrs.displayStyle = "dropdown"`
- switch/boolean
- conditional display using target control `attrs.control_display[]`

Proven v11 storage and `ContentList` mappings:

| Business field | Variable | Target |
| --- | --- | --- |
| Visitor Email | `VisitorEmail` | `Text13` |
| Visitor Phone | `VisitorPhone` | `Text14` |
| Number of Visitors | `NumberofVisitors` | `Decimal1` |
| Access Type | `AccessType` | `Text15` |
| Requires Escort | `RequiresEscort` | `Bit1` |

Sample value shapes:

- Decimal: numeric values
- choice/dropdown: selected option text
- data-list Bit/switch: `"1"` or `"0"`
- approval switch variable/control: boolean `true` or `false`

`EscortUser` is proven as a form-only conditional field shown when `RequiresEscort == true`; it is not persisted in v11.

## Child Data List Title Field Rule

HARD RULE: every generated child data list must preserve `FieldName: "Title"` as Yeeflow's native primary/display field.

Required metadata:

- `Status: 0`
- `IsSystem: true`
- `IsIndex: true`

Do not generate `Title` as an ordinary custom business field. Heep Hong IT eWorkflow Option A v7 proved that `Title` with `Status: 1`, `IsSystem: false`, and `IsIndex: false` can import and render list metadata while causing `api/crafts/datas/{AppID}/{ListID}/query` to fail with HTTP `400`. Option A v8 restored the native `Title` metadata and fixed the data-grid query.

Business labels such as `Request No.`, `Name`, `Equipment Name`, or `Center / Department Name` may be displayed on `Title`, but the underlying metadata must remain native/system/indexed. Use `Text1`, `Text2`, etc. for additional business fields.

## Root App Shell Rules

For generated packages, the root app shell is mandatory. Use the v5 baseline rules:

- top-level wrapper `Title`, `Description`, and non-null `IconUrl`
- `Resource.MainListType = 1024`
- root `Data.Item.ListModel.Type = 1024`
- root `CustomType = ""`
- root `Perm = 0`
- root `WorkspaceID` present
- root `LayoutView` navigation populated
- `Data.AppTags`, `Data.AppMetadatas`, and `Data.AppComponents` arrays present
- `Data.AppThemes` non-empty
- root `CreatedBy` and `ModifiedBy` populated

For root Type `103` app pages:

- include the page `LayoutID` in `ReplaceIds`
- for generated root dashboard pages with embedded page JSON, use the dashboard `LayoutID` for `LayoutInResources[0].ID` and `RefId`; Design System Request Tracker v1 proved that a separate generated resource ID can import but render as an empty designer placeholder
- for data-list persistence, prefer Text fallback for requester/user values unless a focused native data-list identity/user field export proves the persisted shape; approval forms may still use identity-picker/current-user values for workflow assignment when that pattern is proven
- Type `103` `LayoutInResources` resource IDs are excluded from `ReplaceIds`
- `LayoutInResources[0].Resource` must contain valid page JSON

Minimal dashboard-only exception: `Test Dashboard Only.yap` and the generated `generated-dashboard-minimal-v1.yap` runtime baseline prove that an empty dashboard shell can use `LayoutInResources: []`, `Ext2: "{\"src\":true}"`, and only two `ReplaceIds` (root app/ListSet ID plus dashboard `LayoutID`). Use `yeeflow-dashboard-generator` before generating dashboard-specific packages.

Read `references/baseline-department-access-management-v5.md` before changing app shell or Type `103` page logic.

## App-Level Approval Form Rules

- `Data.Forms[].ListID` must be numeric `0` for app-level approval forms.
- `ProcModelID` carries the generated approval process ID and should be included in `ReplaceIds`.
- Root navigation Type `105` should point to the form key.
- Use a fresh FlowKey/form key for every generated import-test package.
- Do not reuse a FlowKey/form key from a previously imported generated app unless explicitly testing update behavior.

## Benefit / Quota Usage App Rules

When an application tracks benefit quota, annual entitlement, family usage, budget usage, or similar consumption:

- generate a persistent usage/transaction list when the business needs audit, reporting, or quota checks
- include applicant identifier, applicant name, readable cycle/year, numeric cycle number when applicable, amount, usage status, source application number, and notes
- if the quota cycle is employee anniversary year or another non-calendar cycle, include a numeric cycle field and query usage by applicant + numeric cycle + active/occupied status
- if the business confirms quota is occupied on submission, create the usage record at submission/start of workflow, not only after final approval
- include in-progress/occupied and approved/confirmed statuses in quota checks; exclude released/rejected statuses
- update the usage record to approved/confirmed on final approval and released/rejected on rejection when `ContentList edit/remove` is runtime-safe
- store a correlation key such as application number, request instance key, form instance id, or workflow instance id so later update/release actions can target the matching usage row
- if edit/remove is not yet proven, document a manual HR release fallback and create a focused learning task; do not leave the usage list unused

## Workflow Branch Coverage Rules

When generating approval workflows:

- every multi-branch review node must cover all meaningful outcomes and policy-routing values
- variables used for branch conditions must be required, auto-derived, or backed by fallback routes
- yes/no flags that drive routing should cover `Yes`, `No`, empty/null, and unexpected values
- route empty or unexpected policy values to specialist review/fallback rather than a dead end
- validate that normal, exception, rejected, and fallback paths all reach an end or persistence node

## Generated List Runtime Purpose Rule

Every generated v1 data list should have at least one active purpose:

- maintained as master/config data and read by form/workflow/dashboard logic
- written as transaction/usage/audit data by workflow or ContentList
- read for quota, routing, reporting, search, dashboard, or export

Do not include unused configuration lists in v1. If a list is only intended for v2, mark it deferred and omit it unless the user explicitly asks for a placeholder.
- use `arraySum` over the query result collection for used amount
- use the top-level total variable from sublist summaries/recalculation for quota checks, workflow routing, and ContentList persistence
- preserve safe FlowKey rules so summary binding keys such as `prefix` cannot be corrupted by import replacement

## ReplaceIds And Lookup Sample Rules

Local app graph IDs should be included in `Resource.ReplaceIds`:

- root app/listset ID
- child list IDs
- field IDs
- view/custom form layout IDs
- data-list custom form resource IDs where the data-list rule requires it
- approval form/process IDs and form keys
- local sample record `ListDataID` values
- root Type `103` page `LayoutID`

Do not include external dependency IDs in `ReplaceIds`.

For standalone `.ydl` with external lookup sample data, external target record IDs must be excluded from the dependent package `ReplaceIds`.

For app-level `.yap` with internal lookup sample data:

- target sample record IDs are local package IDs
- include target sample record IDs in `ReplaceIds`
- dependent sample lookup values may reference those local target sample IDs as plain strings
- export-back from v5 proved Yeeflow remaps target records and dependent lookup values consistently

If grid display appears blank but export-back lookup values match exported target records, classify it as a runtime display/index/cache issue unless the item form lookup value or manually edited rows are also broken.

## ID And Expansion Strategy

- Every generated `.yap` import-test package needs a fresh local ID family.
- Do not reuse ID families from previously imported generated apps, even if the earlier import failed.
- Start from a known-good baseline.
- Add one field/change at a time for unproven field/control types.
- Multi-field expansion is allowed only after the underlying field/control types are proven by export-backed examples and generated import tests.
- Preserve proven field slots unless deliberately testing a new slot.

## Validation Commands

Use these from the project root or adapt paths to the current workspace:

```bash
node scripts/validate-yap-package.js ./app-def.json --mode generator --stage final
node scripts/validate-yap-graph.js ./app-def.json --mode generator --stage final --json ./app-graph.json --md ./app-graph.md
node scripts/validate-ywf-def.js ./extracted-approval-form-def.json --mode final
node scripts/validate-ydl-list.js ./extracted-child-list.json --mode generator --stage final
node scripts/build-yap-wrapper.js ./app-def.json ./app.yap --title "App Name" --description "Description"
node scripts/validate-yapk-package.js "./Existing App Version.yapk" --baseline "./Baseline Version.yapk"
```

When a package includes Custom Code controls, also run:

```bash
node scripts/inspect-yap-custom-code-controls.mjs ./app.yap --out ./custom-code-control-inspection.json
```

For real historical exports, use compatibility mode:

```bash
node scripts/validate-yap-package.js "./Existing App.yap" --mode compatibility
node scripts/validate-yap-graph.js "./Existing App.yap" --mode compatibility
```

## References

Load only the relevant reference:

- `references/yap-structure-study.md`: `.yap` wrapper, root app, child resources, forms, reports/modules, ReplaceIds.
- `docs/yeeflow-yapk-version-package-study.md` and `docs/yeeflow-application-package-generation-rules.md` when present: `.yapk` version package wrapper, package-type decision, and current opaque-resource limitations.
- `references/first-test-plan.md`: first safe app-generation test strategy.
- `references/baseline-department-access-management-v5.md`: successful v5 baseline and root app shell rules.
- `references/baseline-visitor-access-management-v11.md`: Visitor Access v5-v11 generated baselines, including v11 multi-type proof.
- `references/data-list-approval-integration-pattern.md`: generated data list plus approval form integration.
- `references/related-list-lookup-pattern.md`: standalone related-list lookup rules and `.yap` internal lookup contrast.
- `references/validate-yap-package.md`: package validator behavior.
- `references/validate-yap-graph.md`: graph validator behavior.
- `references/build-yap-wrapper.md`: wrapper builder usage and safety rules.
- `references/examples-summary.md`: proven baseline and quick pattern reminders.
- In the active generator workspace, use `docs/workflow-action-configuration-reference.md`, `docs/workflow-action-generation-rules.md`, and `workflow-action-configurations.normalized.json` as the official workflow action configuration reference when generating or validating workflow nodes.
- In the active generator workspace, use `control-configurations.normalized.json`, `field-configurations.normalized.json`, `docs/yeeflow-control-to-field-mapping.md`, and `docs/yeeflow-control-field-generation-rules.md` when planning approval-form controls, data-list persistence, custom list forms, and app-level control-to-field mappings.
- In the active generator workspace, use `workflow-action-config-validator.js`, `yeeflow-control-field-schema-utils.js`, and `yeeflow-expression-utils.js` when available; these are the compact helper/validator entry points for workflow action, control/field schema, and expression checks.

## Workflow Action Configuration Reference

The app validator stack should validate workflow nodes against the normalized action reference when present. Stop before wrapper build on missing required node properties, invalid enum values, invalid value types, invalid `ContentList` mappings, invalid `QueryData` filters, invalid `SequenceFlow` conditions, invalid `Loop`/`Delay` condition shapes, and unsafe external or credential-related actions.

## Application Settings Generation

Root application settings are generated in `Data.Item.ListModel.LayoutView` as a JSON string. Preserve `add/edit/view`, write `sort[]` for navigation, write `attrs.appearance` for header appearance, write `attrs["navigator-menu"]` for menu styling/layout, and keep `sortVer = 1`.

For navigation, generate top-level resources directly in `sort[]` and custom groups as `Type: "classes"` with `ID`, `Title`, `Icon`, and `list[]`. Groups cannot be nested, and the maximum supported menu depth is top-level item plus child resource. Use `DisplayName` only when custom display text is required; omit it to use the resource `Title` fallback. Use `Icon: ""` for no-icon. Use `IsHidden` only as a boolean.

Navigation layout values are `default` for horizontal/default, `left` for vertical, `onheader` for on-header, and `none` for no menu; all four values are runtime-proven for generated packages. Header settings live in `attrs.appearance`; omit `height` for default 56px, use runtime-proven `height: 46` for the small header, and use runtime-proven `hideTitle: true` to hide the application title. Additional header height variants remain unproven until a focused runtime baseline tests them.

Application user groups are generated as empty `Data.AppGroups[]` records with fresh `ID`, `Name`, and nullable `Description`; include group IDs in `Resource.ReplaceIds[]`. Empty app groups are import/open and settings-visible runtime-proven. Do not include group members, real users, emails, or tenant-local identities until a member-bearing export proves the schema.

Treat `GenerateDocument`, `ConvertToPdf`, `AddWatermark`, and `DocumentRecognition` as partially supported until template/document-library dependencies are proven. Treat `AI`, `AzureOpenAI`, `Connector`, `HttpRequest`, `AcrobatSign`, `DocuSign`, and `PandaDoc` as external/credential-sensitive; do not bundle secrets, tokens, passwords, API keys, connection IDs, or tenant-specific credential values.

Workflow assignment rule: generated app packages must not hardcode tenant-specific direct users in approval task `usertaskassignment`. A direct `method: "users"` or `method: "direct"` assignment with a local user ID/title can import but fail publish if the user is not valid in the target tenant. Prefer requester/current-user expression assignment or require an explicit export-backed user mapping.

Assignment task assignee generation update: use `docs/studies/workflow-assignment-task-assignee-settings.md`, `docs/studies/workflow-assignment-task-generation-rules.md`, and `docs/studies/normalized/workflow-assignment-task-assignees/` for export-proven `MultiAssignmentTask.properties.usertaskassignment[]` shapes. `Test ABC.yap` proves direct user, applicant line manager, applicant department manager, direct job position, job position by selected department, job position by applicant department, job position by selected location, and job position by applicant location shapes. These are export-proven and validator-backed only; do not claim runtime routing until a focused runtime baseline passes. Job-position, department, and location assignment may require real org data; use `yeeflow-api-operator` read-only lookup only when local credentials are present and authorized.

Scheduled workflow assignment update: `Workflow Actions Runtime Baseline (1).yap` proves a Scheduled Workflow (`WorkflowType = 3`, `ListID = 0`) can include a `StartNoneEvent` with email fields and no terminate/recall fields, followed by a `MultiAssignmentTask.properties.usertaskassignment[]` Applicant Line Manager expression. This does not prove scheduled assignment routing, scheduled email delivery, or data-list field expression context; do not trigger scheduled workflows during generation checks unless a separate safe runtime test is explicitly scoped.

Approval workflow task-form update: `Workflow Actions Runtime Baseline (2)_Task forms.yap` proves an approval form can include one submission page and multiple task-form pages in `Data.Forms[].DefResource.pageurls[]`. Generate task pages separately from the submission page, associate Assignment Task nodes through `MultiAssignmentTask.properties.taskurl`, and keep task forms compatible with the task type. Standard Action Panel task forms are export-proven; custom `action_button` + `formdef.actions[]` task forms are export-proven for approve, reject, reassign, add-assignee, and complete Submit form configurations. Do not claim custom task-operation runtime behavior until focused runtime proof executes the operations safely.

Form Actions baseline: use `docs/yeeflow-form-action-generation-rules.md` for generated front-end form logic. Button styles, button click triggers, page-load triggers, temp variables, `setvar`, `confirm`, Query data multiple/single mapping, query count, Query data filters via `querydata_filters`, temp query collection aggregation, default Submit form, Save changes, approval completion, and ContentList persistence are runtime-proven in focused generated packages.

## Custom Code Control Rules

When an app package includes a Yeeflow Custom Code control:

- Generate the script first or confirm that an existing script is available in the package; do not create a `codein` control with a missing script.
- Use the export-backed control shape: `type: "codein"` with `attrs["codein-script"]` for embedded source and `attrs["codein-script-param"]` for the parameter map, unless a future export proves a separate script-resource reference pattern.
- Required input parameters declared by the script must be present, and parameter names must be unique.
- Parameter value shapes must match the script's Yeeflow parameter expectations. For Smart Lookup Picker-style controls, expression/static values use `{ type: 2, value: [token...] }`, while output targets use `{ type: 1, value: { prefix, value } }`.
- Dashboard output targets should resolve to dashboard temp variables (`__temp_`), approval-form output targets to workflow/form variables (`__variables_`), and data-list custom-form output targets to list fields (`__list_`).
- Every Custom Code control should have a meaningful surrounding section/title and a clear `nv_label` or nearby label. A generic `Custom code` label is acceptable in an export study but should be improved in generated packages.
- Do not silently fall back to static text or placeholder content when a custom component is required by the app design.
- Public-form custom code must be treated as unproven unless a focused export/runtime test proves the script is safe with public permissions and data access.
- Treat static inspection as configuration proof only. Runtime render, lookup query, and writeback must be tested before claiming support.

## Control-To-Field Mapping Rules

Use generation-safe mappings first: `input` to Text, `textarea` to Text, `input_number` to Decimal, `currency` to Decimal, `radio` to Text choice, `switch` to Bit, `datepicker` to Datetime, and resolved local `lookup` to a lookup field when the target field is lookup-compatible. Use the v6 lookup rule for app packages: persist readable lookup values through `attrs.addition[]` target variables or explicit summaries, and store raw row IDs only intentionally. Use fallback mappings for rich text, identity/organization/location/cost-center pickers, tag, metadata, and direct file/image binary persistence until runtime proof exists. Percent, hyperlink, and rate have generated runtime proof when mapped to Decimal/Text fields as documented in the coverage matrix. Defer signer, lookup-list, nested list row persistence, embedded data-list display, and calculated-column approval variables unless a focused export/import proves the structure.

## Output Expectations

When generating or debugging a `.yap`, report:

- files created or changed
- resource inventory
- generated IDs and `ReplaceIds` strategy
- lookup and `ContentList` mappings
- validation results
- wrapper build result, if built
- unresolved risks and stop conditions
- sandbox import/export-back checklist

<!-- agent-copilot-application-resource-learning:start -->
## AI Agent, Copilot, And Connection Boundary

The DEMO Innovation Ecosystem Platform study proves app-level AI resources in OtherModules: Connections, Agents, and Knowledges. Agents module entries use Type = 0 for AI Agents and Type = 1 for Copilots. Tools can target local data lists, current app resources, connected Agents, or application connections.

Do not include AI Agents, Copilots, or Connections in generated final .yap packages until the target resource graph is fully resolved and local validation passes. External connection tools require placeholders and post-import reconfiguration; do not generate packages that require real Outlook, SharePoint, OAuth, or HTTP credentials.
<!-- agent-copilot-application-resource-learning:end -->

<!-- workflow-claim-task-learning:start -->
## Workflow Claim Task Generation Boundary

Use `docs/studies/workflow-claim-task-action.md` before generating Claim Task nodes. Claim Task is export-proven as `CandidateTask` in approval-form and data-list workflows. It shares task form association (`properties.taskurl`) and receiver editor storage (`properties.usertaskassignment[]`) with Assignment Task, but the semantics are receiver/candidate pool ownership rather than direct assignee ownership. Generate Claim Task only when the business process expects a pool/team to claim work; use Assignment Task for direct user assignment.

Preserve `tasktype="approve"` or `tasktype="complete"` when present, preserve due-date and email fields, and preserve receiver expression-button strings. Do not generate the config-reference typo `properties.tasktype ` with a trailing space. Do not claim claim execution, claim locking, pending-task ownership, quick completion, or email delivery without a focused runtime baseline.
<!-- workflow-claim-task-learning:end -->

<!-- workflow-set-variable-learning:start -->
## Workflow Set Variable Generation Boundary

Use `docs/studies/workflow-set-variable-action.md` before generating workflow Set variable nodes. Set variable is export-proven as `SetVariableTask` in approval-form and data-list workflows. Generate `properties.variablesetting[]` rows for workflow-variable assignments: the row `id` is the target workflow variable and `value` is the expression-token array.

Use `formtype="current"` for the current workflow. Use `formtype="custom"` only for another approval form workflow instance and preserve `properties.data.AppID`, `properties.data.ListSetID`, `properties.data.ProcKey`, and `properties.formids`. In data-list workflows, list fields may be used as right-side `exprType="list_field"` values, but Set variable must not be used to write list fields; use Set data list / `ContentList` for data-list mutation. Do not claim runtime variable mutation or another-workflow updates without focused runtime proof.

Use `docs/studies/workflow-set-data-list-action.md` before generating workflow Set data list nodes. Set data list is export-proven as `ContentList` in approval-form and data-list workflows. Use it for data-source item/field mutation, not workflow-variable mutation. Preserve `properties.listtype` (`select` or data-list-context `current`), `properties.type` (`add`, `edit`, `remove`), `properties.listdatas[]` mappings, and `properties.wheres[]` filters. Selected-list mode must preserve target metadata in `appid`, `listsetid`, and `listid`. Edit/remove are high-impact; generate explicit safe filters and avoid remove unless the user explicitly requests destructive behavior. Preserve numeric operation codes `Per="0".."4"` only where target field metadata supports number operations. Do not claim add/update/delete, current-list mutation, document-library mutation, or sub-list row iteration without focused runtime proof.

Use `docs/studies/workflow-signal-event-action.md` before generating approval workflow Signal event branches. Signal event is export-proven as `SignalEvent` in an approval-form workflow. It has no incoming flow, should have at least one outgoing flow, and uses `properties.eventdefinitions[]` with `CancelEventDefinition` and/or `RevokeEventDefinition`. Treat it as a special event source for recall/terminate compensation, not a normal action in the Start branch. Validate downstream Set data list filters carefully and do not claim recall/terminate or cleanup execution without focused runtime proof.
<!-- workflow-set-variable-learning:end -->

<!-- app-creation-rules-learning:start -->
## App Creation Rule Guardrails

Before generating or importing any `.yap`, enforce the product-team app creation rules in `docs/studies/yeeflow-app-creation-rules.md`. Generated list fields must keep `FieldIndex` synchronized with the numeric suffix at the absolute end of `FieldName` (`FieldIndex: 11` uses `Text11`, not `Text6`) and must keep the `FieldName` storage prefix aligned with `FieldType` (`Text*` text, `Datetime*` date, `Decimal*` numeric). `DisplayName`, `FieldName`, and `InternalName` must each be unique within the same list; `InternalName` and process keys may contain only letters, numbers, and underscores; all three field identifiers and process keys are limited to 255 characters.

Approval forms must emit `NoRule` as an object with `Prefix`, `StartIndex`, `CustomLength`, and `AutoIncrement`; `NoRule.Prefix` must include `{index}`. Treat these as generation-blocking validation errors, not style warnings. Any generated package failing these checks must not be imported.

Focused runtime proof in `docs/studies/yeeflow-app-creation-rules-runtime-proof.md` confirms the repaired workflow field-rule package imported and accepted a manually saved new data-list field. This upgrades only the app/list import-open and data-list field-creation path for the synchronized `FieldIndex`/`FieldName`, unique identifier, valid process-key, and valid `NoRule` rules; do not extend it to workflow routing or Form Report behavior.
<!-- app-creation-rules-learning:end -->

<!-- data-list-document-library-fields-learning:start -->
## Data List And Document Library Field Type Learning

Use `docs/studies/data-list-document-library-field-types.md`, `docs/studies/normalized/data-list-fields/`, and `scripts/inspect-data-list-fields.mjs` before generating or validating broad Data List custom fields. `Data Lists (2).yap` export-proves the target Type `1` data lists `Data list with fields part A` and `Data list with fields part B` with 90 custom fields across `input`, `textarea`, `richtext`, `hyperlink`, `input_number`, `currency`, `percent`, `calculated-column`, `rate`, `switch`, `checkbox`, `radio`, `tag`, `datepicker`, `time`, `identity-picker`, `organization-picker`, `cost-center-picker`, `signer`, `file-upload`, `icon-upload`, `lookup`, `metadata`, `mutiple-metadata`, `location-picker`, `autonumber`, and `list`. `select` and `flowstatus` remain product-rule-backed/unproven in this export.

Field generation must still pass the app-creation gates: unique `DisplayName`, `FieldName`, and `InternalName`; `InternalName` matching `[A-Za-z0-9_]`; identifier length <= 255; generated non-system `FieldName` suffix matching `FieldIndex`; and `FieldName` storage prefix matching `FieldType` for generated seed/add-ready lists. Accept export-proven single metadata fields as `Type = "metadata"` with Bigint storage, even though the earlier product-team 28-type list only named `mutiple-metadata`.

Use export-proven settings where relevant: choice `Rules.choices` and `color_choices`; numeric/currency/percent `displayThousandths`, `rounded-to`, `number_min`, `number_max`, `currencyCode`, `displayFormat`; picker `identity-maxselection`, `multiple`, `metadata-treeselect`, `parentId`; upload `maxsize`, `file_multiple`, `file_typeslimit`, `file_types`, `picture_size_limit`, `controlmultiple`; lookup `appid`, `listsetid`, `listid`, `listfield`, additions, filters, sorting, search, display style, and multiple; calculated columns `calculated_result` plus `calculated`; metadata `source` plus `categoryId`; tag `source`, `category`, `customTags`; autonumber `minDigits`, `startNum`, `prefix`, `suffix`; sub-list `list-variables[]`.

Document Library custom-field applicability is product/user-understanding-backed only in this pass because no Type `16` document library was present. Keep Type `16` default fields and document upload rules from existing document-library studies, and do not claim runtime data-entry behavior for these field settings until focused import/open/field-creation tests pass.

Focused runtime proof in `docs/studies/data-list-field-creation-runtime-proof.md` confirms generated Data List import/open behavior and post-import manual field creation for a representative subset: `input`, `textarea` schema, `input_number`, `currency`, `percent`, `switch`, `checkbox`, `datepicker`, `time`, `identity-picker`, `organization-picker`, `file-upload`, `icon-upload`, local `lookup` schema, `calculated-column` schema, and `list` schema. Use this to prefer native generated fields for import/open baselines, but do not claim record entry, lookup resolution, calculated results, uploads, picker selection, nested row behavior, Document Library, workflow, or Form Report runtime behavior.
<!-- data-list-document-library-fields-learning:end -->

<!-- data-list-custom-form-fields-learning:start -->
## Data List Custom List Form Generation

Use `docs/studies/data-list-custom-form-fields.md`, `docs/studies/normalized/data-list-custom-forms/`, and `scripts/inspect-data-list-custom-forms.mjs` when an app needs generated Data List custom forms. Generate custom forms as Data List `Layouts[]` entries with `Type = 1`, `LayoutView = null`, `LayoutInResources[0].ID = RefId = LayoutID`, and embedded form JSON in `LayoutInResources[0].Resource`. Assign forms through `ListModel.LayoutView.add/edit/view`; the export-proven patterns include separate add/edit forms and one form reused for add/edit/view.

Display settings are separate from the form layouts: `ListModel.LayoutView.add/edit/view` selects a custom form `LayoutID` or `default`, `opentype` stores opening mode, and `modalsize` stores size. Export-proven modes are Pop-up window via `modal`, Slide in via `slide`, and missing defaults of Pop-up window for New/Edit plus Slide in for View. Export-proven sizes are `0` Medium, `1` Small, `2` Large, `3` Full screen, with missing as Default. Choose mode/size by form complexity and validate references before package handoff. Document Library applicability for these settings remains product/user-understanding-backed until a Type `16` export proves it.

For list fields on forms, generate controls under a conservative `container` -> `container` -> `flex_grid` shell. Each top-level field control should use the field `Type`, `binding = FieldName`, `fieldID = FieldID`, label/display metadata, and compatible `attrs` from field rules. Keep default/system fields explicit and system-aware. Validate no duplicate control ids, no unresolved bindings, no fieldID/binding mismatches, and no overlap-prone layout inventions.

For sub-list fields, generate a parent `type = "list"` control and nested controls only inside `attrs.list-fields[]`, with `attrs.list_field = true`, `attrs.list_field_binding` pointing to the parent field, and scoped bindings such as `field_1`. Generate temp variables and form actions only when needed; action buttons, `formAction` hooks, Set variable list-field targets, and temp variable references must resolve. Do not assume approval-form action behavior for Data List custom forms without Data List export/runtime proof.

Document Library custom-list-form applicability is product/user-understanding-backed unless a Type `16` export proves the exact shape. Runtime rendering/action execution is not proven by the export-learning pass.
<!-- data-list-custom-form-fields-learning:end -->

<!-- data-list-public-form-learning:start -->
## Data List Public Form Generation

Use `docs/studies/data-list-public-forms.md`, `docs/studies/normalized/data-list-public-forms/`, and `scripts/inspect-data-list-public-forms.mjs` when an app requires an anonymous public data-collection form. Public Forms are not Custom List Forms: store them under the Data List `PublicForms[]` collection with a JSON-string `Resource`, keep them separate from `Layouts[]`, and validate public-form controls independently from authenticated New/Edit/View forms.

Generate only public-safe top-level field controls proven in `Data Lists (4).yap`: `input`, `textarea`, `richtext`, `input_number`, `percent`, `currency`, `switch`, `radio`, `checkbox`, `datepicker`, `time`, `file-upload`, `icon-upload`, `rate`, `hyperlink`, `signer`, and `list`. The `Title` primary field is export-proven as a special system-field exception; do not include Id/Created/Modified default fields or login-dependent picker fields.

Use conservative page structure such as `container` and `flex_grid`, and include `submit-button` when the Public Form is meant to collect submissions. For generated Public Forms, use export-shaped `flex_grid` attrs (`ver: 1`, structured `columns`/`rows`, `cgap`, `cgapU`) and set `displayLabel: [null, false]` when the grid is only a layout wrapper. Put `submit-button` inside a centered container and use inline width `common.positioning.widthtype: [null, "2"]`.

Focused runtime proof in `docs/studies/data-list-public-form-runtime-proof.md` confirms generated Data List Public Form import/open/list-open/designer-open/control-render behavior after the grid and centered inline submit fix. Redact share URLs/codes in all docs and logs. Treat anonymous submit, public URL access outside the authenticated designer unless separately confirmed, upload execution, sub-list row entry, save/data mutation, and Document Library public-form behavior as unproven until a focused runtime proof covers them.
<!-- data-list-public-form-learning:end -->

<!-- yap-schema-standard-learning:start -->
## YAP Schema Standard Guardrails

Before packaging any generated `.yap`, ensure the wrapper has schema-required `Title`, `Description`, `IconUrl`, `IsListSet`, and `[______gizp______]`-prefixed `Resource`. The decoded resource must contain `Data` as a JSON string whose `ListExportInfo.Item` exists.

Every generated `ListExportItem`, including root `Item` and every `Childs[]` resource, must emit `Defs` and `Layouts` as arrays. Never emit `null`; use `[]` for empty definitions or layouts. Generated packages must pass `scripts/inspect-yap-schema-standard.mjs` and `validate-yap-package.js` before import attempts.

For app-contained AI Agent/Copilot Access app resources tools, keep resource permissions as numeric bitmasks. Use schema-backed masks for approval forms, data lists, document libraries, and AI agents. Keep `formReports` and `dataReports` warning-level until product clarifies whether the correct bit is schema Read `8` or rules-doc Submit `1`.
<!-- yap-schema-standard-learning:end -->
<!-- projects-center-import-failure-hardening:start -->
## Generated App Import-Readiness Gate

The `Projects Center_2` repair proved that compatibility validation can miss generated-import blockers. The initially delivered package passed local compatibility-style checks but failed Yeeflow import; after strict repair, the user confirmed the fixed package imported successfully. Treat that proof narrowly: it proves fixed Projects Center import only, not broad app use, data entry, document-library runtime behavior, report execution, or workflow behavior.

For every newly generated `.yap`, run strict generator/import-readiness validation before handoff. Do not say "local validation passed" when only compatibility validation passed. Compatibility mode is for historical export study; generated app handoff requires `validate-yap-package.js --mode generator --stage final`, `validate-yap-graph.js --mode generator --stage final`, materialization inspection, schema-standard inspection, app-creation rules inspection, data-view/dashboard/page reference checks, wrapper round trip, placeholder scan, and safety scan. Use `scripts/inspect-yap-import-readiness.mjs` when present.

Generation-blocking import-readiness errors include missing or invalid `ListModel.ListType` on Type `1` data lists; export-native native `Title` metadata instead of generator-safe `Status = 0`, `IsSystem = true`, `IsIndex = true`, `FieldIndex = 0`; list/data view columns pointing at unresolved system pseudo-fields or missing fields; custom page/form/dashboard `LayoutInResources[].ID` or `RefId` mismatched from the owning `LayoutID`; dashboard dynamic-display rules or filters referencing unresolved controls/fields, including stale `ListDataID` collection context filters; and `Resource.ReplaceIds` containing tenant/user metadata such as `TenantID`, `CreatedBy`, or `ModifiedBy`.

If strict validation fails, fix the package before handoff. `pass_with_warnings` is acceptable only after the remaining warnings are classified as non-import-blocking runtime/export-derived warnings.
<!-- projects-center-import-failure-hardening:end -->

<!-- container-button-action-settings-learning:start -->
## Container/Button Action Handoff

When generated dashboards, custom pages, or app shells include clickable Containers or Buttons, use the export-backed action-setting guidance in `docs/studies/container-button-action-settings.md` and validate with `scripts/inspect-container-button-actions.mjs`.

For generated apps, do not leave action targets as placeholders. Link actions need a literal URL or expression URL. Add list item actions must point to a real Data List or Document Library and any selected form layout must resolve. Open dashboard actions must point to an included Type `103` dashboard. Open approval form actions must point to an included approval form `ProcKey`, and final approval forms should satisfy the publish/readiness checks. Generated-final unresolved Container/Button action targets are import-readiness errors.

Choose structural Yeeflow actions instead of raw links when the target is a Yeeflow resource. Keep cross-application action targets runtime-sensitive unless a focused export/runtime proof includes the exact cross-app identity shape.

Focused runtime proof in `docs/studies/container-button-action-runtime-proof.md` confirms representative generated current-app Container/Button action navigation for Link, Add list item, Open dashboard, and Open approval form. For generated approval forms opened from dashboard actions, preserve request-page publish readiness: `DefResource.pageurls[]` should contain a request page with outer `type = 1` and `pagetype = 1`, embedded `formdef.id` equal to the page ID, embedded `formdef.pagetype = 1`, populated form name/title, array `filterVars`/`tempVars`, and Start node `taskurl`/`taskUrl`/`TaskUrl` aliases pointing at that request page. The runtime proof fixed `process request pageUrl is null key:CBAR`; do not claim submit/workflow/cross-app/form-action binding proof from it.
<!-- container-button-action-settings-learning:end -->
