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
6. Update or design validator rules before generating. For workflow actions, first normalize the official action configuration reference into `workflow-action-configurations.normalized.json` and document it in `docs/workflow-action-configuration-reference.md` plus `docs/workflow-action-generation-rules.md`.
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
