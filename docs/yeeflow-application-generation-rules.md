# Yeeflow Application Generation Rules

These rules apply to generated new-application `.yap` packages.

## YAP App Materialization Rules

The Custom Code Template Showcase investigation proved that Yeeflow can import a package shell while dropping app resources or data-list fields when ID ownership is wrong. Generated packages must satisfy these rules before runtime import:

- Every `ListID` must be unique.
- Every `FieldID` must be unique across the whole application.
- Every `field.ListID` must equal the parent data list `ListID`.
- Every `FieldName`, `InternalName`, and `DisplayName` must be unique inside its own data list.
- Do not remap `TenantID`, `CreatedBy`, or `ModifiedBy` as generated app-resource IDs.
- Do not include `TenantID`, `CreatedBy`, or `ModifiedBy` in `Resource.ReplaceIds`.
- Allocate fields from a global app-level field ID allocator, not a per-list reset.
- Build `ReplaceIds` from generated local app/list/field/layout/form/sample IDs only.
- Root Type `103` dashboard/page layouts must be owned by the root app/ListSet `ListID`.
- Root navigation must reference packaged dashboard/page, data-list, and approval-form resources that actually exist.
- Run package validation, graph validation, and `scripts/inspect-yap-materialization.mjs` before runtime import.
- Do not runtime-test custom code controls until app materialization passes.

## Runtime Language

Use "locally validated" when validators pass. Use "materialized" only after Yeeflow import/open confirms the app is not blank and generated data-list fields appear. Use "runtime-proven" for custom code controls only after component render, interaction, writeback, and persistence behavior are tested in the intended context.
