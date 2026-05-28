---
name: yeeflow-application-builder
description: build real Yeeflow business applications from requirements, process documents, forms, screenshots, SOPs, sample exports, and app ideas by acting as a business solution architect, designing the safest Yeeflow-native app structure, generating and validating .yap new-app packages or .yapk upgrade packages, runtime-testing when requested, documenting baselines, and coordinating Yeeflow generator skills.
---

# Yeeflow Application Builder

Use this skill when the user provides business requirements, process documents, forms, screenshots, SOPs, sample exports, workflow requirements, or app ideas and asks Codex to build, implement, create, generate, test, or output a Yeeflow application package, `.yap`, or `.yapk`.

YAPK-from-scratch rule: when the requested deliverable is a generated `.yapk`, the builder must still treat the inner application as the first deliverable. Build and validate `AppPackageInfo` content before Brotli/base64/sign. Do not sign if package/app creation validators, graph validators, workflow publish-readiness checks, or placeholder scans fail. `setsign` and `verifysign` prove wrapper/resource integrity, not generated-app correctness or tenant-specific routing. Preserve the proof boundary and write generated `.yapk` output outside git.

This skill is the top-level application-building controller. It coordinates proven generator skills:

- `yeeflow-application-generator`
- `yeeflow-data-list-generator`
- `yeeflow-approval-form-generator`
- `yeeflow-dashboard-generator`
- `yeeflow-expression-generator`

Use `yeeflow-feature-learning-orchestrator` instead when the task is primarily to learn an unknown Yeeflow platform feature from exports, screenshots, runtime tests, or manual fixes.

## New Capability Runtime Gate

When a requirement depends on a newly learned or partially understood Yeeflow capability, do not silently fold it into a normal app build as if it were runtime-proven. Use `yeeflow-feature-learning-orchestrator` first for export-backed learning, then make an explicit runtime decision before broad app generation or merge.

For new capabilities, require one of these labels in the plan and final report:

- export-proven only
- validator-backed only
- planning-guidance only
- import-proven only
- configuration-visible only
- render-only proven
- partial runtime proof
- runtime-proven for a specific tested host/scope

Recommend a focused runtime baseline before depending on the capability when generated package behavior, imported rendering, workflow execution, app setting rendering, AI/email/external execution, custom code execution, document upload/persistence, user/group membership, permissions, or row mutation is involved. Keep runtime baselines small and focused; do not use a full business app to prove a new platform schema unless the user explicitly accepts that risk.

## Application Capability Planning Checklist

Before implementation for any full application build, create a `Capability Coverage Plan`. Use `docs/studies/application-planning-capability-coverage.md` when present. The plan should consider the current learned capability set, select only capabilities that serve the business process, mark partial/unproven areas honestly, and assign each selected capability to the right specialized skill before package generation starts.

Cover these planning areas:

- Core resource model: data lists, approval forms, document libraries, dashboards, reports, follow-up/task lists, master/reference lists, transaction lists, and custom forms.
- AI experience: whether the app needs a Copilot, quick prompts, local resource tools, connected Agents, image upload, or attachments.
- AI Agent design: reusable Agents, required input/output variables, image/file inputs, Access application resources tools, create/update/read behavior, email draft/summarization/scoring/recommendation tasks, and human-review boundaries.
- Workflow and automation: data-list workflows, approval workflows, scheduled workflows, triggers, `QueryData`, `AI`/AI Assistant, `MailTask`/Send email, HTTP/API/resource actions, and which execution steps must remain disabled or deferred during runtime tests.
- Document management: document libraries, generated folders, custom document fields/views/forms, and Doc library controls on dashboards or forms.
- Navigation and application shell: default or custom navigation, navigation groups, top-level resources, grouped resources, layout `default`/`left`/`onheader`/`none`, header title visibility, export-proven header height settings, and app user groups.
- Permissions and users: app user groups, role-based experiences, permission-sensitive screens, and the current boundary that user-group member assignment is not export-proven and must not be generated with real users.
- Integrations and connections: HTTP API, OAuth, OpenAPI/REST tools, external calls, post-import connection setup, credential safety, and execution deferral.
- Runtime and validation plan: import-proof target, runtime-proof target, render-only or validation-only areas, validators to run, and artifacts/private data that must never be committed.

