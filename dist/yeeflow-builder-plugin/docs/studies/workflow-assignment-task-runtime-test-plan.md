# Workflow Assignment Task Runtime Test Plan

## Purpose

Plan a future focused runtime baseline for Assignment Task assignee routing. This plan is not runtime proof. The current evidence is export-proven, API-category-assisted, product-documented, and validator-backed only.

## Scope

Use the smallest approval app that can safely test Assignment Task routing classes without exposing private identities. Runtime work must not happen on the export-learning branch unless explicitly requested.

Test scenarios:

| Scenario | Purpose | Data requirement | Proof target |
|---|---|---|---|
| Static single user | Confirm `type=user`, `method=direct` creates a task for a safe user | explicitly authorized safe user | task routes to intended safe assignee |
| Multiple static users | Confirm multiple direct users in `usertaskassignment[]` | two or more safe users | task creation and completion behavior |
| Direct job position | Confirm direct position assignee expansion | safe position with known test member(s) | task routes to position holder(s) |
| Position by department | Confirm selected department + position routing | safe department and position mapping | task routes to matching role |
| Position by location | Confirm selected location + position routing | safe location and position mapping | task routes to matching role |
| Applicant line manager | Confirm applicant context lookup | safe applicant with safe manager | task routes to manager |
| Applicant department manager | Confirm applicant department manager lookup | safe applicant department with manager | task routes to department manager |
| User group expression | Confirm group expansion if safe group exists | disposable or explicitly safe user group | task routes to group members |
| Sequential appointed order | Confirm `issequential=true` order | two safe assignee sources | first assignee receives task before next |
| Parallel/default appointed order | Confirm absent `issequential` fan-out | two safe assignee sources | all applicable assignees receive tasks together |
| Custom percentage completion | Confirm `approveway=custompercentage` + `approvepercentage` | safe multi-assignee task | completion threshold behavior |
| Email notification enabled | Designer/open proof first; delivery only if explicitly scoped | safe notification recipient/sandbox | configuration persists; delivery not assumed |

## Safety Rules

- Do not use real private users unless explicitly authorized and safe.
- Do not send email unless notification delivery is explicitly scoped and recipients are safe.
- Do not commit request records, raw API responses, raw exports, screenshots with private identities, or `.env.local`.
- Use `yeeflow-api-operator` only for authorized read-only lookup of users, departments, locations, and positions.
- Treat user-group lookup as unresolved unless a future safe API/operator expansion supports it.

## Validation Before Runtime

Before import or live workflow execution:

- run package validation in compatibility/generator mode as appropriate
- run graph validation
- run workflow action config validation
- run assignment assignee inspection
- run secret/private-data safety scans
- verify generated package contains no private user/org data unless explicitly required and safe

## Proof Boundary

Runtime proof requires import/open plus actual disposable request execution for routing scenarios. Designer visibility, package validation, and API category lookup are not enough to claim routing behavior.
