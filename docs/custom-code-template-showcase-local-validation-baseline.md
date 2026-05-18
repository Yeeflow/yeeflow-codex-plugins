# Custom Code Template Showcase Local Validation Baseline

App: Enterprise Service Request & Compliance Review

Phase 2 generated a local `.yap` showcase package with all 13 custom code templates embedded in Custom Code controls.

Runtime status: import materialization is still pending after the latest metadata-preservation patch. Do not claim runtime proof from this baseline.

Public form support: not claimed.

Generated package path: `custom-code-template-showcase.v1.yap`

Included contexts:
- Dashboard: KPI, distribution, trend, exception alerts, activity timeline, related-record grid, Smart Lookup Picker.
- Approval form: dependent selector, hierarchical selector, Smart Lookup Picker, multi-entry tags, checklist, approval timeline, activity timeline, related-record grid, approval decision panel.
- Data-list custom form: Smart Lookup Picker regression placement using `__list_` output targets.

Local validation results are recorded in the generated `custom-code-template-showcase.v1.validate-*.json` artifacts.

Latest local materialization checks:
- Root Type `103` dashboard layout is owned by the root app/listset `ListID`.
- `LayoutInResources[0].ID` and `RefId` match the dashboard page `LayoutID`.
- Root tenant/user metadata is preserved from the working baseline instead of being remapped into the generated local ID family.
- Child data lists, approval form, navigation entries, and Custom Code controls are present in the decoded package.