For any generated Data List that users will create records in, include a runtime-safe Add form plan. `ListModel.LayoutView.add` must resolve to a generated or export-backed Type `1` custom form layout; `opentype.add` and `modalsize.add` alone are not enough. The focused fixed Container/Button action package is user-confirmed to render the default `+ New item` Add modal for `Action Runtime Requests` after this shape was corrected, but save/data mutation and other hosts remain separate proof items. Validate the default `+ New item` path locally and include manual runtime verification of the Add modal rendering when the app depends on user-created list records.

For requirements that need actionable dashboard cards, Kanban lanes, item edit/delete buttons, selection checkboxes, or bulk update/delete behavior, use `docs/studies/collection-kanban-actions.md`. Collection/Kanban item actions are export-proven as local `attrs.actions[]` on the host control, with item-template controls binding through `attrs.control_action` and current-item context through `__ctx_coll` / `ListDataID`. Plan selected IDs/count as dashboard temp variables, use dynamic display rules for checked/unchecked icons and bulk toolbar visibility, and validate all local action bindings and variable references. Keep actual edit/delete/update/select/bulk execution as a focused runtime-test item unless that specific generated package has been tested.

The focused generated package in `docs/studies/collection-kanban-actions-runtime-proof.md` is now user-confirmed runtime proof for this pattern in the tested package. It includes one Data List, one dashboard, Collection and Kanban controls, local item actions, current item context, selection state, checked/unchecked icons, selected count, and bulk update/delete actions. Keep the claim scoped to those tested behaviors and package.

If planning depends on real users, departments, locations, or positions, use `yeeflow-api-operator` only when local credentials are present and the user wants authorized lookup. Do not invent org/reference data when safe API lookup is available, but do not require API access for ordinary package generation. Keep generated packages free of private user data unless explicitly required, narrow in scope, and safe; prefer placeholders, empty app groups, requester/current-user expressions, or post-import configuration.

Every `Capability Coverage Plan` should include:

- selected capabilities
- intentionally excluded capabilities
- deferred or unproven capabilities
- runtime test boundary
- safety boundary
- skill and validator dependencies

Before generation, self-check that the plan considered all available learned capabilities without overusing irrelevant ones, assigned each selected capability to the correct skill, marked proof gaps honestly, and named validation/runtime-test boundaries.

## Application Settings Planning

When requirements mention application navigation, header appearance, menu layout, or app user groups, use the runtime-proven application settings model from the active workspace docs. Generate these settings in the root app `Data.Item.ListModel.LayoutView` JSON string: `sort[]` for menu structure, `attrs["navigator-menu"].position` for layout, and `attrs.appearance` for header fields.

Use `Type = "classes"` for custom navigation groups, keep groups top-level only, keep depth to two layers, require group `Title`, use optional resource `DisplayName` for custom text, omit `DisplayName` for resource-name fallback, and use `Icon: ""` for no-icon. Supported layout values `default`, `left`, `onheader`, and `none` are runtime-proven for generated packages. `attrs.appearance.height = 46` and `hideTitle: true` are runtime-proven together; additional header heights remain unproven. User groups may be generated as empty `Data.AppGroups[]` records with fresh IDs in `ReplaceIds`; do not generate real users, emails, or members until member schema is proven.

## Custom Code Planning

Use custom code as an advanced application component only when the business interaction cannot be delivered cleanly with standard Yeeflow controls, lookup settings, expressions, form actions, workflow actions, or dashboard widgets.

Use custom code when:

- standard Yeeflow controls cannot provide the required interaction
- advanced lookup/picker behavior is needed, such as a reusable search-select component over a large master list
- dynamic UI logic is too complex for standard controls, form actions, lookup filters, or expressions
- a reusable business component already exists and is appropriate for the target app
- the business value justifies the maintenance and runtime-test cost

Avoid custom code when:

- standard controls can solve the requirement
- behavior is simple enough with form actions, lookup, Query data, expressions, dynamic display, or workflow actions
- the script depends on unsupported or unproven runtime APIs
- the app must remain fully no-code for maintainability
- the behavior affects approval routing, financial authority, security, or persistence and can be implemented server/workflow-side

Planning questions before adding a Custom Code control:

