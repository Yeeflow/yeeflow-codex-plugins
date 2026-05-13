# Knowledge Base App Pattern

Source studied: `/Users/Renger/Downloads/Knowledge Base_1.yap`

Use this when generating a small Knowledge Base-style `.yap` app that combines local lists and dashboard pages.

## Safe Runtime-Proven Scope

Generate:

- one root app/listset
- one Type `103` Home dashboard page
- local `Categories` list
- local `Articles` list
- plain text article category labels
- local category/article sample rows
- root navigation for Home, Categories, and Articles

Defer:

- `Sections`
- article-to-category lookup metadata
- richtext article bodies
- icon-upload images
- article detail pages
- nested category-to-article dashboard Collections
- Search query-param flow
- Admin application-URL cards
- forms, workflows, reports, AI modules, connections, document libraries

## App Shell Rules

- root app/listset keeps `CustomType: ""`, `Perm: 0`, non-null `IconUrl`, `WorkspaceID`, `CreatedBy`, and `ModifiedBy`
- root `LayoutView.sort[]` includes duplicate Type `103` entries for the Home dashboard when following the proven dashboard shell pattern
- local list navigation entries point to included child list IDs
- `AppTags`, `AppMetadatas`, `AppComponents`, `AppThemes`, and `OtherModules` are present as arrays
- child lists keep app-level metadata in the proven generated shape: populated `TenantID`, `CreatedBy`, and `ModifiedBy`, with child `WorkspaceID: null`
- do not add an ad hoc `ListSetID` property directly to the root `ListModel`

## ReplaceIds Rules

Include:

- root ListSetID
- dashboard LayoutID
- local list IDs
- generated field IDs
- generated list view/layout IDs
- local sample row IDs

Exclude:

- tenant/user IDs
- AppID
- any external dependency IDs

## Runtime Checklist

- import metadata parses app name and icon
- app appears in Shared Workspace
- Home dashboard opens and renders
- local list navigation renders
- Categories and Articles list queries do not return `400`

## Runtime Lessons

- v1 imported and opened but showed Yeeflow's empty component shell, so import alone is not enough.
- v2/v3 rendered Home/Categories, but Articles stayed on the loading spinner.
- v4 passed after correcting child-list metadata, keeping list `LayoutView: null`, removing the first-stage lookup, and preserving native `Title.FieldIndex: 0`.
