---
name: yeeflow-dashboard-generator
description: generate, inspect, validate, package, debug, and improve Yeeflow dashboard .yap app pages after studying real exports; use for dashboard-only apps, Type 103 dashboard pages, dashboard widgets, dashboard navigation, ReplaceIds rules, and staged dashboard import testing.
---

# Yeeflow Dashboard Generator

## Application Navigation References

When a dashboard/application page is included in app navigation, reference the root app page layout from `Data.Item.ListModel.LayoutView.sort[]` using `Type = 103` and `ListID = Data.Item.Layouts[].LayoutID`. Use optional `DisplayName` for a custom menu label and omit it for title fallback. Use a string `Icon`, or `Icon: ""` for no-icon.

Dashboard menu items can be top-level resources or children inside a top-level `Type = "classes"` navigation group. Do not create nested groups. Validate the menu reference resolves to an included Type 103 layout before wrapper build.

Use this skill when the user asks to generate, debug, validate, or learn Yeeflow dashboard packages, including minimal dashboard-only apps, dashboard widgets, dashboard page JSON, Type `103` navigation, dashboard `exts`, and dashboard import failures.

When dashboard changes target an existing imported application, route package-type decisions through `yeeflow-application-builder` / `yeeflow-application-generator`. Generate `.yap` for new/cloned apps. For `.yapk` upgrades, start from a Yeeflow Version management baseline and preserve app identity/stable IDs; do not attempt to patch dashboard internals in `.yapk` while its `Resource` payload remains opaque.

For unproven dashboard areas, use this with `yeeflow-feature-learning-orchestrator`: study real exports first, then generate the smallest importable test.

## What To Load

- For the proven minimal dashboard shell, read `references/minimal-dashboard-pattern.md`.
- For proven static page-builder elements, read `references/simple-elements-pattern.md`.
- For proven local data-bound summary/table elements, read `references/data-bound-elements-pattern.md`.
- For proven local data-bound chart widgets, read `references/chart-widgets-pattern.md`.
- For proven dashboard filter controls and filter-bound chart conditions, read `references/filter-controls-pattern.md`.
- For the first proven Service Desk Pro-style static Executive Dashboard rebuild, read `references/service-desk-pro-stage-c-pattern.md`.
- For the first proven Service Desk Pro-style local Support Tickets source list, read `references/service-desk-pro-stage-d-pattern.md`.
- For the proven Service Desk Pro KPI summary stages and pending first chart package, read `references/service-desk-pro-stage-e-f-pattern.md`.
- For proven Service Desk Pro Support Teams filters, opendashboard actions, Drill-down data-list tables, static Drill-down filters, submitted-period binding, and Settings/Help Guide polish, read `references/service-desk-pro-stage-i-l-pattern.md`.
- For the first studied dashboard Collection control pattern, read `references/collection-control-pattern.md`.
- For Knowledge Base-style dashboard apps with article/category Collections and local data lists, read `references/knowledge-base-pattern.md`.
- For validator and wrapper expectations, read `references/validator-rules.md`.
- Before operating Yeeflow UI, read `references/runtime-testing.md`.
- For app shell/list/form hard rules, also use `yeeflow-application-generator`, `yeeflow-data-list-generator`, and `yeeflow-approval-form-generator` as needed.
- For dashboard expressions, data filters, dynamic display/style rules, filter-bound chart conditions, Collection item text expressions, and formula-like widget settings, also use `yeeflow-expression-generator`, `yeeflow-expression-functions.normalized.json`, `yeeflow-expression-function-knowledge-base.normalized.json`, `yeeflow-expression-operators.normalized.json`, `yeeflow-expression-utils.js`, `docs/yeeflow-expression-generation-rules.md`, and `docs/yeeflow-expression-editor-ui-contexts.md`.

When a dashboard/reporting control depends on a data-list, document-library, or Form Report view, inspect `docs/studies/data-view-resource-settings.md` first. Data views are `Layouts[]` entries with URL/default/filter/sort/user-filter settings; do not treat a dashboard data source as runtime-proven just because a view exists in the package. Confirm the target list-like resource and selected view fields/filters resolve before generation, and keep view-driven dashboard behavior runtime-sensitive until focused proof observes it.