- Which page or form needs the component?
- Is the placement a dashboard, approval form, data-list custom form, or public form?
- What inputs does the component need?
- Are inputs static, field-based, variable-based, temp-variable-based, or expression-based?
- Does the component write back to Yeeflow variables, fields, or temp variables?
- Is the component read-only or interactive?
- Is the component safe for public forms and anonymous/limited-permission users?
- What native fallback exists if the component fails?

When an existing script is used in an app package, coordinate with `yeeflow-custom-code-generator` for the script's parameters and with the relevant page/form generator for placement. Do not generate a Custom Code control unless the script is available or generated as part of the app package, required input parameters are configured, and a focused runtime test plan exists.

## Core Behavior

Think like an experienced business consultant and Yeeflow solution architect:

- understand the business goal before designing fields
- identify mandatory core business capabilities before proposing v1 scope
- do not defer a feature that is central to the stated business process merely because it is technically sensitive; mark it as a required v1 runtime proof item with fallback behavior instead
- recommend the best Yeeflow-native application structure
- separate v1 must-have scope from v2/v3 enhancements
- separate business decision gates from technical runtime assumptions
- ask the user/business owner to confirm business decision gates before generation, unless they explicitly approve default assumptions
- present unanswered business decision gates directly in the Codex chat and stop before generation until the user answers or explicitly approves defaults
- prefer a working, high-quality app over an overloaded first package
- use proven runtime-safe patterns from the installed skills
- mark unproven features clearly and test them before depending on them
- make reasonable assumptions when requirements are unclear, document them, and keep moving unless the assumption would be risky
- when requirements imply multiple selectable business items, evaluate a sublist/listref design early instead of forcing a single lookup field
- when requirements include requester/applicant/employee identity, decide whether proxy submission is allowed; if the applicant field is editable, its change action must rerun profile snapshot and dependent policy/quota calculations
- when requirements include quota, benefit eligibility, or tenure rules, decide the quota cycle, occupation timing, release behavior, and eligibility source before generation
- every generated data list must have an active runtime purpose in v1 or be explicitly deferred out of the package
- master/reference data lists named in requirements must be real active generated lists with fields, views, current-standard custom forms, and sample/reference rows when forms, lookups, dashboards, or workflows depend on them; do not leave them as placeholder concepts
- line-item planning must explicitly choose one persistence model: workflow sublist summary only, direct child-row persistence, or a separate transaction item list with its own runtime proof and reporting purpose
- availability, stock, booking, quota, or capacity logic must be labeled honestly as manual review only, query-based availability, or inventory/reservation based; never present review routing as true stock control
- generated dashboards must be meaningful enough for the app's v1 workflow while staying inside runtime-proven dashboard patterns
- dashboard KPIs, summaries, report sections, queues, analytics, trends, and charts must be implemented with data-bound dashboard controls, not static Text mockups. Use Summary controls for counts/totals, data-list or proven Collection controls for queues/report tables, and chart controls when the chart model is known/proven. Do not remove planned chart controls merely because the initial source list is empty; seed or confirm representative records before deciding chart validity. Use functional list/table fallbacks only for structural chart failures, or as complementary drill-down/reporting views beside working charts
- do not mark dashboard runtime proof as passed only because a page renders; verify source-list bindings, dashboard `exts`, ReportIds, and at least one value/list/empty-state coming from the expected data source
- runtime-unproven features must be marked as required focused proof items or deferred with fallback behavior before final package claims
- workflow routing variables must be required, auto-derived, or protected by fallback branches so no approval path can dead-end on empty/unexpected values
- decide package type before generation: output `.yap` for a new/cloned application, and output `.yapk` only for an existing-app upgrade from a Yeeflow Version management baseline package
- for `.yapk` upgrades, preserve app identity and stable object IDs; do not apply fresh-ID `.yap` import-generation rules unless adding newly proven resources

## Default Lifecycle

For requirement-to-application requests, load `references/requirement-to-yap-generation-lifecycle.md` and follow it end to end:

1. Requirement intake
2. Initial business analysis
3. Initial app plan/spec
4. Business clarification gate
5. Wait for user answers when business-critical decisions are missing
6. Apply confirmed answers to plan/spec
7. Generation-readiness review
8. Generate the correct package type only if ready: `.yap` for new applications, `.yapk` for existing-app upgrades when a safe baseline exists
9. Local validation
10. Runtime import testing when requested or included in the user's build/test request
11. Runtime issue fixing
12. Documentation
13. Skill updates only if new reusable knowledge is learned
14. Git commit/push
15. Final package output

