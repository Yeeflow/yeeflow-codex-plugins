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

## Local Validation Summary

- Package validation: pass with warnings.
- Graph validation: pass.
- Approval form validation: pass with warnings.
- Data-list validation: all 9 generated lists pass with warnings.
- Workflow action validation: pass through the package/YWF validators.
- Wrapper round trip: pass.
- Custom-code inspection: 25 controls found; dashboard 7, approval form 17, data-list form 1, public form 0.
- Custom-code parameter validation: pass.
- Dashboard structure inspection: pass with one native data-list reporting fallback plus custom-code analytics components.
- Duplicate field/internal-name check: pass.
- Lookup dependency check: pass; no native lookup fields were generated, and custom lookup sources are local seeded lists.
- FlowKey safety and corrupted `prefix`/`pr<id>x` checks: pass.
- Expression smoke test: pass.
- TSX check: pass via esbuild parse/bundle check for all 13 templates.

Validator warnings remain expected because Custom Code controls are schema-supported but runtime-unproven for 12 of the 13 templates until this generated package is imported and exercised.
