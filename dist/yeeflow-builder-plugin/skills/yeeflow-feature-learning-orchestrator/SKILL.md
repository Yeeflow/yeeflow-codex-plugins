---
name: yeeflow-feature-learning-orchestrator
description: orchestrate end-to-end Yeeflow feature learning from real exports before generation, including .yap/.ydl/.ywf study, pattern docs, validator updates, minimal test packages, runtime import testing, export-back comparison, baselines, and creation or update of feature-specific generator skills for dashboards, document libraries, reports, AI Agents, Copilots, workflow actions, and other application resources.
---

# Yeeflow Feature Learning Orchestrator

Use this skill when the user asks to study a new Yeeflow feature, learn dashboard or document-library structure from exported files, analyze an exported `.yap` and build a test package, create a generator skill for a feature area, run the full learning cycle, or use the Yeeflow feature learning process.

This is a learning orchestration skill. It does not replace:

- `yeeflow-approval-form-generator`
- `yeeflow-data-list-generator`
- `yeeflow-application-generator`
- `yeeflow-application-builder`

Use generator and builder skills for proven generation work. Use this skill when a feature area is not yet proven or when a new resource pattern must be learned from real exports.

When reviewing black-box generated-app self-tests, treat the generated apps as evidence only. Do not merge self-test packages as product baselines and do not promote raw `.yap`, `.ydl`, `.ywf`, or `.yapk` artifacts into reusable skills. Classify each finding as a reusable skill/generator rule, validator rule, application-specific design choice, acceptable limitation, or focused runtime-proof need before updating docs, validators, or installed skills.

## Skill Boundary

Use `yeeflow-feature-learning-orchestrator` for training Codex on new Yeeflow platform capabilities:

- studying new Yeeflow exports
- learning new controls
- learning workflow/action patterns
- learning dashboard patterns
- learning form action patterns
- learning expression patterns
- comparing generated output with manual fixes
- updating docs, validators, and skills
- creating focused runtime proof apps for unknown platform behavior
- promoting proven learning into generator skills
- consolidating black-box self-test findings into reusable generator, validator, checklist, and skill guidance without adopting the self-test app as a baseline

Use `yeeflow-application-builder` when the user provides business requirements and asks Codex to build, implement, create, generate, test, or output a real Yeeflow application/package/`.yap`. The builder skill owns the Requirement-to-YAP lifecycle and business solution design process.

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

A feature is not runtime-learned until real export study, validation, focused runtime proof, baseline documentation, and skill updates are complete. Export-backed schema learning can still be useful, but it must be labeled as export-proven, validator-backed, planning-guidance, import-proven, or partial rather than runtime-proven.

## Runtime Gate For New Capability Learning

Use `docs/studies/new-capability-runtime-gate-process.md` when present. New function/schema/skill learning should follow an explicit two-step proof model:

1. Export-backed learning branch.
2. Focused runtime baseline branch or isolated runtime continuation.
3. Merge only after the proof boundary is clear.

Learning branch purpose:

- decode and study exports read-only
- document schemas, relationships, `ReplaceIds`, dependencies, and unknowns
- create normalized redacted references
- update validators carefully, using hard errors only for proven invalid generated shapes
- update skills with export-proven knowledge only
- avoid claiming import/runtime behavior

Runtime decision before merge:

- recommend a focused runtime test before merge when generated package behavior, imported rendering, workflow execution, app settings rendering, AI/email/external execution, custom code execution, document upload/persistence, user/group membership, permissions, or row mutation is involved
- continue runtime work on the same branch only if generated artifacts stay isolated, ignored, and safe
- otherwise create a separate focused runtime branch
- defer runtime proof only when the user explicitly approves merging as export-proven, validator-backed, planning-guidance, import-proven, or partial

Focused runtime baseline rules:

- build the smallest app that tests only the learned capability
- avoid unrelated app complexity
- validate locally before building, and build before runtime testing
- import only into `https://codex.yeeflow.com/` after local validation passes and runtime testing is requested
- avoid live AI calls, real email, external APIs, destructive updates, private users, private images, private documents, and credentials unless the safe scope is explicit
- document exact proof labels: passed, partial, blocked, or not tested

