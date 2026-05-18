# Yeeflow Document Library Resource Structure

Source studied: `Projects Center.yap` from a read-only local decode.

Raw decoded payloads were kept under ignored `tmp/` inspection folders only. Tenant, user, and raw package metadata are intentionally omitted from this study.

## Resources Found

| Library | Resource type | App placement | Export role |
| --- | --- | --- | --- |
| Documents | `ListModel.Type = 16` | Child resource under the application/listset | Configured document library with custom lookup fields, multiple views, and assigned New/Edit/View custom forms |
| New Document library | `ListModel.Type = 16` | Child resource under the application/listset | Newly created/minimal document library with default document fields and one upload form |

Normal data lists in the same app use `ListModel.Type = 1`. Report-like resources use other type values, such as `64`. This makes document libraries distinguishable from normal data lists.

## Resource Model

Document libraries live in `Data.Childs[]`, using the same outer child-resource envelope as data lists:

- `ListModel`
- `Defs`
- `Layouts`
- `ListDatas`
- `FlowMappings`
- `PublicForms`
- `RemindRules`

The differentiator is `ListModel.Type = 16`. The studied libraries also use:

- `CustomType = "ListSite_<root app list id>"`
- `WorkspaceID`
- `TableCode = "flowcraft"`
- `IndexCode = "flowcraft"`
- `Perm = 4`
- `Flags = 1`
- `IsItemPerm = true`
- `AdvanceList = []`

## App Linkage

The root application `LayoutView.sort[]` includes navigation entries for both document libraries. Each entry points to the library `ListID`, carries `Type = 16`, and uses the root app/listset ID as `ListSetID`.

Document libraries therefore need both:

- a child resource under `Data.Childs[]`
- a root navigation item in the app/listset layout metadata

## ReplaceIds

The export uses normal app-level `ReplaceIds` behavior for local generated resource IDs. No document-library-specific replacement map exception was proven except this caution: file/document payload IDs must not be generated or remapped until a focused upload/export-back test proves their safe shape.

## Similarities To Data Lists

- Same child-resource envelope.
- Same `Defs[]` field model.
- Same Type `0` view layout model when a configured view exists.
- Same Type `1` custom form model when a custom form exists.
- Same lookup field `Rules` model for custom lookup fields.
- Same field/list/form reference integrity risks.

## Differences From Data Lists

- `ListModel.Type = 16`, not `1`.
- Native document fields differ from generated data-list Title rules.
- The `Title` field in studied document libraries has `Status = 1`, while generated normal data-list baselines require `Status = 0`.
- Upload behavior is represented by `Text4` with a `file-upload` control and library-specific rules.
- Folder support appears through `Bigint1` / `ParentID`.
- Newly created libraries may have an empty/default view `LayoutView`, while configured libraries use normal view JSON.

## Stop Conditions

Stop generation or runtime testing if:

- Type `16` cannot be preserved.
- the upload field `Text4` cannot be represented as a document-library file-upload field.
- the parent/folder field shape is unclear.
- raw file payloads or private document metadata would be bundled.
- app navigation does not point to the document library resource.
