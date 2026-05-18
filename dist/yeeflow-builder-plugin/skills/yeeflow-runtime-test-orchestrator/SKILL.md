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
