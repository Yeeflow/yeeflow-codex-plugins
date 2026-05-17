# Yeeflow Workflow Action Generation Rules

Use this with `workflow-action-configurations.normalized.json` when generating or validating Yeeflow workflows. The source JSON is the official action configuration reference for this workspace.

## General Rules

- Preserve the exact workflow node type in `shape.stencil.id`; it must match a configured action type unless a real export proves a new type.
- Every generated workflow node should include `properties.name` when the action reference marks it required, and should include stable `id`, `resourceid`, `incoming`, `outgoing`, and `position` layout metadata.
- Validate property value types against the normalized reference before wrapper build. Treat `enum` as a string-compatible enum and reject values outside the configured keys.
- Apply conditional properties from the reference. When an action selects a mode such as `ContentList.type = add`, `Delay.type = duration`, or `QueryData.result.type = multiple`, include the matching nested configuration.
- Keep expressions and rich-text expressions as expression payloads; do not replace them with guessed IDs or literal secrets.
- Do not bundle passwords, API keys, connection credentials, tokens, or tenant-specific secret values. External/credential actions are dependency-only until resolved in a sandbox export/import cycle.

## Action Families

- Supported for structural generation/validation: `StartNoneEvent`, `EndNoneEvent`, `EndRejectEvent`, `SequenceFlow`, `InclusiveGateway`, `MultiAssignmentTask`, `CandidateTask`, `MailTask`, `SetVariableTask`, `ContentList`, `QueryData`, `SignalEvent`, `ResponseTo`, `Delay`, `Loop`, `LoopBreak`, `StartWorkflowTask`.
- Partially supported because document/template dependencies must be resolved from real metadata: `GenerateDocument`, `ConvertToPdf`, `AddWatermark`, `DocumentRecognition`.
- Partially supported and blocked for generated packages unless the user provides safe dependency metadata without sensitive values: `AI`, `AzureOpenAI`, `Connector`, `HttpRequest`, `AcrobatSign`, `DocuSign`, `PandaDoc`.

## Specific Validation Rules

- `ContentList`: require target metadata for selected-list operations; `add` and `edit` require `listdatas`; `edit` and `remove` require `wheres`; each mapping must name a target column/field and provide a source value/expression.
- `QueryData`: require source list metadata when the action is used; `filters` must be an array of condition objects; `datasource` sort entries must include sort field and direction; `result.type` must be `single` or `multiple`; multi-result mappings must name a destination variable/list and field assignments when present.
- `SequenceFlow`: `conditioninfo` must be an array when present; each condition object should include an operator plus left/right operands unless it is a recognized task outcome expression from a real export.
- `Delay`: `type` must be `duration`, `until`, or `condition`; duration mode requires count and unit; until mode requires a specific or dynamic time shape; condition mode requires `condition.conditions` array.
- `Loop`: `loopType` must be `list`, `values`, or `number`; loop values must include prefix/type/value; `continueCondition` and `breakCondition` must parse as condition arrays when present.
- External actions: flag `HttpRequest`, `Connector`, signing providers, `AI`, and `AzureOpenAI` as unsafe for generated final packages unless the package contains only non-sensitive dependency placeholders.

## Generator Stop Conditions

- Stop before building a `.ywf`, `.ydl`, or `.yap` wrapper if required action properties are missing in final mode.
- Stop if an enum value is outside the normalized reference.
- Stop if `ContentList` or `QueryData` targets do not resolve to package or exported-back metadata.

## Quota Usage Lifecycle Pattern

When a business decision says quota, entitlement, budget, or benefit usage is occupied on submission:

- create the usage/occupation row when the workflow starts or immediately after the submit/start Set Variable step, not only after final approval
- query future usage by applicant identity + numeric cycle/year + active usage status
- count in-progress/occupied and approved/confirmed statuses; exclude released/rejected statuses
- store a correlation key such as application number, request instance key, form instance id, or workflow instance id so the same usage row can be updated later
- on final approval, use `ContentList` edit to mark the matching usage row approved/confirmed when runtime-safe
- on rejection/cancel, use `ContentList` edit/remove to release or reject the matching usage row when runtime-safe
- if `ContentList` edit/remove has not been runtime-proven for the scenario, document the HR manual release fallback and create a focused learning task instead of leaving the usage list unused

## Branch Coverage Pattern

For review nodes with multiple outgoing `SequenceFlow` branches:

- branch variables must be required, auto-derived, or protected by a fallback route
- cover approve/reject plus yes/no/empty/unexpected values for policy-routing flags
- route unknown or empty exception flags to a specialist review/fallback path rather than allowing a dead end
- validate that every outgoing condition family eventually reaches an end or persistence node

Example: if `HasCustomPackageProduct` drives Finance/Benefits Review, the standard branch can use `Approved + HasCustomPackageProduct = No`, while the Finance/fallback branch can use `Approved + HasCustomPackageProduct != No` to cover `Yes`, empty, and unexpected values.
- Stop if external/credential actions contain literal secrets or unresolved connection IDs.
- Do not generate a new app solely from this reference; use it to validate a separately decomposed workflow requirement.