Merge rule:

- do not merge a new capability branch as runtime-proven unless focused runtime testing passed and the tested host/scope is documented
- if merged before runtime, the final report must name the proof boundary and preserved gaps
- do not promote broad generation rules from export study alone; either keep them export-proven/validator-warning/planning guidance or require focused runtime proof
- never treat import/open, configuration visibility, render-only proof, and executed runtime behavior as the same evidence level

For generated-app UI/UX standards, first study a focused export such as `UI and UX design (1).yap`, document dashboard/list/approval form shells, add validator warnings where exact checks are safe, and only then propose a minimal generated test package. Do not make UI/UX standard warnings into hard generator errors until a generated package has runtime import/open and export-back proof.

For Yeeflow Document Library learning and generation, use `docs/studies/document-library-resource-structure.md`, `docs/studies/document-library-fields-views-forms.md`, `docs/studies/document-library-generation-rules.md`, `docs/studies/document-library-runtime-test-plan.md`, and `document-library-resource-reference.normalized.json`. `Projects Center.yap` proved document libraries are app child resources with `ListModel.Type = 16`, normal child-resource envelopes, root navigation entries with `Type = 16`, document-specific default fields, Type `0` views, and Type `1` custom forms. `Document Library Sample.yap` proved document-library-only apps may export with no root pages, root `LayoutView = {"sortVer":1}`, empty view `LayoutView`, an unassigned `New file` upload form, and top-level `Resource.SimplePortal = null`. The user-runtime-tested `document-library-sample-new-library-only.v1.yap` imported and ran successfully; treat the `New Document Library` resource shape, with default Type `0` view `LayoutView = ""`, as the canonical minimal base definition. Do not use the earlier generated `Baseline Documents` experiment as the base definition. The v2 `Enterprise Document Center` runtime pass imported/opened three generated Type `16` libraries with simple custom fields and configured views. The v2 folder pass proved generated root-level folder rows using the export-backed `ListDatas` shape with `Bigint1 = "0"` and `Text1 = "folder"`; nested folders and upload persistence remain runtime-sensitive. `Enterprise Document Center Folders Runtime.yap` proves dashboard Doc library controls with `type = "document-library"`, `attrs.data.list`, optional `attrs.data.folder.path = "0/<folder ListDataID>"`, optional expression-token `attrs.data.customPath`, `attrs.listarr`, and caption/search/add-true settings. The form-host study proved document-library custom-form hosting for root-bound controls with disabled search/add; approval-form controls rendered in Builder preview, but live request proof is blocked by workflow assignment-task assignee and task form setting generation rather than the Doc library control schema; data-list custom-form hosting remains validation-only until focused runtime tests.

For root style/token learning, study `root_styles.txt` read-only, preserve token names exactly, document token groups, and update generator guidance to prefer Yeeflow-native tokens over arbitrary colors. Do not inject the full root stylesheet into generated apps.

For Yeeflow Application Design System learning, consolidate the focused UI/UX export, root tokens, design-system alignment guidance, and proven generated-app baselines into `docs/yeeflow-application-design-system.md` plus layout/style/dashboard/list/form/control-naming standards. Keep validator checks warning-first until a generated design-system package has runtime import/open/export-back proof.

For manual form-design correction learning, study the exported-back `.yap` read-only, compare the improved form Def against the generated baseline, extract exact property paths, update `docs/yeeflow-form-design-quality-rules.md`, add warning-first validators, and update approval/application/data-list generator skills. Do not regenerate the app in the same pass unless the user explicitly requests it.

For focused Text control learning, treat a small `.ywf` sample as authoritative. Decode it read-only, extract every native Text control, document `attrs.headc`, `attrs.heads`, and `attrs.common` shapes, update `docs/yeeflow-text-control-generation-standards.md`, add warning-first validators, sync approval/application/data-list/dashboard skills, and only then regenerate affected apps with fresh IDs.