## Package Type Gate

Before generation, clarify whether the user wants:

- a new application package (`.yap`) for import as a separate app, or
- an existing application upgrade package (`.yapk`) for Application Settings -> Version management -> Upgrade application.

For new applications, use normal `.yap` rules: fresh ID family, safe FlowKey/form key, `ReplaceIds`, full local app/form/list validation, and import as a new app.

Materialization hard rules for new `.yap` packages:

- allocate `FieldID` values globally across the app; do not reset per data list
- preserve parent `ListID` on every field
- keep `FieldName`, `InternalName`, and `DisplayName` unique inside each data list
- preserve real `TenantID`, `CreatedBy`, and `ModifiedBy`; do not remap them and do not include them in `ReplaceIds`
- keep all generated numeric-looking IDs within signed `System.Int64` range; Yeeflow import can parse child `LayoutID` as `Int64`, so oversized 20-digit IDs block import
- for generated app-contained AI Agent/Copilot resources, use numeric `Publisher: 0` instead of `Publisher: null`
- for app-contained Access application resources tools, use compact `{ id, permissions }` entries with numeric bitmask permissions, not string arrays
- for data-list workflows, use export-like workflow designer graph metadata so the imported workflow designer can open
- verify root dashboard/page navigation and Type `103` ownership with materialization inspection
- do not runtime-test custom code controls until the imported app opens with real dashboard/list/form content and generated fields are visible

For existing application upgrades, request a baseline `.yapk` downloaded from Yeeflow Version management. Preserve `PackageId`, `TenantID`, `AppID`, `ListID`, stable object IDs, and other app identity fields required for upgrade. Do not generate a `.yap` when the user asked to modify the already-imported app unless they explicitly want a cloned app.

Current `.yapk` limitation: product schema defines the wrapper as `AppExportPackageInfo` and describes `Resource` as Brotli-compressed `AppPackageInfo`, but readable historical artifacts did not verify that Brotli decode path in the current study. For `.yapk` work, use `yeeflow-yapk-package-generator`; the normal `.yap` application generator must not own `.yapk` content generation. Until Yeeflow Resource decode/edit/encode/sign/verify/runtime-upgrade is proven, Codex must not output externally edited app-content `.yapk` packages as valid upgrades; use Yeeflow Version management to generate official `.yapk` packages or produce a `.yap` clone/change plan.

Also load `references/business-solution-design-principles.md` before designing the app structure.
For generation-readiness reviews, also load `references/business-decision-gates.md`, `references/application-design-quality-gates.md`, and `references/application-planning-key-design-decisions.md`.
During final validation and runtime planning, also use the active workspace checklists when present:

- `docs/yeeflow-runtime-test-checklist-template.md`
- `docs/yeeflow-application-generation-review-checklist.md`

## Business Decision Gates

Before generating a real `.yap`, identify business choices that materially change workflow, validation, data persistence, pricing, quota logic, attachment rules, dashboards, or approval responsibility.

Treat these as confirmation gates, not technical notes. Stop before generation if business-critical gates are unanswered and the user has not explicitly approved default assumptions.

### Business Clarification Gate

When unanswered business-critical decisions exist, ask them directly in the Codex chat after the initial app plan/spec is created or updated.

Use this exact chat format:

```text
Business clarification required before generation:

1. <Question>
   - Option A:
   - Option B:
   - Recommended default:
   - Why this matters:

2. <Question>
   - Option A:
   - Option B:
   - Recommended default:
   - Why this matters:

Generation is paused until these questions are answered or defaults are explicitly approved.
```

After outputting this block, do not continue to `.yap` generation in the same turn. Wait for the user's answers or explicit approval of the recommended defaults.

Examples:

- quota cycle policy
- quota occupation/release timing
- mandatory approval roles
- pricing ownership and manual override policy
- exact attachment requirements by scenario
- whether dashboard surfaces belong in v1
- status lifecycle
- compliance/audit handling
- integration responsibility
- role permissions
- what happens on approval, rejection, or resubmission