When a dashboard uses Data Filter controls, inspect `docs/studies/data-filter-controls.md`, `docs/studies/normalized/data-filter-controls/`, and `references/filter-controls-pattern.md` first. `Sales_Management_AD.yap` export-proves dashboard Checkbox, Select, Range, Check range, Date, Relative period, Apply button, and Remove filters shapes. `CRM - Customer relationship management.yap` export-proves Search, Radio, Hierarchy, and Sorting shapes. Filter variables live in embedded page `filterVars[]`, value-producing controls bind with `__filter_`, and downstream table/report/chart consumers use expression-token references in data filter conditions, fulltext filters, or sorting-filter entries. Use Apply button only for click-apply filters and treat Remove filters as a special reset control. Dashboard schema is export-proven; approval/data-list form hosts and interactive runtime behavior still need separate proof.

When a dashboard uses Pivot Table controls, inspect `docs/studies/pivot-table-control.md`, `docs/studies/normalized/pivot-table-control/`, `docs/studies/pivot-table-control-runtime-proof.md`, and `scripts/inspect-pivot-table-controls.mjs` first. `CRM - Customer relationship management (1).yap` export-proves the dashboard host schema: the page contains visible `type = "pivot-table"` controls and matching `page.exts[]` entries with `category = "___Pivot___"`, `key = "PivotTable"`, and `i` equal to the control id. The focused v2 generated package proves a representative Dashboard Pivot Table app can be manually imported and used with 20 safe synthetic data-list rows, and the user confirmed new items can be added in that package's data list. The v1/v2 diff strongly indicates the seed/add fix was field storage alignment: clone data-list field definitions by `FieldName`, not array position, so `FieldID`, `FieldName`, `FieldType`, `Type`, and row-cell references stay aligned. Use Pivot Tables for multidimensional summaries with rows, columns, and values. Resolve every source and field before handoff, use count aggregations for counts and numeric aggregations only on numeric/currency fields, restrict date groupings to date/time fields, and style `header`, `body`, `subtotal`, and `grandtotal` sections for readable dashboard tables. Data Filter variable references in Pivot Table conditions must resolve to page `filterVars[]`; the CRM Pivot Tables did not themselves consume filter variables, so interactive filtering remains unproven until runtime-tested.

## Core Rule

Do not start complex dashboard generation from a complex dashboard export.

Start from the smallest proven dashboard app, then add one capability at a time:

1. empty Type `103` dashboard shell
2. embedded page JSON with no widgets
3. one static visual/control
4. one local data list
5. one simple dashboard widget
6. one dashboard `exts` data source
7. one chart widget type or one chart style change
8. one dashboard filter
9. multiple widgets/filters/actions
10. Service Desk Pro-style dashboard reconstruction

Each import-test package must use a fresh local ID family.

## Generated Dashboard UI/UX Standard

When the active workspace contains `docs/yeeflow-application-design-system.md` and `docs/yeeflow-dashboard-design-standards.md`, use them as the default dashboard design standard. Use `docs/yeeflow-dashboard-ui-ux-patterns.md` for export-level evidence. The first official UI/UX reference export is `UI and UX design (1).yap`.

Default generated dashboards should:

- set embedded page `attrs.hideHeaderAll = true`
- set embedded page `attrs.container.padding` to `--sp--s0` on all sides
- set full-page background on embedded page `attrs.background` when needed
- use a top-level container with `nv_label: "Main"`
- place the main visible content inside a child container with `nv_label: "Content"`
- keep Type `103` `LayoutView = null`, `Ext2 = "{\"src\":true}"`, and embedded page JSON in `LayoutInResources[0].Resource`
- for generated root dashboard pages with embedded page JSON, set `LayoutInResources[0].ID` and `RefId` to the dashboard `LayoutID`; Design System Request Tracker v1 proved this renders the runtime dashboard, while a separate generated resource ID rendered an empty designer placeholder

