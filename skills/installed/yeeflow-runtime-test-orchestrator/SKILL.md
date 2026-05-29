---
name: yeeflow-runtime-test-orchestrator
description: Standardize runtime testing for generated or modified Yeeflow applications. Use when Codex has produced a Yeeflow .yap package, the user asks to runtime-test a Yeeflow app, Codex needs to decide whether a generated app can be accepted as a baseline, or runtime results must be classified as runtime-proven, partially proven, render-only proven, blocked, or not tested.
---

# Yeeflow Runtime Test Orchestrator

## Full Application Visual Quality Gate

Vendor Onboarding full UI v2 proved that import/install success is not enough. Do not call a generated package a full UI application unless it implements the approved plan and mockup-derived pages, forms, controls, bindings, and actions at usable quality. Blank or generic Data List custom forms are quality failures. Default/plain buttons without action bindings are quality failures. Default alert copy such as `Alert` or `Here is the description` is a quality failure. Kanban and Collection controls without meaningful dynamic item templates and item actions are quality failures.

For full application generation, run `scripts/inspect-generated-app-quality.mjs --package <package> --spec <approved-spec.md> --strict-visual-app-quality` before handoff. The strict gate must fail missing planned pages/forms, missing print pages, underbuilt dashboards, missing safe padding/card structure, placeholder controls, default buttons, missing actions, empty Kanban/Collection templates, and undocumented deferred scope. Do not return a minimal or technically importable scaffold when the user asked for the full approved application.

## Visual Fidelity Runtime Review Addendum

Vendor Onboarding full UI v3 proved that passing structural strict validation is still not enough when runtime review shows a plain or underdesigned page. Strict visual quality must evaluate design richness, not just object existence. A dashboard with plain text blocks, a table, weak metadata-only styling, or generated placeholder actions is not a successful full UI when the approved mockup expects a modern SaaS layout. KPI cards must render as designed card-like sections with reliable visual cues; buttons must have meaningful labels and real configured actions rather than safeGeneratedAction/no-op placeholders; alerts must use runtime-renderable business-specific content; Kanban/Collection controls must have useful item templates and real item actions; custom forms must be designed, sectioned, and non-blank. If runtime screenshots or user review show the generated package looks far from the approved mockups, mark the proof failed and harden the validator before generating another package. Do not report full app generation success unless the package passes design/spec fidelity checks and the result is plausibly close to the approved mockups.

## Public Tenant Safety

- Use `YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1` for live API calls.
- Use `YEEFLOW_TENANT_URL` only for tenant/app links, for example `https://<yourdomain>.yeeflow.com`; never use a tenant URL as the API base.
- Treat `YEEFLOW_BASE_URL` as a legacy API base URL alias only, not as a tenant URL.
- When `YEEFLOW_PROFILE` is set, use only the selected local profile for that run and keep all other profiles inactive.
- Never hardcode internal test tenant domains, commit `.env.local`, print API keys, or persist raw API responses, tenant IDs, private URLs, raw `Resource`, raw `Sign`, decoded payloads, screenshots, or generated runtime packages.

Business Travel runtime-practice checkpoint: when a generated package imports, continue with a separate workflow designer publish check before claiming workflow readiness. The fixed `business-travel-budget-control.schema-fixed.v1.yap` package is user-proven for import, app open, workflow open, and workflow publish after schema/variable/assignee repairs. Keep workflow execution, routing, request submission, email, ContentList/data mutation, and true Finance Manager assignment unproven until explicitly tested. A package that imports after `ListModel.Flags = 1` is not automatically workflow-publish-proven.

YAPK-from-scratch runtime checkpoint: a signed and verified `.yapk` is not runtime proof. Before runtime upgrade testing, confirm that decoded `AppPackageInfo` passed content validators, graph checks, workflow publish-readiness checks, and placeholder scans before signing. Classify signing/verifysign as integrity proof only; classify upgrade/import, app open, workflow publish, workflow execution, assignment routing, and data mutation separately.

Vendor Onboarding v1.13-v1.15 YAPK runtime-test checkpoint: before manual install testing, confirm the package validates as schema v2 `AppExportPackageInfo`, `Resource` Brotli-decodes to `AppPackageInfo`, `Childs[]` uses `Fields` rather than `Defs`, `LongAsString` fields remain strings, no-portal packages use `PortalInfo: null`, `AppID = 41`, and dashboard Data table columns include both `Field` source binding and `FieldName` label. Passing `setsign` and `verifysign` remains signing proof only; app install/create and Home dashboard render must be recorded separately.

## Core Rule

Treat local package validation and Yeeflow runtime proof as separate gates. A package can be locally valid but still not accepted as a baseline until the runtime pass is documented.

For `.yapk` runtime claims, use `yeeflow-yapk-package-generator` for preflight inspection and keep wrapper acceptance separate from app-content proof. Do not classify `.yapk` content mutation as runtime-proven unless the test uses a schema-valid Resource rebuild, product-supported signing/verification, and a Yeeflow upgrade that visibly verifies the intended changed lists, fields, dashboards, forms, or workflows. Tenant-specific position/user/group routing is not proven without real authorized mappings and focused runtime evidence.

Never accept fake dashboards, static KPI mockups, or unbound placeholder charts as runtime-proven. Dashboard KPIs, charts, and tables must be data-bound and must render from actual Yeeflow data sources.

