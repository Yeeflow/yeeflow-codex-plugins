# Scheduled Workflow Runtime Test Plan

Source export: `/Users/Renger/Downloads/AI Agent and Copilot Local Resource Baseline8.yap`

Current milestone: validation-only. No generated package or runtime test was run in this branch.

## Local Gates

Before any runtime import:

1. Decode the `.yap` with large numeric IDs preserved as strings.
2. Create redacted normalized references.
3. Run package validation in compatibility or generator mode as appropriate.
4. Run graph validation.
5. Confirm `QueryData` list references resolve.
6. Confirm `AI` action Agent references resolve.
7. Confirm fixed email recipients are safe or redacted and not executed.
8. Confirm the schedule cannot run automatically during import/open testing.

## Safe Runtime Checks

Safe checks for a future generated package:

- package imports
- app opens and is not an empty shell
- Scheduled Workflow resource appears
- Scheduled Workflow designer opens
- recurrence settings render correctly
- timezone renders correctly
- working-days-only setting renders correctly when present
- Query data action opens and targets the local list
- AI Assistant action opens and references the local Agent
- Send email action opens and displays safe recipient/subject/body configuration
- workflow variables are visible

## Blocked Checks

Blocked unless explicitly safe:

- triggering the schedule
- running the workflow
- sending email
- executing the AI Assistant action against live AI
- using real recipients
- using tenant/private data in email content

## Classification

Use these labels:

| Label | Meaning |
| --- | --- |
| validation-only | Decode, documentation, and local validation only. |
| partial | Import/open/configuration renders, but schedule/email/AI execution is skipped. |
| runtime-proven | Import/open and explicitly safe non-private execution pass. |
| blocked | Runtime would send real email, call live AI unexpectedly, or execute a schedule unsafely. |
