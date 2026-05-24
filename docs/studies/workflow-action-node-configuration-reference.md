# Workflow Action Node Configuration Reference

Proof boundary: `node-configurations.json` is config-reference-backed only. It is useful for control-type mapping and expected property paths, but it is not export proof and not runtime proof.

Source path studied:

```text
/Users/Renger/Downloads/node-configurations.json
```

## Useful Mappings

| Product/front-end action | Internal control type | Config id | Current use |
|---|---|---|---|
| Assignment Task | `MultiAssignmentTask` | `config_MultiAssignmentTask` | Compare with Claim Task, validate direct-assignment properties. |
| Claim Task | `CandidateTask` | `config_CandidateTask` | New Claim Task export-learning reference. |
| Set variable | `SetVariableTask` | `config_SetVariableTask` | Current Set variable export-learning reference. |
| Set data list | `ContentList` | `config_ContentList` | Useful for future Set data list study. |
| Start | `StartNoneEvent` | `config_StartNoneEvent` | Start action comparison across workflow hosts. |
| Connector line | `SequenceFlow` | `config_SequenceFlow` | Workflow transition condition validation. |

## CandidateTask vs MultiAssignmentTask

| Area | CandidateTask config | MultiAssignmentTask config | Notes |
|---|---|---|---|
| People picker field | `properties.usertaskassignment` | `properties.usertaskassignment` | Same family, different semantics: receivers/candidates vs direct assignees. |
| Task form | `properties.taskurl` | `properties.taskurl` | Same task form association path. |
| Task type | `properties.tasktype ` in config reference | `properties.tasktype` | The Claim Task config has a trailing-space path, but the export uses `properties.tasktype`. Treat trailing-space path as a warning-only config mismatch. |
| Due date | `duedatetype`, `duedatedefinition`, `duedateexpress`, `isfromworkcalendar` | same family | Export confirms Claim Task `hour` and `day`; minutes and express are product/config-known but not found in this Claim Task export. |
| Quick completion | `disablequickapproval` | `disablequickapproval` | Product-documented for Claim Task approval type; not found in the studied Claim Task export. |
| Notification | `isenabledemail`, `from`, `to`, `cc`, `subject`, `html` | same family | Export confirms enabled Claim Task email config in data-list workflow. |
| Files | `properties.files.list`, `properties.files.variables` | same family | Config says list-workflow task; not found in the Claim Task export. |

## SetVariableTask Reference

`Workflow Actions Runtime Baseline (4)_Set variable.yap` proves front-end Set variable serializes as `SetVariableTask` in approval form and data-list workflows.

| Config path | Export finding | Notes |
|---|---|---|
| `properties.formtype` | `current` and `custom` found | `current` targets current workflow variables; `custom` targets another approval form workflow instance. |
| `properties.variablesetting` | array found on every Set variable node | Each entry represents one left-side target workflow variable and one right-side expression value. |
| `properties.data.AppID` | found for `formtype="custom"` | Redact target app IDs in docs/refs. |
| `properties.data.ListSetID` | found for `formtype="custom"` | Redact target listset/application IDs. |
| `properties.data.ProcKey` | found for `formtype="custom"` | Stores target approval form key in the studied export. |
| `properties.formids` | found for `formtype="custom"` | Stores the target submitted approval request/form instance id; redact in docs/refs. |

The config reference is useful for validating expected paths, but the export is still source of truth for concrete field names and shapes. The studied export did not show Set variable updating data-list fields; it only targeted workflow variables. Data-list field tokens appeared only as right-side expression values.

## SetVariableTask vs ContentList

| Area | SetVariableTask | ContentList |
|---|---|---|
| Product action | Set variable | Set data list |
| Target | workflow variables | data-list/document-library records and fields |
| Current data-list workflow use | set workflow variables; may read list fields as expression values | add/update/delete list records |
| Reference status | export-proven in Set variable study | config-reference-backed here; product-documented as Set Data List action |

## Reference Use Rules

- Use this JSON as a map of expected workflow action configuration paths.
- Use real exports as source of truth for serialized field names and actual shapes.
- If the config reference and export disagree, document the mismatch and preserve the export shape.
- Keep validation warning-first unless a bad shape is proven to break import/publish/runtime.
- Do not commit raw `node-configurations.json` unless a future repo policy explicitly allows a sanitized copy.
- Do not treat config-reference-backed fields as runtime-safe.

## Future Study Candidates

- `SetVariableTask`: validate `properties.variablesetting[]` and cross-workflow variable references.
- `ContentList`: validate current/select list operations, `listdatas[]`, and `wheres[]`.
- `SequenceFlow`: continue aligning transition condition wrappers with expression/condition docs.
- `StartNoneEvent`: continue separating approval-form-only terminate/recall fields from data-list and scheduled workflow Start shapes.
