# Application Planning And Full-Scope Generation Hardening

## Reason For Study

Public v0.6.1 plugin testing showed that generated applications can fall below the local training workflow quality bar when Codex jumps straight to package generation, under-asks clarifying questions, or builds a small/simple first version instead of the full expected application.

Observed failures:

- no visible application plan before generation
- unclear requirements were not clarified before package work
- data model, pages, forms, dashboards, controls, and actions were chosen too shallowly
- generated output behaved like a simple v1/MVP even when the user expected a complete app
- dashboard Data table controls were emitted without display fields
- dashboard and Data List custom form layouts lacked safe left/right padding

## Plan-First Requirement

For normal application-generation requests, Codex should create a Markdown application plan before building a `.yap` or `.yapk` package unless the user explicitly says to skip planning.

Safe app plans can be saved under:

```text
docs/generated-app-plans/<safe-app-name>-plan.md
```

If a plan contains tenant-specific, private, or runtime-generated information that should not be committed, save it outside git and report the path instead.

## Clarification Gate

Ask focused clarification questions when missing details would likely produce a bad package:

- app purpose
- target users/roles
- required data lists and important fields
- process states/statuses
- approval flow
- dashboards/reports
- actions/workflows
- integrations/API requirements
- package type or expected output

Ask only the minimum needed to unblock safe generation. If uncertainty is not blocking, state assumptions in the plan and proceed.

## Required App Plan Contents

A good Yeeflow app plan should include:

- application purpose
- target users/roles
- business process overview
- data lists and fields
- document libraries if needed
- New/Edit/View forms
- Print Page if needed
- approval forms if needed
- dashboards and pages
- controls selected for each page
- actions and workflows
- automation/workflow logic
- permissions/roles if relevant
- integration/API requirements if relevant
- layout/design approach
- validation checklist
- assumptions, exclusions, and deferred items
- proof boundary

## Full-Scope Generation Expectation

The default public plugin behavior should be full-scope generation from the accepted plan. Codex should not default to a simple version, MVP, basic app, or small v1 package unless the user explicitly asks for that.

Implement all planned core data lists, fields, forms, dashboards, actions, workflows, and major controls in one package when feasible. If a planned item cannot be generated safely, mark it as excluded or deferred with the reason, workaround, and proof boundary.

Staged generation is allowed only when:

- the user explicitly asks for MVP/v1/simple output
- the app is too large for one safe package
- critical information is missing and the user chooses to proceed with assumptions
- the task is explicitly a focused runtime proof package

## Plan-To-Package Consistency

After generation, compare the package against the plan:

- planned data lists exist
- planned important fields exist
- planned forms exist
- planned dashboards/pages exist
- planned major controls exist
- planned Data tables have configured display columns
- planned actions/workflows exist or are documented as deferred
- forms and dashboards follow padding/layout quality standards
- data sources and bindings resolve
- no empty required controls remain
- package is not an underbuilt simple version when the plan says full implementation

Use `scripts/inspect-generated-app-quality.mjs --package <package> --plan <plan.md>` to combine plan presence, package inventory, and generated UI quality checks.

## UI Quality Rules

Generated dashboards and Data List custom forms should use safe outer padding, grouped sections/cards/containers, and readable spacing. Major controls should not touch the page or window edge.

Data table controls must configure a source and meaningful display fields. Include 3 to 5 useful columns when fields are available, prioritizing title/name plus status, date, owner, amount, or progress fields as relevant.

Choose controls based on business value:

- Data table for tabular records with configured columns
- Collection/Kanban for card, task, or status-oriented views
- Timeline for date or event history
- Steps bar for process/status stage
- Progress controls for KPI/completion
- Tabs/toggles for organized dense content
- Dynamic Sub List for line items/details
- Print Page for printable record output

Prefer fewer complete controls over many incomplete controls.

## Proof Boundary

This branch hardens guidance, docs, and validation. It does not prove every future generated application will be visually perfect or complete. It should reduce known failures such as no plan, underbuilt apps, empty Data tables, and no-padding layouts.

Runtime proof requires generating and testing a focused application package with the new plan-first workflow and quality gate.
