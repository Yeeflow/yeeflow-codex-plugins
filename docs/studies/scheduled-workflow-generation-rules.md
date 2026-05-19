# Scheduled Workflow Generation Rules

Source export: `/Users/Renger/Downloads/AI Agent and Copilot Local Resource Baseline8.yap`

Classification: generation guidance from export-proven structure. Generated import/open behavior is not yet runtime-proven.

## Minimal Shape

To generate a Scheduled Workflow resource, include an app-level `Data.Forms[]` entry with:

- `Name`
- `Key`
- `AppID`
- `ListID = 0`
- `ProcModelID`
- `DefResource` JSON string
- `WorkflowType = 3`
- `Settings` JSON string
- `Deployed` value aligned to intended runtime behavior

The `DefResource` should include:

- `childshapes[]`
- `variables.basic`, `variables.listref`, `variables.filter`
- `pageurls[]`
- `defkey`
- `workflowType = 3`
- `AppListSetID`
- graph position/zoom metadata

## Safe Baseline Decision

This branch intentionally does not generate a new baseline because:

- both studied schedules are deployed
- `MailTask` has fixed real recipient text in the export
- `AI` action execution may call live AI services
- schedule-disable/import behavior is not yet proven by export or runtime

A future safe baseline should first prove whether a scheduled workflow can be imported disabled or otherwise prevented from running automatically. If not, do not include a live `MailTask` or live AI action in an import-test package.

## Candidate Future Baseline

When safe disable behavior is known, generate the smallest package:

- one harmless local data list
- one local AI Agent with no external tools
- one Scheduled Workflow with `QueryData`, `AI`, and `MailTask`
- safe test recipient only, or no executable email recipient
- schedule disabled or set so it cannot execute during import/open testing
- fresh ID family and fresh workflow node IDs

## Validator Gates

- package validation
- graph validation
- workflow action configuration validation
- scheduled recurrence settings validation
- `QueryData` list reference validation
- `AI` Agent reference validation
- `MailTask` recipient risk scan
- expression/button HTML reference scan
- ReplaceIds scope check
- raw export and secret scan
