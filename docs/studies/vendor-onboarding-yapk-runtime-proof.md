# Vendor Onboarding YAPK Runtime Proof Candidate

## Summary

This study records the local generation and validation status for the Vendor Onboarding & Compliance Management YAPK candidate generated from the approved UI implementation spec.

- Approved spec: `docs/generated-app-plans/vendor-onboarding-compliance-ui-implementation-spec.md`
- V1 output package: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.yapk`
- V1.1 signed output package: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.1-signed.yapk`
- V1.2 install-compatibility output package: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.2-install-compatible.yapk`
- V1.3 export-shape output package: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.3-export-shape.yapk`
- V1.4 field-category fixed YAPK package: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-category-fixed.yapk`
- YAP fallback output package: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.yap`
- YAP numeric `MainListType` candidate: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.1-mainlisttype.yap`
- YAP data-model isolation candidate: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.2-data-model.yap`
- YAP schema-direct candidate: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.3-schema-direct.yap`
- YAP field-category fixed schema-direct candidate: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-category-fixed.yap`
- Generator: `generate-vendor-onboarding-compliance-yapk.mjs`
- Install-compatibility generator: `generate-vendor-onboarding-install-compatible-yapk.mjs`
- Branch: `codex/vendor-onboarding-yapk-runtime-proof`
- Package type: YAPK
- V1 generated status: local validation candidate with placeholder signature shape
- V1.1 generated status: server-signed and verified locally, but rejected by Yeeflow install as an incorrect package
- V1.2 generated status: server-signed install-compatibility candidate using API-issued IDs and Yeeflow-style Brotli flush encoding; Yeeflow created an application tile but marked the install failed during materialization
- V1.3 generated status: server-signed export-shape candidate that keeps the V1.2 accepted wrapper/signing/encoding pattern and restores export-like list, field, and layout metadata
- V1.4 generated status: server-signed export-shape YAPK and schema-direct YAP with every `Field.Category` normalized to an integer
- YAP fallback status: generated from the same decoded application resource for normal application import testing after the YAPK path failed materialization
- YAP V1.1 status: same full generated application as V1 YAP with `Resource.MainListType` normalized from string `classes` to numeric `1024`
- YAP V1.2 data-model status: import-isolation candidate that removes the rich dashboard/custom-page surfaces and app groups, keeping the five data lists, fields, simple list forms, list views, and a minimal Home page
- YAP V1.3 schema-direct status: generated after reviewing the supplied standard YAP schema; `Resource` decodes directly to `ListExportInfo` instead of the older `Resource.Data` envelope

## Implemented Data Lists

- Vendors
- Vendor Documents
- Compliance Reviews
- Vendor Tasks
- Vendor Activity / History

The package defines 59 fields across the five data lists, including vendor identity, risk/status fields, compliance review fields, document review/expiry fields, task assignment/status fields, and vendor activity timeline fields. Vendor-related child lists include lookup rules back to the Vendors list.

## Implemented Pages And Forms

- Vendor Management Dashboard
- Compliance Review Workspace
- Vendor Detail View Page
- New Vendor Request Form
- Vendor Print Page

The package also includes supporting maintenance forms for Vendor Documents, Compliance Reviews, Vendor Tasks, and Vendor Activity / History so each generated data list has a safe add/edit/view form reference.

## Implemented Major Controls

- KPI cards using Container/Grid/Text controls
- Progress circle
- Progress bar
- Alert boxes
- Kanban boards with meaningful card template fields
- Data tables with configured display columns
- Icon list
- Vertical timeline
- Tabs
- Steps bar
- Dynamic field controls
- Dynamic user controls
- Dynamic file controls
- Document embed
- Dynamic Sub List for required document checklist
- Collection cards with local collection actions
- Bulk operation toolbar pattern
- QR Code
- Barcode
- Divider
- Safe outer padding, card structure, and grid layout
- Scoped custom CSS intent is represented in the page/card layout and remains subject to runtime visual review

## Validation Results