For focused approval-form control learning from a `.yap` export, scope the study to the named approval form. Decode the wrapper read-only, extract the selected `Data.Forms[].DefResource`, inventory controls, variables, bindings, layout containers, lookup/list dependencies, runtime-sensitive controls, and validator gaps, then promote only documented rules into approval/application/data-list skills. Do not generate or import unless the user explicitly asks. Use `docs/ai-training-approval-form-control-study.md` as the current broad control-anatomy example.

For approval-form control runtime coverage, keep a consolidated matrix after each staged package. After Approval Form Controls Test v1/v2/v3/v4/v6, use `approval-form-control-runtime-coverage.json` and `docs/approval-form-control-runtime-coverage-matrix.md` to distinguish runtime-proven controls, partially proven controls, skipped/deferred controls, environment-dependent controls, and persistence-safe mappings. Stage 5 metadata/tag controls may be intentionally skipped; document that status rather than treating it as proof. Stage 6 proved internal packaged lookup and list/listref workflow-form usage, and also proved the raw lookup persistence rule: raw lookup variables mapped into plain text fields store internal local row IDs, so readable persistence should use lookup `attrs.addition[]` autofill variables or explicit summaries unless row IDs are intentional.

For global page-background learning, apply the rule across all generated Yeeflow visual surfaces: dashboard pages, data-list custom forms, approval submission pages, and approval/task pages should set full-page background color on the page/form background property, not on the top-level `Main` container. Keep `Main` structural and reserve container backgrounds for specific sections, cards, headers, summary panels, and content surfaces.

After a generated application reaches a runtime baseline, sync the relevant project skill mirrors and active `~/.codex/skills` installs. The CAPEX Runtime V2/V3/V4 learning promoted manual form corrections into generator standards: page-level backgrounds, Form header/request summary/metric row, inline Text/Icon controls, icon badge wrappers, two-column field grids, runtime-sensitive control fallback rules, calculated fields, workflow-action schema validation, and control/field schema mapping. Use `docs/generated-it-hardware-capex-request-text-standard-baseline.md` as the latest CAPEX runtime evidence.

For Yeeflow expression-editor learning, treat uploaded training references and screenshots as read-only schema/UI evidence. Extract the exact token model, variable shape, allowed operators, allowed function names, function parameter counts, enriched function metadata, and editor entry points into normalized JSON references and docs. Add helper validation before generation. Expressions are used across calculated controls, dynamic display rules, custom validation rules, lookup/data filters, workflow transition/action conditions, default values, request numbers, and subtotal/total/date/string formulas. Preserve exact runtime function names; if a function is only visible in a screenshot and lacks parameter metadata, document it as observed but not generation-safe. Create or update a dedicated expression skill when the expression layer becomes a reusable cross-feature capability. Do not generate an app during the foundation pass.

For expression export-back enrichment, compare user notes against decoded runtime names before promoting functions. `Expression Runtime Test v1 Patch.yap` proved that department/organization attribute expressions use `getOrgAttr`; the noted `getDeptAttr` name was not present in the export. After learning user/profile expression patterns, generate the smallest focused runtime package, validate with expression utilities and app/form/list validators, import-test only when requested, then update docs and skills with actual runtime evidence and tenant-data caveats.

For sub list/listref summary expression learning, study the updated export first and extract three layers separately: row-level current-object expressions (`exprType: "variable_ctx"`), parent list summary configuration (`attrs["list-fields-summary"]`), and workflow transition wrappers (`conditioninfo[]` with numeric `n.*` operators). Then generate the smallest focused runtime app to prove row calculations, summary display, summary-to-variable binding, and both high/normal workflow branches before promoting the pattern as generator-safe. Document runtime entry behavior such as summaries recalculating after row input blur/commit.

For FlowKey/import-replacement learning, compare generated and manually fixed exports for corrupted JSON property names as well as values. `Implant Application Request (1).ywf` proved that generated FlowKey `EFI` was replaced inside the reserved property name `prefix`, corrupting a sublist summary binding to `pr<runtimeFlowKey>x` and breaking `TotalApplicationAmount` binding. Promote safe FlowKey rules into validators and generator skills: generated FlowKeys must not be lowercase substrings of reserved JSON property names, and wrapper/export inspections should warn on corrupted keys like `pr[0-9]+x`.

