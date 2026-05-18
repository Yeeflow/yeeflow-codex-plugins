---
name: yeeflow-package-validator
description: Standardize Yeeflow package validation before import or runtime testing. Use when Codex generates or edits a .yap package, validates Yeeflow data lists, forms, workflows, dashboards, custom code, or expressions, diagnoses package import/materialization issues, or decides whether runtime import is safe.
---

# Yeeflow Package Validator

## Core Rule

Validate before import. Do not runtime-test a package with blocking structural, graph, wrapper, workflow, list, field, materialization, FlowKey, or unsafe `.yapk` issues.

New application creation may output `.yap`. Existing app upgrade `.yapk` remains read-only and server-generated until Yeeflow signing and Resource mechanics are proven.

## Validation Workflow

1. Identify the package type and source of truth. Preserve generated `.yap` files unless the task explicitly asks to regenerate them.
2. Run available repo validators for package, graph, workflow, data list, wrapper round trip, materialization, expressions, dashboards, and custom code.
3. Inspect field/list integrity and FlowKey safety.
4. Classify every finding as blocking, warning, or informational.
5. Decide whether import/runtime testing is safe.
6. Report exact commands, files checked, findings, and next actions.

Use [package-validation-lifecycle.md](references/package-validation-lifecycle.md) for the detailed sequence.

## Required Validation Areas

Load [yap-materialization-rules.md](references/yap-materialization-rules.md) when package materialization or import safety is in scope. Check:

- `validate-yap-package`
- `validate-yap-graph`
- `validate-ywf-def`
- `validate-ydl-list`
- workflow action config validation
- expression smoke tests
- wrapper round trip
- materialization inspection
- custom code inspection
- dashboard inspection
- FlowKey safety
- prefix or `pr<id>x` corruption checks
- app-wide unique `FieldID`
- `field.ListID` equals parent data list `ListID`
- unique `FieldName`, `InternalName`, and `DisplayName` inside each list
- no remapping of `TenantID`, `CreatedBy`, or `ModifiedBy`

For document libraries, also check:

- `ListModel.Type = 16`
- root app navigation references the library as `Type = 16` for mixed/richer apps; document-library-only packages may use the sample-proven root `LayoutView = {"sortVer":1}` with no Type `103` page or nav, reported as warnings
- top-level `Resource.SimplePortal = null`
- default fields exist: `Title`, `Bigint1`, `Text1`, `Bigint2`, `Text2`, `Text3`, and `Text4`
- `Text4` uses `Type = "file-upload"` and library upload rules
- `Title` keeps document-library native metadata and is not forced into normal data-list `Status = 0`
- field `ListID` values match the parent library `ListID`
- `FieldID` values are unique across the app
- Type `0` view field references resolve when view JSON is present
- Type `1` custom form bindings resolve to library fields
- partial document-library `ListModel.LayoutView` assignments are warnings; sample minimal libraries leave the single `New file` form unassigned, while configured libraries assign `add`, `edit`, and `view` together
- generated packages do not embed raw file/document payloads unless focused runtime export-back proof exists

## Severity

Use [validation-error-severity.md](references/validation-error-severity.md) to decide what blocks import. When uncertain, mark the finding as blocking until a proven Yeeflow import/runtime counterexample exists.

## Reporting

Report validation as:

- package path and package type
- validators and inspections run
- blocking issues
- warnings
- accepted risks
- runtime import decision
- exact follow-up needed

Do not claim runtime proof from local validation alone.