Never accept a generated application as runtime-ready when the UI quality gate fails. Before import/open testing, generated dashboards and Data List custom forms should pass checks for safe padding, wrapper sections/cards, resolved data sources, nonempty Data table display columns, and meaningful Collection/Kanban/Timeline item templates. Runtime testing can confirm visible polish, but it should not be used to discover obvious empty tables or edge-to-edge form layouts that local inspection can catch.

For newly generated YAP dashboards, confirm the current dashboard shell when no inline resource is present: root `Type = 103`, `LayoutView = null`, `Ext2 = "{\"src\":true}"`, and `LayoutInResources = []`. Vendor Onboarding v1.12 proves that current dashboards can include inline content with a simple Data table when `attrs.listarr[].Field` is the source field binding and `FieldName` is the visible label. Runtime testing should explicitly check that the dashboard does not show the deleted-fields query error.

Never accept a full application generation as runtime-ready if it skipped the app plan or underbuilt the plan. Before runtime import, confirm the saved or visible Markdown plan, assumptions, exclusions/deferred items, validation checklist, and proof boundary. The package should be checked against the plan for lists, fields, forms, dashboards, controls, actions, workflows, layout quality, and bindings. If the package is intentionally smaller than the plan, classify it as a focused runtime proof or staged/MVP package only when the user explicitly requested that scope.

Also confirm the app plan includes `UI/UX and Control Mapping` before runtime testing a full generated app. The runtime scope should verify that the package behaves like the intended web-app experience mapped into Yeeflow: the right users see the right information first, common actions are reachable, dashboards/forms are padded and grouped, data-bound controls render meaningful fields, and Custom code/custom CSS is used only where justified and documented.

When a package was generated from mockups, screenshots, or visual design descriptions, runtime planning should also compare the imported app against the UI implementation spec. Verify structural fidelity rather than pixel-perfect matching: pages exist, visible sections are present, Data tables have columns, Collection/Kanban/Timeline templates show dynamic fields, actions are reachable, print pages are formatted, and no rich mockup-backed page was reduced to a blank/simple surface.

For newly learned capabilities, runtime testing should usually be a focused baseline, not a broad full-app test. The runtime plan should prove only the new capability plus required host surfaces, with unrelated app complexity removed. If runtime proof is deferred, classify the branch as export-proven, validator-backed, planning-guidance, import-proven, configuration-visible, render-only, partial, or not tested. Do not recommend merging as runtime-proven until the focused runtime path passed and the tested host/scope is documented.

Data Filter runtime boundary: `Sales_Management_AD.yap` and `CRM - Customer relationship management.yap` are export-proven for dashboard filter schema. `docs/studies/data-filter-controls-runtime-proof.md` proves a focused generated dashboard package imported, opened, rendered Search/Radio/Range/Sorting filters plus an Apply button, rendered data-bound table/chart surfaces, and stayed stable for one Search click-apply interaction and one Radio value-change selection. Keep this narrow: Range and Sorting are render-proven only, Remove filters reset behavior and Hierarchy interaction are not runtime-proven, approval-form and data-list-form Data Filter usage remain product-documented only, and exhaustive filter semantics/operators/performance are unproven.

Pivot Table runtime boundary: `CRM - Customer relationship management (1).yap` is export-proven for Pivot Table controls on a Dashboard page only. `docs/studies/pivot-table-control.md`, `docs/studies/pivot-table-control-runtime-proof.md`, and `scripts/inspect-pivot-table-controls.mjs` document and validate the schema. The focused v2 generated package is user-confirmed to import/work well with 20 safe synthetic data-list rows, and adding a new data-list item is user-confirmed successful for that package. The v1 missing-row/Add failed issue is strongly indicated to be a generic data-list seed/add-readiness problem caused by crossed `FieldName`/`FieldType` metadata, so do not runtime-test packages with `FIELD_NAME_FIELDTYPE_MISMATCH`. Keep the Pivot Table claim narrow: exhaustive aggregation correctness, every aggregation/date-grouping mode, Data Filter interaction, sorting semantics, styling fidelity, alternate data source classes, and Data List form hosting are not runtime-proven. Before expanding runtime claims, use another focused generated package with safe local data and verify the specific behavior under test.

Data List LayoutView runtime boundary: `docs/studies/data-list-layoutview-add-form-runtime-fix.md` documents a generated package where the Data List opened but the default `+ New item` Add modal loaded forever because `ListModel.LayoutView.add` was missing and only `opentype.add` / `modalsize.add` existed. The user-confirmed fixed package imported, opened `Action Runtime Requests`, and rendered the default `+ New item` Add modal successfully after `LayoutView.add/edit/view` resolved to concrete Type `1` layouts and object-shaped display-settings `sort` was omitted. Before runtime import, generated packages with Data Lists must pass the LayoutView add-form checks: `LayoutView.add` resolves to a local Type `1` form layout, `view` resolves when present, `edit` is either `default` or resolvable, and display-settings `sort` is omitted or export-shaped. This proves Add modal rendering for the focused generated Container/Button action package only; save/data mutation, other open modes, Public Forms, Document Libraries, Form Reports, and unrelated app patterns remain unproven.

Collection/Kanban action runtime boundary: `Company Overview (2).yap` export-proves Collection/Kanban local action schema, current item context, item selection variables, dynamic display rules, and bulk operation configuration, but not executed runtime behavior. A focused runtime baseline should test item edit form opening, item delete confirmation/removal, current item update fields, selection toggle state, selected count, bulk toolbar visibility, bulk update, bulk delete, cleanup/reset variables, and any Trigger list workflow step separately. Do not claim collection action mutation, workflow triggering, or bulk operation execution from local validation or export inspection alone.

