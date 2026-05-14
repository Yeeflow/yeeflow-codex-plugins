# Approval Form Control Runtime Coverage Matrix

Date: 2026-05-14

Sources:

- `docs/ai-training-approval-form-control-study.md`
- `docs/generated-approval-form-controls-test-baseline.md`
- `docs/generated-approval-form-controls-test-v2-baseline.md`
- `control-configurations.normalized.json`
- `field-configurations.normalized.json`

This matrix separates export-backed control anatomy from generated runtime proof. A control is not considered generation-safe just because it appeared in `AI Training.yap`; it becomes runtime-proven only after a generated package imports, opens, renders the control, submits, completes the approval task, and persists the expected value when persistence is in scope.

## Status Legend

| Status | Meaning |
| --- | --- |
| Proven | Generated package passed import/open/render/submit/approval/persistence for the control or infrastructure behavior. |
| Partially proven | Generated package rendered the control, but value entry or persistence was not fully exercised. |
| Schema-supported but untested | Normalized schema or export anatomy exists, but no focused generated runtime package has proved it yet. |
| Runtime-sensitive | Shape depends on tenant metadata, uploads, source lists, tree data, listrefs, or unresolved runtime behavior. |
| Deferred | Do not generate by default until a focused export/import proof exists. |

## Matrix

| Control | Variable type | AI Training | v1 included | Runtime status | Reason / next test |
| --- | --- | --- | --- | --- | --- |
| `input` | `text` | Yes | Yes | Proven | Request Title submitted and persisted to `Title`. |
| `textarea` | `text` | Yes | Yes | Proven | Rendered on submit/review pages. Persist long text in a later form-focused run if needed. |
| `richtext` | `text` | Yes | Yes | Partially proven | Editor rendered after loading, but formatted value entry/persistence was not exercised. |
| `input_number` | `number` | Yes | Yes | Proven | Quantity accepted numeric input and persisted. |
| `currency` | `number` | Yes | Yes | Proven | Unit Price accepted USD value and participated in calculation/persistence. |
| `percent` | `number` | Yes | Yes | Proven | v2 accepted `25.00%`, displayed it on the approval task, used it in calculation, and persisted it to the list view. |
| `radio` | `text` | Yes | Yes | Partially proven | Dropdown rendered in v1, but value was not selected. Test in a choice-focused package. |
| `checkbox` | `text` | Yes | Yes | Proven | Selection rendered, reviewed, and persisted as a JSON-like array string. |
| `switch` | `boolean` | Yes | Yes | Proven | Rendered and persisted OFF/ON-compatible values. |
| `datepicker` | `date` | Yes | Yes | Proven | Date rendered and persisted. |
| `daterange` | `date` | Yes | Yes | Partially proven | v2 accepted from/to values and displayed them on the approval task; a later package should expose both mapped date fields in the list view. |
| `time` | `date` | Yes | No | Proven | v2 accepted `10:30:00`, displayed it on the approval task, and persisted it to the list view. |
| `file-upload` | `file` | Yes | Yes | Partially proven | Upload button rendered; no file was uploaded. Stage 3 tests actual upload. |
| `icon-upload` | `img` | Yes | No | Runtime-sensitive | Requires focused upload/media proof. Stage 3 after file upload. |
| `identity-picker` | `user` | Yes | Yes | Proven | Current user resolved and reviewer task assignment worked. |
| `organization-picker` | `groupselect` | Yes | No | Runtime-sensitive | Depends on tenant organization tree. Stage 4. |
| `location-picker` | `location` | Yes | No | Runtime-sensitive | Depends on tenant location metadata. Stage 4. |
| `cost-center-picker` | `costcenter` | Yes | No | Runtime-sensitive | Depends on tenant cost center metadata. Stage 4. |
| `metadata` | `metadata` | Yes | No | Deferred | Requires known `source` and `categoryId`; do not guess. Stage 5 only with resolved metadata. |
| `mutiple-metadata` | `mutiple-metadata` | Yes | No | Deferred | Same metadata source risk plus multi-value shape. |
| `lookup` | `lookup` | Yes | Yes | Partially proven | Internal lookup rendered in v1 but no value was selected. Stage 6 will test selection/persistence. |
| `lookup-list` | `lookup` | Yes | No | Runtime-sensitive | Relation-name addition shape needs an isolated generated proof. |
| `list` / `listref` | `list` | Yes | No | Runtime-sensitive | Requires `variables.listref` and child-control wiring. |
| `data-list` | n/a | Yes | No | Runtime-sensitive | Needs resolved source metadata and display proof. |
| `signer` | `signer` | No | No | Deferred | Schema-supported but not in AI Training; needs focused signer export. |
| `tag` | `tag` | No | No | Schema-supported but untested | Use text/checkbox fallback until a generated package proves it. |
| `rate` | `number` | No | No | Proven | v2 rendered the star rating, accepted `3.5`, displayed it on review, and persisted it to the list view. |
| `hyperlink` | `text` | No | No | Proven | v2 accepted a URL, displayed it as an open link on review, and persisted it as a list-view link. |
| `calculated` | `number` | No | Yes | Proven | v1 proved subtotal and v2 proved percent-based calculation: `200 * 25% = 50`. |
| `aktabs` / tab controls | n/a | Yes | No | Schema-supported but untested | Test separately as a layout-control package after value controls. |
| `workflowControlPanel` | n/a | Yes | Yes | Proven | Submit and approval actions completed successfully. |
| `workflowHistory` | n/a | Yes | Yes | Proven | Flow history rendered on review task page. |

The machine-readable version is `approval-form-control-runtime-coverage.json`.

## V1 Proven Set

`Approval Form Controls Test v1` proved:

- `input`
- `textarea` render
- `input_number`
- `currency`
- `checkbox`
- `switch`
- `datepicker`
- `identity-picker`
- `calculated`
- `workflowControlPanel`
- `workflowHistory`

It partially proved:

- `richtext`
- `radio`
- `file-upload`
- `lookup`

## V2 Proven Set

`Approval Form Controls Test v2 - Advanced Input Controls` proved:

- `percent`
- `time`
- `hyperlink`
- `rate`
- `calculated`

It partially proved:

- `daterange` value entry and review rendering. A later package should expose both mapped date fields in the list view before promoting it to fully proven persistence.

## Remaining Staged Runtime Tests

The next package should be Stage 3: upload and media controls.

It should isolate:

- `file-upload`
- `icon-upload`

Later stages should not start until upload/media behavior is documented.