Validation was run on the generated V1.1 signed YAPK, the decoded app resource, and a temporary YAP-format validation wrapper around the same decoded app graph for legacy import-readiness inspectors. After V1.1 failed in Yeeflow install, V1.2 was generated to match the successful fresh-install YAPK evidence from the earlier Customer Satisfaction Survey study.

| Check | Result | Notes |
| --- | --- | --- |
| YAPK wrapper decode/parse | Pass | V1.1 Resource Brotli-decodes and validates as AppPackageInfo. |
| YAPK schema standard inspection | Pass | No wrapper/schema errors. |
| Strict generated package validation | Pass with warnings | 0 errors, warnings are schema-support/proof-boundary items for generated fields and advanced controls. |
| Graph validation | Pass with warnings | 0 errors, no unresolved lookup or graph edges. |
| Generated UI quality inspection | Pass | 0 errors, 0 warnings; dashboards, custom forms, data tables, and item templates detected. |
| Spec coverage inspection | Pass with warnings | 0 errors; manual review warnings remain for print page and advanced visual elements. |
| Import-readiness suite | Pass with warnings | 0 errors using the temporary validation wrapper; warnings remain for runtime proof boundaries and generated-control caution. |
| codex.yeeflow.com scan | Pass | No hard-coded internal tenant URL found in generated package or generator. |

## Install Failure Follow-Up

The V1.1 server-signed package reached the Yeeflow install dialog but failed after clicking install with: `The package you uploaded is incorrect, please check and try again.`

The likely cause is package shape rather than signature validity. V1.1 used locally invented `7601...` IDs, finalized standard Brotli encoding, wrapper `AppID` as a string, and many inner identity values as quoted strings. A prior successful fresh-installable YAPK in this workspace required a closer Yeeflow-generated shape:

- API-issued IDs from `/utils/generate/ids`
- text-level ID remapping to avoid large numeric ID rounding
- wrapper `AppID` preserved as a number
- BOM-prefixed wrapper JSON
- Yeeflow-style Brotli flush-before-dispose Resource encoding, which tolerant-decodes to complete JSON but strict sync decode ends with `Z_BUF_ERROR`

V1.2 applies those install-compatibility changes.

V1.2 local proof:

- Output: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.2-install-compatible.yapk`
- Version: `1.2-install-compatible`
- API-issued/remapped large IDs: 83
- Server signing: passed
- Server verification: passed
- Signature shape: 32-byte base64 value
- Wrapper `AppID` type: number
- Resource encoding: Yeeflow-style Brotli flush-before-dispose compatible
- Tolerant Resource decode: complete parseable `AppPackageInfo`
- Strict sync decode: expected `Z_BUF_ERROR`
- Counts: 2 pages, 5 child lists, 59 fields, 14 layouts, 4 Data tables, 8 item-template controls
- Empty Data tables: 0
- Empty item templates: 0

## V1.2 Runtime Result And V1.3 Follow-Up

The V1.2 package was accepted far enough for Yeeflow to create an application tile named `Vendor Onboarding & Compliance Management`, but the tile showed `Install failed`. This is different from the V1.1 package-level rejection and narrows the issue to inner application materialization rather than wrapper parsing, signature shape, or upload acceptance.

V1.2 inspection found that its inner app package had been over-pruned while trying to match installable wrapper behavior:

- `ListSet` and child `List` resources were missing export-style keys such as `IsItemPerm`, `IsVerRecord`, `HasComment`, `Perms`, `AdvancePerms`, `Items`, and `Ext3`.
- Layout resources were missing export-style keys such as `Title`, `Ext3`, `IsDefault`, `IsItemPerm`, and `Perms`.
- Field resources still had a generated `Title` key that is absent from the successful fresh-installable YAPK comparison package.

V1.3 restores those export-like list, field, and layout metadata keys while preserving:

- API-issued ID remapping
- wrapper `AppID` as a number
- BOM-prefixed wrapper JSON
- Yeeflow-style Brotli flush-before-dispose Resource encoding
- 32-byte server signature
- successful `verifysign`

V1.3 local proof:

- Output: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.3-export-shape.yapk`
- Version: `1.3-export-shape`
- Server signing: passed
- Server verification: passed
- Signature shape: 32-byte base64 value
- Wrapper `AppID` type: number
- Resource encoding: Yeeflow-style Brotli flush-before-dispose compatible
- Tolerant Resource decode: complete parseable `AppPackageInfo`
- Strict sync decode: expected `Z_BUF_ERROR`
- Counts: 2 pages, 5 child lists, 59 fields, 14 layouts
- Export-like key check: root list set, child lists, fields, pages, and layouts now include the same key families as the successful fresh-install comparison package
- Hard-coded `codex.yeeflow.com`: none detected