Correct-project runtime package status: `docs/studies/collection-kanban-actions-runtime-proof.md` records `/Users/Renger/Downloads/collection-kanban-actions-runtime-proof.v2.yap` as user-confirmed runtime-proven for the focused v2 scope. Do not reuse earlier wrong-project artifacts or claims. Passed paths: app import, dashboard open, Collection render, Kanban render, item buttons, edit item modal/form opening, current item delete, current item update to `Completed`, checked/unchecked selection icon toggle, selected count, bulk toolbar display, bulk mark completed, and bulk delete. Keep Trigger list workflow, Barcode, NFC, AI assistant, cross-host variable access, unrelated action step families, and untested Kanban behaviors out of the proof claim.

Correct-project v2 manual test result: `/Users/Renger/Downloads/collection-kanban-actions-runtime-proof.v2.yap` was imported and tested from the clean `formreport-clean` branch. The user confirmed app import, dashboard open, Collection render, Kanban render, item buttons visible, edit item opens expected edit UI, delete prompts/deletes current item, mark completed updates current status, checked/unchecked selection toggles, selected count updates, bulk toolbar appears when count > 0, bulk mark completed works, bulk delete works, and no missing binding/render/action error appears.

## Runtime Workflow

1. Confirm local validation completed first. If package/materialization validation failed, classify runtime as blocked by package/materialization and do not import.
2. Plan the runtime scope before testing. Include import/open smoke, dashboards, data lists, approval forms, workflow branches, actions, expressions, custom code, and domain-specific lifecycle checks.
3. Execute tests in Yeeflow using the smallest safe dataset that proves the behavior.
4. Record evidence, failures, blocked steps, and assumptions. Use the classification labels exactly.
5. Recommend baseline acceptance only for behavior that is actually proven in runtime.

For the full pass sequence, read [runtime-test-lifecycle.md](references/runtime-test-lifecycle.md).

## App-Level Capability Runtime Planning

When testing a full generated application, start from its `Capability Coverage Plan` when available. The runtime plan should cover every selected capability at the safest useful proof level and explicitly mark excluded, deferred, or unproven capabilities as not tested or validation-only.

Include app-level checks when relevant:

- app imports and opens
- navigation renders, including custom labels, resource-title fallback, icons/no-icons, groups, child items, selected layout, header height, and title visibility
- data lists open, fields/views/forms materialize, lookup/sample dependencies resolve, and follow-up/task lists serve a real workflow purpose
- for Data Lists, default `+ New item` opens and renders the selected Add form rather than staying in a loading state
- approval forms open, publish when required, submit, route, show task pages, and write `ContentList` records when scoped
- dashboards render with data-bound KPIs, queues, charts, Doc library controls, or empty states from the expected source lists
- document libraries open, generated folders render, custom fields/views/forms are inspectable, and upload behavior is tested only with disposable files
- Copilot configuration opens, quick prompts/tools are visible, and chat/tool execution happens only in an approved safe sandbox
- Agent configuration opens, input/output variables and tools are visible, and Agent execution or row mutation happens only in an approved safe sandbox
- workflows open in the designer, including data-list workflows, approval workflows, scheduled workflows, `QueryData`, `AI`/AI Assistant, `MailTask`/Send email, and designer metadata
- scheduled workflows show recurrence/timezone/working-day settings but do not trigger, publish, run, send email, or call live AI unless explicitly scoped
- custom code controls render and perform query/writeback only after host page/form safety is established
- integrations, HTTP/OpenAPI/OAuth, email, external calls, image/file analysis, and destructive list mutations remain execution-deferred unless the plan names safe credentials, data, and call scope

When runtime planning needs to confirm that users, departments, locations, or positions exist, use `yeeflow-api-operator` for safe read-only lookup only when local credentials are present and the call scope is approved. Use it to support approval-routing tests or select safe test identities only when explicitly allowed. Do not dump private user data, run write APIs, or make API access mandatory for import/open validation.

## What To Test

Load [runtime-test-checklist.md](references/runtime-test-checklist.md) when creating or running a test plan. The checklist covers:

- import/open smoke test
- dashboard render and data-bound validation
- data list materialization
- approval form open, submit, and review testing
- workflow branch coverage
- form action testing
- query data and filter expression testing
- ContentList persistence
- Family Quota Usage and audit lifecycle style tests
- custom code control runtime proof

For application settings runtime tests, use `docs/studies/application-settings-runtime-test-plan.md` when present. After local validation passes, test import/open, navigation menu render, custom menu text, resource-title fallback when `DisplayName` is omitted, icon and `Icon: ""` no-icon behavior, group menu render, child item render, layout modes `default`/`left`/`onheader`/`none`, header height/title visibility, and app user group page visibility only when placeholder groups contain no real users or emails. The `Application Settings Runtime Baseline` pass proved generated packages for all four layout modes, `height: 46`, `hideTitle: true`, custom text, fallback text, `Type: "classes"` groups, child resource navigation, `Icon: ""`, and empty app groups visible in settings. Do not runtime-test member assignments until a safe member-bearing export proves the schema.

