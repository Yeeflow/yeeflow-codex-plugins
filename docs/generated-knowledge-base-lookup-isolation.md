# Generated Knowledge Base Lookup Isolation

Scope: article-to-category lookup learning after the runtime-proven `knowledge-base-generated-v4.yap` baseline.

Source export studied: `/Users/Renger/Downloads/Knowledge Base_1.yap`

## Source Lookup Pattern

The real Knowledge Base source stores article category lookup metadata on the `Articles` list as:

- `FieldName: "Text4"`
- `DisplayName: "Category"`
- `InternalName: "Category"`
- `FieldType: "Text"`
- `Type: "lookup"`
- `FieldIndex: 4`
- `Rules.listid`: local `Categories` list ID
- `Rules.listsetid`: root app/listset ID
- `Rules.listfield`: `Title`
- `Rules.displayStyle`: `dropdown`

Article sample lookup values are plain target category `ListDataID` strings in `Text4`.

## Isolation Results

| Package | Change tested | Validation | Runtime result |
| --- | --- | --- | --- |
| `knowledge-base-lookup-v5.yap` | Added `Articles.Text3` lookup to local `Categories.Title`, with local category sample IDs in article rows | package passed with `APP_THEME_EMPTY`; graph passed | imported; Home and Categories rendered; Articles stayed on loading spinner |
| `knowledge-base-lookup-v6-empty-samples.yap` | Kept `Articles.Text3` lookup but blanked article lookup sample values | package passed with `APP_THEME_EMPTY`; graph passed | imported; Home and Categories rendered; Articles stayed on loading spinner |
| `knowledge-base-lookup-v7-hidden-lookup-column.yap` | Kept `Articles.Text3` lookup, blank sample values, and hid lookup from Articles list view | package passed with `APP_THEME_EMPTY`; graph passed | imported; Home and Categories rendered; Articles stayed on loading spinner |
| `knowledge-base-lookup-v8-text4-lookup.yap` | Moved lookup to source-like `Articles.Text4`, kept blank values, and hid lookup from Articles list view | package passed with `APP_THEME_EMPTY`; graph passed; wrapper round-trip passed | imported; Home dashboard rendered; Categories and Articles stayed on loading spinners |
| `knowledge-base-lookup-v9-text4-only.yap` | Started from the runtime-proven v4 shape, added only blank source-like `Articles.Text4` lookup metadata, omitted the generated `Text3` placeholder, and kept the lookup hidden from the list view | package passed with `APP_THEME_EMPTY`; graph passed; wrapper round-trip passed | imported; Home dashboard rendered; Categories opened with 3 rows; Articles stayed on loading spinner |
| `knowledge-base-text4-input-v10.yap` | Started from the runtime-proven v4 shape and added `Articles.Text4` as a plain input field instead of lookup metadata | package passed with `APP_THEME_EMPTY`; graph passed; wrapper round-trip passed | imported and app tile appeared; app-open/list runtime verification is pending because Chrome accessibility and screenshot access failed during the verification step |

## Current Finding

The v5-v7 failures show that using `Text3` for the generated lookup is not safe for the Knowledge Base article list. The failure still occurred when lookup sample values were blank and when the lookup was hidden from the visible list layout, so the issue is not only sample-value remapping or visible-column rendering.

The v8 failure shows that moving the lookup to source-like `Text4` is still not sufficient. Because both `Categories` and `Articles` stayed on loading spinners while the static Home dashboard rendered, the lookup field shape or list metadata still has an unresolved runtime dependency.

The v9 result narrows that finding: with the generated `Text3` placeholder removed and only `Articles.Text4` lookup metadata added, `Categories` opens correctly again while `Articles` stays on a loading spinner. This points to the article list lookup metadata itself rather than the category list definition or a generated `Text3` field-slot collision.

The v10 package isolates the `Text4` field slot without lookup metadata. It imported and produced a workspace tile, but the app-open smoke test could not be completed in the current session because Chrome returned `cgWindowNotFound` through Computer Use and the screenshot surface was black. Do not mark plain `Text4` field-slot runtime as proven until v10 opens and both generated lists render.

## Generator Rules

- Do not add article lookup fields to Knowledge Base generated packages until a source-like lookup package is runtime proven.
- Keep the v4 plain text `Category Label` baseline as the safe production baseline.
- When reintroducing lookup, prefer source-like field slots:
  - `Text2`: Content or deferred content slot
  - `Text3`: Feature image slot
  - `Text4`: Category lookup
  - `Text5`: Section lookup
- Add only one lookup relationship per isolation package.
- Keep lookup sample values blank until lookup metadata alone opens cleanly.
- After lookup metadata opens, run a second package with local target sample row IDs in lookup values and include those local target IDs in `ReplaceIds`.
- v8/v9 prove that `Articles.Text4` lookup metadata alone is not yet safe; the next isolation must finish the plain `Text4` field-slot smoke test before reducing or source-aligning lookup metadata.
- v10 should be opened and verified before any new package is generated. If v10 passes, the lookup metadata is the failure trigger. If v10 fails, field ordering or non-contiguous generated `Text4` usage is itself unproven.

## Stop Conditions

Stop before promoting lookup support if:

- Articles list stays on a loading spinner after import.
- Chrome/network evidence cannot be collected due local browser permission limits.
- lookup target list or display field cannot be resolved by `validate-yap-graph.js`.
- a generated lookup would need to reuse imported/remapped IDs from a previous package.