For real application-builder packages, do not stop at an empty dashboard unless the app scope explicitly says dashboard is deferred. A runtime-safe v1 dashboard should include meaningful, locally proven sections such as request queues, status counts, simple source-list Collections, or KPI cards backed by included data lists. Keep advanced widgets, filters, reservations, and charts within proven dashboard patterns and mark anything unproven as focused runtime proof.

Functional dashboard rule: when a plan/spec says KPI, summary, count, total, queue, report, analytics, trend, or chart, generate a functional dashboard control rather than a static Text mockup. Use `summary` controls for counts/totals, `data-list` or proven `collection` controls for operational queues and report tables, and `pie-chart`/`bar-chart`/`line-chart` controls when the chart model and binding shape are known. If a planned chart has a known model, generate the real chart and seed or confirm representative source rows for runtime validation. Treat an empty chart as a no-data / insufficient-source-data condition, not as a broken chart. Use a data-bound list/table fallback only when the chart control fails structurally after valid source data exists, and keep fallback tables as complementary drill-down/reporting views when charts work. Static Text controls are allowed for headings, descriptions, labels, instructions, and explanatory notes only; a hardcoded Text value such as `0`, `0.00`, `N/A`, or placeholder copy must not be used as a KPI/report/queue substitute unless explicitly labeled demo/placeholder content.

Form Report data-source note: product understanding says Form Reports can feed Lookup fields, Data table controls, Collections, and analytics controls such as Summary, Pie chart, Column chart, Line chart, and Pivot table. `AI Training-2 (1).yap` did not include dashboard/control references to Form Reports, so dashboard generators must not claim or invent the binding schema. Use Form Reports as dashboard data sources only after a real export or focused runtime baseline proves the control reference shape.

The studied dashboard does not prove a dashboard `attrs.container.cw` setting. Do not invent one until another real export proves it.

Global page background rule: do not set full-page background color on the dashboard `Main` container. `Main` stays structural; page background belongs on embedded page attrs. Use backgrounds on `Page header`, cards, KPI containers, Collection sections, or other specific visible containers only when those surfaces need their own color.

Shared CAPEX/design-system carry-forward: dashboard pages in generated app packages should follow the same `Main` structural parent, `Content` visible content, token-aligned color, meaningful `nv_label`, and Text Style Sample rules used by the latest CAPEX v4 Text Standard baseline. Dashboard-specific generation still requires dashboard export proof for new controls, but shared page/header/container rules apply globally.

Use `docs/yeeflow-root-style-token-reference.md` for dashboard color, spacing, radius, and typography guidance. Prefer semantic tokens for generated dashboard surfaces and statuses: primary, success, warning, danger, and neutral. Avoid arbitrary custom palettes; do not inject the full root stylesheet.

Generated dashboards should use clear sections (`Page header`, `Summary section`, `Body section`, `Collection section`, `Empty state`), meaningful `nv_label` names, token-aligned neutral surfaces, and Collection controls for repeatable list-style content when source lists are local and proven.

When the workspace includes `docs/yeeflow-text-control-generation-standards.md`, generated dashboard headings, labels, card titles, KPI text, and empty states must follow the Text Style Sample native Text shape: `type: "heading"`, inline width by default, `attrs.heads.ty = [null, token]` or a custom typography object, and plain string `attrs.heads.color`.

Dashboard expressions must use Yeeflow expression-token arrays. Dashboard Collection item expressions may use export-backed context variables such as `exprType: "variable_ctx"` with `ctx: "__ctx_coll"`; validate those against the collection source list before build. Do not invent expression functions or operators for chart filters, text expressions, or data filters. Treat `addWorkDays` and `addWorkHours` as expression-editor UI-observed but metadata-pending until export-backed parameter examples are captured.

Form Actions carry-forward: approval-form exports and generated runtime tests prove the front-end form action model (`formdef.actions[]`, `action_button.attrs.control_action`, `formAction.onLoad`, temp variables, `setvar`, `confirm`, `querydata`, `querydata_filters`, `arraySum`, `JSONStringfy`, and `submit`). Dashboard actions may share concepts, but dashboard generation must not assume the same wrapper until a dashboard export proves the exact dashboard action location and trigger shape. Reuse button style guidance only as visual guidance. Do not generate Submit form or Save changes steps on dashboard pages.

