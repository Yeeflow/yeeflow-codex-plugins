# Yeeflow Requirement-to-YAP Generation Lifecycle

Use this lifecycle whenever the user provides Yeeflow application requirements, screenshots, sample forms, SOPs, process documents, sample exports, or app ideas and asks Codex to build, implement, create, generate, test, or output an application package or `.yap`.

The builder is the main controller. Coordinate the application, data-list, approval-form, dashboard, and expression generator skills as needed. Use proven knowledge first; send genuinely unknown platform behavior to `yeeflow-feature-learning-orchestrator`.

## Trigger Behavior

Run this lifecycle for requests such as:

- "Build this Yeeflow app from the uploaded requirement."
- "Implement this application."
- "Generate the .yap for this process."
- "Create the Yeeflow application based on this document."
- "Use the current skills to build this app."
- "Here is the requirement. Please generate the final app package."
- "Create the app and test it in Yeeflow."

Do not generate an app when the user explicitly asks only for study, review, planning, or learning.

## 1. Requirement Intake

Read all uploaded requirement files, screenshots, sample forms, sample exports, Markdown files, Word documents, PDFs, JSON files, and user notes.

Extract:

- business purpose
- user roles
- app modules
- data entities
- data lists
- approval forms
- data list forms
- dashboards
- reports
- workflows
- documents/files
- lookups/reference data
- sublists/line items
- calculations/expressions
- form actions
- query data needs
- integrations, if any
- risky, unsupported, or deferred features

If supplied exports or manually improved samples contain reusable patterns, study them read-only before generation. Preserve original files.

## 2. Initial Business Analysis

Before designing resources, summarize:

- the operational process
- start/end states
- actors and handoffs
- approval/review gates
- exceptions and rejection/rework paths
- data that must be captured, calculated, persisted, or reported

Document reasonable assumptions instead of blocking unnecessarily. Ask only when a missing answer would materially change the app architecture.

## 3. Initial App Plan/Spec

Create:

- `<app-name>-app-plan.md`
- `<app-name>-app-spec.json`

The plan must include:

1. App overview
2. Resources to generate
3. Data lists and fields
4. Approval forms and form sections
5. Data list custom forms, if needed
6. Dashboards, if needed
7. Workflow design
8. Expressions and calculated fields
9. Sublist/list controls and summaries
10. Form actions and temp variables, if needed
11. Query data requirements, if needed
12. ContentList persistence strategy
13. UI/UX design approach
14. Runtime test checklist
15. Deferred/risky items
16. Recommended v1 scope

The plan/spec must also make key design decisions explicit when relevant:

- requester/applicant model, including whether proxy submission is allowed
- applicant profile snapshot and readonly/persistence rules
- quota cycle, occupation timing, release behavior, and eligibility source
- multiple product/item sublist strategy
- form-action recalculation triggers for page load, driver-field change, and submit

Validate the spec with a JSON parse check before using it for generation.

## 4. Business Clarification Gate

After the initial app plan/spec is created, identify business-critical decisions that are still unanswered.

Business-critical questions include anything that changes:

- workflow route
- approval responsibility
- quota/policy calculation
- status lifecycle
- data ownership
- pricing or amount calculation
- required attachments/documents
- persistence timing
- compliance/audit handling
- dashboard inclusion if it affects v1 scope
- integration responsibility
- role permissions
- what happens on approval/rejection/resubmission

Examples:

- Should quota reset by calendar year or employee anniversary year?
- Should quota be occupied on submission or final approval?
- Is manager approval mandatory?
- Is custom pricing fixed or manually entered?
- Which attachments are required by scenario?
- Should v1 include a home dashboard?
- Should rejected records be automatically expired or manually closed?
- Should approval route depend on amount threshold?

When unanswered business decisions exist, output a clear question block in the Codex chat:

```text
Business clarification required before generation:

1. <Question>
   - Option A:
   - Option B:
   - Recommended default:
   - Why this matters:

2. <Question>
   - Option A:
   - Option B:
   - Recommended default:
   - Why this matters:

Generation is paused until these questions are answered or defaults are explicitly approved.
```

Stop after outputting the clarification block. Do not continue to `.yap` generation in the same turn.

Generation may continue only after:

- the user answers the questions, or
- the user explicitly approves default assumptions.

## 5. Wait For User Answers

If the clarification gate is open, wait. Do not generate an app, import anything, operate Yeeflow UI, or silently choose defaults.

When the user answers:

- update the app plan/spec
- mark each relevant `businessDecisionGates[].status` as `answered` or `defaultApproved`
- record the confirmed answer
- adjust v1 scope, workflow, form actions, data model, dashboards, and runtime checklist accordingly

## 6. Apply Confirmed Answers To Plan/Spec

App specs should include decision gates using this shape:

```json
"businessDecisionGates": [
  {
    "key": "quotaCycle",
    "question": "Should quota reset by calendar year or employee anniversary year?",
    "options": ["calendarYear", "employeeAnniversaryYear"],
    "recommendedDefault": "calendarYear",
    "requiredBeforeGeneration": true,
    "status": "unanswered"
  }
]
```

Technical assumptions should be recorded separately from business decision gates. Technical assumptions can be tested by Codex during generation/runtime and should have fallback behavior.

Examples:

- whether `getUserAttr(RequesterApplicant, ...)` works directly
- whether a tenant profile field is populated
- whether a dashboard widget binding needs a specific runtime pattern
- whether a form action step needs a reduced runtime proof

Technical assumptions should not block generation unless they affect business correctness.

## 7. Generation-Readiness Review

Before generation, confirm:

- all required business decision gates are answered or defaults are explicitly approved
- mandatory v1 business capabilities are not misclassified as v2 enhancements
- technical assumptions have validation/fallback plans
- approval form design-quality gates are represented
- the JSON spec parses

Stop if any required business decision gate remains unanswered.

## 8. Decide Safe V1 Scope

Choose the safest first working version.

Default v1 scope:

- core data lists
- one main approval form
- simple workflow
- ContentList persistence
- essential expressions/calculations
- no unnecessary dashboards/reports/integrations unless required

If the requirement is large, defer advanced features to v2/v3. Prefer a working, importable, testable v1 over a large all-at-once package.

## 9. Generate V1 Package

Generate:

- `<app-name>-app-def.v1.json`
- `<app-name>-approval-form-def.v1.json`, if applicable
- `<app-name>.v1.yap`
- generation report
- validation reports

Use current proven generation rules:

- use a fresh ID family
- use a fresh FlowKey/form key
- keep `Data.Forms[].ListID = 0` for app-level approval forms
- preserve native Title metadata on all generated data lists
- use requester/current-user expression assignment instead of hardcoded tenant-specific users unless export-backed
- set full-page background on the page/form background, not the `Main` container
- use Main / Content / Form body / Form bottom
- place Action Panel and Flow History in Form bottom
- use the learned Text control standard
- make Text controls inline width by default
- use two-column grids for normal fields
- use full-row layout for textarea, richtext, list, and sublist controls
- use meaningful `nv_label` names
- use correct `attrs.querydata_filters` plural for Query data filters
- use readable lookup summary variables instead of raw lookup IDs when persistence/display should be readable
- treat temp variables as frontend-only; do not use them for backend persistence unless copied into workflow/form variables
- use requester/applicant variables or snapshot variables for applicant business logic after defaulting from Current User
- when an editable applicant field drives profile/quota logic, bind its change action to rerun applicant snapshot and quota/policy calculations
- when quota is employee-anniversary based, persist a numeric cycle field on usage records and query by applicant identity + cycle + status
- when using `dateDiff`, encode the third unit parameter as a raw lowercase string such as `"year"`, not an expression-token array
- keep dependent Set variable calculations ordered; use multi-value Set variables only for independent assignments
- ensure ContentList mappings use valid workflow/form variables

