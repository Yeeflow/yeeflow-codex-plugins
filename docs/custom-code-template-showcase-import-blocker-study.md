# Custom Code Template Showcase Import Blocker Study

## Scope

This study investigates why `custom-code-template-showcase.v1.yap` imported into Yeeflow as an app shell but opened to the empty `Start to build with Components` state instead of materializing its generated lists, dashboard, approval form, workflow, and Custom Code controls.

Public form support remains untested and is not claimed.

## Finding

Two package materialization issues were found.

Primary root cause: the generator remapped tenant/user metadata from the Smart Lookup baseline into the showcase local ID family. The failed resource used generated `6182...` IDs for `TenantID`, `CreatedBy`, and `ModifiedBy`, and also listed those metadata IDs in `ReplaceIds`. Working generated apps keep tenant/user metadata as the real tenant values from the known-good baseline and reserve generated local IDs for app resources.

Secondary issue: the generated root Type `103` dashboard layout used the dashboard page `LayoutID` as its owning `ListID`.

Failed shape:

```json
{
  "rootListId": "6182000000000000000",
  "layoutId": "6182000000000000001",
  "layoutListId": "6182000000000000001"
}
```

Working generated app packages use a different ownership rule:

```json
{
  "rootListId": "<root app/listset id>",
  "layoutId": "<dashboard page layout id>",
  "layoutListId": "<root app/listset id>",
  "LayoutInResources[0].ID": "<dashboard page layout id>",
  "LayoutInResources[0].RefId": "<dashboard page layout id>"
}
```

The failed package did contain real resources after wrapper decode:

- Root app shell: present.
- Root navigation: present.
- Dashboard page JSON: present.
- Data lists: 9 present.
- Approval form: 1 present.
- Custom Code controls: 25 present.
- Public form controls: 0.

The resources were therefore not missing from the wrapper. The app shell imported, but the importer did not materialize the embedded resources. Runtime evidence showed the app tile was created while the app opened to `Start to build with Components`.

## Working Comparison

Compared references:

- `custom-code-smart-lookup-picker-test.resource.json`
- `employee-family-implant-app-def.v3.json`

Both working references keep tenant/user metadata as real tenant/user IDs. Generated local IDs are used for app/list/page/form/list-data resources only.

Both working references also keep root Type `103` layouts owned by the root app/listset `ListID`, while `LayoutID` and `LayoutInResources[0].ID/RefId` identify the page resource.

The patched showcase package now matches that materialization shape and passes the focused materialization inspection.

## Patch

Patched `generate-custom-code-template-showcase-v1.mjs`:

- Preserve baseline tenant/user metadata instead of remapping it to `6182...`.
- Build `ReplaceIds` from generated local app-resource IDs only.
- `data.Item.Layouts[0].LayoutID = nextId(1)`
- `data.Item.Layouts[0].ListID = nextId(0)`
- `LayoutInResources[0].ID = nextId(1)`
- `LayoutInResources[0].RefId = nextId(1)`
- root navigation Type `103` keeps `ListID = nextId(1)` and `ListSetID = nextId(0)`

This preserves the proven page-reference pattern while restoring the root app ownership relationship.

## Validator Added

Added `scripts/inspect-yap-materialization.mjs`.

The validator checks:

- root app model exists and is Type `1024`
- root navigation has at least one Type `103` page
- Type `103` navigation entries point to existing root layouts
- Type `103` root layouts are owned by the root app/listset `ListID`
- `LayoutInResources[0].ID` and `RefId` equal the page `LayoutID`
- child data lists are reachable from root navigation
- data-list navigation entries point to packaged child lists
- child list layouts are owned by their own list IDs
- packaged approval forms use `Data.Forms[].ListID = 0`
- approval forms are represented in root navigation when forms are included
- root tenant/user metadata has not been remapped into the generated local app ID family

This catches both locally detectable empty-shell risks found during this investigation.

## Current Status

The patched showcase package passes local materialization inspection and the normal local validation chain. A pre-metadata-fix runtime smoke import still opened as an empty shell. A fresh post-metadata-fix runtime import was created as `Custom Code Template Showcase Materialization Retest 20260518`, but opening the detected runtime route still showed the empty `Start to build with Components` state. This means the showcase package is still not runtime-proven as materialized.

To isolate whether generated `.yap` import was broadly broken, a separate minimal package was generated:

- Package: `one-list-materialization-smoke-test.v1.yap`
- App: `One Data List Materialization Smoke Test`
- Contents: one root Type `103` home page, one data list, two sample records, no approval forms, no Custom Code controls
- Local result: package, graph, wrapper round trip, and materialization inspection passed; materialization inspection only warned that no approval forms were present
- Runtime result reported by user on 2026-05-18: installed and test passed

This proves the current Yeeflow tenant can import and materialize a simple generated app package. The remaining showcase blocker is therefore not a blanket import/wrapper failure. Focus the next investigation on structural differences between the one-list materialization smoke package, the Smart Lookup focused package, and the full showcase package.

Template runtime proof status is unchanged:

- `smart-lookup-picker`: previously runtime-proven in the focused app, not yet retested in this showcase package.
- Other 12 templates: not runtime-proven.
- Public form support: not claimed.