For app-shell navigation around dashboards, keep the menu readable by inverting the root header colors: `navigator-menu.bgc` should equal `appearance.color`, and `navigator-menu.color` should equal `appearance.bgc`.

## Doc Library Controls On Dashboards

Use dashboard Doc library controls when a dashboard should expose Yeeflow Document Library resources directly. `Enterprise Document Center Folders Runtime.yap` proves the dashboard control shape:

- place the control in `Item.Layouts[].LayoutInResources[0].Resource`
- use `type: "document-library"` and `nv_label: "Doc library"`
- set `attrs.data.list` with `AppID`, target Type `16` `ListID`, `Type: 16`, target `Title`, and app root `ListSetID`
- for a root-folder view, set `attrs.data.folder.path = "0/<folder ListDataID>"` and `attrs.data.folder.label` to the folder title
- populate `attrs.listarr[]` with target-library fields; the first Name column may use the observed `Attrs.table.cw = [null, 40]` and `cwu = [null, "%"]`
- when using a caption, the export-proven settings are `display: true`, `add: true`, `search: true`, `placeholder`, `addtext`, `layout` pointing to the target library `New file` form `LayoutID`, and `op: "modal"`
- disabled search/add settings are runtime-proven for a document-library custom-form hosted Doc library control, but disabled dashboard states are still untested; do not generalize the disabled-state proof across hosts without a focused runtime test
- do not claim dynamic folder paths or non-dashboard approval/data-list form contexts as runtime-proven until focused generated packages test them
- do not generate uploaded document rows or document binaries for dashboard control tests

## Custom Code Controls On Dashboards

Use a dashboard Custom Code control only when native dashboard controls, Collections, filters, summaries, charts, and actions cannot deliver the needed interaction.

Generation rules:

- Place the control in the embedded dashboard page JSON under `Item.Layouts[].LayoutInResources[0].Resource`.
- Use `type: "codein"` and include a valid script in `attrs["codein-script"]`, or use a future export-backed script reference pattern if one is proven.
- Configure input parameters in `attrs["codein-script-param"]`; required parameters from the script's `inputParameters()` must be present.
- For writable dashboard outputs, define dashboard `tempVars[]` and bind output parameters with `{ "type": 1, "value": { "prefix": "__temp_", "value": "<TempVarId>" } }`.
- Keep parameter types aligned with TSX expectations. Smart Lookup Picker-style list id, display field, value field, and booleans are expression parameters (`type: 2`); text labels and numeric config may be static strings.
- Give the surrounding section and control a meaningful `nv_label`/title rather than relying only on the generic `Custom code` label.
- Do not use dashboard custom code as a substitute for data-bound KPI, chart, queue, or report controls.
- Test dashboard render separately from save/writeback, because dashboard temp-variable setters may behave differently from approval-form fields.

## Minimal Proven Baseline

The first proven generated dashboard package is:

- workspace artifact: `generated-dashboard-minimal-v1.yap`
- source export studied: `Test Dashboard Only.yap`
- app shape: one root app/listset, one Type `103` dashboard layout, no child resources
- runtime result: imported into `https://codex.yeeflow.com/`, appeared in Shared Workspace, opened, and rendered the empty dashboard page shell

The second proven generated dashboard package is:

- workspace artifact: `generated-dashboard-simple-elements-v2.yap`
- source export studied: `Test Dashboard Only (2).yap`
- app shape: one root app/listset, one Type `103` dashboard layout, one embedded static page JSON resource, no child resources
- runtime result: imported into `https://codex.yeeflow.com/`, appeared in Shared Workspace, opened, and rendered static dashboard elements

The first proven Yeeflow Application Design System dashboard package is:

- workspace artifact: `design-system-request-tracker.v1.yap`
- app shape: one Type `103` dashboard, one Requests data list with Edit/View custom forms, and one simple approval workflow
- runtime result: imported into `https://codex.yeeflow.com/`, dashboard rendered the `Main` -> `Content` design-system layout, Requests opened without a visible query failure, approval submitted/routed/completed, and the approved workflow path created a Requests record
- dashboard resource note: use `LayoutInResources[0].ID = RefId = LayoutID` for generated embedded dashboard page JSON

The third proven generated dashboard package is:

- workspace artifact: `generated-dashboard-data-bound-v3.yap`
- source export studied: `Generated Dashboard Simple Elements v2.yap`
- app shape: one root app/listset, one Type `103` dashboard layout, one local child data list, two summary controls, one dashboard data table control
- runtime result: imported into `https://codex.yeeflow.com/`, appeared in Shared Workspace, opened, rendered summary values and table rows, and the local `Event Planning` list opened without a visible query failure

The fourth proven generated dashboard package is:

- workspace artifact: `generated-dashboard-chart-widgets-v4.yap`
- source export studied: `Generated Dashboard Data Bound v3.yap`
- app shape: one root app/listset, one Type `103` dashboard layout, one local child data list, two summary controls, one dashboard data table control, and three chart widgets
- chart widgets proven: pie, column, and line
- runtime result: imported into `https://codex.yeeflow.com/`, appeared in Shared Workspace, opened, rendered summary values, table rows, and visible pie, column, and line chart output; the local `Event Planning` list opened without a visible query failure

The fifth proven generated dashboard package is:

- workspace artifact: `generated-dashboard-filter-controls-v5.yap`
- source export studied: `Generated Dashboard Chart Widgets v4.yap`
- app shape: v4 chart package plus one filter container, one search filter, one radio filter, one range filter, and chart conditions bound to page filter variables
- runtime result: imported into `https://codex.yeeflow.com/`, appeared in Shared Workspace, opened, rendered search/radio/range filters, rendered summary values, table rows, and visible pie/column/line chart output, and opened the local `Event Planning` source list without a visible query failure

The first proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-b-or-c.generated.yap`
- source export studied: `Service Desk Pro (1).yap`
- app shape: one root app/listset, one Type `103` Executive Dashboard page, static Service Desk-style header, filter note, KPI placeholders, chart placeholders, and operational placeholders
- intentionally excluded: child data lists, `exts`, `filterVars`, `tempVars`, summaries, charts, reports, Settings actions, drill-down actions, forms, workflows, AI modules, and document libraries
- runtime result: imported into `https://codex.yeeflow.com/`, appeared in Shared Workspace, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage C`, and rendered the static Executive Dashboard content

The second proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-d.generated.yap`
- source export studied: `Service Desk Pro (1).yap`
- app shape: Stage C static Executive Dashboard plus one local `Support Tickets` child data list
- minimal list fields proven: native `Title` as `Ticket Title`, `Text1` Ticket ID, `Text2` Priority, `Text3` Status, `Text4` Assigned Team, `Datetime1` Created Time, `Decimal1` First Response Hours, `Decimal2` Resolution Hours, `Bit1` First Response SLA Compliance, `Bit2` Resolution SLA Compliance
- intentionally excluded: dashboard `exts`, bound summaries, charts, filters, reports, Settings, drill-down actions, forms, workflows, AI modules, and document libraries
- runtime result: imported into `https://codex.yeeflow.com/`, appeared in Shared Workspace, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage D`, and opened `Support Tickets` with six rendered sample rows and no visible `datas/query` failure

The third proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-e.generated.yap`
- app shape: Stage D plus one bound `Total Submitted` summary over the local `Support Tickets` list
- runtime result: imported into `https://codex.yeeflow.com/`, appeared in Shared Workspace, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage E`, and rendered `Total Submitted = 6`

The fourth proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-f1.generated.yap`
- app shape: Stage E plus four bound KPI summaries over the local `Support Tickets` list
- runtime result: imported into `https://codex.yeeflow.com/`, appeared in Shared Workspace, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage F1`, and rendered `Total Submitted = 6`, `Resolved Tickets = 2`, `Open Tickets = 4`, and `Critical Open = 0`

