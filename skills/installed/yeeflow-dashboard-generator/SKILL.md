---
name: yeeflow-dashboard-generator
description: generate, inspect, validate, package, debug, and improve Yeeflow dashboard .yap app pages after studying real exports; use for dashboard-only apps, Type 103 dashboard pages, dashboard widgets, dashboard navigation, ReplaceIds rules, and staged dashboard import testing.
---

# Yeeflow Dashboard Generator

Use this skill when the user asks to generate, debug, validate, or learn Yeeflow dashboard packages, including minimal dashboard-only apps, dashboard widgets, dashboard page JSON, Type `103` navigation, dashboard `exts`, and dashboard import failures.

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

The studied dashboard does not prove a dashboard `attrs.container.cw` setting. Do not invent one until another real export proves it.

Global page background rule: do not set full-page background color on the dashboard `Main` container. `Main` stays structural; page background belongs on embedded page attrs. Use backgrounds on `Page header`, cards, KPI containers, Collection sections, or other specific visible containers only when those surfaces need their own color.

Shared CAPEX/design-system carry-forward: dashboard pages in generated app packages should follow the same `Main` structural parent, `Content` visible content, token-aligned color, meaningful `nv_label`, and Text Style Sample rules used by the latest CAPEX v4 Text Standard baseline. Dashboard-specific generation still requires dashboard export proof for new controls, but shared page/header/container rules apply globally.

Use `docs/yeeflow-root-style-token-reference.md` for dashboard color, spacing, radius, and typography guidance. Prefer semantic tokens for generated dashboard surfaces and statuses: primary, success, warning, danger, and neutral. Avoid arbitrary custom palettes; do not inject the full root stylesheet.

Generated dashboards should use clear sections (`Page header`, `Summary section`, `Body section`, `Collection section`, `Empty state`), meaningful `nv_label` names, token-aligned neutral surfaces, and Collection controls for repeatable list-style content when source lists are local and proven.

When the workspace includes `docs/yeeflow-text-control-generation-standards.md`, generated dashboard headings, labels, card titles, KPI text, and empty states must follow the Text Style Sample native Text shape: `type: "heading"`, inline width by default, `attrs.heads.ty = [null, token]` or a custom typography object, and plain string `attrs.heads.color`.

For app-shell navigation around dashboards, keep the menu readable by inverting the root header colors: `navigator-menu.bgc` should equal `appearance.color`, and `navigator-menu.color` should equal `appearance.bgc`.

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
- dashboard page content or empty page shell renders
- local source lists open without visible `datas/query` failures when the package includes dashboard data sources

For the current dashboard learning loop, the user has authorized import testing after every newly generated `.yap`; do the runtime import test after local validation for each new package unless they explicitly pause it.

If runtime fails, create a smaller isolation package with fresh IDs instead of guessing.
