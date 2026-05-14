---
name: yeeflow-application-generator
description: generate, inspect, validate, package, debug, and improve small yeeflow application-level .yap packages, including multi-list apps, app shells, app navigation, lookup relationships, approval forms, contentlist persistence, replaceids, exported-back .yap comparison, and sandbox app import/export learning.
---

# Yeeflow Application Generator

Use this skill for small Yeeflow `.yap` application packages that combine related data lists and approval forms. Keep v1 scoped to proven patterns: data lists, custom list forms, lookup relationships, simple approval forms, and `ContentList` persistence.

For component details, also use the installed skills:

- `yeeflow-data-list-generator` for `.ydl` child list structure, fields, views, custom forms, sample data, and lookup fields.
- `yeeflow-approval-form-generator` for approval form Def structure, request/approval pages, lookup controls, workflow graph, and `ContentList` mapping.
- For Knowledge Base-style local list plus dashboard packages, read `references/knowledge-base-app-pattern.md` and also use `yeeflow-dashboard-generator`.

## Standard Workflow

1. Decompose the app requirement into resources, relationships, and stop conditions.
2. Create a normalized app spec before generating package JSON.
3. Generate or patch decoded `.yap` Resource/Data JSON only after the graph is clear.
4. Validate child lists and approval forms where practical.
5. Validate the assembled app with `scripts/validate-yap-package.js`.
6. Validate app relationships with `scripts/validate-yap-graph.js`.
7. Build the wrapper with `scripts/build-yap-wrapper.js` only after validation passes.
8. Report sandbox import checklist and require export-back learning before production-like use.

Never import into Yeeflow or operate the UI unless the user explicitly asks. Preserve large numeric IDs as strings. Redact secret/token/client values.

## Supported v1 Package Shape

Use v1 for apps like `Department Access Management`:

- root app/listset shell
- child data lists in `Data.Childs[]`
- data-list fields, views, sample records, and custom forms
- internal lookup relationships between lists
- one or more simple approval forms in `Data.Forms[]`
- approval form lookup controls
- lookup additional field mappings
- approval workflow `ContentList` create/update actions targeting included lists
- workflow action validation against the normalized node/action configuration reference
- generated multi-type approval/list fields, including text, number, radio/dropdown, switch, and conditional display
- simple root navigation and one Type `103` app page

## Generated App UI/UX Standard

Use `docs/yeeflow-application-design-system.md` as the master reusable generated-app design system when present in the active workspace. Use `docs/yeeflow-application-ui-ux-standards.md`, `docs/yeeflow-application-layout-standards.md`, `docs/yeeflow-application-style-token-standards.md`, `docs/yeeflow-dashboard-ui-ux-patterns.md`, `docs/yeeflow-data-list-ui-ux-patterns.md`, and `docs/yeeflow-approval-form-ui-ux-patterns.md` as supporting references.

The first official reference export is `UI and UX design (1).yap`. It proves this native shell:

- dashboard pages set `attrs.hideHeaderAll = true`, page padding to `--sp--s0` on all sides, and use `Main` -> `Content` containers named through `nv_label`
- generated data lists include `Edit Item` and `View Item` custom forms; New/Edit map to `Edit Item`, View maps to `View Item`
- custom list forms use `attrs.container.cw = "2"`, zero padding, and `Main` -> `Content`
- approval form pages use `attrs.container.cw = "2"`, zero padding, `Main` -> `Content`, with business controls in `Form body` and workflow controls in `Form bottom`
- default approval forms include both `workflowControlPanel` and `workflowHistory` in `Form bottom` unless the user explicitly asks to omit them

Treat validator UI/UX standard findings as warnings until the first generated UI/UX standard package has passed runtime import/open and export-back comparison.