## YAP Fallback Package

After the V1.3 YAPK still showed `Install failed`, the same generated application resource was wrapped as a standard `.yap` application package for direct import testing instead of version-package installation.

- Output: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.yap`
- Package type: `.yap`
- Source resource: `.tmp/vendor-onboarding-compliance-management/vendor-onboarding-compliance-management.decoded-resource.json`
- Build command: `node build-yap-wrapper.js ... --validation-mode generator`
- Wrapper build status: pass
- Wrapper round trip: pass
- Package validation: pass with warnings, 0 errors
- Graph validation: pass with warnings, 0 errors
- Import-readiness suite: pass with warnings, 0 errors
- Generated UI quality inspection: pass, 0 errors
- Spec inspection: pass with warnings for manual print-page and advanced visual-element review
- Inventory: 5 data lists, 59 fields, 2 dashboards, 14 layouts, 4 app user groups
- Hard-coded `codex.yeeflow.com`: none detected

This `.yap` package is the recommended next manual import candidate because the `.yapk` path is now known to fail during application materialization.

The first `.yap` import test also failed with `Created failed`. Inspection found that the wrapper was accepted into the import dialog but the create step still rejected the generated application resource. Two follow-up `.yap` candidates were generated:

- `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.1-mainlisttype.yap`
  - Changes only `Resource.MainListType` from string `classes` to numeric `1024`.
  - Keeps the full rich UI payload.
  - Use this only to test whether the root app type encoding was the blocker.
- `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.2-data-model.yap`
  - Recommended next test.
  - Uses numeric `MainListType = 1024`.
  - Removes the rich dashboard, rich custom forms, advanced UI controls, and app groups.
  - Keeps 5 data lists, 59 fields, lookup relationships, simple list views/forms, and one minimal Home page.
  - Import-readiness suite passed with warnings and 0 errors.
  - Inspection summary: 5 child lists, 0 app groups, 1 root layout, 15 child layouts, 79 replace IDs.

If V1.2 data-model imports, the failure is isolated to the rich UI/dashboard/custom-form layer rather than the core data model.

The V1.2 data-model import test created an application tile but still showed `Import failed`. A review against `/Users/Renger/Downloads/yap-v1-schema_v2.json` found a standard-schema mismatch in the fallback packages: the schema describes the wrapper `Resource` as fixed gzip prefix plus `Gzip(UTF8 JSON(ListExportInfo))`, and its decoded-resource schema points directly to `ListExportInfo`. The earlier fallback wrapped the app data in a legacy object with `AppID`, `MainListType`, `Data`, `ReplaceIds`, `ReportIds`, and `FormKeys`, which the standard schema rejects as additional properties.

The V1.3 schema-direct YAP candidate fixes that schema mismatch:

- Output: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.3-schema-direct.yap`
- Package type: `.yap`
- Wrapper fields: `Title`, `Description`, `IconUrl`, `IsListSet`, `Resource`
- Decoded `Resource`: direct `ListExportInfo`
- Child lists: 5
- Fields: 59
- Layouts: 16
- `PortalInfo`: omitted because it is optional in `ListExportInfo` and cannot be `null` when present
- Field/list/layout metadata: normalized to the supplied schema types and allowed properties
- Standard schema validation using `/Users/Renger/Downloads/yap-v1-schema_v2.json`: pass, 0 errors
- Yeeflow schema-standard inspector: pass, 0 errors, 0 warnings