Use current proven feature foundations:

- approval-control runtime coverage
- expression generation rules
- sublist current-object expressions
- sublist summary binding
- workflow numeric routing
- form actions Phase 1 and Phase 2
- Query data multiple/single
- Submit form / Save changes
- `arraySum` and `JSONStringfy` where export-backed

## 10. Local Validation

Run the relevant local checks:

```bash
node --check <generator>
node scripts/smoke-expression-validation.mjs
node validate-yap-package.js <app-def-or-yap>
node validate-yap-graph.js <app-def-or-yap>
node validate-ywf-def.js <approval-form-def>
node validate-ydl-list.js <list-def>
node workflow-action-config-validator.js <app-def-or-workflow>
node build-yap-wrapper.js <app-def.json> <output.yap>
```

Also run JSON parse checks for generated specs and decoded/package JSON.

Do not import if validation has blocking errors. Warning-level findings may be acceptable when documented and understood.

## 11. Runtime Test

Use:

`https://codex.yeeflow.com/`

Runtime checklist:

1. Import app.
2. App opens.
3. Data lists open without `datas/query` 400.
4. Approval forms open.
5. Data list custom forms open, if included.
6. Dashboards render, if included.
7. Required controls render.
8. Expressions work.
9. Sublist calculations and summaries work, if included.
10. Form actions work, if included.
11. Query data works, if included.
12. Submit workflow.
13. Approval task opens.
14. Approval/rejection works.
15. ContentList creates records.
16. Persisted values are readable and correct.

Runtime testing requires explicit user intent to test/import or an app-generation request that asks for end-to-end testing. Do not operate Yeeflow UI for study-only tasks.

## 12. Fix Runtime Issues

If runtime fails:

- capture console/network evidence
- identify the root cause
- do not guess
- patch only after the root cause is clear
- regenerate with a fresh ID family and fresh FlowKey/form key
- retest

Known root-cause checks:

- bad native Title metadata can cause data list query failure
- hardcoded tenant user assignment can fail after import
- raw lookup value persisted to text stores a row ID, not display name
- temp variables are not backend persistence variables
- Query data filters must use `attrs.querydata_filters` plural
- Text control `attrs.heads.color` must be a plain string, not an array
- `Main` container should not carry page-level background
- `Data.Forms[].ListID` must be `0` for app-level approval forms

## 13. Documentation

Create:

- `docs/generated-<app-name>-baseline-v1.md`

Include:

- generated resources
- field/control types used
- workflow shape
- expressions
- sublists/summaries
- form actions
- ContentList mappings
- validation results
- runtime result
- known limitations
- v2 recommendations

## 14. Skill Updates

If new reusable Yeeflow patterns are learned:

- update docs
- update validators if safe
- update relevant project skill mirrors
- sync to `~/.codex/skills`
- run skill checks

Do not update skills for app-specific content unless it is reusable.

## 15. Git

After success or honest partial result:

- run `git status`
- confirm no raw exports/secrets are staged
- stage safe files only
- commit and push the current branch

Suggested commit message:

```text
Generate <App Name> v1 baseline
```

## 12. Final Output

Report:

- generated `.yap` path
- upload/download copy path, if any
- app plan/spec paths
- validation results
- runtime result
- known limitations
- docs updated
- skills updated, if any
- commit hash
- branch status

## Usage Example

Example user request:

```text
Here is the requirement document. Use the Yeeflow app generation lifecycle to implement this application and output the final .yap.
```

Expected Codex behavior:

1. Study the requirement.
2. Create plan/spec.
3. Generate v1.
4. Validate locally.
5. Import/runtime-test in `codex.yeeflow.com` if requested as part of the app build/test.
6. Fix issues with fresh IDs if needed.
7. Document result.
8. Commit/push.
9. Report final `.yap` path.