For document-library runtime tests, use `docs/studies/document-library-runtime-test-plan.md` when present. Prove import/open separately from upload behavior: the app must not open as an empty shell, every generated Type `16` document library must be reachable from the imported app, the libraries must open, default/custom fields must be visible or inspectable, and upload/folder behavior may only be tested with disposable non-private files. `Document Library Sample.yap` proves document-library-only apps may omit root navigation and Type `103` pages, so judge reachability from the runtime UI rather than assuming a navigation item must exist. The user-runtime-tested `document-library-sample-new-library-only.v1.yap` imported and ran successfully; use its `New Document Library` shape as the minimal import/open baseline. The `Enterprise Document Center` v2 runtime pass accepted multiple generated libraries with custom fields and configured views. The v2 folder pass proved generated root-level folder rows appear and persist, plus manual `New Folder` creation works across all three generated libraries; do not claim nested generated folders or upload persistence proof from that result alone.

For data-view runtime tests, start from `docs/studies/data-view-resource-settings.md` and validate the package with `scripts/inspect-data-views.mjs` before import. Runtime proof should explicitly test import/open, default view selection, custom view URL routing, visible columns, fixed data filters, end-user filter controls, sort order, view permissions with safe placeholder/audience scope, and each configured view type. Calendar rendering, kanban drag/drop updates, gallery card cover behavior, Form Report detail-page access, and document-library advanced view types must not be claimed until those exact paths are observed in a focused baseline.

For Data List permissions and notifications runtime tests, start from `docs/studies/data-list-document-library-permissions-notifications.md` and validate with `scripts/inspect-data-list-permissions.mjs` plus `scripts/inspect-data-list-notifications.mjs`. Permission runtime proof must use safe placeholder users/groups/departments and explicitly test manage-permission UI state, edit/view all-users versus specified-users behavior, and advanced edit/delete/new/import/export rows only after the detailed audience schema is export-located or safely API-located. Notification delivery must not be tested unless explicitly scoped with safe recipients; export-proven `RemindRules` are configuration proof, not delivery proof.

For dashboard Doc library control runtime tests, use `docs/studies/doc-library-control-runtime-test-plan.md` when present. Confirm import/open, dashboard `Document Center` render, root-bound control render, folder-bound control render, caption/search/add visibility, folder persistence after refresh, and whether the control's add flow opens the target library `New file` form. For form-host tests, use `docs/studies/doc-library-control-form-hosts-runtime.md` when present. The current form-host proof is document-library custom form open/render with disabled search/add; approval-form controls rendered in Builder preview, but live request proof is blocked by workflow assignment-task assignee and task form setting generation rather than the Doc library control schema; data-list custom forms are validation-only until reachable runtime forms are tested. Do not claim dynamic folder expressions or upload persistence unless a focused generated package proves them.

For Form Report runtime tests, use `docs/studies/form-report-resource.md` as the export-backed schema reference. A focused baseline should prove import/open, source approval form publish/open, disposable submitted requests, no-filter report rows, filtered report rows, one-sub-list row granularity, coexistence of main variables plus sub-list fields, view/detail-page access enabled versus disabled, export permission behavior, and export-back comparison. Do not claim row multiplication, row-click blocking/opening, Excel export, custom permission audience behavior, or use as a lookup/dashboard/data-table/analytics data source until those exact paths are observed with disposable data.

If the repo contains `docs/yeeflow-runtime-test-checklist-template.md` or `docs/yeeflow-application-generation-review-checklist.md`, use them as project-local reporting templates.

## Classification

Use [runtime-result-classification.md](references/runtime-result-classification.md) whenever reporting runtime status. Required labels:

- runtime-proven
- partially proven
- render-only proven
- blocked by configuration
- blocked by package/materialization
- blocked by Yeeflow runtime context
- not tested

Be explicit about which lists, forms, dashboards, workflow branches, and custom code controls each label applies to.

## Reporting

Return a short status summary plus a table of tested areas, result labels, evidence, and next action. Separate "accepted baseline" from "needs follow-up"; do not imply unsupported behavior is proven.

<!-- agent-copilot-application-resource-learning:start -->
## AI Resource Runtime Safety

Runtime-test AI Agents and Copilots only after local package, graph, AI resource, connection, tool-reference, ReplaceIds, and secret scans pass. Safe first checks are import, app open, Agent/Copilot visibility, configuration page open, and non-executing component visibility.

Do not trigger Outlook, SharePoint, OAuth, HTTP, OpenAPI, document generation, image generation, or destructive list mutation tools unless explicitly configured with safe test credentials and approved call scope. Classify untested AI/connection packages as validation-only or partial.

For data-list workflow AI image-extraction cases, use `docs/studies/data-list-workflow-ai-agent-runtime-test-plan.md` when present. The current `Spark & AI (1).yap` study is export-proven only: the host list already contains rows, the Agent can update list data through an application-resource access tool, and live execution would call real AI on uploaded images. Safe runtime scope is import/open plus workflow-node and Agent-tool configuration visibility in a sandbox package; do not run the workflow, upload real images, or update real records unless the package is a freshly generated harmless baseline and the execution scope is explicitly approved.
<!-- agent-copilot-application-resource-learning:end -->

<!-- scheduled-workflow-ai-assistant-learning:start -->
## Scheduled Workflow Runtime Safety

Runtime-test Scheduled Workflow packages only after local package, graph, workflow-action, AI Agent reference, email-recipient, ReplaceIds, and secret scans pass. Safe first checks are import, app open, Scheduled Workflow visibility, designer open, recurrence UI render, timezone/working-day setting render, Query data action open, AI Assistant action open, and Send email configuration display.

The `Scheduled Workflow Safe Runtime Baseline` pass proved import/open/designer rendering for a generated package with local `Runtime Ideas`, local `Email generation`, far-future non-deployed weekly recurrence, `QueryData`, `AI`, and `MailTask` configured to a reserved safe test recipient placeholder. Classify the Codex-observed proof as partial: import/open/configuration runtime-proven by Codex. User-confirmed function test passed; exact execution scope not yet documented.