The fifth proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-f2.generated.yap`
- app shape: Stage F1 plus one `Open Tickets by Priority` column chart
- runtime result: imported into `https://codex.yeeflow.com/`, appeared in Shared Workspace, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage F2`, kept the KPI values `6`, `2`, `4`, and `0`, and rendered the `Open Tickets by Priority` column chart with Medium and High buckets

The sixth proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-g.generated.yap`
- app shape: Stage F2 plus one static Type `103` `Settings` page
- runtime result: imported into `https://codex.yeeflow.com/`, appeared in Shared Workspace, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage G`, and rendered the static Settings configuration cards

The seventh proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-h.generated.yap`
- app shape: Stage G plus static Type `103` `Drill-down Tickets List` and `Help Guide` pages
- runtime result: imported into `https://codex.yeeflow.com/`, appeared in Shared Workspace, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage H`, rendered Drill-down Tickets List and Help Guide pages, and opened the local `Support Tickets` source list with six rows

The eighth proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-i.generated.yap`
- app shape: Stage H plus local `Support Teams` data list, Support Teams select filter control, and submitted-period staged control
- runtime result: imported into `https://codex.yeeflow.com/`, appeared in Shared Workspace, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage I`, rendered the Support Teams select filter, and opened the local `Support Teams` list with rows

The ninth proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-j.generated.yap`
- app shape: Stage I plus one `opendashboard` action from the Executive Dashboard operational card to the included `Drill-down Tickets List` Type `103` page
- runtime result: imported into `https://codex.yeeflow.com/`, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage J`, and clicking the `Drill-down Tickets List` card opened the staged Drill-down page in a modal

The tenth proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-k.generated.yap`
- app shape: Stage J with the Drill-down static rows replaced by a dashboard `data-list` control bound to local `Support Tickets`
- runtime result: imported into `https://codex.yeeflow.com/`, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage K`, and rendered the bound Support Tickets table both by direct navigation and inside the Executive Dashboard modal

The eleventh proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-l.generated.yap`
- app shape: Stage K plus one static scalar Drill-down table filter, `Text2 = High`
- runtime result: imported into `https://codex.yeeflow.com/`, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage L`, and rendered only the high-priority tickets `T-1001` and `T-1006`

The twelfth proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-m.generated.yap`
- app shape: Stage L export-back study plus submitted-period conditions on all local KPI summaries and the local priority chart, Settings 3-column layout polish, and an improved static Help Guide layout
- runtime result: imported into `https://codex.yeeflow.com/`, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage M`, rendered the KPI cards, and clicking `Today` changed the KPI values from `6`, `2`, `4`, `0` to `0`, `0`, `0`, `0`; Settings, Help Guide, Drill-down, Support Tickets, and Support Teams also rendered successfully

The thirteenth proven Service Desk Pro resumed package is:

- workspace artifact: `service-desk-pro-dashboard-stage-n.generated.yap`
- app shape: Stage M with fresh IDs and Executive Dashboard helper copy updated to describe the active Submitted period binding
- runtime result: imported into `https://codex.yeeflow.com/`, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage N`, rendered the active helper copy, changed KPI values from `6`, `2`, `4`, `0` to `0`, `0`, `0`, `0` after clicking `Today`, and successfully opened Settings, Help Guide, Drill-down Tickets List, Support Tickets, and Support Teams

The first studied Service Desk Pro Collection export is:

- source export: `Service Desk Pro Dashboard Stage M.yap`
- studied dashboard: `Tickets with Collection`
- app shape: Stage M plus one Type `103` dashboard containing two Collection controls bound to local `Support Tickets`
- learned patterns: card/grid Collection, table-style Collection, dynamic fields with `source: "3"`, collection item expressions with `ctx: "__ctx_coll"`, `dateFormat` expression wrapper, conditional priority badge styles in `attrs.control_display`, and designer `nv_label` naming
- generation status: documented and validator-covered, but not yet a generated runtime baseline; first generated package should use one card/grid Collection only

The first runtime-proven generated Knowledge Base-style package is:

- workspace artifact: `knowledge-base-generated-v4.yap`
- source export studied: `Knowledge Base_1.yap`
- app shape: one root app/listset, one Type `103` Home dashboard page, local `Categories` and `Articles` data lists, plain text article category labels, article/category sample rows, Article Collection with fulltext search, Category Collection, and `dynamic-field` controls inside Collection item templates
- intentionally deferred: article-to-category lookup metadata, `Sections`, richtext body fields, icon-upload/image controls, article detail links, nested category-to-article Collections, Search query-param flow, Admin action cards, forms, workflows, reports, AI modules, connections, and document libraries
- validation result: generator syntax passed, package/graph validation passed, wrapper round-trip passed; only `APP_THEME_EMPTY` warning remains
- runtime result: imported into `https://codex.yeeflow.com/`, opened as `Knowledge Base Generated v4`, rendered Home article/category Collection cards, and opened both `Categories` and `Articles` with sample rows
- key lesson: native generated `Title` fields require `FieldIndex: 0` in addition to `Status: 0`, `IsSystem: true`, and `IsIndex: true`

