# Yeeflow Dashboard Design Standards

Generated dashboards should be useful operational pages, not landing-page artwork.

## Required Shell

Use:

- Type `103` app page
- `attrs.hideHeaderAll = true`
- zero page padding
- `Main` -> `Content`
- meaningful `nv_label` values

Do not invent dashboard `attrs.container.cw` until a real export proves it.

## Default Structure

```text
Main
└─ Content
   ├─ Page header
   ├─ Summary section
   ├─ Body section
   └─ Collection section or Empty state
```

`Page header` should explain the current page in concise business language. `Summary section` should show KPI/status cards. `Body section` should hold tables, Collections, charts, or operational shortcuts.

## Visual Style

Use:

- neutral page background
- white or token background cards
- subtle neutral borders
- limited soft shadow
- clear spacing rhythm
- primary blue only for active actions, selected states, and main calls to action

Avoid broad gradients, decorative graphics, and oversized hero composition unless the user explicitly asks for a marketing page.

## KPI And Status Cards

Use semantic colors:

- primary for total/current focus
- success for completed/approved
- warning for pending/attention
- danger for overdue/rejected/failed
- neutral for draft/inactive/reference

Cards should have concise labels, a clear value, and optional helper metadata. Avoid filler metrics.

## Collection Presentation

Use Collection controls for repeated list-style data when source lists are local and proven.

Recommended names:

- `Collection section`
- `Collection`
- `Collection item`
- `Table header`
- `Table row`
- `Status badge`

For table-style Collections, keep visible captions off on layout-only grids and rely on `nv_label` for designer readability.

## Empty States

Use business-friendly copy:

- state what is empty
- say what the user can do next
- avoid technical wording

Example: `No requests yet. Submitted requests will appear here after the workflow starts.`

## Validator Guidance

Warn when dashboards are missing hidden header, zero padding, `Main`, `Content`, meaningful `nv_label`, or use many arbitrary hard-coded colors.

## Runtime-Proven Generation Notes

The first Design System Request Tracker runtime package proved that a generated Type `103` dashboard with embedded page JSON should store `LayoutInResources[0].ID` and `LayoutInResources[0].RefId` as the dashboard `LayoutID` when the page resource is the runtime dashboard body. A separate resource ID imported successfully but rendered the dashboard as an empty designer placeholder. Use the dashboard `LayoutID` for the embedded resource unless a later export proves a safer split-resource pattern.

Keep `LayoutView = null`, `Ext2 = "{\"src\":true}"`, and `LayoutInResources[0].Resource` as the serialized page JSON. The runtime-proven shell still uses embedded `attrs.hideHeaderAll = true`, zero padding, and `Main` -> `Content`.