Do not trigger schedules, run workflows, send email, publish workflows, or execute AI Assistant actions unless the recipient, schedule, AI call scope, and data are explicitly safe. Do not separately claim schedule trigger execution, manual run behavior, email delivery, AI Assistant execution, or workflow-triggered AI Agent execution unless the exact tested path is documented. Classify unexecuted scheduled-workflow packages as partial only when import/open/designer rendering was actually tested; otherwise classify as validation-only.
<!-- scheduled-workflow-ai-assistant-learning:end -->

<!-- workflow-assignment-task-assignee-learning:start -->
## Assignment Task Assignee Runtime Planning

For newly generated or newly learned `MultiAssignmentTask.properties.usertaskassignment[]` patterns, use a focused runtime baseline before broad generation claims. Prove only the intended assignee routing classes with safe disposable requests and explicitly authorized target-tenant org data. Safe first coverage should include applicant line manager, applicant department manager, direct job position, position by applicant department, position by applicant location, multiple static users, mixed direct user plus position, user group expression when a safe group is available, Sequential appointed order, Parallel/default appointed order, custom percentage completion, Complete task `tasktype="complete"` designer/open proof, due-date/reminder configuration designer/open proof, Start allow terminate/recall designer/open proof, and email notification configuration designer/open proof. Do not expose real user names/emails/IDs in reusable evidence, do not send notifications unless explicitly safe, and classify export-only assignee shapes as export-proven/validator-backed rather than runtime-proven. API-assisted org/reference lookup can confirm that static references correspond to real users, departments, locations, positions, groups, group members, and position assignments, but it is not runtime routing, group expansion, appointed-order, due-date scheduling, recall/terminate, or notification-delivery proof.

The first generated Assignment Task assignee baseline imported/opened and showed designer panels for sequential, parallel/default, and email-notification task configuration, but publish was blocked by a missing-input-line error and no request was submitted. Treat it as designer proof only. A follow-up runtime pass must use a unique package identity, prove publish, and safely submit before claiming routing, appointed-order, group/position expansion, custom-percentage, or notification behavior.

The V2 generated baseline fixed process-model ID remapping and used a non-overlapping left-to-right `rt_*` workflow graph. It imported, opened, published, and opened the published form successfully. Still do not claim assignment routing, group/position expansion, appointed-order execution, custom-percentage completion, or email delivery until a safe request is submitted and observed.

`Test ABC (2).yap` and `Test ABC (3).yap` add export-proven Complete task, due-date, reminder, and Start settings. The next combined baseline should test designer/open visibility for these settings first, keep generated nodes non-overlapping, and keep email delivery, due-date reminder delivery, terminate/recall execution, and complete-task runtime execution out of scope unless explicitly safe.

`Purchase Requests.ydl` adds data-list workflow coverage for the next combined baseline. Test data-list Start email configuration separately from approval-form Start terminate/recall settings because the studied data-list Start lacks terminate/recall fields. Add designer/open proof for a data-list Assignment Task with a Created By/list-item assignee expression and for task forms that mix normal controls with list-bound controls. Submit disposable list records only after safe assignee references and safe notification scope are selected; do not send email or claim Created By/list-field routing until observed.

The combined `Workflow Actions Runtime Baseline` package imported, opened, rendered, and published both the approval workflow and the data-list workflow in Chrome. Treat approval Start terminate/recall/condition/email settings, representative Assignment Task assignee/task-type/appointed-order panels, data-list Start email-without-terminate/recall settings, and data-list Assignment Task Created By/list-field expression configuration as designer/publish-proven. A later narrow submit pass used read-only API-assisted safety checks, submitted one fake approval request, and observed the first `Static User Assignment` pending task for `Workflow Action Approval Test`; treat only that first approval direct static-user route as runtime-proven. Do not claim data-list item routing, group/position/list-field expansion, later-task routing, Complete task execution, due-date reminder execution, task-form save/edit behavior, or email delivery until scoped safe submit tests observe them.

Scheduled Workflow Start/Assignment Task comparison proof from `Workflow Actions Runtime Baseline (1).yap` is export-proven only: Start email config and absence of terminate/recall fields, plus one `MultiAssignmentTask` Applicant Line Manager expression. Runtime tests for scheduled assignment must not execute schedules, create tasks, or send email unless a separate safe window, recipients, and rollback plan are explicitly scoped.

Approval workflow task-form proof from `Workflow Actions Runtime Baseline (2)_Task forms.yap` plus corrected `Workflow Action Approval Test.ywf` is now import/open/designer/publish-proven through the focused `Workflow Task Form Runtime Baseline` package. The pass proved the imported app/form opened, the form designer listed the submission form plus four task forms, `WARTB Task3` rendered custom approve/reject/reassign/add-assignee buttons, the workflow designer opened, and publish succeeded. Execute approve/reject/reassign/add-assignee/complete only with disposable requests and safe test users. Do not claim Add assignee, reassign, complete, task-owner field persistence, Claim Task behavior, or email delivery runtime behavior until an operation-level baseline observes it.

For Claim Task, start with import/open/designer/publish proof only. A focused Claim Task baseline should verify `CandidateTask` panels for approval and complete types, receiver/candidate editor entries, task-form selection, due-date settings, and email configuration without claiming any task. Claim execution, one-user claim locking, movement into the claimant Pending Tasks list, approve/reject/complete after claim, quick completion, and email delivery require a later explicitly safe runtime pass with disposable records and safe receivers.