The V1.3 schema-direct YAP is now the recommended next manual import candidate. If it still creates a tile but shows `Import failed`, the next blocker is likely inside server-side materialization semantics that are not expressed by the provided JSON schema, and Yeeflow server-side import diagnostics will be needed.

If V1.3 still fails, use the isolation matrix in `docs/studies/vendor-onboarding-import-isolation-matrix.md`. It provides six schema-direct `.yap` packages that add one capability layer at a time, from one data list through five lists, lookups, simple forms, a Data table dashboard, and a Kanban dashboard.

## V1.4 Field Category Type Fix

Product team feedback on `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.3-export-shape.yapk` identified a concrete materialization issue:

> `Childs[0].Fields[0].Category` must be an int type.

The safe decoded inspection found that the V1.3 export-shape YAPK had 59 fields with `Category` serialized as the string value `List`. The schema-direct YAP candidate already had 59 fields with integer `Category: 0`. Prior generated app resources and normalized field references also use integer `Category: 0`, so `0` is the observed export-compatible default used for generated data-list fields.

Root cause:

- The YAPK install-compatibility normalizer changed field `Category` from the base app package integer value into the string `"List"`.
- Local validators did not previously enforce integer `Field.Category`, so the YAPK passed local checks while still violating server-side import/materialization expectations.

Generator fix:

- `generate-vendor-onboarding-install-compatible-yapk.mjs` now normalizes every field `Category` to an integer before encoding/signing.
- `generate-vendor-onboarding-yap-fallbacks.mjs` now normalizes every schema-direct YAP field `Category` to an integer.
- Missing, null, empty, or legacy `"List"` category values are normalized to the observed export-compatible integer default `0`; numeric strings are converted to integers; invalid non-numeric values fail generation.

Validator hardening:

- `validate-yap-package.js`
- `validate-yapk-package.js`
- `scripts/inspect-yap-schema-standard.mjs`
- `scripts/inspect-yapk-schema-standard.mjs`
- `scripts/validate-standard-package-schema.mjs`

All now report `FIELD_CATEGORY_NOT_INT` when a generated YAP/YAPK field has a missing, string, null, array, object, or otherwise non-integer `Category`.

Regression smoke:

- `scripts/smoke-field-category-validation.mjs` creates temporary synthetic YAP and YAPK wrappers with `Category: "0"` and `Category: 0`.
- The string case is detected as `FIELD_CATEGORY_NOT_INT`.
- The integer case does not trigger `FIELD_CATEGORY_NOT_INT`.

V1.4 local proof:

- YAPK output: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-category-fixed.yapk`
- YAP output: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-category-fixed.yap`
- YAPK server signing: passed
- YAPK server verification: passed
- YAPK signature shape: 32-byte base64 value
- YAPK Resource: Yeeflow-style Brotli flush-before-dispose compatible; tolerant decode succeeds, strict sync decode still shows the expected `Z_BUF_ERROR`
- Standard YAP schema validation: pass, 0 errors
- Standard YAPK schema validation: pass, 0 errors
- YAP schema-standard inspector: pass, 0 errors, 0 warnings
- YAPK schema-standard inspector: pass, 0 errors, 0 warnings
- YAP package validator: pass with warnings, 0 errors
- YAP graph validator: pass with warnings, 0 errors
- YAP import-readiness suite: pass with warnings, 0 errors
- YAPK package validator: pass, 0 errors
- Category audit: 59 fields checked in each package; all `Category` values are integer `0`; `Childs[0].Fields[0].Category` is integer `0`
- Hard-coded `codex.yeeflow.com`: none detected

Recommended next manual test:

1. Try `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-category-fixed.yapk` first because it directly fixes the product-team-reported YAPK materialization issue.
2. If the YAPK still fails, try `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-category-fixed.yap`.
3. If both still fail, continue with the import isolation matrix to locate the next server-side materialization blocker.

## Signing And Verification

The generator uses the standard Yeeflow API base URL behavior through `scripts/yeeflow-env-utils.mjs`.

