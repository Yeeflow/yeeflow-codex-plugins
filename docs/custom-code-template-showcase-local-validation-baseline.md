# Custom Code Template Showcase Local Validation Baseline

App: Enterprise Service Request & Compliance Review

Phase 2 generated a local `.yap` showcase package with all 13 custom code templates embedded in Custom Code controls.

Runtime status: materialization passed; component smoke partially completed. Do not claim full runtime proof for all 13 templates from this baseline.

Public form support: not claimed.

Generated package path: `custom-code-template-showcase.v1.yap`

Included contexts:
- Dashboard: KPI, distribution, trend, exception alerts, activity timeline, related-record grid, Smart Lookup Picker.
- Approval form: dependent selector, hierarchical selector, Smart Lookup Picker, multi-entry tags, checklist, approval timeline, activity timeline, related-record grid, approval decision panel.
- Data-list custom form: Smart Lookup Picker regression placement using `__list_` output targets.

Local validation results are recorded in the generated `custom-code-template-showcase.v1.validate-*.json` artifacts after the validator chain is run.

Latest retest local validation summary:

- `validate-yap-package`: pass with warnings, 0 errors.
- `validate-yap-graph`: pass, 0 errors.
- `inspect-yap-materialization`: pass, 0 errors.
- `inspect-yap-custom-code-controls`: 0 errors, warnings only.
- `validate-ywf-def`: pass with warnings, 0 errors.
- `validate-ydl-list`: all 9 generated lists pass with warnings, 0 errors.
- wrapper round trip: pass, 0 errors.

## Materialization Resolution

Runtime import retesting confirmed the final package installs, application content materializes, and generated data-list custom fields appear correctly.

Fresh runtime smoke on the rebuilt package after the materialization fixes confirmed:

- The app opened to real content, not `Start to build with Components`.
- The dashboard/home page appeared.
- Generated data lists appeared in navigation.
- `Service Requests` opened with custom fields and sample rows.
- The approval form opened.
- The workflow designer prompt appeared for `Enterprise Service Request Review`.
- Custom Code controls were visible on dashboard, approval form, and data-list custom form surfaces.

Resolved blockers:

- Tenant/user metadata was preserved instead of remapped into the generated ID family.
- Root Type `103` dashboard ownership now points back to the root app/ListSet `ListID`.
- `FieldID` values are globally unique across the full `.yap` application.
- Every `field.ListID` matches its parent data-list `ListID`.
- Duplicate field display/internal/name risks are covered by validators.

## Component Smoke Result

Runtime-proven in this app:

- `checklist-compliance-block`: approval form checklist rendered, checkbox interaction updated `3 / 3`, and output JSON reflected checked state.
- `multi-entry-tag-input`: approval form tag entry added `urgent`, displayed the chip, and wrote `["urgent"]`.
- `smart-lookup-picker`: approval form and data-list custom form search/select/writeback were observed.

Render-only proven:

- `kpi-card-set`: dashboard KPI cards rendered configured values; data-bound KPI calculation was not proven.

Blocked by configuration/query wiring:

- `activity-timeline`
- `approval-timeline`
- `dependent-selector`
- `distribution-chart-module`
- `exception-alert-panel`
- `hierarchical-selector`
- `related-record-summary-grid`
- `trend-chart-module`

Not tested:

- `approval-decision-panel`: the reviewer/task context was not reached during this smoke test.

Public form support remains untested and is not claimed.
