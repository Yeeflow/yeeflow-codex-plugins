# Workflow AI Assistant Agent Action

Source export: `/Users/Renger/Downloads/AI Agent and Copilot Local Resource Baseline8.yap`

Classification: export-proven action shape only. AI execution was not runtime-tested in this branch.

## Node Shape

The AI Assistant workflow action uses workflow node `stencil.id = "AI"`.

Observed properties:

| Property | Observed value / pattern |
| --- | --- |
| `name` | `AI Generate email` |
| `type` | `agent` |
| `user` | `null` |
| `data.AppID` | app ID number |
| `data.ListSetID` | containing app/listset ID |
| `data.AgentID` | target AI Agent resource ID |
| `inputVariables[]` | action inputs mapped from workflow variables/expressions |
| `outputVariables[]` | Agent outputs mapped back to workflow variables |
| `context.enabled` | `true` |
| `context.selected.application` | `true` |
| `context.selected.workflowInstance` | `true` |
| `context.selected.workflowVariables` | `true` |
| `context.selected.workflowTasks` | `true` |

## Input Mapping

The action passes workflow variable `QueryItems` into Agent input variable `QueryItems`:

```json
{
  "id": "QueryItems",
  "type": "text",
  "value": {
    "type": 1,
    "value": {
      "exprType": "variable",
      "valueType": "text",
      "id": "QueryItems",
      "type": "expr"
    }
  }
}
```

## Output Mapping

The Agent output `Subject` maps to workflow variable `EmailSubject`:

```json
{ "prefix": "__variables_", "value": "EmailSubject" }
```

The Agent output `Body` maps to workflow variable `EmailBody`.

## Validation Rules

- In agent mode, require `properties.data.AgentID`.
- Resolve `AgentID` to an included `OtherModules.Type = "Agents"` entry with AI resource `Type = 0`.
- Validate `inputVariables` and `outputVariables` are arrays.
- Validate output mappings include `value.prefix` and `value.value`.
- Treat AI execution as runtime-sensitive. Import/open/configuration checks may be safe, but running the node can call live AI services.