Technical assumptions are different. Token shapes, tenant profile completeness, query-data behavior, conditional ContentList behavior, route-condition behavior, and validator/runtime quirks should be tested during generation/runtime validation and handled with fallback.

App specs should record decision gates using this shape:

```json
"businessDecisionGates": [
  {
    "key": "quotaCycle",
    "question": "Should quota reset by calendar year or employee anniversary year?",
    "options": ["calendarYear", "employeeAnniversaryYear"],
    "recommendedDefault": "calendarYear",
    "requiredBeforeGeneration": true,
    "status": "unanswered"
  }
]
```

## Mandatory V1 Capability Rule

Do not incorrectly move core business capabilities to v2. If a capability is essential to the requested business process, keep it in v1 as either:

- a proven implementation item, or
- a required v1 runtime proof item with a documented fallback.

Only defer true enhancements, integrations, advanced analytics, admin configurability, scheduled automation, or optional polish.

## Design Quality Gate

Before accepting generated approval forms, run a design-quality review using `yeeflow-approval-form-generator`.

Generated app packages must fail readiness if the approval form does not follow the learned Yeeflow design structure:

- page-level background, not `Main` background
- `Main` / `Content` / `Form body` / `Form bottom`
- Form header / request summary
- two-column grids for normal fields
- full-row layout for textarea, upload, list/sublist, rich text, and long helper/guidance content
- learned Text control standard, inline width by default
- meaningful `nv_label`
- Action Panel and Flow History in Form bottom

## Proven Standards To Apply

Use the current Yeeflow generation foundation by default:

- fresh ID family
- fresh FlowKey/form key
- FlowKey/form key must be safe against Yeeflow import replacement: its lowercase text must not appear inside reserved JSON property names such as `prefix`, `suffix`, `field`, `fields`, `profile`, `definition`, `workflow`, `variable`, `filter`, `ref`, `href`, `control`, `collection`, `condition`, `expression`, `attributes`, `actions`, or `binding`. Known failure: FlowKey `EFI` corrupted summary binding key `prefix` into `pr<runtimeFlowKey>x`.
- `Data.Forms[].ListID = 0`
- native Title metadata on generated data lists
- requester/current-user assignment instead of hardcoded tenant users
- page-level background, not `Main` background
- learned Text control standard
- Text controls inline width by default
- Main / Content / Form body / Form bottom
- Action Panel and Flow History in Form bottom
- two-column grids for normal fields
- full-row long controls and sublists
- meaningful `nv_label`
- approval-control runtime coverage
- expression generation rules
- sublist current-object expressions
- sublist summary binding
- workflow numeric routing
- latest workflow transition condition operand wrappers for direct selectors, direct values, and expression-editor operands
- form actions Phase 1 and Phase 2
- correct `attrs.querydata_filters`
- expression-editor token arrays with `showCus: false` for Query data filter values that reference workflow variables or calculations
- `arraySum`
- `JSONStringfy`
- readable lookup summary variables
- multi-item product/service/request lines should use sublists with row calculations and summary-bound total variables when the business process allows multiple selections
- policy-critical totals from sublists should be recalculated in quota/submit/routing/persistence preflight actions with `arraySum(<ListVariableId>, "<SubtotalFieldId>", [], [])`, even when a visible summary binding is present
- applicant/requester variables should be fixed business identities; Current User may default the applicant on a new request, but applicant profile reads, quota checks, workflow routes, and persistence should use the requester/applicant variable or snapshot variables
- editable applicant/requester controls must rerun dependent snapshot/profile/quota form actions on change when proxy submission is allowed
- user-profile-derived applicant data should be snapshotted into workflow/form variables, displayed readonly, and persisted through ContentList when needed for reporting/audit
- quota and benefit usage lists should include applicant identity, readable applicant name, cycle number/year, amount, status, and source application number
- if quota is occupied on submission, create the usage/occupation record when the workflow starts, include in-progress and approved/confirmed records in future quota checks, and release/update the matching record on rejection or final approval using a stored request/form/workflow correlation key
- employee-anniversary quota cycles should use a numeric cycle field when comparing usage records; for boarding-year eligibility, `ApplicantBoardingYears = dateDiff(ApplicantBoardingDate, now(), "year", [])`, with `0` meaning no family quota and values greater than `0` meaning eligible
- configuration lists such as attachment requirement rules must be read by form actions, workflows, dashboards, or reports in v1; otherwise remove/defer them instead of shipping dead configuration
- master data lists such as Equipment Catalog, Visitors, Departments, Products, or Resource Catalog must be generated as usable runtime lists when lookups/forms depend on them; include maintainable sample/reference rows for local validation unless the dependency is deliberately external and mapped
- do not ship generated data lists that only make the app plan look complete; each list must be opened by navigation/dashboard, queried by form actions, written by workflow, or explicitly identified as a maintained master/reference list
- request line items must declare whether they are stored only as a parent readable summary, stored as direct child rows, or stored in a separate transaction item list; direct child-row persistence remains runtime-proof scoped unless a current baseline proves it for the target pattern
- review-only availability decisions may route to an admin/security/equipment reviewer, but they are not inventory control. True stock/availability requires query-backed stock status or reservation/decrement/update behavior with focused runtime proof
- workflow branches from approval/review nodes must cover normal, exception, empty, and unexpected routing-variable cases; unknown policy values should route to review/fallback, not to a dead end
- core policy checks such as quota validation should run automatically on submit, not only through a manual check button
- submit guard actions should prove both the invalid/warning path and the valid path; conditional warning/confirm/check steps before submit usually need step-level `continue: true` so valid requests skip the warning and still reach Submit form
- required applicant identity controls with Default value = Current User should not also get redundant page-load Set variable default steps
- multi-value Set variables should be used only for independent assignments; keep ordered Set variable steps when later values depend on earlier assignments
- temp variables are frontend-only
- ContentList persistence rules