For Set variable, start with import/open/designer/publish proof only. A focused Set variable baseline should verify `SetVariableTask` panels for current workflow variables, multiple variable rows, another approval workflow target metadata, form id settings, and data-list workflow list-field right-side expressions. Do not execute variable mutation, update another approval workflow instance, create list items, or mutate data-list fields unless disposable submitted requests/list records and safe target form IDs are explicitly scoped. Use Set data list / `ContentList` for list-field mutation tests, not Set variable.

For Set data list, start with import/open/designer/publish proof only. A focused Set data list baseline should verify `ContentList` panels for selected data source targets, current-list mode in data-list workflow, `add`/`edit`/`remove` operation settings, `listdatas[]` mappings, numeric operation modes, `wheres[]` filters, and sub-list/detail-row mappings. Do not execute add/update/delete until the target lists/items are disposable and filters are explicitly safe. Test add first, edit only against a single known disposable row, and keep remove/delete deferred unless destructive testing is explicitly approved. Do not test document-library mutation until a document-library target export proves the shape.

For Signal event, start with import/open/designer/publish proof only. A focused Signal event baseline should verify the approval workflow designer can render a `SignalEvent` with no incoming flow, event definitions for cancel/terminate and revoke/recall, and downstream compensation actions such as Set data list without executing recall, terminate, or cleanup mutation. Recall/terminate execution should be deferred until disposable requests, safe target records, and rollback expectations are explicitly scoped.

The combined `Workflow Actions Batch Runtime Baseline` imported, opened, rendered, and published generated approval and data-list workflows containing Claim Task / `CandidateTask`, Set variable / `SetVariableTask`, Set data list / `ContentList`, and Signal event / `SignalEvent`. Treat this as import/open/designer/publish proof only. The baseline does not prove Claim Task claiming, pending-task routing, approve/reject/complete execution, Set variable mutation, Set data list add/edit/remove execution, sub-list row iteration, Signal event recall/terminate firing, downstream cleanup mutation, Products workflow triggering, or email delivery.

AP Approval demo publish-fix boundary: user-confirmed external publish success proves only the task-page shape fix for that AP demo workflow. Before future runtime tests, run strict generated-app import/publish readiness and confirm Assignment Task / Claim Task nodes have `properties.pagetype = 1`, mirrored `taskurl`/`taskUrl`/`TaskUrl`, and referenced task pages with outer `pagetype = 1`. Do not claim routing, task operation execution, email delivery, or data mutation from this publish fix.
<!-- workflow-assignment-task-assignee-learning:end -->

<!-- app-creation-rules-learning:start -->
## App Creation Rule Runtime Boundary

Before runtime import tests, run the app creation rule validators from `docs/studies/yeeflow-app-creation-rules.md`. A generated package with FieldIndex/FieldName suffix mismatch, FieldName/FieldType storage mismatch, duplicate list identifiers, invalid process keys, or malformed approval-form `NoRule` must not be imported. Product-rule-backed and validator-backed fixes are not runtime proof; only upgrade to import/open/designer/runtime labels after a focused regenerated package imports and opens in Yeeflow.

The focused proof in `docs/studies/yeeflow-app-creation-rules-runtime-proof.md` imported the repaired workflow field-rule package, opened the app/approval form/data list, opened the New Field panel, and saved a new single-line field without the duplicate-value error. Label this runtime-import-proven and data-list-field-creation-proven only; keep workflow routing, workflow execution, record mutation, and Form Report separate.
<!-- app-creation-rules-learning:end -->

<!-- data-list-document-library-fields-learning:start -->
## Data List And Document Library Field Type Learning

Use `docs/studies/data-list-document-library-field-types.md`, `docs/studies/normalized/data-list-fields/`, and `scripts/inspect-data-list-fields.mjs` before generating or validating broad Data List custom fields. `Data Lists (2).yap` export-proves the target Type `1` data lists `Data list with fields part A` and `Data list with fields part B` with 90 custom fields across `input`, `textarea`, `richtext`, `hyperlink`, `input_number`, `currency`, `percent`, `calculated-column`, `rate`, `switch`, `checkbox`, `radio`, `tag`, `datepicker`, `time`, `identity-picker`, `organization-picker`, `cost-center-picker`, `signer`, `file-upload`, `icon-upload`, `lookup`, `metadata`, `mutiple-metadata`, `location-picker`, `autonumber`, and `list`. `select` and `flowstatus` remain product-rule-backed/unproven in this export.

Field generation must still pass the v0.5.12 app-creation gates: unique `DisplayName`, `FieldName`, and `InternalName`; `InternalName` matching `[A-Za-z0-9_]`; identifier length <= 255; and generated non-system `FieldName` suffix matching `FieldIndex`. Accept export-proven single metadata fields as `Type = "metadata"` with Bigint storage, even though the earlier product-team 28-type list only named `mutiple-metadata`.

Use export-proven settings where relevant: choice `Rules.choices` and `color_choices`; numeric/currency/percent `displayThousandths`, `rounded-to`, `number_min`, `number_max`, `currencyCode`, `displayFormat`; picker `identity-maxselection`, `multiple`, `metadata-treeselect`, `parentId`; upload `maxsize`, `file_multiple`, `file_typeslimit`, `file_types`, `picture_size_limit`, `controlmultiple`; lookup `appid`, `listsetid`, `listid`, `listfield`, additions, filters, sorting, search, display style, and multiple; calculated columns `calculated_result` plus `calculated`; metadata `source` plus `categoryId`; tag `source`, `category`, `customTags`; autonumber `minDigits`, `startNum`, `prefix`, `suffix`; sub-list `list-variables[]`.