Runtime update: `Design System Request Tracker DSX` proved the generated design-system package pattern through import, dashboard render, Requests list query, Edit/View custom forms, approval form publish, submission form render, reviewer approval routing, approval completion, and workflow-created list record. Use its dashboard `LayoutInResources[0].ID = RefId = LayoutID` pattern for generated root app dashboards with embedded page JSON. Expect imported app-level approval forms to require publishing in Yeeflow Form Builder before submit/approve runtime testing.

Use `docs/yeeflow-root-style-token-reference.md` as the root style/design-token reference. Generated apps should use Yeeflow-native root style tokens such as `--c--primary`, `--c--success`, `--c--warning`, `--c--danger`, `--c--neutral-light-active`, `--fs--base`, and `--sp--s200` where supported. Avoid arbitrary custom colors and do not inject the full root stylesheet into generated apps. Do not require token references when a real Yeeflow export stores resolved hex values.

Generated apps should apply the Yeeflow Application Design System by default: use `Main` / `Content` containers, meaningful `nv_label` names, token-aligned colors and spacing, Edit/View custom forms for generated data lists, `Form body` / `Form bottom` approval pages, and clear dashboard sections plus Collection naming. Treat design-system validator findings as warnings until runtime import/open/export-back proof exists for the specific generated package.

Global page background rule: when any generated dashboard, data-list custom form, approval submission page, or approval task page needs a full-page background color, set it on the page/form background setting, not on `Main`. `Main` is a structural layout container. Only section/card/header-specific backgrounds should live on those specific containers.

Approval-form UI quality update: when the workspace includes `docs/yeeflow-form-design-quality-rules.md`, apply it to app-level approval forms. Rich request forms should set page-level background on `formdef.attrs.background`, add a `Form header` for request-summary panels, generate corrected inline text/icon controls, use the Text Style Sample native Text shape (`heading` controls, `[null, token]` typography, plain string `heads.color`), use square icon badge wrappers, organize normal fields with two-column `flex_grid` controls, full-span long controls, and use native `calculated` controls for formula fields where the expression is known.

CAPEX runtime baseline: `IT Hardware CAPEX Request v4 Text Standard` was generated by `generate-it-hardware-capex-request-v3.mjs` after the Runtime V2 design study and Text Style Sample study. The package imported, opened, rendered the approval form, and the generated Text control Typography and Text shadow designer popups opened successfully. Treat `docs/generated-it-hardware-capex-request-text-standard-baseline.md`, `docs/it-hardware-capex-request-runtime-v2-ui-study.md`, and `docs/yeeflow-text-control-generation-standards.md` as the current rich approval-form UI baseline before generating similar business applications.

Approval control anatomy update: when the workspace includes `docs/ai-training-approval-form-control-study.md`, use that study before adding broad native approval controls to an app package. It documents the export-backed variable/control binding model for `input`, `textarea`, `richtext`, choices, switches, numeric/date controls, file/image upload, user/department/location/cost center/metadata pickers, lookup, lookup-list, sublist/listref, data-list display, tabs, and action buttons. Do not promote those advanced controls into a generated `.yap` without resolved local app/list dependencies, fresh IDs, validator review, and focused runtime proof.

Approval Form Controls Test v2 runtime update: app-level packages can now use the proven advanced-input batch when scoped and validated: `percent`, `time`, `hyperlink`, `rate`, and `calculated`. The v2 package imported, opened, rendered the form, submitted, opened the reviewer task, approved, and created the target `ContentList` record. Keep `daterange` in partial-proof status until both mapped date fields are exposed and verified in a generated list view.

Approval Form Controls Test v6 runtime update: app-level packages can now use internal packaged single-select approval-form `lookup` controls and workflow-form `list` / `listref` controls when scoped and validated. The v6 package imported, opened source and target lists without `datas/query` 400, selected a packaged lookup record, populated readonly fields via `attrs.addition[]`, added/edited a list row, submitted, opened the reviewer task, approved, and created the target `ContentList` record. Do not persist raw lookup variables into plain text fields when the expected value is readable display text: v6 proved that this stores the internal local row ID. Use lookup addition/autofill variables or explicit summary variables for readable persistence. Direct child-row-to-data-list persistence for list/listref remains deferred; use a text summary or a separately modeled child list until export-backed proof exists.

