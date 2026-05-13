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

## Current Finding

The v5-v7 failures show that using `Text3` for the generated lookup is not safe for the Knowledge Base article list. The failure still occurred when lookup sample values were blank and when the lookup was hidden from the visible list layout, so the issue is not only sample-value remapping or visible-column rendering.

The v8 failure shows that moving the lookup to source-like `Text4` is still not sufficient. Because both `Categories` and `Articles` stayed on loading spinners while the static Home dashboard rendered, the lookup field shape or list metadata still has an unresolved runtime dependency. Do not generate the next lookup package with local lookup sample IDs until lookup metadata alone opens cleanly.

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
- v8 proves that `Articles.Text4` metadata alone is not yet safe; the next isolation must reduce or source-align list metadata rather than add sample values.

## Stop Conditions

Stop before promoting lookup support if:

- Articles list stays on a loading spinner after import.
- Chrome/network evidence cannot be collected due local browser permission limits.
- lookup target list or display field cannot be resolved by `validate-yap-graph.js`.
- a generated lookup would need to reuse imported/remapped IDs from a previous package.
