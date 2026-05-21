---
name: yeeflow-runtime-test-orchestrator
description: Standardize runtime testing for generated or modified Yeeflow applications. Use when Codex has produced a Yeeflow .yap package, the user asks to runtime-test a Yeeflow app, Codex needs to decide whether a generated app can be accepted as a baseline, or runtime results must be classified as runtime-proven, partially proven, render-only proven, blocked, or not tested.
---

# Yeeflow Runtime Test Orchestrator

## Core Rule

Treat local package validation and Yeeflow runtime proof as separate gates. A package can be locally valid but still not accepted as a baseline until the runtime pass is documented.

Never accept fake dashboards, static KPI mockups, or unbound placeholder charts as runtime-proven. Dashboard KPIs, charts, and tables must be data-bound and must render from actual Yeeflow data sources.

## Runtime Workflow

1. Confirm local validation completed first. If package/materialization validation failed, classify runtime as blocked by package/materialization and do not import.
2. Plan the runtime scope before testing. Include import/open smoke, dashboards, data lists, approval forms, workflow branches, actions, expressions, custom code, and domain-specific lifecycle checks.
3. Execute tests in Yeeflow using the smallest safe dataset that proves the behavior.
4. Record evidence, failures, blocked steps, and assumptions. Use the classification labels exactly.
5. Recommend baseline acceptance only for behavior that is actually proven in runtime.

For the full pass sequence, read [runtime-test-lifecycle.md](references/runtime-test-lifecycle.md).

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

For application settings runtime tests, use `docs/studies/application-settings-runtime-test-plan.md` when present. After local validation passes, test import/open, navigation menu render, custom menu text, resource-title fallback when `DisplayName` is omitted, icon and `Icon: ""` no-icon behavior, group menu render, child item render, layout modes `default`/`left`/`onheader`/`none`, header height/title visibility, and app user group page visibility only when placeholder groups contain no real users or emails. Do not runtime-test member assignments until a safe member-bearing export proves the schema.

For document-library runtime tests, use `docs/studies/document-library-runtime-test-plan.md` when present. Prove import/open separately from upload behavior: the app must not open as an empty shell, every generated Type `16` document library must be reachable from the imported app, the libraries must open, default/custom fields must be visible or inspectable, and upload/folder behavior may only be tested with disposable non-private files. `Document Library Sample.yap` proves document-library-only apps may omit root navigation and Type `103` pages, so judge reachability from the runtime UI rather than assuming a navigation item must exist. The user-runtime-tested `document-library-sample-new-library-only.v1.yap` imported and ran successfully; use its `New Document Library` shape as the minimal import/open baseline. The `Enterprise Document Center` v2 runtime pass accepted multiple generated libraries with custom fields and configured views. The v2 folder pass proved generated root-level folder rows appear and persist, plus manual `New Folder` creation works across all three generated libraries; do not claim nested generated folders or upload persistence proof from that result alone.

For dashboard Doc library control runtime tests, use `docs/studies/doc-library-control-runtime-test-plan.md` when present. Confirm import/open, dashboard `Document Center` render, root-bound control render, folder-bound control render, caption/search/add visibility, folder persistence after refresh, and whether the control's add flow opens the target library `New file` form. For form-host tests, use `docs/studies/doc-library-control-form-hosts-runtime.md` when present. The current form-host proof is document-library custom form open/render with disabled search/add; approval-form controls rendered in Builder preview, but live request proof is blocked by workflow assignment-task assignee and task form setting generation rather than the Doc library control schema; data-list custom forms are validation-only until reachable runtime forms are tested. Do not claim dynamic folder expressions or upload persistence unless a focused generated package proves them.

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

The `Scheduled Workflow Safe Runtime Baseline` pass proved import/open/designer rendering for a generated package with local `Runtime Ideas`, local `Email generation`, far-future non-deployed weekly recurrence, `QueryData`, `AI`, and `MailTask` configured to `workflow.safe.test@example.com`. Classify the Codex-observed proof as partial: import/open/configuration runtime-proven by Codex. User-confirmed function test passed; exact execution scope not yet documented.

Do not trigger schedules, run workflows, send email, publish workflows, or execute AI Assistant actions unless the recipient, schedule, AI call scope, and data are explicitly safe. Do not separately claim schedule trigger execution, manual run behavior, email delivery, AI Assistant execution, or workflow-triggered AI Agent execution unless the exact tested path is documented. Classify unexecuted scheduled-workflow packages as partial only when import/open/designer rendering was actually tested; otherwise classify as validation-only.
<!-- scheduled-workflow-ai-assistant-learning:end -->
