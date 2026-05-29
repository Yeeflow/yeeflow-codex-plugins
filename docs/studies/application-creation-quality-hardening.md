# Application Creation Quality Hardening

## Context

Yeeflow Builder Plugin v0.6.2 fixed the technical package import foundation for generated YAP and YAPK packages. The Vendor Onboarding full UI proof showed that import correctness is necessary but not sufficient for full application generation quality.

The latest generated Vendor Onboarding files were:

- `/Users/Renger/Downloads/vendor-onboarding-compliance-management.full-ui.v2-src-dashboard.yapk`
- `/Users/Renger/Downloads/vendor-onboarding-compliance-management.full-ui.v2-src-dashboard.yap`

Both packages now import or install successfully after product-feedback fixes, but the path required multiple manual correction rounds.

## Findings

- Full UI v1 generated retired dashboard pages.
- Current Type 103 dashboards must include the current `src` marker.
- Missing `Ext2 = "{\"src\":true}"` routes a dashboard through the retired legacy renderer.
- Generated dashboards must never use retired or legacy dashboard shells.
- No-portal YAP packages must use `SimplePortal: null`.
- `SimplePortal: {}` and `SimplePortal: []` are invalid for no-portal YAP packages.
- No-portal YAPK packages must use `PortalInfo: null`.
- `PortalInfo: {}` and `PortalInfo: []` are invalid for no-portal YAPK packages.
- The package generator produced structures that were schema-valid but product-invalid until product-team feedback corrected them.
- The final full UI generated app still needs a visual and functional fidelity review against the approved five mockups.

## Hardened Rules

Generated Type 103 dashboards must use the current dashboard shape:

- `Type = 103`
- `Ext2` parses to `{ "src": true }`
- `LayoutInResources` is an array
- `LayoutView` follows the current export-proven dashboard rule
- retired legacy patterns are blocked

Generated no-portal YAP packages must emit:

```json
{
  "SimplePortal": null
}
```

Generated no-portal YAPK packages must emit:

```json
{
  "PortalInfo": null
}
```

## Quality Gate

Full application generation must run strict quality validation before handoff. The strict gate checks package structure, dashboard renderer version, Data table bindings, blank dashboards, spec coverage, and deferred feature reporting.

Generated packages should not be considered ready merely because they import. They must be checked against the approved app plan or UI implementation spec and must not silently return a minimal subset when a full application was requested.

## Proof Boundary

This hardening records product-feedback rules and validator behavior from the Vendor Onboarding proof. It does not prove the final generated app is visually faithful to the five approved mockups. That requires a separate visual/fidelity review in Yeeflow after import/install.