Document Library custom-field applicability is product/user-understanding-backed only in this pass because no Type `16` document library was present. Keep Type `16` default fields and document upload rules from existing document-library studies, and do not claim runtime data-entry behavior for these field settings until focused import/open/field-creation tests pass.

Focused runtime proof in `docs/studies/data-list-field-creation-runtime-proof.md` imported `data-list-field-creation-runtime-proof.v1.yap`, opened `Data List Field Creation Runtime Proof`, opened `Field Creation Runtime Test`, observed representative generated columns, opened `+ New column`, and saved `Runtime Extra Field` with `Added Successfully`. Label this runtime-import-proven, data-list-open-proven, and representative data-list-field-creation-proven only; keep lookup resolution, calculated correctness, uploads, picker selection, sub-list data entry, metadata, Document Library, workflow, and Form Report out of scope.
<!-- data-list-document-library-fields-learning:end -->

<!-- data-list-custom-form-fields-learning:start -->
## Data List Custom List Form Runtime Boundary

`docs/studies/data-list-custom-form-fields.md` is export-proof only. Before claiming runtime behavior for generated Data List custom forms, run a focused import/open baseline that proves the app opens, the target list opens, New/Edit/View display settings route to the expected custom forms and opening modes/sizes, representative field controls render, sub-list controls render if included, action buttons are visible, and any tested form action executes safely.

Do not treat export-proven `setvar` action shape, `formAction.onLoad`, action button bindings, temp variables, or sub-list nested controls as runtime action proof. Keep Document Library custom-form behavior product/user-understanding-backed unless a Type `16` package is imported/opened and the custom form is reached at runtime.
<!-- data-list-custom-form-fields-learning:end -->

<!-- data-list-public-form-learning:start -->
## Data List Public Form Runtime Boundary

`docs/studies/data-list-public-forms.md` is export-proof only. Before claiming runtime behavior for Data List Public Forms, run a focused import/open/share baseline that proves package import, app open, public form designer/open behavior, allowed field/control rendering, submit button visibility, public URL generation/opening if safe, and anonymous submission only if the target list and test data are disposable.

Focused runtime proof in `docs/studies/data-list-public-form-runtime-proof.md` confirms a generated Type `1` Data List Public Form package imported, opened the app/list, showed the Public Form inside the data list, opened the designer, rendered representative allowed list-bound controls, and passed after the grid/display-caption and centered inline submit-button fix. This upgrades only the generated import/open/designer/control-render path for the observed package and layout pattern.

Do not treat export-proven public form structure or this focused proof as proof of anonymous submit, public URL access outside the authenticated designer unless separately confirmed, save/data creation, upload behavior, sub-list data entry, signature capture, or validation-message behavior. Document Library public-form behavior is unproven unless a Type `16` public-form package is imported/opened and tested.
<!-- data-list-public-form-learning:end -->

<!-- yap-schema-standard-learning:start -->
## YAP Schema Standard Runtime Gate

Before any runtime import attempt, run `scripts/inspect-yap-schema-standard.mjs` and package validation. Do not import a generated package when the wrapper is malformed, `Resource` lacks the `[______gizp______]` prefix, decoded `Resource.Data` is malformed, `ListExportInfo.Item` is missing, or any root/child `Defs` or `Layouts` value is missing, null, or not an array. Empty arrays are valid.

Schema-standard validation is not runtime proof. A focused runtime proof is still needed for any generator change that repairs a previous import failure such as `Item.Defs: null`. Preserve warning-only status for the unresolved `formReports`/`dataReports` Access app resource permission bit conflict until product team clarifies it.
<!-- yap-schema-standard-learning:end -->
<!-- projects-center-import-failure-hardening:start -->
## Pre-Import Readiness Gate

Before any runtime import attempt for a newly generated `.yap`, require strict generator/import-readiness validation. Do not import packages that only passed compatibility validation. Run strict package validation, strict graph validation, materialization inspection, schema-standard inspection, app-creation rules inspection, data-view/dashboard/page reference checks, wrapper round trip, placeholder scan, and safety scan; use `scripts/inspect-yap-import-readiness.mjs` when present.

The Projects Center fixed package import is user-proven only for import success. It does not prove app open/use, data entry, document-library behavior, scheduled report execution, or workflow behavior. Keep those runtime scopes separate.
<!-- projects-center-import-failure-hardening:end -->

<!-- container-button-action-settings-learning:start -->
## Container/Button Action Runtime Boundary

Container/Button Action settings from `AP Approval Demo v3.yap` are export-proven and validator-backed. `docs/studies/container-button-action-runtime-proof.md` adds user-confirmed focused generated-package proof for representative Link, Add list item, Open dashboard, and Open approval form navigation/open behavior with modal/pop-up, slide-in, and full-page/target modes.

Keep the proof narrow: save/submit, workflow execution, approval routing, cross-app targets, form-action binding, permissions/security, external sensitive navigation, and every open-mode/size combination remain unproven. If an Open approval form action exposes `process request pageUrl is null`, inspect the target approval form request page shape before retesting.
<!-- container-button-action-settings-learning:end -->

<!-- sub-list-dynamic-content-learning:start -->
## Sub List Runtime Proof Boundary

