# Custom Code Template Showcase Local Validation Baseline

App: Enterprise Service Request & Compliance Review

Phase 2 generated a local `.yap` showcase package with all 13 custom code templates embedded in Custom Code controls.

Runtime status: not tested. Do not claim runtime proof from this baseline.

Public form support: not claimed.

Generated package path: `custom-code-template-showcase.v1.yap`

Included contexts:
- Dashboard: KPI, distribution, trend, exception alerts, activity timeline, related-record grid, Smart Lookup Picker.
- Approval form: dependent selector, hierarchical selector, Smart Lookup Picker, multi-entry tags, checklist, approval timeline, activity timeline, related-record grid, approval decision panel.
- Data-list custom form: Smart Lookup Picker regression placement using `__list_` output targets.

Local validation results are recorded in the generated `custom-code-template-showcase.v1.validate-*.json` artifacts after the validator chain is run.

## Materialization Resolution

Runtime import retesting confirmed the final package installs, application content materializes, and generated data-list custom fields appear correctly.

Resolved blockers:

- Tenant/user metadata was preserved instead of remapped into the generated ID family.
- Root Type `103` dashboard ownership now points back to the root app/ListSet `ListID`.
- `FieldID` values are globally unique across the full `.yap` application.
- Every `field.ListID` matches its parent data-list `ListID`.
- Duplicate field display/internal/name risks are covered by validators.

Custom code component runtime testing remains separate. Do not claim all 13 custom code templates are runtime-proven until component-level render, interaction, and writeback tests are completed.