For Yeeflow Form Actions Phase 1 learning, study the manually updated export before generating. Extract action buttons, button style codes, `action_button.attrs.control_action`, `page.formdef.formAction.onLoad`, `page.formdef.actions[]`, `variables.tempVars[]`, temp variable expression prefixes, and Phase 1 step types (`setvar`, `confirm`). Keep terminology clear: form actions are front-end form logic; workflow actions are process/backend graph logic; temp variables are form-runtime state. Treat new step types such as `listitem` as observed/deferred until a focused generated runtime test proves them.

The first generated Form Actions Phase 1 runtime app proved button styles, button-click actions, page-load actions, temp variable display, `setvar`, `confirm`, submit, reviewer task open, and approval completion after correcting an invalid generated direct-user assignee. The root cause was a hardcoded `method: "users"` assignment with a tenant-local user id/title. Promote this as a generator rule: do not hardcode direct users unless the mapping is export-backed and valid for the target tenant; use requester/current-user expression assignment by default. ContentList persistence remained pending in that first package, so keep it separate from the form-action proof until a regenerated package proves it.

For Yeeflow Form Actions Phase 2 query/submit learning, study the manually updated runtime export before generating. Extract `querydata` steps, query multiple vs single modes, source list metadata, selected fields, field maps, result count variables, temp collection variables, mapping to form list variables, Query data filters, `arraySum` over query collections, `JSONStringfy` collection display, submit steps, and Save changes mode. The generated `Form Actions Phase 2 Query Submit Test v1` runtime proved query multiple/single mapping, count output, `arraySum`, `JSONStringfy`, default Submit form, Save changes, approval completion, and ContentList persistence. The corrected filter retest proved Query data filter conditions use `attrs.querydata_filters` plural with Bit ON as `right: "true"`, returning 2 active rows and `arraySum` 2000; the singular `querydata_filter` helper path is ignored by runtime. `Implant Application Request (5).ywf` proved the Query data filter value-mode trap: variable/calculated right operands must be expression-token arrays with `showCus: false`, not frontend `<input ...>` expression-button HTML in direct-value mode. Treat `vLookup` as deferred when it appears only in labels. Do not document or generate `arraySub`; the learned aggregate is `arraySum`.

For Yeeflow Form Actions Phase 3 condition-flow learning, study corrected `.ywf` exports before promoting submit guard behavior. `Implant Application Request (2).ywf` proved that designer checkbox `Continue next step when condition is not met` serializes as step-level `continue: true`. Conditional warning/confirm/check steps before a Submit form step usually require this property so the valid path can skip the warning and continue to submit.

For expression export-back fixes discovered during manual runtime testing, compare the generated and manually corrected token shapes exactly before promoting. `Implant Application Request (3).ywf` proved that `dateDiff` date-unit params use a raw lowercase string such as `"year"`; the generated token-array shape `[{ "type": "str", "value": "Year" }]` rendered as `formcraft.formula.datetype.[object Object]` and broke Applicant Boarding Years calculation. Promote this kind of finding into expression docs, validators, generator skills, and focused smoke tests.

For workflow transition condition learning, study corrected `.ywf` exports before promoting branch condition generation. `Implant Application Request (4).ywf` proved latest SequenceFlow condition rows support independent left/right operand modes: `type: 1` direct selector, `type: 0` direct/static/option/date value, and `type: 2` expression editor. Compare old legacy HTML-button conditions with wrapper-object manual examples, document when each pattern should be generated, and update validators warning-first.

For Yeeflow application version-management package learning, treat `.yapk` as distinct from `.yap`. Study the wrapper first and preserve originals. Studied `.yapk` version packages are JSON with `PackageId`, `TenantID`, `AppID`, `ListID`, `Version`, `Notes`, `Author`, `Date`, `Sign`, and opaque high-entropy base64 `Resource` values without the `.yap` `[______gizp______]` gzip prefix. A metadata-only wrapper edit was rejected at runtime, and multi-version comparison showed `PackageId`, `Sign`, and `Resource` change across Yeeflow-generated versions while tenant/app/list identity stays stable. Until encoding/signing is proven, do not mutate `.yapk` wrappers or app internals; use `.yapk` as read/inspect-only and rely on Yeeflow Version management for valid upgrade packages.

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
   For generated `.yap` materialization learning, promote app-resource ID rules into validators before retesting: do not remap `TenantID`, `CreatedBy`, or `ModifiedBy`; keep `FieldID` globally unique across the application; keep every `field.ListID` equal to its parent list; and verify root Type `103` dashboard/navigation linkage with materialization inspection.