## Stop And Defer

Do not blindly implement every requested detail in v1. Defer features when they are optional, integration-heavy, advanced, unclear, or likely to make the first package hard to import and test.

Do not use "runtime-sensitive" alone as a reason to defer a core business capability. For core capabilities, require focused runtime proof and fallback behavior.

Stop before generation when:

- mandatory business decision gates are unanswered
- required v1 capabilities have been misclassified as v2 enhancements
- approval form design quality gates are not represented in the plan/spec
- generated form structure lacks grid-based field layout or Form bottom action/history placement

Use `yeeflow-feature-learning-orchestrator` when a requested app needs an unproven platform capability that should be learned from exports before production-style generation.

<!-- projects-center-import-failure-hardening:start -->
## Generated App Import-Readiness Handoff

For newly generated `.yap` packages, compatibility validation is not enough. Before final handoff, require strict package validation, strict graph validation, materialization inspection, schema-standard inspection, app-creation rules inspection, data-view/dashboard/page reference checks, wrapper round trip, placeholder scan, and safety scan. Prefer `scripts/inspect-yap-import-readiness.mjs` when available.

The Projects Center fixed package import is user-proven only for the repaired Projects Center package. Do not claim broad app open/use, data entry, document-library upload/folder behavior, report execution, or workflow proof from that incident. Missing `ListType`, unsafe native `Title` metadata, unresolved view columns, mismatched `LayoutInResources` IDs, unresolved dashboard dynamic-display/filter references, and tenant/user metadata in `ReplaceIds` must block generated-package handoff.
<!-- projects-center-import-failure-hardening:end -->

<!-- container-button-action-settings-learning:start -->
## Actionable Dashboard Business Choices

When translating requirements into dashboard actions, choose Container/Button action types by business intent: Link for URL destinations, Add list item for quick-create data/document flows, Open dashboard for navigation and drill-down, Open approval form for starting workflow requests, and form/page Action binding for local front-end logic when the host schema is proven.

Use structural Yeeflow targets instead of raw links for resources included in the generated app. Generated applications must validate Container/Button action targets and open behavior before `.yap` handoff, and runtime navigation/open behavior remains unproven until clicked in a focused runtime test.
<!-- container-button-action-settings-learning:end -->

<!-- sub-list-dynamic-content-learning:start -->
## Sub List Dynamic Content Planning

For business requirements that need repeated line items with a custom row/card/table layout, consider a Sub List with Dynamic content layout before custom code. Approval Form evidence from `docs/studies/sub-list-dynamic-content.md` proves that Dynamic Sub Lists can place visual/layout controls inside each item template, including containers, grids, text/input controls, icons, dropbars, and action buttons.

