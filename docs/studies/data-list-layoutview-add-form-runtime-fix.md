# Data List LayoutView Add Form Runtime Fix

## Issue

The generated package `container-button-action-runtime-proof.v1.yap` imported and opened, but the `Action Runtime Requests` Data List default `+ New item` button opened an Add modal that kept loading and never rendered the form.

Product feedback identified the cause as an incorrect `ListInfo.LayoutView` / `ListModel.LayoutView` shape for the generated Data List.

## Evidence

Broken generated shape, redacted:

```json
{
  "opentype": { "add": "modal" },
  "modalsize": { "add": 1 },
  "sort": [
    { "SortName": "Created", "SortByDesc": true }
  ]
}
```

The broken list had only one Type `0` view layout and no Type `1` New/Edit/View form layouts. `LayoutView.add`, `LayoutView.edit`, and `LayoutView.view` were missing, so the default New Item modal had no concrete add-form target.

Product-provided working comparison used an object with concrete layout references, redacted:

```json
{
  "add": "__ADD_FORM_LAYOUT_ID__",
  "edit": "default",
  "opentype": { "view": "new" },
  "sort": [
    [
      "__FIELD_ID__",
      "__FIELD_ID__"
    ]
  ],
  "view": "__VIEW_FORM_LAYOUT_ID__"
}
```

The exact IDs are package-local generated IDs and must resolve inside the package.

## Root Cause

The runtime-proof generator assumed the source package already contained usable custom form layouts. The source template only had a default Type `0` list view. The generator used optional chaining for `add/edit/view`, so `JSON.stringify` omitted those keys when no form layouts existed.

The generated Data List also put `[{ SortName, SortByDesc }]` into `ListModel.LayoutView.sort`. That object shape is widely used in Type `0` view layout JSON, but product comparison indicates Data List display settings expect either an export-shaped field-ID array or no sort setting.

## Fix

`generate-container-button-action-runtime-proof.mjs` now creates concrete Type `1` Data List form layouts:

- `New Item`
- `Edit Item`
- `View Item`

It assigns `ListModel.LayoutView.add/edit/view` to those generated layout IDs, keeps `opentype.add = "modal"` and `modalsize.add = 1`, and omits unsafe display-settings `sort`.

## Validator Hardening

Generated-final validation now fails when:

- `ListModel.LayoutView.add` is missing or resolves to `default`
- `LayoutView.add/edit/view` references do not resolve to local Type `1` layouts
- Data List display-settings `sort` is not an export-supported array shape
- Data List display-settings `sort` uses object entries such as `SortName` / `SortByDesc`

The old broken package now fails with:

- `LAYOUTVIEW_ADD_LAYOUT_MISSING`
- `LAYOUTVIEW_SORT_OBJECT_UNSUPPORTED`

## Regenerated Package

Manual-test package:

`/Users/Renger/Downloads/container-button-action-runtime-proof.layoutview-fixed.v1.yap`

Safe local inspection confirms:

- `LayoutView.add` resolves
- `LayoutView.edit` resolves
- `LayoutView.view` resolves
- Type `1` New/Edit/View layouts have embedded resources
- display-settings `sort` is omitted

## Local Proof

Local validation passed with zero errors:

- `validate-yap-package.js`: 0 errors
- `validate-yap-graph.js`: 0 errors
- `scripts/inspect-yap-materialization.mjs`: 0 errors, 0 warnings
- `scripts/inspect-data-list-custom-forms.mjs`: 0 findings
- `scripts/inspect-data-list-fields.mjs`: 0 findings
- `scripts/inspect-container-button-actions.mjs`: 0 findings
- `scripts/inspect-yap-import-readiness.mjs`: 0 errors
- wrapper decode/re-encode round trip: pass

Existing warnings are proof-boundary warnings for unproven field/control behavior and the intentionally minimal approval workflow, not LayoutView failures.

## Proof Boundary

This fix is local validator-backed and package-generated. Runtime rendering of the default `+ New item` Add modal remains pending until the fixed package is imported into Yeeflow and manually tested.
