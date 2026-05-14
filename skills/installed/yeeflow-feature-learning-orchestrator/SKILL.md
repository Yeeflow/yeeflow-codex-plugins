---
name: yeeflow-feature-learning-orchestrator
description: orchestrate end-to-end Yeeflow feature learning from real exports before generation, including .yap/.ydl/.ywf study, pattern docs, validator updates, minimal test packages, runtime import testing, export-back comparison, baselines, and creation or update of feature-specific generator skills for dashboards, document libraries, reports, AI Agents, Copilots, workflow actions, and other application resources.
---

# Yeeflow Feature Learning Orchestrator

Use this skill when the user asks to study a new Yeeflow feature, learn dashboard or document-library structure from exported files, analyze an exported `.yap` and build a test package, create a generator skill for a feature area, run the full learning cycle, or use the Yeeflow feature learning process.

This is an orchestration skill. It does not replace:

- `yeeflow-approval-form-generator`
- `yeeflow-data-list-generator`
- `yeeflow-application-generator`

Use those feature skills for proven generation work. Use this skill when a feature area is not yet proven or when a new resource pattern must be learned from real exports.

## Core Principle

Do not start by generating.

For any new Yeeflow feature:

1. Study real exports first.
2. Extract structure.
3. Document patterns.
4. Update validators.
5. Generate the smallest possible test.
6. Validate.
7. Build wrapper.
8. Import/test in Yeeflow only when explicitly asked.
9. Debug failures with evidence.
10. Document the successful baseline.
11. Update or create the relevant feature-specific skill.

A feature is not learned until real export study, validation, runtime proof, baseline documentation, and skill updates are complete.

For generated-app UI/UX standards, first study a focused export such as `UI and UX design (1).yap`, document dashboard/list/approval form shells, add validator warnings where exact checks are safe, and only then propose a minimal generated test package. Do not make UI/UX standard warnings into hard generator errors until a generated package has runtime import/open and export-back proof.

For root style/token learning, study `root_styles.txt` read-only, preserve token names exactly, document token groups, and update generator guidance to prefer Yeeflow-native tokens over arbitrary colors. Do not inject the full root stylesheet into generated apps.

For Yeeflow Application Design System learning, consolidate the focused UI/UX export, root tokens, design-system alignment guidance, and proven generated-app baselines into `docs/yeeflow-application-design-system.md` plus layout/style/dashboard/list/form/control-naming standards. Keep validator checks warning-first until a generated design-system package has runtime import/open/export-back proof.

For manual form-design correction learning, study the exported-back `.yap` read-only, compare the improved form Def against the generated baseline, extract exact property paths, update `docs/yeeflow-form-design-quality-rules.md`, add warning-first validators, and update approval/application/data-list generator skills. Do not regenerate the app in the same pass unless the user explicitly requests it.

For focused Text control learning, treat a small `.ywf` sample as authoritative. Decode it read-only, extract every native Text control, document `attrs.headc`, `attrs.heads`, and `attrs.common` shapes, update `docs/yeeflow-text-control-generation-standards.md`, add warning-first validators, sync approval/application/data-list/dashboard skills, and only then regenerate affected apps with fresh IDs.

For focused approval-form control learning from a `.yap` export, scope the study to the named approval form. Decode the wrapper read-only, extract the selected `Data.Forms[].DefResource`, inventory controls, variables, bindings, layout containers, lookup/list dependencies, runtime-sensitive controls, and validator gaps, then promote only documented rules into approval/application/data-list skills. Do not generate or import unless the user explicitly asks. Use `docs/ai-training-approval-form-control-study.md` as the current broad control-anatomy example.

For approval-form control runtime coverage, keep a consolidated matrix after each staged package. After Approval Form Controls Test v1/v2/v3/v4/v6, use `approval-form-control-runtime-coverage.json` and `docs/approval-form-control-runtime-coverage-matrix.md` to distinguish runtime-proven controls, partially proven controls, skipped/deferred controls, environment-dependent controls, and persistence-safe mappings. Stage 5 metadata/tag controls may be intentionally skipped; document that status rather than treating it as proof. Stage 6 proved internal packaged lookup and list/listref workflow-form usage, and also proved the raw lookup persistence rule: raw lookup variables mapped into plain text fields store internal local row IDs, so readable persistence should use lookup `attrs.addition[]` autofill variables or explicit summaries unless row IDs are intentional.

For global page-background learning, apply the rule across all generated Yeeflow visual surfaces: dashboard pages, data-list custom forms, approval submission pages, and approval/task pages should set full-page background color on the page/form background property, not on the top-level `Main` container. Keep `Main` structural and reserve container backgrounds for specific sections, cards, headers, summary panels, and content surfaces.

After a generated application reaches a runtime baseline, sync the relevant project skill mirrors and active `~/.codex/skills` installs. The CAPEX Runtime V2/V3/V4 learning promoted manual form corrections into generator standards: page-level backgrounds, Form header/request summary/metric row, inline Text/Icon controls, icon badge wrappers, two-column field grids, runtime-sensitive control fallback rules, calculated fields, workflow-action schema validation, and control/field schema mapping. Use `docs/generated-it-hardware-capex-request-text-standard-baseline.md` as the latest CAPEX runtime evidence.