- API base URL used by the generator environment helper: `https://api.yeeflow.com/v1`
- V1 server signing status: skipped because no local `YEEFLOW_API_KEY` was configured during the first generation pass
- V1 local placeholder signature shape: 32-byte base64 value
- V1.1 server signing status: `signed_and_verified`
- V1.1 server signature shape: 32-byte base64 value
- V1.1 `verifysign` status: HTTP 200
- V1.2 server signing status: `signed_and_verified`
- V1.2 server signature shape: 32-byte base64 value
- V1.2 `verifysign` status: passed
- V1.3 server signing status: `signed_and_verified`
- V1.3 server signature shape: 32-byte base64 value
- V1.3 `verifysign` status: passed
- V1.4 server signing status: `signed_and_verified`
- V1.4 server signature shape: 32-byte base64 value
- V1.4 `verifysign` status: passed

The V1 package remains the locally validated baseline. The V1.1 package proved signing and verification but failed package install. The V1.2 package proved wrapper/upload acceptance but failed materialization. The V1.3 package preserved the accepted wrapper pattern and restored export-like metadata but still failed materialization. The V1.4 package fixes the product-team-reported `Field.Category` integer typing issue and is now the recommended first retry. The full `.yap` fallback also reached the import dialog but failed create. The `.yap` V1.4 schema-direct package is the fallback retry if the corrected YAPK still fails.

## Known Gaps

- No complete live Yeeflow import proof has been performed yet.
- No runtime page-open proof has been performed yet.
- V1.2 reached application-tile creation but failed materialization.
- V1.3 reached the same materialization-failure state.
- V1.4 has not yet been manually import-tested after the field `Category` typing fix.
- The full `.yap` fallback reached the import dialog but failed create.
- The `.yap` V1.3 schema-direct package must be manually import-tested before being treated as import-proven.
- Collection/Kanban action steps are safe local placeholders and should be connected to tenant-specific workflows after import if needed.
- Advanced controls such as Document embed, QR Code, Barcode, timeline, and print layout require runtime visual confirmation.
- Custom CSS polish is represented as layout/style intent in generated controls; final visual polish must be checked in Yeeflow after import.

## Proof Boundary

This branch proves that a full-scope Vendor Onboarding & Compliance Management app candidate can be generated from the approved UI implementation spec and pass local structural, graph, UI-quality, schema, wrapper round-trip, and import-readiness checks with no blocking errors. It also proves that the product-team-reported `Field.Category` integer typing issue is fixed in both the generated YAPK and schema-direct YAP candidates, and that local validators now catch the regression. The `.yapk` variants before V1.4 showed that signing, wrapper acceptance, API-issued IDs, and export-like metadata were still not enough for Yeeflow version-package materialization. The full `.yap` fallback showed that direct app import can still fail when the rich generated UI payload is present. The `.yap` V1.2 data-model isolation package created an application tile but still failed materialization. The `.yap` V1.4 schema-direct package aligns the decoded `Resource` shape with the supplied standard YAP schema and fixes field category typing.

It does not prove live import success, runtime rendering, or end-user workflow behavior. Those require a focused manual import and runtime proof in a Yeeflow tenant.

## Manual Test Checklist

1. Install `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-category-fixed.yapk`.
2. If the YAPK still fails, import `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-category-fixed.yap`.
3. Open the Vendor Management Dashboard.
4. Check dashboard padding, cards, KPI layout, alert, and quick links.
5. Verify dashboard Data tables show configured columns.
6. Verify Kanban cards show meaningful vendor fields.
7. Open the Vendor Detail View Page.
8. Verify tabs, steps bar, progress controls, document embed area, compliance cards, task cards, and timeline.
9. Open the New Vendor Request Form.
10. Verify padded sections, toggle section, Dynamic Sub List, file/document fields, and form actions.
11. Open the Compliance Review Workspace.
12. Verify Kanban, collection cards, risk score, alert, bulk toolbar pattern, and missing/expired document table.
13. Open the Vendor Print Page.
14. Verify print layout, divider spacing, approval timeline, document checklist, QR Code, and Barcode.
15. Connect placeholder collection/workflow actions to tenant-specific workflows if needed.
16. Record the live import/runtime result before treating this as runtime-proven.