7. Write a dedicated study doc such as `docs/dashboard-feature-pattern-study.md`, `docs/document-library-feature-pattern-study.md`, `docs/report-feature-pattern-study.md`, or `docs/ai-agent-feature-pattern-study.md`.
8. Generate only the smallest possible test package, using fresh local ID families and minimal dependencies.
9. Run component and package validators. Build wrappers only after validators pass.
10. If the user explicitly asks for runtime testing, import into `https://codex.yeeflow.com/` and capture runtime evidence.
11. If runtime fails, isolate with smaller packages instead of guessing. If app materialization fails or imports as an empty shell, stop before testing custom controls and focus on app shell/resource linkage, global field IDs, field ownership, duplicate field names, `ReplaceIds`, and dashboard/navigation references.
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

<!-- agent-copilot-application-resource-learning:start -->
## AI Agent/Copilot Resource Learning Route

For AI Agents, Copilots, application connections, OpenAPI/REST tools, and application-resource access, use learning mode first: decode exports read-only, map OtherModules, normalize redacted references, update validators, and only then decide whether a generated baseline is safe. Do not mix this with requirement-to-app delivery until the resource graph and validation rules are clear.

Hard stop if Agent/Copilot resources cannot be located, tool references cannot be mapped, connection values cannot be redacted, or runtime testing would call real external systems.
<!-- agent-copilot-application-resource-learning:end -->

<!-- scheduled-workflow-ai-assistant-learning:start -->
## Scheduled Workflow / AI Assistant Action Learning Route

For Scheduled Workflow resources, Send email workflow actions, Query data workflow actions, and AI Assistant workflow actions, use learning mode first. Decode `.yap` exports read-only, preserve large numeric IDs as strings, and document `Data.Forms[]` entries with `WorkflowType = 3` before generation.

`AI Agent and Copilot Local Resource Baseline8.yap` proves app-level Scheduled Workflow resources are stored in `Data.Forms[]` with `ListID = 0`, `WorkflowType = 3`, a JSON-string `Settings` schedule, and a JSON-string `DefResource` workflow graph. It proves daily `Frequency = "0"`, weekly `Frequency = "1"`, weekly weekday `Values[]`, Windows-style `TimeZone`, `Times[]`, and `IsWorkday: true` for every-X-working-days recurrence.

The same export proves workflow `QueryData` -> `AI` -> `MailTask` orchestration where `QueryData` writes local list JSON to a workflow variable, `AI` with `properties.type = "agent"` calls an app-contained AI Agent through `properties.data.AgentID`, maps Agent outputs back to workflow variables, and `MailTask` can use those workflow variables for subject/body.

`Spark & AI (1).yap` extends the workflow AI proof to data-list workflows. The proven path is host-list `FlowMappings[].Setting.NewTrigger = true` -> `Data.Forms[]` workflow with `WorkflowType = 1` -> workflow graph `AI` node -> app-contained Agent with image input `type = "img"` bound from a list-field expression (`valueType = "icon-upload"`) plus native `ListDataID` bound into a text input. The called Agent can use an application-resource access tool (`Components[].Type = 2`, `SubType = 10`) scoped through `Settings.resources.dataLists.items[]` to update the triggering row. Study and document this path before generating any list workflow that can invoke live AI or mutate app data.

Hard stop if scheduled-workflow recurrence cannot be mapped, fixed recipients cannot be made safe/redacted, AI Agent references do not resolve, Query data list references do not resolve, or runtime testing might send real email or call live AI unexpectedly.
<!-- scheduled-workflow-ai-assistant-learning:end -->

<!-- workflow-assignment-task-assignee-learning:start -->
## Workflow Assignment Task Assignee Learning Route