## Stop Conditions

Stop before final generation if:

- no real dashboard export has been studied
- Type `103` dashboard navigation does not resolve to a root layout
- `LayoutInResources` behavior is being guessed instead of copied from a studied pattern
- local root/dashboard IDs are missing from `ReplaceIds`
- tenant/user metadata is remapped into a generated local ID family
- widget `exts` reference lists or reports not included in the package
- dashboard `exts[].i` does not resolve to a page control id
- dashboard `exts[].i` is missing from `Resource.ReportIds` when report ids are present
- dashboard chart `exts[].settings.rows[]` or `values[]` field references do not resolve to the source list fields
- dashboard Pivot Table source, row, column, value, date-grouping, aggregation, or filter-variable references do not resolve
- dashboard filter control binding does not resolve to page `filterVars`
- dashboard chart condition variable expression does not resolve to page `filterVars`
- `save_var` references do not resolve to `tempVars`
- `opendashboard` actions reference missing Type `103` pages
- query-param to `tempVars` mapping is needed before original Service Desk drill-down filters are generated
- original Service Desk `collection` card layout is copied without a local runtime baseline
- Settings tile actions reference external `ListSetID` or `ProcKey` dependencies not included in the package
- submitted-period conditions are duplicated on the same dashboard binding
- validator or wrapper round-trip checks fail

## Required Validation

Run the relevant local scripts before runtime testing:

```bash
node validate-yap-package.js <resource-or-yap> --mode generator --stage final
node validate-yap-graph.js <resource-or-yap> --mode generator --stage final
node build-yap-wrapper.js <resource.json> <output.yap> --title "<title>" --validation-mode generator
```

`APP_THEME_EMPTY` is acceptable for the minimal dashboard-only baseline because the studied export uses `AppThemes: []`. Treat it as a warning for richer apps, not a blocker for the empty dashboard shell.

## Runtime Proof

A dashboard package is not considered learned until it imports and opens in Yeeflow. When the user explicitly asks for runtime testing, use:

`https://codex.yeeflow.com/`

Confirm:

- import metadata dialog parses name/description/icon
- import completes
- app appears in Shared Workspace
- app opens
- dashboard navigation renders
- dashboard page content renders with expected functional controls; rendering alone is not enough for a KPI/reporting dashboard
- KPI/summary cards are real `summary` controls bound through dashboard `exts`, not static Text values
- operational queues and report sections are real `data-list` or proven `collection` controls bound to source lists
- chart sections render real chart controls when chart models are known; runtime tests must create or confirm representative source records before deciding chart validity. Empty chart output with no matching records is a no-data result, while model-load failure after valid data is a chart defect. Data-bound list/table fallbacks are acceptable only for structural chart failures or as complementary drill-down views
- local source lists open without visible `datas/query` failures when the package includes dashboard data sources

For the current dashboard learning loop, the user has authorized import testing after every newly generated `.yap`; do the runtime import test after local validation for each new package unless they explicitly pause it.

