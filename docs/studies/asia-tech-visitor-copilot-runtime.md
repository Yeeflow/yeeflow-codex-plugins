# Asia Tech Visitor Copilot Runtime Study

Date: 2026-05-19

Branch: `codex/asia-tech-visitor-copilot-app`

Generated app: `Asia Tech Visitor & Meeting Copilot`

Generated package: `asia-tech-visitor-meeting-copilot.v1.yap`

## Generated Scope

The package contains:

- 4 data lists: `Contacts`, `Companies`, `Follow-up Tasks`, `Event Meetings`
- 2 dashboards: `Event Command Center`, `AI Capture Workspace`
- 1 Copilot: `Event Booth Assistant`
- 2 AI Agents: `Name Card & Badge Extraction Agent`, `Lead Fit & Follow-up Advisor`
- 1 data-list workflow: `Analyze new contact with AI`
- 0 external connections
- 0 real visitor records
- 0 real image binaries
- 0 email-sending configuration

The workflow is generated as a Contacts new-item workflow with `WorkflowType = 1`, host-list `ListID`, and `FlowMappings[].Setting.NewTrigger = true`. It is included for designer/runtime inspection and remains execution-deferred for safety.

## Local Validation Results

Local validation completed with no blocking errors:

- Generator syntax check: pass
- Generator run and wrapper build: pass
- Wrapper round trip: pass, decoded source matched generated source
- Package validation: `pass_with_warnings`, 0 errors
- Graph validation: `pass_with_warnings`, 0 errors, 0 unresolved edges
- Data-list validation: all 4 lists passed with warnings only
- Materialization inspection: pass, 0 errors, 0 warnings
- Agent/Copilot inspection: pass, 2 Agents, 1 Copilot, 5 AI tools, 0 connections
- Expression smoke validation: pass
- `git diff --check`: pass
- Safety scan: no secrets, credentials, real contacts, real images, or private data found; generic token/tenant wording false positives were reviewed

Expected validation warnings remain around environment-sensitive controls and runtime-sensitive AI/list-mutation behavior, including upload controls, identity pickers, AI workflow execution, connected Agent references, and lookup dependencies.

## Runtime Import Result

Runtime target: `https://codex.yeeflow.com/`

Import path used for file picker compatibility: `/private/tmp/a.yap`, copied from the generated package.

Initial runtime result:

- The package import dialog accepted the generated package.
- The import dialog populated the app name and description as `Asia Tech Visitor & Meeting Copilot`.
- After import, the `Asia Tech Visitor & Meeting Copilot` app card appeared in the Yeeflow `AI Generation` workspace with an `Import failed` label.

Failure detail reported by Yeeflow:

- Path: `Childs[0].Layouts[0].LayoutID`
- Value: `73221000000000001001`
- Error: value could not convert to `System.Int64`; value was too large or too small for an `Int64`.

Root cause:

- The generator's child-list `LayoutID` function emitted 20-digit IDs.
- Yeeflow imports those layout IDs through a signed 64-bit integer path.
- `73221000000000001001` is greater than `System.Int64.MaxValue` (`9223372036854775807`), so server-side import/materialization failed even though local JSON parsing and graph validation passed.

Fix applied:

- Child-list layout IDs now use a 19-digit `7322100000000001001`-style range.
- The generator now fails fast if any numeric-looking generated ID exceeds signed 64-bit range.
- `validate-yap-package.js` now reports `SYSTEM_INT64_ID_OVERFLOW` for generated final packages before runtime import.
- The regenerated package has 0 signed 64-bit overflow IDs in the decoded app definition and wrapper resource.

Second import hypothesis:

- AI Agent and Copilot records were generated with `Publisher: null`.
- Yeeflow AI resource import may expect publisher metadata as an integer value.
- The package was regenerated with `Publisher: 0` for both AI Agents and the Copilot.

Final manual import result:

- The regenerated package with signed-64-bit-safe layout IDs and `Publisher: 0` on all AI Agent/Copilot records imported successfully.
- This confirms both fixes as generated-package import requirements for this app shape.

Not completed in this pass:

- Opening the imported app from the card.
- Opening generated data lists.
- Opening generated dashboards.
- Opening Copilot configuration.
- Opening AI Agent configuration.
- Opening workflow designer or AI Assistant node configuration.
- Verifying the Contact image/file field in a live form.

The card click target or post-import navigation did not open the app during this pass, so deeper runtime proof needs another controlled UI pass.

## Safety-Defered Tests

The following were not executed:

- Copilot chat execution.
- AI Agent execution.
- Image upload or OCR/extraction execution.
- Contact workflow execution.
- Follow-up task creation by AI.
- Email sending.
- External API calls.

No real event visitors, attendee data, business-card images, credentials, tokens, or external connectors were used.

## Proof Classification

Runtime-proven:

- Upload/import dialog acceptance.
- Server-side import failure for oversized `LayoutID` values.
- Successful import after replacing oversized layout IDs and setting AI resource `Publisher` to `0`.

Runtime-fixed and locally validated after failure:

- Child-list layout IDs are now inside signed 64-bit range.
- Package validation rerun after the fix reports 0 `SYSTEM_INT64_ID_OVERFLOW` errors.
- App-contained AI Agent/Copilot resources use `Publisher: 0`.

Locally validated:

- App data model.
- App-contained Copilot resource.
- App-contained AI Agent resources.
- Contacts data-list workflow structure.
- AI Assistant workflow node reference to the Lead Fit Agent.
- Access application resources tool scopes.

Validation-only / safety-deferred:

- Copilot chat behavior.
- Name-card or badge image extraction.
- Agent-driven Contact and Company mutation.
- Agent-driven follow-up task creation.
- Follow-up email draft execution.
- Workflow execution.
- Dashboard runtime rendering.

## Follow-Up Runtime Pass

The next runtime pass should inspect the successfully imported package configuration without running AI execution:

- Refresh the Yeeflow workspace and open the app from its card or app context menu.
- Confirm all 4 data lists open.
- Confirm both dashboards render.
- Confirm Copilot quick prompts are visible.
- Confirm both Agent resources open.
- Confirm Access application resources tools point to local lists only.
- Confirm the Contacts workflow opens in designer.
- Confirm the AI Assistant node references `Lead Fit & Follow-up Advisor`.
- Confirm no Send Email action is present.
- Optionally create one fake Contact only if workflow execution can remain disabled or explicitly controlled.