For approval workflow assignment task learning, decode `.yap` exports read-only, preserve large numeric IDs as strings, and inspect `MultiAssignmentTask.properties.usertaskassignment[]` plus task-type, due-date, reminder, and notification fields. `Test ABC.yap` export-proves direct user, applicant line manager, applicant department manager, direct job position, job position by selected department, job position by applicant department, job position by selected location, and job position by applicant location shapes. `Test ABC (1).yap` extends this with multiple assignee entries in one task, mixed users/positions/expressions, user-group expression, position all-users expression, `issequential=true`, `approveway` variants, custom percentage, and email notification fields. `Test ABC (2).yap` export-proves absent `tasktype` as approval/default, `tasktype="complete"` for Complete tasks, due-date types `hour`, `day`, and `express`, working-calendar day flag, and reminder `notifyrules[]` before/on/after due date. `Test ABC (3).yap` export-proves Start action settings for `terminate`, `terminate-conditions`, `revoke-conditions`, and Start email notification. Use `docs/studies/workflow-assignment-task-assignee-settings.md`, `docs/studies/workflow-assignment-task-complete-task-and-due-date.md`, `docs/studies/workflow-start-action-settings.md`, `docs/studies/workflow-assignment-task-generation-rules.md`, `docs/studies/workflow-assignment-task-runtime-test-plan.md`, `docs/studies/normalized/workflow-assignment-task-assignees/`, `docs/studies/normalized/workflow-assignment-task/`, and `docs/studies/normalized/workflow-start-action/`.

Keep this capability export-proven/validator-backed until a focused runtime baseline proves routing. Multiple users, mixed assignee lists, user groups, Sequential/Parallel appointed order, completion modes, and email notification configuration are export-proven where documented, but routing, group/position expansion, appointed-order behavior, and notification delivery remain runtime-unproven. Do not promote workflow-variable assignees, selected department-manager static entries, department+location position entries, or quick-completion behavior unless a focused export proves their exact package shape.

When learning workflow actions, keep product Help Center behavior separate from export schema proof. Minutes as a due-date unit, Automatic Treatment due-date actions, reminder recipients beyond task owner/current assignee, enabled Start terminate examples, Start recall execution, and email delivery remain unproven until export/runtime evidence exists. Generated workflow nodes should be laid out without overlap and `SequenceFlow` source/target plus node incoming/outgoing references must stay consistent.

For API coverage audits that support Assignment Task learning, use only official read-only Yeeflow API endpoints and document gaps in `docs/studies/yeeflow-api-operator-assignment-routing-coverage.md`. Documented read-only support now covers users, user detail, departments, locations, location detail, positions, position assignments, groups, and group members; it still does not prove workflow routing.
<!-- workflow-assignment-task-assignee-learning:end -->

<!-- application-settings-navigation-user-groups-learning:start -->
## Application Settings, Navigation, Header, And User Groups

For application settings learning, decode `.yap` exports read-only and inspect the root app shell first. The export-proven location is `Data.Item.ListModel.LayoutView` as a JSON string. Parsed `sort[]` stores navigation menu items, `attrs["navigator-menu"].position` stores menu layout, and `attrs.appearance` stores header appearance.

Navigation menu exports prove resource items and custom groups. Groups use `Type = "classes"`, `ID`, `Title`, optional `Icon`, and child resources in `list[]`; groups require display text and cannot contain nested groups. Resource items may include `DisplayName` for custom menu text or omit it to fall back to `Title`. No-icon is export-proven as `Icon: ""`. Keep menu depth to two layers.

Navigation layout values are `default` for horizontal/default, `left` for vertical, `onheader` for on-header, and `none` for no menu. Header title hidden is `attrs.appearance.hideTitle = true`; default visible title is omission. Default 56px height is represented by omission, and v6 proves small height as `attrs.appearance.height = 46`; larger heights remain product-known but not export-proven.

Application user groups are export-proven in `Data.AppGroups[]` with `{ ID, Name, Description }`; v6 proves group IDs belong in `Resource.ReplaceIds[]`. Member storage was not present in the studied export, so do not generate group members or real users until a safe member-bearing export proves the schema.
<!-- application-settings-navigation-user-groups-learning:end -->
