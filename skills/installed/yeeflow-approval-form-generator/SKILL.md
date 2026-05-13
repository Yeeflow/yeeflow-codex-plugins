---
name: yeeflow-approval-form-generator
description: generate, inspect, validate, package, and improve yeeflow approval form definitions, decoded .ywf def json, .ywf exports, and .yap application exports using a staged native-first workflow with metadata mapping, validators, and safe stop conditions.
---

# Yeeflow Approval Form Generator

Use this skill when the user asks to generate, inspect, validate, package, troubleshoot, or improve Yeeflow approval form definitions, decoded `.ywf` Def JSON, `.ywf` wrappers, or `.yap` application exports.

## Core Workflow

Always work in stages:

```text
business requirement
-> requirement decomposition
-> metadata extraction/mapping
-> decoded Def JSON draft
-> structural validation
-> app-context validation
-> wrapper build
-> sandbox import by user/operator
-> runtime test
-> export-back learning
```

Do not generate raw `.ywf` directly from business text. Generate and validate decoded Def JSON first.

## Native-First Rule

Prefer Yeeflow native configuration in this order:

1. standard controls
2. attrs/defaults/readonly/validation
3. calculated fields and list summaries
4. lookup configuration and filters
5. form actions
6. workflow actions
7. AI actions
8. custom code control

Use custom code only when the requirement is justified client-side behavior that native Yeeflow features cannot model safely.

## Generated Approval Form UI/UX Standard

When the active workspace contains `docs/yeeflow-application-design-system.md` and `docs/yeeflow-approval-form-design-standards.md`, use them as the default approval-form design standard. Use `docs/yeeflow-approval-form-ui-ux-patterns.md` for export-level evidence. The first official UI/UX reference export is `UI and UX design (1).yap`.

Generated submission and task pages should use:

- `attrs.container.cw = "2"`
- zero padding with `--sp--s0` on all sides
- a top-level `Main` container
- a `Content` container inside `Main`
- a `Form body` container inside `Content` for request/review fields
- a `Form bottom` container at the end of `Content`
- `workflowControlPanel` and `workflowHistory` inside `Form bottom` by default

Some forms may omit Action Panel or Flow History only when the user explicitly asks or a real export proves the omission.

Use `docs/yeeflow-root-style-token-reference.md` for approval-form token guidance. Generated forms should prefer Yeeflow-native tokens for backgrounds, neutral borders, headings, spacing, and semantic decision/status colors. Let native `workflowControlPanel` and `workflowHistory` styles apply unless a real export proves a style override.

Generated approval forms should apply the design system by default: business content in `Form body`, Action Panel and Flow History in `Form bottom`, readonly task-page mirroring where useful, meaningful `nv_label`, and token-aligned colors and spacing without changing core workflow logic.

## Hard Stop Conditions

Stop and report blockers. Do not build final `.ywf` when:

- placeholders remain
- structural validation fails
- app-context validation fails
- app/list/field IDs are missing
- a generated approval form targets a newly generated data list using pre-import/generated `ListID` values instead of exported-back list metadata
- FlowKey does not equal `defkey`
- WorkflowType does not equal `workflowType`
- custom code is unreviewed or unjustified
- sensitive credential/token resources are involved
- workflow action properties do not satisfy the normalized action reference from `workflow-action-configurations.normalized.json`
- production use is requested without sandbox import/export round-trip proof

Never guess app IDs, listset IDs, list IDs, field internal names, users, groups, positions, document template IDs, AI agent IDs, or connection IDs.

## Proven V1 Patterns

This skill can help generate or validate:

- one-step approvals
- two-step approvals
- structured request and approval pages
- responsive grid UI
- current user/current date defaults
- workflow action panel and history
- page registration/publish metadata
- workflow graph layout metadata
- ContentList parent persistence
- ContentList persistence to a newly generated dedicated data list after importing/exporting the list back and patching to the real metadata
- workflow action validation against the normalized node/action configuration reference
- data-list lookup controls with additional-field mappings into readonly approval form variables
- number fields using number variables and `input_number` controls
- single-select fields using text variables and `radio` controls, including dropdown style via `attrs.displayStyle = "dropdown"`
- switch fields using boolean variables and `switch` controls
- conditional display rules on target controls via `attrs.control_display[]`
- type-compatible `ContentList` mappings for text, number, choice, and switch fields
- line-item tables
- parent/detail persistence
- optional custom code controls when justified
- `.yap` metadata extraction
- `.ywf` wrapper build with round-trip validation

## References

Load only the reference needed for the task:

- `references/operating-playbook.md`: master workflow, stop conditions, readiness levels.
- `references/requirement-decomposition-template.md`: intake and decomposition before generation.
- `references/baseline-v6-template.md`: proven request/approval page, defaults, graph, and page metadata patterns.
- `references/custom-code-decision-guide.md`: when to use or avoid custom code.
- `references/yap-structure-study.md`: `.yap` package structure and app/list relationship patterns.
- `references/field-type-pattern-study.md`: number, radio/dropdown, switch, conditional display, and v11 generated `.yap` proof.
- `references/validation-guide.md`: structural and app-context validator usage.
- In the active generator workspace, also use `docs/workflow-action-configuration-reference.md`, `docs/workflow-action-generation-rules.md`, and `workflow-action-configurations.normalized.json` as the official workflow action configuration reference when present.
- `references/metadata-and-wrapper-guide.md`: metadata replacement and wrapper build usage.
- `references/data-list-approval-integration-pattern.md`: staged generated data list plus approval form persistence integration.
- `references/examples-summary.md`: proven examples and what each demonstrates.

## Generated Storage List Rule

When an approval form writes to a newly generated data list:

1. Generate and build the `.ydl` first.
2. The user imports the data list into the sandbox and exports it back.
3. Extract the exported-back `AppID`, `ListSetID`, `ListID`, `FieldName`, `InternalName`, and `FieldID` values.
4. Patch the approval form `ContentList` target and field mappings from that exported-back metadata.
5. Validate with `validate-ywf-def.js --mode final`.
6. Validate with `validate-ywf-def-against-yap.js` against the generated-list metadata.
7. Build the `.ywf` only after both validators pass and no placeholders remain.

Do not build a production-like final `.ywf` that targets pre-import generated data-list IDs.

## Lookup Control Rules

Use lookup controls when the requester should select an existing app/list record. Confirmed data-list lookup controls require source `appid`, `listsetid`, `listid`, and display field metadata.

For additional field mappings:

- mappings live in lookup `attrs.addition[]`
- each source field must resolve by source field name and/or field ID
- each target must be a workflow/form variable
- displayed derived target controls should usually be readonly
- validate lookup source, display field, sort field, additional source fields, and target variables against metadata before wrapper build

## Field Type Rules

Use the Visitor Access Management v11 baseline as the current generated proof for richer approval form fields.

Number fields:

- workflow variable `type = "number"`
- control `type = "input_number"`
- format/min attrs such as `displayThousandths`, `rounded-to`, and `number_min`
- default value, when needed, on the control as numeric `value`
- persist to `Decimal/input_number` data-list fields through `ContentList`

Single-select fields:

- workflow variable `type = "text"`
- radio layout control `type = "radio"` with `attrs.choices[]`
- dropdown layout uses the same `radio` control plus `attrs.displayStyle = "dropdown"`
- selected value is the option text
- persist to text/radio-compatible target fields

Switch fields:

- workflow variable `type = "boolean"`
- control `type = "switch"`
- default value is boolean `true` or `false`
- persist to `Bit/switch` data-list fields

Conditional display:

- store rules on the target control under `attrs.control_display[]`
- confirmed example: show `EscortUser` when `RequiresEscort == true`
- `controlId` should match the target control ID
- source variable and condition value type must be compatible

Approval page mirroring:

- mirror submitted business fields on approval pages as readonly unless explicitly request-only
- conditional fields can be mirrored with the same rule or shown unconditionally for reviewer context

Known gaps:

- persisted conditional field such as `EscortUser -> Text16`
- multi-select choice
- user picker
- lookup inside a line-item table

## Scripts

Use bundled scripts rather than rewriting validators/builders:

- `scripts/validate-ywf-def.js`: validate decoded Def JSON in draft/final mode.
- `scripts/validate-ywf-def-against-yap.js`: validate Def mappings against extracted `.yap` metadata.
- `scripts/inspect-yap-package.js`: inspect `.yap` package structure and inventory.
- `scripts/extract-yap-metadata.js`: extract app/list/form/field metadata from `.yap`.
- `scripts/apply-ywf-metadata.js`: safely replace placeholders using metadata mapping.
- `scripts/build-ywf-wrapper.js`: base64 wrap validated decoded Def and round-trip validate.

Workflow action validation now covers missing required node properties, invalid enum values, invalid value types, `ContentList` mappings, `QueryData` filters, `SequenceFlow` conditions, `Loop`/`Delay` condition shapes, and unsafe external or credential-related workflow actions. Do not bundle sensitive values.

## Output Contract

For new form generation, output:

A. Requirement interpretation  
B. Decomposition table  
C. Native feature plan  
D. Custom code decision  
E. Dependency list  
F. Decoded Def draft when ready  
G. Validation reports  
H. Wrapper build result only if final validation passes  
I. Risks, assumptions, and sandbox test checklist

If metadata is missing, stop at draft mode and produce a dependency map.