If runtime fails, create a smaller isolation package with fresh IDs instead of guessing.

Dashboard Data Filter runtime proof: `docs/studies/data-filter-controls-runtime-proof.md` proves a focused generated dashboard package imported, opened, rendered a data table/list-like control, summaries, chart/report controls, Search/Radio/Range/Sorting Data Filter controls, and an Apply button. It also proves one Search click-apply interaction and one Radio value-change selection stayed stable with no visible missing-filter-variable, missing-binding, or dashboard-crash errors. Treat Range and Sorting as render-proven only in that pass, and keep Remove filters, Hierarchy, exhaustive operator semantics, approval-form usage, and data-list-form usage unproven at runtime.

## Shared Form Action Concepts

Form actions are front-end page/form logic, distinct from backend workflow graph actions. Phase 1 approval-form runtime proof covers action buttons, button click triggers, page-load triggers, temp variables, `setvar`, and `confirm`; the same concepts may apply to dashboards only after a dashboard-specific export/runtime proof. Do not promote dashboard form actions from approval-form evidence alone.

`Sales Quotation.yap` export-proves a Data List custom View form action step `type = "print"` that opens a Print Page custom form with current `ListDataID` context. Treat Print page as a shared form-action concept only where the host schema supports form actions; Dashboard and Approval Form availability remains product/schema-understanding-backed unless a dashboard or approval-form export/runtime proof contains the same step.
<!-- projects-center-import-failure-hardening:start -->
## Dashboard/Page Import-Readiness

Generated dashboards, root pages, and custom page resources must pass strict reference checks before `.yap` handoff. `LayoutInResources[].ID` and `RefId` must match the owning `LayoutID` where the current generated-page model requires inline resources. Dynamic display rules must reference the target control id, and formulas/filters must resolve against the active collection source list or page filter variables.

Do not ship dashboard collection filters that reference unresolved `__ctx_coll` fields such as `ListDataID` when that field is not present on the collection source list. Treat stale copied `controlId` values, unresolved field filters, and unresolved data source/list references as generated-final errors, not cosmetic warnings.
<!-- projects-center-import-failure-hardening:end -->

<!-- container-button-action-settings-learning:start -->
## Container And Button Action Settings

Use `docs/studies/container-button-action-settings.md`, `docs/studies/normalized/container-button-actions/`, and `scripts/inspect-container-button-actions.mjs` when dashboards use actionable Containers or Buttons. `AP Approval Demo v3.yap` export-proves that dashboard `container` controls and `action_button` controls share the same `attrs` action-setting model.

Export-proven action codes are `2` Link, `5` Add list item, `6` Open dashboard, and `8` Open approval form. The Builder UI also shows `Action` for form/page action binding, but the target dashboard did not include action code `1`; keep dashboard-specific form-action binding warning-first until a dashboard export proves the exact target field.

Choose the action type from business intent: Link for URL destinations; Add list item for quick-create list/document flows; Open dashboard for navigation, drill-down, reports, and workspaces; Open approval form for starting workflow/request forms. Prefer structural Yeeflow references over raw links for Yeeflow resources.

Validate every generated action before handoff. `attrs.data.list.ListID` must resolve for Add list item; `attrs.data.page.PageID` must resolve to a Type `103` dashboard for Open dashboard; `attrs.data.form.ProcKey` must resolve to an included approval form for Open approval form; Link needs a literal URL or expression URL. Export-proven `op` values are empty/default, `modal`, `slide`, `target`, and `new`; export-proven `modalsize` values are `0`, `1`, `2`, `3`, and `9`, with `cusize` for custom sizing.

Focused runtime proof in `docs/studies/container-button-action-runtime-proof.md` confirms a generated dashboard package imported/opened and representative Link, Add list item, Open dashboard, and Open approval form actions worked after the approval request-page fix. Treat this as generated-package proof for current-app navigation/open behavior only; keep save/submit/workflow, cross-app targets, form-action binding, external sensitive navigation, and all open-mode/size combinations unproven.
<!-- container-button-action-settings-learning:end -->