For Yeeflow expression-editor learning, treat uploaded training references and screenshots as read-only schema/UI evidence. Extract the exact token model, variable shape, allowed operators, allowed function names, function parameter counts, enriched function metadata, and editor entry points into normalized JSON references and docs. Add helper validation before generation. Expressions are used across calculated controls, dynamic display rules, custom validation rules, lookup/data filters, workflow transition/action conditions, default values, request numbers, and subtotal/total/date/string formulas. Preserve exact runtime function names; if a function is only visible in a screenshot and lacks parameter metadata, document it as observed but not generation-safe. Create or update a dedicated expression skill when the expression layer becomes a reusable cross-feature capability. Do not generate an app during the foundation pass.

## What To Load

- For the full lifecycle, read `references/feature-learning-workflow.md`.
- Before any Yeeflow import/runtime test, read `references/runtime-testing.md`.
- Before generation or validation, read `references/hard-rules.md`.
- Before updating or creating a feature skill, read `references/feature-skill-map.md`.

Also read the relevant installed feature skills when the task touches their area:

- `.yap` app shell, navigation, app-level resources: `yeeflow-application-generator`
- data lists and `.ydl`: `yeeflow-data-list-generator`
- approval forms and `.ywf`: `yeeflow-approval-form-generator`

## Standard Operating Workflow

1. Ask for real exported files that contain the feature: a working `.yap`, a smaller focused example if available, an exported-back version after manual UI changes if available, and screenshots or notes that explain the Yeeflow UI configuration.
2. Decode and inspect exports read-only. Preserve originals. Redact token, credential, secret, tenant, connection, and API-key-like values.
3. Inventory feature resources and dependencies. Identify where the feature lives in `Data.Item`, `Data.Childs`, `Data.Forms`, `DataReports`, `FormReports`, dashboards, document libraries, agents, knowledges, connections, or `OtherModules`.
4. Compare with known baselines from the app, list, and approval-form skills. Mark what is known, new, similar, risky, or externally dependent.
5. Extract a reusable feature pattern: location, required fields, IDs, `ReplaceIds`, navigation/menu links, related child resources, data sources, runtime dependencies, and export-back behavior.
6. Update or design validator rules before generating. For workflow actions, first normalize the official action configuration reference into `workflow-action-configurations.normalized.json` and document it in `docs/workflow-action-configuration-reference.md` plus `docs/workflow-action-generation-rules.md`. For control/field schema references, first normalize `control-configurations.json` and `field-configurations.json`, document approval control rules, data-list field rules, and control-to-field mappings, then update validators and generator skills before app generation.
7. Write a dedicated study doc such as `docs/dashboard-feature-pattern-study.md`, `docs/document-library-feature-pattern-study.md`, `docs/report-feature-pattern-study.md`, or `docs/ai-agent-feature-pattern-study.md`.
8. Generate only the smallest possible test package, using fresh local ID families and minimal dependencies.
9. Run component and package validators. Build wrappers only after validators pass.
10. If the user explicitly asks for runtime testing, import into `https://codex.yeeflow.com/` and capture runtime evidence.
11. If runtime fails, isolate with smaller packages instead of guessing.
12. If possible, export the imported app back and compare generated source, wrapper, and exported-back `.yap`.
13. Patch minimally with fresh IDs, retest, and preserve known-good baselines.
14. Document the successful baseline.
15. Update or create the relevant feature-specific skill, including proven patterns, hard rules, validators/scripts, stop conditions, summarized examples, and remaining gaps.

## Workflow Action Learning Rules

When learning workflow actions from `node-configurations.json`, treat the uploaded JSON as read-only source evidence. Extract control types, required/optional properties, value types, enums, nested schemas, and conditional applicability. Update validators before generating new workflow packages.

Validation should cover missing required node properties, invalid enum values, invalid value types, invalid `ContentList` mappings, invalid `QueryData` filters, invalid `SequenceFlow` conditions, invalid `Loop`/`Delay` condition shapes, and unsafe external or credential-related actions. Do not bundle sensitive values.

## Control And Field Schema Learning Rules

When learning Yeeflow approval control or data-list field schemas from `control-configurations.json` and `field-configurations.json`, treat them as read-only schema evidence rather than runtime proof. Preserve large IDs as strings, redact sensitive values, produce normalized references and docs, make validator checks warning-first for runtime-unproven shapes, and update approval-form, data-list, and application generator skills. Do not create a standalone schema skill unless it adds a clearly distinct workflow beyond those existing generators.

## Validation Commands To Prefer

Use existing project validators and builders rather than copying scripts into this skill:

```bash
node validate-yap-package.js <decoded-app.json> --mode generator --stage final
node validate-yap-graph.js <decoded-app.json> --mode generator --stage final
node validate-ywf-def.js <approval-form-def.json> --mode final
node validate-ydl-list.js <list-def.json> --mode generator --stage final
node build-yap-wrapper.js decoded-app.json output.yap
node --check <script.js>
```

Adapt paths to the active workspace or installed skill script location. Report if a validator is missing and create/update it before generation when the feature requires new checks.

## Runtime Boundary

Never import into Yeeflow or operate Chrome for Yeeflow testing unless the user explicitly asks. When the user does ask, use the Codex Yeeflow environment:

`https://codex.yeeflow.com/`

Use Chrome console/network evidence when import or runtime behavior fails. Do not expose secrets or tenant credentials in logs, summaries, docs, or skills.