Plan list actions as Sub List scoped actions: Add sub item and Import items act on the current list; Duplicate item and Delete item act on the current object; Insert before/after current item uses positioned `list_new` steps; Move up/down use `list_move` with Move down carrying `attrs.moveMode = "2"`. For business line-item tables, prefer a visible Delete column plus a row operation menu for Duplicate, Insert before, Insert after, Move up, and Move down. Do not promise runtime execution, save/mutation behavior, current-object expression evaluation, or Data List custom form behavior unless a focused runtime proof covers that exact host and operation.

For runtime follow-up planning, use `generate-sub-list-dynamic-actions-runtime-proof.mjs` and `docs/studies/sub-list-dynamic-actions-runtime-proof.md` as the current minimal candidate: one Approval Form, one Dynamic Sub List, header grid, row fields `Item Name`, `Quantity`, and `Notes`, and actions `list_new`, `list_dup`, `list_del`, and `list_import`. Treat business designs that depend on these actions as pending manual runtime confirmation until the generated package is imported and exercised.

For business table-style line items, prefer the corrected Dynamic Sub List grid pattern over custom code when it fits: one visual section, caption-off header grid, caption-off Dynamic Sub List, matching body grid inside `list-body`, and aligned action/field/icon columns. Treat V1.2 as pending until manual runtime confirms the corrected header/body layout and selected actions.

For quote/invoice/proposal scenarios that need print output, `Sales Quotation.yap` export-proves a Data List `Quotation` custom form named `Print Page` with a read-only Dynamic Sub List for line items and a View form button/action that calls it through a `type = "print"` form action step. Generate print pages as dedicated Type `1` custom forms, bind Dynamic Sub List row displays to a real Sub List field, resolve row fields from `Rules["list-variables"]`, hide edit/add actions on read-only print displays, and keep runtime print execution claims pending until the user tests the print preview.
<!-- sub-list-dynamic-content-learning:end -->

<!-- kanban-collection-dynamic-controls-learning:start -->
## Kanban/Collection Dynamic Controls Planning

For business apps that need grouped work cards, activity collections, or read-only record headers, prefer native Kanban, Collection, and Dynamic controls where the source list and field bindings can be resolved. `Company Overview.yap` export-proves Dashboard Kanban/Collection item templates using Dynamic controls with source `3`, and a Data List `View page` using Dynamic field controls with source `4`.

In plans and final reports, separate export-proven schema from runtime proof. `kanban-collection-timeline-runtime-proof.v1.yap` proves import/open/render stability for the focused generated dashboard package containing Kanban, Collection, Vertical Timeline, Horizontal Timeline, and Dynamic field values. It also proves Dynamic user/image/file controls do not crash with empty values. It does not prove Kanban drag/drop, item click behavior, non-empty dynamic user/image/file display, preview/download behavior, or Data List custom form runtime rendering.

## Timeline Controls Planning

For business apps that need chronological or time-progression views, consider native Vertical Timeline and Horizontal Timeline before custom code. `Company Overview (1).yap` export-proves dashboard `timeline-v` and `timeline-h` controls bound to a Data List and using Dynamic controls inside item templates.

Use Vertical Timeline for activity feeds, history, lifecycle logs, audit/event streams, approval history, and vertical milestone flows. Use Horizontal Timeline for project schedules, roadmaps, lifecycle stages, campaign plans, and phase progression. Timelines should resolve a source list plus date/title/order fields, and item templates should bind Dynamic controls with `attrs.source = "3"` and `attrs["obj-f"]`. A focused generated package has now proven import/open/render stability for timeline controls with Dynamic fields; keep intended interactions, scrolling semantics, preview/download behavior, and non-empty user/image/file display scoped to separate tests.

Runtime proof: `/Users/Renger/Downloads/kanban-collection-timeline-runtime-proof.v1.yap` imported successfully and `Dynamic Controls Runtime Dashboard` opened. Kanban, Collection, Vertical Timeline, Horizontal Timeline, and Dynamic field values rendered; Dynamic user/image/file controls were stable with empty values and no missing binding/render error appeared. User/image/file non-empty display, preview/download, drag/drop, click/open, and Data List form runtime behavior remain unproven.
<!-- kanban-collection-dynamic-controls-learning:end -->
