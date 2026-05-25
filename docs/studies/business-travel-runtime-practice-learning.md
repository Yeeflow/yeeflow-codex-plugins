# Business Travel Runtime Practice Learning

Proof boundary: schema-v2-backed, runtime-practice-backed, validator-backed, and generator-hardened. Import after the `ListModel.Flags` repair is user-proven. Workflow publish fixes are validator-backed until the user confirms a successful publish. Workflow execution, request submission, routing, data-list mutation, and budget-control behavior are not runtime-proven.

## Sources

- Original failed package: `/Users/Renger/Downloads/business-travel-budget-control.v1.yap`
- Latest repaired package: `/Users/Renger/Downloads/business-travel-budget-control.schema-fixed.v1.yap`
- Latest schema reference: `/Users/Renger/Downloads/yap-v1-schema_v2.json`
- Prior schema study: `docs/studies/yap-schema-standard.md`
- Business Travel repair study: `docs/studies/business-travel-yap-schema-fix.md`
- App creation rules study: `docs/studies/yeeflow-app-creation-rules.md`

Raw `.yap` packages and decoded payloads are not committed.

## Runtime Practice Sequence

The first schema repair fixed `Data.Item.Defs`, `NoRule`, field suffixes, and workflow expression shapes, but the generated package still failed import because root and child `ListModel.Flags` were missing.

The schema-backed fix set:

- `Data.Item.ListModel.Flags = 1`
- every `Data.Childs[].ListModel.Flags = 1`

After that fix, the user manually imported the package successfully. This proves import for that repaired package shape only.

Subsequent approval-form workflow publish attempts exposed workflow designer issues:

- `The variable EstimatedTotalAmount used in sequence flow Finance Required is deleted`
- `Configuration error on node Set_TR#: TRid not found`
- `The variable Applicant used in node Manager Approval is deleted`
- `Configuration error on node Finance Approval: Assignee: model.Method (position) model.Position (__POSITION_ID_REQUIRED_FINANCE_MANAGER__) must be a valid number`

These are workflow publish blockers, not workflow execution results.

## Learned Fixes

### Schema Fixes

- `Defs` and `Layouts` must be arrays, never `null`.
- Root and child `ListModel.Flags` must be `1`.
- `CustomListModel.Status` is schema-v2 fixed to `1` when present.
- `CustomListModel.Type` must be one of `1`, `16`, `32`, `64`, `128`, or `1024`.
- Approval/process form `NoRule` must be an object with `Prefix`, `StartIndex`, `CustomLength`, and `AutoIncrement`.
- `NoRule.Prefix` must include `{index}`.

### Workflow Variable Fixes

- Sequence-flow conditions must only reference variables declared in `DefResource.variables`.
- `Finance Required` and `Finance Not Required` were repaired from deleted `EstimatedTotalAmount` to existing numeric variable `TotalAmount`.
- Set Variable targets must exist in workflow variables.
- `Set_TR#` was repaired by declaring text workflow variable `TRid` and aligning the assignment `idx`.
- Assignment task expressions must only reference declared workflow variables.
- `Manager Approval` was repaired by declaring user workflow variable `Applicant`.
- Form bindings and sub-list summary bindings must use declared variables when they drive workflow routing or designer-visible assignment expressions.

### Assignment Fixes

- Direct job-position assignment with `method = "position"` requires a valid numeric `position` ID.
- Placeholder IDs such as `__POSITION_ID_REQUIRED_FINANCE_MANAGER__` must not be emitted into final packages.
- If a true tenant-specific position ID is unavailable, generation must stop for a real mapping or use an explicitly documented safe fallback only when the user permits the semantic change.
- In this repair, Finance Approval was made publish-oriented by replacing the unsafe placeholder position with the existing applicant line-manager expression assignment. This is not proof of a true Finance Manager role.

## Validator Rules Added

- `LISTMODEL_FLAGS_INVALID`
- `LISTMODEL_STATUS_INVALID`
- `LISTMODEL_TYPE_INVALID`
- `WORKFLOW_SEQUENCE_CONDITION_VARIABLE_UNRESOLVED`
- `SETVARIABLE_UNKNOWN_VARIABLE`
- `TASK_ASSIGNMENT_VARIABLE_UNRESOLVED`
- `ASSIGNMENT_TASK_POSITION_ID_INVALID`

The original package now fails locally with clear errors for the schema and workflow-publish blockers. The latest repaired package passes local package validation with warnings only.

## Generator Rules

Future `.yap` generators must:

- write `ListModel.Flags = 1` for root and child list-like resources
- write `Status = 1` when including `ListModel.Status`
- keep `ListModel.Type` within the schema-v2 enum
- declare every workflow variable before using it in form controls, summaries, sequence conditions, Set Variable actions, assignment expressions, or ContentList mappings
- fail generation when a sequence flow references a deleted/missing variable
- fail generation when Set Variable targets are undeclared
- fail generation when assignment expressions reference undeclared variables
- never emit placeholder users, groups, positions, IDs, credentials, or tenant-specific values into final packages
- require real numeric position IDs for direct position assignments, or stop for user-approved mapping/fallback

## Proof Boundary

- Business Travel import after `Flags = 1`: user-proven.
- Current repaired workflow publish fixes: validator-backed and ready for manual publish test.
- Workflow publish success: pending user confirmation.
- Workflow execution/routing/submission/data mutation: not runtime-proven.
- True Finance Manager assignment: not proven; requires real numeric position ID or safe tenant lookup.

## Recommended Next Step

Manually publish-test the latest `Business Travel Request` approval workflow from `/Users/Renger/Downloads/business-travel-budget-control.schema-fixed.v1.yap`. If publish succeeds, record that proof separately before merging broader runtime claims or rebuilding the plugin.
