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
- Stop if external/credential actions contain literal secrets or unresolved connection IDs.
- Do not generate a new app solely from this reference; use it to validate a separately decomposed workflow requirement.
