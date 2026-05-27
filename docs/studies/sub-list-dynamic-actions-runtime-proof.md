# Sub List Dynamic Actions Runtime Proof

## Status

V1 runtime issue found. V1.2 YAPK has been generated, signed, and verified from the user-corrected V1.1 baseline. Manual runtime confirmation is still pending.

Generated package:

`/Users/Renger/Downloads/sub-list-dynamic-actions-runtime-proof.v1.yap`

Corrected baseline studied:

`/Users/Renger/Downloads/Sub List Dynamic Runtime Proof-V1.1.yapk`

Generated V1.2 output:

`/Users/Renger/Downloads/Sub List Dynamic Runtime Proof-V1.2-grid-fixed.yapk`

Local source package used as schema evidence:

`/Users/Renger/Downloads/Sub list Dynamic.yap`

## Package Scope

The generated package is `Sub List Dynamic Runtime Proof`. It contains one app-level Approval Form named `Dynamic Sub List Runtime Form`.

The request page contains one Sub List control using Dynamic content layout. The Sub List has three simple row fields:

- Item Name: text
- Quantity: number
- Notes: text

The form also includes a sibling `flex_grid` header above the Sub List to exercise the table-style header pattern learned from the export.

## V1 Runtime Feedback

The V1 generated package rendered the Dynamic Sub List and generally looked good, but the table-style header Grid was wrong:

- The header Grid rendered as one column rather than a multi-column header.
- The Grid Appearance settings could not expand in Designer.
- The Sub List display caption should be turned off for this table-style layout.
- The Dynamic item template should not rely on loose controls in the Sub List body; it should use the corrected Grid/body structure from the V1.1 YAPK.

## Corrected V1.1 Structure Learned

The user-corrected V1.1 YAPK stores the table-style area as a combined section: a container holds a header `flex_grid` followed by the Dynamic Sub List. The Sub List has `displayLabel = [null,false]`, `attrs["list-display-preference"] = "dynamic"`, and local `attrs.actions[]` for `list_new`, `list_dup`, `list_del`, and `list_import`.

Inside `list-body`, the first child is a matching `flex_grid` with export-shaped `attrs.columns`, `attrs.rows`, `cgap`, `cgapU`, `content`, and `displayLabel = [null,false]`. The header and body grids use the same column-track pattern, including narrow action/icon columns and aligned field columns.

The corrected header Grid uses object-shaped responsive column settings, for example breakpoint keys with `list` and `last` track definitions. The broken V1 header used an array/object hybrid that validated locally but rendered as one column and appeared to break the Designer Appearance panel.

## Actions Included

The generated Sub List keeps a small representative action set:

| UI action | Step type | Scope |
| --- | --- | --- |
| Add sub item / Add another item | `list_new` | Current list |
| Duplicate item | `list_dup` | Current object |
| Delete item | `list_del` | Current object |
| Import items | `list_import` | Current list |

Insert before/after, Move item, Update fields, and current-object expression examples are not included in this runtime proof package.

## Local Validation

Completed:

- Generator syntax check passed.
- Package validator passed with zero errors.
- Approval form definition validator passed with zero errors.
- Sub List dynamic inspector passed and detected one Approval Form, one Sub List, one Dynamic layout, and step types `list_new`, `list_dup`, `list_del`, and `list_import`.
- Schema-standard inspector passed with zero findings.
- Wrapper round-trip/decode smoke passed.
- Normalized JSON references parse.
- Safety scan found no raw package artifacts, screenshots, decoded payloads, `.env.local`, API responses, secrets, or conflict markers in commit-scoped files.

V1.2 follow-up:

- V1.1 YAPK wrapper parsed safely.
- V1.1 top-level `Resource` decoded with the tolerant Brotli path to complete `AppPackageInfo` JSON.
- V1.1 approval form `DefResource` decoded safely.
- Broken V1 YAP and corrected V1.1 YAPK were compared structurally.
- Generator was updated so the normal path creates a V1.2 YAPK from the corrected V1.1 baseline and keeps the old YAP path behind `--legacy-yap`.
- V1.2 YAPK generation passed.
- `setsign` returned a 32-byte signature.
- `verifysign` returned HTTP 200.
- V1.2 wrapper parse and standard Brotli decode passed.
- V1.2 Sub List inspection passed: one Approval Form, one Dynamic Sub List, caption off, body grid present, five body-grid column containers, Add/Import footer buttons, and action steps `list_new`, `list_dup`, `list_del`, and `list_import`.
- The stale standalone V1 header Grid was removed from V1.2 before signing.
- The body grid field controls were wrapped in column containers before signing.

Skipped due to local tool hangs:

- `validate-yap-graph.js`
- `scripts/inspect-yap-materialization.mjs`
- full `scripts/inspect-yap-import-readiness.mjs`
- `git status --short`

## Manual Runtime Test Instructions

Import:

`/Users/Renger/Downloads/sub-list-dynamic-actions-runtime-proof.v1.yap`

Then verify:

- The app imports successfully.
- The Approval Form opens.
- The Dynamic Sub List renders without missing binding or render errors.
- The header grid appears above the Sub List.
- Add another item works.
- Duplicate item works.
- Delete item works.
- Import items opens or behaves correctly.

Record the exact runtime result before promoting any action from pending to runtime-proven.

## Proof Boundary

This package is generated from export-proven Approval Form Dynamic Sub List schema and is pending manual runtime testing.

Runtime proof, once confirmed, applies only to this generated package, the Approval Form host, and the exact tested actions. It must not be generalized to all Sub List actions, Data List custom forms, workflow execution, current-object expression evaluation, scrollbar behavior, or row persistence.

For the V1.2 YAPK follow-up, the user-corrected V1.1 YAPK is the source of truth for the grid/header/body layout. V1.2 is generated/signed/verified, but remains runtime-pending until it is imported/upgraded and manually tested.