Navigation contrast rule: when root `LayoutView.attrs.appearance` defines a header background and text color, generated apps should invert that pair for `LayoutView.attrs["navigator-menu"]`. Use the header text color as the navigator background and the header background as the navigator text/icon color. For the standard shell, use `appearance: { bgc: "var(--c--primary-light)", color: "var(--c--primary)" }` and `"navigator-menu": { bgc: "var(--c--primary)", color: "var(--c--primary-light)", position: "default" }`.

Theme color rule: generated `Data.AppThemes[].Config.neutral.lightmodel` should be `"Luminance"`, not `"Lightness"`.

Keep these out of scope in v1 unless the user asks for research only:

- dashboards beyond a minimal Type `103` shell page
- data reports and form reports
- AI Agents, Copilots, Connections, Knowledges
- document libraries, document generation, templates
- external HTTP/API actions
- complex list workflows or scheduled workflows

## Hard Stop Conditions

Stop before final `.yap` build if any of these are true:

- unresolved resource graph
- missing lookup target list or display/search field
- missing `ContentList` target list or target field
- invalid or incomplete root app shell
- missing root navigation or app page
- unresolved AI/connection/knowledge/document/external resources
- workflow action properties do not satisfy `workflow-action-configurations.normalized.json`
- placeholders remain in final mode
- validators fail
- sensitive credential-like resources would be copied
- production use is requested without sandbox import/export-back proof

## Current Advanced Baseline

Use Visitor Access Management v11 as the current advanced generated `.yap` baseline for small app packages.

Confirmed v11 settings:

- fresh `216...` local ID family
- fresh FlowKey/form key `VBB`
- `Data.Forms[].ListID = 0`
- `ProcModelID` carries the approval process ID
- app imported and passed runtime testing
- package, graph, approval form, and wrapper round-trip validations passed

Proven v11 field/control types:

- text/input
- number/input_number
- single select radio/dropdown using `radio` control plus `attrs.displayStyle = "dropdown"`
- switch/boolean
- conditional display using target control `attrs.control_display[]`

Proven v11 storage and `ContentList` mappings:

| Business field | Variable | Target |
| --- | --- | --- |
| Visitor Email | `VisitorEmail` | `Text13` |
| Visitor Phone | `VisitorPhone` | `Text14` |
| Number of Visitors | `NumberofVisitors` | `Decimal1` |
| Access Type | `AccessType` | `Text15` |
| Requires Escort | `RequiresEscort` | `Bit1` |

Sample value shapes:

- Decimal: numeric values
- choice/dropdown: selected option text
- data-list Bit/switch: `"1"` or `"0"`
- approval switch variable/control: boolean `true` or `false`

`EscortUser` is proven as a form-only conditional field shown when `RequiresEscort == true`; it is not persisted in v11.

## Child Data List Title Field Rule

HARD RULE: every generated child data list must preserve `FieldName: "Title"` as Yeeflow's native primary/display field.

Required metadata:

- `Status: 0`
- `IsSystem: true`
- `IsIndex: true`

Do not generate `Title` as an ordinary custom business field. Heep Hong IT eWorkflow Option A v7 proved that `Title` with `Status: 1`, `IsSystem: false`, and `IsIndex: false` can import and render list metadata while causing `api/crafts/datas/{AppID}/{ListID}/query` to fail with HTTP `400`. Option A v8 restored the native `Title` metadata and fixed the data-grid query.

Business labels such as `Request No.`, `Name`, `Equipment Name`, or `Center / Department Name` may be displayed on `Title`, but the underlying metadata must remain native/system/indexed. Use `Text1`, `Text2`, etc. for additional business fields.

## Root App Shell Rules

For generated packages, the root app shell is mandatory. Use the v5 baseline rules:

- top-level wrapper `Title`, `Description`, and non-null `IconUrl`
- `Resource.MainListType = 1024`
- root `Data.Item.ListModel.Type = 1024`
- root `CustomType = ""`
- root `Perm = 0`
- root `WorkspaceID` present
- root `LayoutView` navigation populated
- `Data.AppTags`, `Data.AppMetadatas`, and `Data.AppComponents` arrays present
- `Data.AppThemes` non-empty
- root `CreatedBy` and `ModifiedBy` populated

For root Type `103` app pages:

- include the page `LayoutID` in `ReplaceIds`
- for generated root dashboard pages with embedded page JSON, use the dashboard `LayoutID` for `LayoutInResources[0].ID` and `RefId`; Design System Request Tracker v1 proved that a separate generated resource ID can import but render as an empty designer placeholder
- for data-list persistence, prefer Text fallback for requester/user values unless a focused native data-list identity/user field export proves the persisted shape; approval forms may still use identity-picker/current-user values for workflow assignment when that pattern is proven
- Type `103` `LayoutInResources` resource IDs are excluded from `ReplaceIds`
- `LayoutInResources[0].Resource` must contain valid page JSON

Minimal dashboard-only exception: `Test Dashboard Only.yap` and the generated `generated-dashboard-minimal-v1.yap` runtime baseline prove that an empty dashboard shell can use `LayoutInResources: []`, `Ext2: "{\"src\":true}"`, and only two `ReplaceIds` (root app/ListSet ID plus dashboard `LayoutID`). Use `yeeflow-dashboard-generator` before generating dashboard-specific packages.

Read `references/baseline-department-access-management-v5.md` before changing app shell or Type `103` page logic.

## App-Level Approval Form Rules

- `Data.Forms[].ListID` must be numeric `0` for app-level approval forms.
- `ProcModelID` carries the generated approval process ID and should be included in `ReplaceIds`.
- Root navigation Type `105` should point to the form key.
- Use a fresh FlowKey/form key for every generated import-test package.
- Do not reuse a FlowKey/form key from a previously imported generated app unless explicitly testing update behavior.

## ReplaceIds And Lookup Sample Rules

Local app graph IDs should be included in `Resource.ReplaceIds`:

- root app/listset ID
- child list IDs
- field IDs
- view/custom form layout IDs
- data-list custom form resource IDs where the data-list rule requires it
- approval form/process IDs and form keys
- local sample record `ListDataID` values
- root Type `103` page `LayoutID`

Do not include external dependency IDs in `ReplaceIds`.

For standalone `.ydl` with external lookup sample data, external target record IDs must be excluded from the dependent package `ReplaceIds`.

For app-level `.yap` with internal lookup sample data:

- target sample record IDs are local package IDs
- include target sample record IDs in `ReplaceIds`
- dependent sample lookup values may reference those local target sample IDs as plain strings
- export-back from v5 proved Yeeflow remaps target records and dependent lookup values consistently

If grid display appears blank but export-back lookup values match exported target records, classify it as a runtime display/index/cache issue unless the item form lookup value or manually edited rows are also broken.

## ID And Expansion Strategy

- Every generated `.yap` import-test package needs a fresh local ID family.
- Do not reuse ID families from previously imported generated apps, even if the earlier import failed.
- Start from a known-good baseline.
- Add one field/change at a time for unproven field/control types.
- Multi-field expansion is allowed only after the underlying field/control types are proven by export-backed examples and generated import tests.
- Preserve proven field slots unless deliberately testing a new slot.

## Validation Commands

Use these from the project root or adapt paths to the current workspace:

```bash
node scripts/validate-yap-package.js ./app-def.json --mode generator --stage final
node scripts/validate-yap-graph.js ./app-def.json --mode generator --stage final --json ./app-graph.json --md ./app-graph.md
node scripts/validate-ywf-def.js ./extracted-approval-form-def.json --mode final
node scripts/validate-ydl-list.js ./extracted-child-list.json --mode generator --stage final
node scripts/build-yap-wrapper.js ./app-def.json ./app.yap --title "App Name" --description "Description"
```

