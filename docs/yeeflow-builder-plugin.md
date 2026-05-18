# Yeeflow Builder Plugin

The Yeeflow Builder Plugin is a private, skills-only Codex plugin for internal Yeeflow application builders. It packages the current repo's proven Yeeflow skills so Codex can plan, generate, validate, test, and improve Yeeflow application work without adding OAuth, Yeeflow API integration, or MCP servers.

## Package Contents

The plugin lives at `dist/yeeflow-builder-plugin/` and includes:

- `.codex-plugin/plugin.json` with private plugin metadata and a skills-only manifest.
- `skills/yeeflow-application-builder/`
- `skills/yeeflow-feature-learning-orchestrator/`
- `skills/yeeflow-application-generator/`
- `skills/yeeflow-approval-form-generator/`
- `skills/yeeflow-data-list-generator/`
- `skills/yeeflow-dashboard-generator/`
- `skills/yeeflow-expression-generator/`
- `skills/yeeflow-custom-code-generator/`
- `scripts/` helper checks referenced by bundled skills.
- `yeeflow-expression-utils.js` support utility for expression smoke validation.

## Bundled Skills

`yeeflow-application-builder` is the top-level controller for real requirement-to-application work. Use it when the goal is to design and build a Yeeflow business application from requirements, forms, screenshots, SOPs, or app ideas.

`yeeflow-feature-learning-orchestrator` coordinates learning from real exports and runtime evidence. Use it when Yeeflow behavior is unknown, not yet proven, or needs an export-first learning pass before generation.

`yeeflow-application-generator` creates and validates small application-level `.yap` packages, including multi-list app shells, navigation, lookup relationships, approval forms, and app package wrappers.

`yeeflow-approval-form-generator` generates, inspects, validates, and improves approval form definitions, decoded `.ywf` JSON, `.ywf` wrappers, and approval-form resources inside `.yap` exports.

`yeeflow-data-list-generator` generates, inspects, validates, and improves `.ydl` data-list definitions, fields, views, custom list forms, lookup relationships, metadata, and sample data.

`yeeflow-dashboard-generator` generates, learns, validates, and improves Yeeflow dashboard pages and widgets, including data-bound KPI, chart, table, filter, and navigation patterns.

`yeeflow-expression-generator` generates and validates Yeeflow expression token arrays for calculated controls, dynamic display rules, validations, filters, workflow conditions, defaults, request numbers, and formulas.

`yeeflow-custom-code-generator` generates, updates, debugs, documents, and redesigns Yeeflow custom code controls for runtime-proven contexts such as forms, tables, dashboards, editors, and data-driven components.

## Builder vs. Learning Orchestrator

Use `yeeflow-application-builder` when the user wants a real business app built from requirements. It must act like a Yeeflow business solution architect: clarify the business process, decide the safest native Yeeflow structure, keep v1 scope conservative, and coordinate generator skills only after the application plan passes business gates.

Use `yeeflow-feature-learning-orchestrator` when the task is to learn unknown Yeeflow behavior from real exports, screenshots, runtime tests, manual fixes, or exported-back comparisons. Feature learning and app building are separate workflows. Unknown platform behavior should be proven through the learning workflow before it is treated as a builder capability.

## Starting a New App Build

Start with `yeeflow-application-builder`. Provide the requirement document, screenshots, SOPs, form samples, workflow expectations, data model notes, and any known Yeeflow constraints.

The builder should:

1. Run business clarification gates before generation.
2. Identify lists, approval forms, dashboards, expressions, workflows, and custom-code needs.
3. Prefer native Yeeflow controls before custom code.
4. Generate a new application package as `.yap`.
5. Validate child lists, approval forms, expressions, dashboards, wrappers, and app graph relationships.
6. Record runtime test planning and runtime results before accepting a baseline.

New app creation outputs `.yap`.

## Starting a Learning Pass

Start with `yeeflow-feature-learning-orchestrator` when the behavior is not already proven. Provide the real `.yap`, `.ywf`, `.ydl`, screenshots, manual runtime steps, failure messages, or exported-back comparison files.

The learning workflow should:

1. Study real exports before generation.
2. Document the observed structure and unknowns.
3. Build focused minimal proof packages only when needed.
4. Run or plan runtime import tests.
5. Compare exported-back results when available.
6. Promote only proven patterns into references, validators, or generator rules.
7. Document accepted baselines and limitations.

Runtime pass evidence must be documented before accepting a baseline.

## Custom Code Generation

Use `yeeflow-custom-code-generator` for runtime-proven custom-code contexts. It can produce full code files, modify existing code, debug broken code, create user guides from code, or plan placement of existing scripts inside a Yeeflow application.

Custom code support must only be claimed for contexts that are runtime-proven. Public form custom code support is not claimed unless tested. When a standard Yeeflow control, expression, workflow action, form action, dashboard widget, or lookup configuration can meet the need cleanly, prefer the native option.

## `.yap` vs `.yapk`

New app creation outputs `.yap`.

Existing app upgrade `.yapk` is read-only/server-generated until Yeeflow signing and `Resource` mechanics are proven. Do not claim externally edited `.yapk` packages are valid upgrades. Do not mutate generated `.yap` or `.yapk` files as part of plugin packaging.

For existing app work, use `.yapk` exports for inspection, validation, and change planning only unless a proven Yeeflow-safe upgrade mechanism exists.

## Validation and Runtime Expectations

Validation should include structural checks, app graph checks, child list validation, approval form validation, expression validation, dashboard reference checks, package wrapper round trips where available, and JSON/JavaScript syntax checks for skill references and scripts.

Dashboard KPIs, charts, and tables must be data-bound, not static mockups. Runtime tests should confirm import behavior, navigation behavior, data binding, form behavior, workflow behavior, dashboard rendering, and exported-back differences where applicable.

Local validation is not the same as Yeeflow runtime proof. Accepted baselines must record what was structurally validated, what was runtime tested, what remains unproven, and what fallback was used.

## Current Limitations

- This package is skills-only.
- No OAuth is included.
- No Yeeflow API integration is included.
- No MCP servers are included.
- `.yapk` mutation is not supported.
- Public form custom code is not claimed unless explicitly runtime-tested.
- Runtime proof still depends on Yeeflow import/testing access.
- The plugin package mirrors current repo skills; behavior is unchanged except for packaging metadata.

## Manual Install or Upload

If no repo-specific packaging command is available, use `dist/yeeflow-builder-plugin/` as the plugin root. The manifest is `dist/yeeflow-builder-plugin/.codex-plugin/plugin.json`, and bundled skills are under `dist/yeeflow-builder-plugin/skills/`.