Sub List Dynamic content schema from `docs/studies/sub-list-dynamic-content.md` is export-proven, not runtime-proven. A focused runtime proof should import a disposable package, open the Approval Form, render a Dynamic Sub List with its sibling header grid, click Add another item, Duplicate item, Delete item, Import items, Insert before, and Insert after where safe, and verify whether current-object expressions and summaries update after row edits.

Keep each claim narrow: rendering a Dynamic Sub List does not prove row mutation; clicking Add does not prove Duplicate/Delete/Import; Approval Form proof does not prove Data List custom form behavior. Avoid destructive or private data during list-action tests.

Current runtime-test candidate: `/Users/Renger/Downloads/sub-list-dynamic-actions-runtime-proof.v1.yap`, generated by `generate-sub-list-dynamic-actions-runtime-proof.mjs`, contains one app-level Approval Form, one Dynamic Sub List, a sibling header grid, and actions `list_new`, `list_dup`, `list_del`, and `list_import`. Manual test checklist: import the package, open `Sub List Dynamic Runtime Proof`, open `Dynamic Sub List Runtime Form`, confirm the Dynamic Sub List renders without binding errors, click Add another item, Duplicate item, Delete item, and Import items, and record the exact result for each action. Do not claim Insert before/after, Move item, Update fields, current-object expressions, scrollbar behavior, workflow completion, or Data List custom form behavior from this candidate.

V1 manual feedback: the Dynamic Sub List rendered, but the header Grid collapsed to one column and Grid Appearance could not expand. V1.2 was generated, signed, and verified from the corrected V1.1 YAPK baseline after removing the stale standalone V1 header grid and wrapping body-grid field controls in column containers. Manual V1.2 testing should verify header/body alignment, hidden Sub List caption, Designer Appearance expandability for layout grids, Add another item, Duplicate, Delete, and Import. Keep action execution pending until the user confirms each click result.

V1.3 user runtime result: the Purchase Request form opens, the Dynamic Sub List renders, the caption is hidden, header/body columns align, and the row menu opens; its menu only had Duplicate/Delete. V1.4 is generated/signed/verified from V1.3 and should be manually tested for row menu actions Duplicate, Insert before, Insert after, Move up, and Move down, with Delete remaining as the visible last-column action. Do not claim Insert/Move runtime behavior until the user confirms each action.

V1.5 user runtime result: `/Users/Renger/Downloads/Sub List Dynamic Runtime Proof-V1.5-row-menu-actions-resource-fixed.yapk` works well for the focused Approval Form Dynamic Sub List row menu actions Duplicate, Insert before, Insert after, Move up, and Move down. Keep the proof narrow to that generated YAPK package, Approval Form host, and tested row actions; it does not prove Data List custom forms, print pages, workflow execution, or broader current-object expression behavior.

For Data List print-page follow-up tests, use `docs/studies/data-list-print-page-dynamic-sub-list.md`: import or inspect a package with a Data List custom View form action using `type = "print"`, open the View form, click the print action, and verify the Print Page renders read-only Dynamic Sub List line items. Do not claim runtime print preview/execution from export inspection alone.
<!-- sub-list-dynamic-content-learning:end -->

<!-- kanban-collection-dynamic-controls-learning:start -->
## Kanban/Collection Dynamic Controls Runtime Boundary

`Company Overview.yap` export-proves Kanban, Collection, and Dynamic control schema. The focused generated package `/Users/Renger/Downloads/kanban-collection-timeline-runtime-proof.v1.yap` is user-confirmed to import successfully, open `Dynamic Controls Runtime Dashboard`, render Kanban and Collection, render Dynamic field values, keep Dynamic user/image/file controls stable with empty values, and show no missing binding/render error. Separately test any item click, image preview, file preview/download, non-empty user/image/file display, or Kanban drag/drop behavior before claiming those behaviors.

## Timeline Dynamic Controls Runtime Boundary

`Company Overview (1).yap` export-proves Vertical Timeline and Horizontal Timeline dashboard schema, Dynamic controls in timeline item templates, and the current item binding pattern (`attrs.source = "3"` plus `attrs["obj-f"]`). The focused generated package `/Users/Renger/Downloads/kanban-collection-timeline-runtime-proof.v1.yap` is user-confirmed to render Vertical Timeline and Horizontal Timeline items, render Dynamic field values, and keep Dynamic user/image/file controls stable with empty values. Separately test timeline item click/open behavior, horizontal arrows/slides, scrolling, image preview, file preview/download, and non-empty user/image/file display if those claims are needed.

Keep proof claims narrow: a rendered Vertical Timeline does not prove Horizontal Timeline arrows; Dynamic field rendering does not prove file preview/download; dashboard timeline proof does not prove approval-form or data-list-form timeline hosts.

Data List custom-form Dynamic field usage with source `4` is export-proven on `View page`, but runtime custom-form behavior remains unproven until the form is opened and verified in Yeeflow.

Runtime-proven generated package: `/Users/Renger/Downloads/kanban-collection-timeline-runtime-proof.v1.yap`, produced by `generate-kanban-collection-timeline-runtime-proof.mjs`. User-confirmed result: app imported successfully, `Dynamic Controls Runtime Dashboard` opened, Kanban rendered, Collection rendered, Vertical Timeline rendered, Horizontal Timeline rendered, Dynamic field values rendered, Dynamic user/image/file controls did not crash with empty values, and no missing binding/render error appeared. Do not claim non-empty user/image/file display, preview/download, drag/drop, click/open, or Data List form runtime behavior unless those exact interactions are tested.
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