For real historical exports, use compatibility mode:

```bash
node scripts/validate-yap-package.js "./Existing App.yap" --mode compatibility
node scripts/validate-yap-graph.js "./Existing App.yap" --mode compatibility
```

## References

Load only the relevant reference:

- `references/yap-structure-study.md`: `.yap` wrapper, root app, child resources, forms, reports/modules, ReplaceIds.
- `references/first-test-plan.md`: first safe app-generation test strategy.
- `references/baseline-department-access-management-v5.md`: successful v5 baseline and root app shell rules.
- `references/baseline-visitor-access-management-v11.md`: Visitor Access v5-v11 generated baselines, including v11 multi-type proof.
- `references/data-list-approval-integration-pattern.md`: generated data list plus approval form integration.
- `references/related-list-lookup-pattern.md`: standalone related-list lookup rules and `.yap` internal lookup contrast.
- `references/validate-yap-package.md`: package validator behavior.
- `references/validate-yap-graph.md`: graph validator behavior.
- `references/build-yap-wrapper.md`: wrapper builder usage and safety rules.
- `references/examples-summary.md`: proven baseline and quick pattern reminders.
- In the active generator workspace, use `docs/workflow-action-configuration-reference.md`, `docs/workflow-action-generation-rules.md`, and `workflow-action-configurations.normalized.json` as the official workflow action configuration reference when generating or validating workflow nodes.
- In the active generator workspace, use `control-configurations.normalized.json`, `field-configurations.normalized.json`, `docs/yeeflow-control-to-field-mapping.md`, and `docs/yeeflow-control-field-generation-rules.md` when planning approval-form controls, data-list persistence, custom list forms, and app-level control-to-field mappings.
- In the active generator workspace, use `workflow-action-config-validator.js` and `yeeflow-control-field-schema-utils.js` when available; these are the compact helper/validator entry points for workflow action and control/field schema checks.

## Workflow Action Configuration Reference

The app validator stack should validate workflow nodes against the normalized action reference when present. Stop before wrapper build on missing required node properties, invalid enum values, invalid value types, invalid `ContentList` mappings, invalid `QueryData` filters, invalid `SequenceFlow` conditions, invalid `Loop`/`Delay` condition shapes, and unsafe external or credential-related actions.

Treat `GenerateDocument`, `ConvertToPdf`, `AddWatermark`, and `DocumentRecognition` as partially supported until template/document-library dependencies are proven. Treat `AI`, `AzureOpenAI`, `Connector`, `HttpRequest`, `AcrobatSign`, `DocuSign`, and `PandaDoc` as external/credential-sensitive; do not bundle secrets, tokens, passwords, API keys, connection IDs, or tenant-specific credential values.

## Control-To-Field Mapping Rules

Use generation-safe mappings first: `input` to Text, `textarea` to Text, `input_number` to Decimal, `currency` to Decimal, `radio` to Text choice, `switch` to Bit, `datepicker` to Datetime, and resolved local `lookup` to a lookup field when the target field is lookup-compatible. Use the v6 lookup rule for app packages: persist readable lookup values through `attrs.addition[]` target variables or explicit summaries, and store raw row IDs only intentionally. Use fallback mappings for rich text, identity/organization/location/cost-center pickers, tag, metadata, and direct file/image binary persistence until runtime proof exists. Percent, hyperlink, and rate have generated runtime proof when mapped to Decimal/Text fields as documented in the coverage matrix. Defer signer, lookup-list, nested list row persistence, embedded data-list display, and calculated-column approval variables unless a focused export/import proves the structure.

## Output Expectations

When generating or debugging a `.yap`, report:

- files created or changed
- resource inventory
- generated IDs and `ReplaceIds` strategy
- lookup and `ContentList` mappings
- validation results
- wrapper build result, if built
- unresolved risks and stop conditions
- sandbox import/export-back checklist
