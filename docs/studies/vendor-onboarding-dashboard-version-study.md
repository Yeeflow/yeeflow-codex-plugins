# Vendor Onboarding Dashboard Version Study

## Context

The Vendor Onboarding import/debug loop reached successful import with the V1.9 generated YAP candidates. After import, the generated `Home` dashboard appeared to use an older dashboard shell. A user-edited dashboard named `New Dashboard` was then added in Yeeflow using the current dashboard designer and exported as:

`~/Downloads/Vendor Onboarding & Compliance Managementv1.93.yap`

The raw export is intentionally not committed. This study records only normalized structural findings.

## Dashboards Found

The export contains two root application page layouts under `ListExportInfo.Item.Layouts[]`:

- `Home`
- `New Dashboard`

Both are `Type = 103` dashboard/application page layouts. No `DataReports`, `AppComponents`, or `AppGroups` were required for either dashboard in this export.

## Home Dashboard Finding

`Home` is the older generated dashboard shell:

- Location: `Item.Layouts[]`
- Type: `103`
- `LayoutView`: empty string
- `Ext2`: empty string
- `LayoutInResources`: null or missing after export

This shape imports but does not represent the current dashboard shell created by the current Yeeflow dashboard designer.

## New Dashboard Finding

`New Dashboard` is the current dashboard shell created manually in Yeeflow:

- Location: `Item.Layouts[]`
- Type: `103`
- `LayoutView`: `null`
- `Ext2`: `{"src": true}`
- `LayoutInResources`: empty array

This is export-proven from the user-created dashboard in the imported application. The export proves the current blank dashboard shell, not yet the storage shape for rich current-version dashboard controls.

## Structural Diff

| Area | Old `Home` | Current `New Dashboard` | Conclusion |
| --- | --- | --- | --- |
| Storage location | `Item.Layouts[]` | `Item.Layouts[]` | Current dashboards are still root Type 103 layouts. |
| `LayoutView` | `""` | `null` | Current shell uses `null`. |
| `Ext2` | `""` | `{"src": true}` | Current shell uses the `src` marker. |
| `LayoutInResources` | null or missing | `[]` | Current blank dashboard shell uses an empty array. |
| Navigation | `Home` is present in root navigation | `New Dashboard` was not present in root navigation sort | Generator should still register generated `Home` in root navigation. |

## Current Dashboard Generation Rule

For generated app `Home` dashboards, use this export-proven current shell:

```json
{
  "Type": 103,
  "Title": "Home",
  "LayoutView": null,
  "Ext1": null,
  "Ext2": "{\"src\":true}",
  "Ext3": null,
  "IsDefault": false,
  "IsItemPerm": false,
  "LayoutInResources": []
}
```

Root navigation should still include a `LayoutView.sort[]` item:

- `Type`: `103`
- `ListID`: the generated `Home` `LayoutID`
- `ListSetID`: the generated root application/ListSet `ListID`
- `AppID`: `41`

## Generator Implications

- Generate new application dashboards with `LayoutView: null`, `Ext2: "{\"src\":true}"`, and empty `LayoutInResources`.
- Preserve the prior import-learned rules: `AppID = 41`, API-issued IDs, populated `ReplaceIds`, correct `ListSite_<root ListID>` `CustomType`, integer `Field.Category`, unique IDs, and `ListExportResult` resource shape.
- Do not assume rich current-dashboard control content can be embedded using the older inline page-resource model until a current-dashboard-with-controls export proves the content shape.

## Validator Implications

Generated-final validators should report:

- `DASHBOARD_USES_LEGACY_SCHEMA` when a generated empty Type 103 dashboard uses blank `LayoutView` or lacks the `Ext2` current marker.
- `DASHBOARD_CURRENT_VERSION_MARKER_MISSING` when `Ext2` does not parse to `{ "src": true }`.
- Existing dashboard resource checks still apply when a dashboard includes inline page resources.

The supplied product-team JSON schema still declares dashboard `LayoutView` as a string. The v1.93 export itself uses `LayoutView: null` on `New Dashboard`, so strict schema validation reports that single type mismatch for the export-proven current shell. The current branch therefore treats this as a schema/export drift note rather than a generator regression.

## Proof Boundary

`New Dashboard` structure is export-proven from the user-edited v1.93 export. The exact runtime behavior is proven only by the user-created dashboard existing in the imported app. Generated-current-dashboard behavior must be proven by importing a new generated candidate and confirming that `Home` opens with the current dashboard version.
