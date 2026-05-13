---
name: yeeflow-data-list-generator
description: generate, inspect, validate, package, debug, and improve yeeflow data list definitions, .ydl exports, list metadata, lookup relationships, custom list forms, views, and data-list sample data
---

# Yeeflow Data List Generator

Use this skill when the user asks to inspect, validate, generate, package, debug, or improve Yeeflow data-list `.ydl` exports or decoded data-list JSON.

## Standard Workflow

Follow the staged path:

```text
business requirement
  -> decomposition
  -> normalized data-list spec
  -> decoded .ydl draft
  -> structural validation
  -> app-context/dependency validation when needed
  -> wrapper build
  -> sandbox import by user/operator
  -> export-back learning
```

Prefer native Yeeflow list features first: fields, Rules, lookups, views, custom list forms, sample data, and list workflows only when truly needed.

## Hard Stop Conditions

Do not build a final `.ydl` when:

- placeholders remain
- `validate-ydl-list.js --mode generator --stage final` fails
- required app/list/field metadata is missing
- lookup targets or target display fields are unresolved
- sample lookup values are unknown or unsafe
- external resolved lookup IDs would be included in `Resource.ReplaceIds`
- production IDs are guessed
- custom form bindings are unresolved
- workflow, AI, HTTP/API, credential, user, file, or external dependencies are unresolved
- no sandbox import/export round trip has proven production readiness

Do not import anything, operate Yeeflow UI, or modify original exports unless the user explicitly asks.

## Scripts

Use bundled scripts from `scripts/`:

- `inspect-ydl-package.js`: decode `.ydl` and inventory fields, views, forms, workflows, lookups, sample data.
- `extract-ydl-metadata.js`: extract machine-readable metadata from one or more `.ydl` files.
- `validate-ydl-list.js`: validate decoded data-list JSON or `.ydl` wrapper.
- `validate-ydl-against-yap.js`: validate list dependencies against `.yap` metadata or compatible metadata.
- `build-ydl-wrapper.js`: build `.ydl` wrapper only after final validation passes.

Common commands:

```bash
node scripts/validate-ydl-list.js ./draft.json --mode generator --stage draft
node scripts/validate-ydl-list.js ./final.json --mode generator --stage final --dependency-map ./dependencies.json
node scripts/build-ydl-wrapper.js ./final.json ./output.ydl --title "List Name" --description "Sandbox generated list" --dependency-map ./dependencies.json
```

## References

Load only the relevant reference:

- `references/operating-playbook.md`: end-to-end rules and readiness levels.
- `references/ydl-structure-study.md`: wrapper format and decoded structure.
- `references/baseline-asset-inventory-v5.md`: proven single-list custom form baseline.
- `references/related-list-lookup-pattern.md`: staged lookup and sample-data rules.
- `references/approval-form-integration-pattern.md`: generated storage list handoff to approval-form `ContentList` persistence.
- `references/knowledge-base-list-pattern.md`: Knowledge Base category/article list and lookup pattern.
- `references/validation-guide.md`: validator and builder usage.
- `references/metadata-guide.md`: `.ydl` and `.yap` metadata lessons.
- `references/examples-summary.md`: proven examples and intentionally omitted bulky artifacts.

## Generation Rules

- Use `AppID: 41` for sandbox/test packages unless target metadata says otherwise.
- Generate large numeric string IDs for sandbox `ListSetID`, `ListID`, `FieldID`, `LayoutID`, and sample `ListDataID`.
- For production or existing apps, use confirmed metadata only.
- HARD RULE: preserve `FieldName: "Title"` as Yeeflow's native primary/display field in every generated data list. `Title` must keep `Status: 0`, `IsSystem: true`, and `IsIndex: true`. Do not treat `Title` as a normal custom business field.
- Business concepts such as "Request No.", "Name", "Equipment Name", or "Center / Department Name" may be displayed on `Title`, but the underlying `Title` metadata must remain native/system/indexed. Use `Text1`, `Text2`, etc. for additional business text fields.
- Use `Decimal` + `input_number` fields for persisted numbers; `Decimal1` is the proven generated slot in Visitor Access Management v11.
- Use `Bit` + `switch` fields for persisted booleans; `Bit1` is the proven generated slot in Visitor Access Management v11.
- Use text/radio-compatible fields for single-select storage; selected option values are stored as text.
- Custom forms must follow the Asset Inventory v5 pattern:
  - `Layout.Type = 1`
  - `Layout.LayoutView = null`
  - `Layout.Ext2 = "{\"src\":true}"`
  - `Layout.IsItemPerm = false`
  - `LayoutInResources[0].ID = LayoutID`
  - `LayoutInResources[0].RefId = LayoutID`
  - `LayoutInResources[0].Resource` is a JSON string with `children`, `attrs`, `title`, `filterVars`, `ver`, `tempVars`
  - `Item.ListModel.LayoutView.add/edit/view` points to the custom form `LayoutID`
- Single lookup sample values are plain target record `ListDataID` strings.
- For staged standalone related lists, import/export the reference list first, patch the dependent lookup to real metadata, and exclude external lookup IDs from `Resource.ReplaceIds`.
- For app-level `.yap` internal lookup samples, target sample record IDs are local IDs, should be included in `ReplaceIds`, and dependent lookup sample values may reference those local IDs.
- For generated lists intended as approval-form storage targets, build/import/export the `.ydl` first, then use exported-back list and field metadata to patch the approval form `ContentList` target.

## Field Type And Sample Rules

Generated `.ydl` lists and `.yap` child lists can now use these proven field shapes:

| Intent | FieldName example | FieldType | Type | Sample value |
| --- | --- | --- | --- | --- |
| text | `Text13` | `Text` | `input` | string |
| number | `Decimal1` | `Decimal` | `input_number` | numeric value |
| single select storage | `Text15` | `Text` | `radio` | selected option text |
| boolean switch | `Bit1` | `Bit` | `switch` | `"1"` or `"0"` |

Custom list forms should use matching bound controls for these fields:

- number fields: `input_number`
- choice/dropdown storage: `radio` or dropdown-compatible radio attrs when supported by the form pattern
- switch fields: `switch`

When an approval form writes to a generated data list, require compatible mappings:

- text variables -> `Text/input`
- number variables -> `Decimal/input_number`
- radio/dropdown text variables -> `Text/radio`
- boolean switch variables -> `Bit/switch`

## Approval Form Storage Integration

When a generated data list will store records created by a generated approval form:

1. Generate and validate the data list first.
2. Build the `.ydl` only after final validation passes.
3. The user imports the `.ydl` and exports the imported list back.
4. Extract exported-back `AppID`, `ListSetID`, `ListID`, `FieldName`, `InternalName`, and `FieldID` values.
5. Hand that metadata to the approval-form generator.
6. Patch the approval form `ContentList` target and mappings from exported-back metadata.
7. Build the final `.ywf` only after approval-form structural and app-context validations pass.

Do not let the approval form target pre-import generated list IDs for production-like testing.

## Staged Integration Checklist

- data list final validation passed
- `.ydl` wrapper round-trip validation passed
- user imported data list
- user exported data list back
- exported-back metadata extracted
- external lookup sample IDs excluded from `Resource.ReplaceIds`
- approval form `ContentList` target patched to exported-back list metadata
- approval form validates against generated-list metadata
- approval `.ywf` wrapper round-trip validation passed

## Output Expectations

When generating, report:

- requirement decomposition
- native feature plan
- normalized spec
- dependency map
- decoded draft/final path
- validation results
- wrapper build result if created
- stop conditions and sandbox limitations
