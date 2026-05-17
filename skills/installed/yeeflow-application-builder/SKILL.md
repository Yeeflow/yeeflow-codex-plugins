---
name: yeeflow-application-builder
description: build real Yeeflow business applications from requirements, process documents, forms, screenshots, SOPs, sample exports, and app ideas by acting as a business solution architect, designing the safest Yeeflow-native app structure, generating and validating .yap packages, runtime-testing when requested, documenting baselines, and coordinating Yeeflow generator skills.
---

# Yeeflow Application Builder

Use this skill when the user provides business requirements, process documents, forms, screenshots, SOPs, sample exports, workflow requirements, or app ideas and asks Codex to build, implement, create, generate, test, or output a Yeeflow application package or `.yap`.

This skill is the top-level application-building controller. It coordinates proven generator skills:

- `yeeflow-application-generator`
- `yeeflow-data-list-generator`
- `yeeflow-approval-form-generator`
- `yeeflow-dashboard-generator`
- `yeeflow-expression-generator`

Use `yeeflow-feature-learning-orchestrator` instead when the task is primarily to learn an unknown Yeeflow platform feature from exports, screenshots, runtime tests, or manual fixes.

## Core Behavior

Think like an experienced business consultant and Yeeflow solution architect:

- understand the business goal before designing fields
- identify mandatory core business capabilities before proposing v1 scope
- do not defer a feature that is central to the stated business process merely because it is technically sensitive; mark it as a required v1 runtime proof item with fallback behavior instead
- recommend the best Yeeflow-native application structure
- separate v1 must-have scope from v2/v3 enhancements
- separate business decision gates from technical runtime assumptions
- ask the user/business owner to confirm business decision gates before generation, unless they explicitly approve default assumptions
- present unanswered business decision gates directly in the Codex chat and stop before generation until the user answers or explicitly approves defaults
- prefer a working, high-quality app over an overloaded first package
- use proven runtime-safe patterns from the installed skills
- mark unproven features clearly and test them before depending on them
- make reasonable assumptions when requirements are unclear, document them, and keep moving unless the assumption would be risky
- when requirements imply multiple selectable business items, evaluate a sublist/listref design early instead of forcing a single lookup field
- when requirements include requester/applicant/employee identity, decide whether proxy submission is allowed; if the applicant field is editable, its change action must rerun profile snapshot and dependent policy/quota calculations
- when requirements include quota, benefit eligibility, or tenure rules, decide the quota cycle, occupation timing, release behavior, and eligibility source before generation
- every generated data list must have an active runtime purpose in v1 or be explicitly deferred out of the package
- workflow routing variables must be required, auto-derived, or protected by fallback branches so no approval path can dead-end on empty/unexpected values

## Default Lifecycle

For requirement-to-application requests, load `references/requirement-to-yap-generation-lifecycle.md` and follow it end to end:

1. Requirement intake
2. Initial business analysis
3. Initial app plan/spec
4. Business clarification gate
5. Wait for user answers when business-critical decisions are missing
6. Apply confirmed answers to plan/spec
7. Generation-readiness review
8. Generate `.yap` only if ready
9. Local validation
10. Runtime import testing when requested or included in the user's build/test request
11. Runtime issue fixing
12. Documentation
13. Skill updates only if new reusable knowledge is learned
14. Git commit/push
15. Final `.yap` output

Also load `references/business-solution-design-principles.md` before designing the app structure.
For generation-readiness reviews, also load `references/business-decision-gates.md`, `references/application-design-quality-gates.md`, and `references/application-planning-key-design-decisions.md`.

## Business Decision Gates

Before generating a real `.yap`, identify business choices that materially change workflow, validation, data persistence, pricing, quota logic, attachment rules, dashboards, or approval responsibility.

Treat these as confirmation gates, not technical notes. Stop before generation if business-critical gates are unanswered and the user has not explicitly approved default assumptions.

### Business Clarification Gate

When unanswered business-critical decisions exist, ask them directly in the Codex chat after the initial app plan/spec is created or updated.

Use this exact chat format:

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

After outputting this block, do not continue to `.yap` generation in the same turn. Wait for the user's answers or explicit approval of the recommended defaults.

Examples:

- quota cycle policy
- quota occupation/release timing
- mandatory approval roles
- pricing ownership and manual override policy
- exact attachment requirements by scenario
- whether dashboard surfaces belong in v1
- status lifecycle
- compliance/audit handling
- integration responsibility
- role permissions
- what happens on approval, rejection, or resubmission

Technical assumptions are different. Token shapes, tenant profile completeness, query-data behavior, conditional ContentList behavior, route-condition behavior, and validator/runtime quirks should be tested during generation/runtime validation and handled with fallback.

App specs should record decision gates using this shape:

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

## Mandatory V1 Capability Rule

Do not incorrectly move core business capabilities to v2. If a capability is essential to the requested business process, keep it in v1 as either:

- a proven implementation item, or
- a required v1 runtime proof item with a documented fallback.

Only defer true enhancements, integrations, advanced analytics, admin configurability, scheduled automation, or optional polish.

## Design Quality Gate

Before accepting generated approval forms, run a design-quality review using `yeeflow-approval-form-generator`.

Generated app packages must fail readiness if the approval form does not follow the learned Yeeflow design structure:

- page-level background, not `Main` background
- `Main` / `Content` / `Form body` / `Form bottom`
- Form header / request summary
- two-column grids for normal fields
- full-row layout for textarea, upload, list/sublist, rich text, and long helper/guidance content
- learned Text control standard, inline width by default
- meaningful `nv_label`
- Action Panel and Flow History in Form bottom

## Proven Standards To Apply

Use the current Yeeflow generation foundation by default:

- fresh ID family
- fresh FlowKey/form key
- FlowKey/form key must be safe against Yeeflow import replacement: its lowercase text must not appear inside reserved JSON property names such as `prefix`, `suffix`, `field`, `fields`, `profile`, `definition`, `workflow`, `variable`, `filter`, `ref`, `href`, `control`, `collection`, `condition`, `expression`, `attributes`, `actions`, or `binding`. Known failure: FlowKey `EFI` corrupted summary binding key `prefix` into `pr<runtimeFlowKey>x`.
- `Data.Forms[].ListID = 0`
- native Title metadata on generated data lists
- requester/current-user assignment instead of hardcoded tenant users
- page-level background, not `Main` background
- learned Text control standard
- Text controls inline width by default
- Main / Content / Form body / Form bottom
- Action Panel and Flow History in Form bottom
- two-column grids for normal fields
- full-row long controls and sublists
- meaningful `nv_label`
- approval-control runtime coverage
- expression generation rules
- sublist current-object expressions
- sublist summary binding
- workflow numeric routing
- form actions Phase 1 and Phase 2
- correct `attrs.querydata_filters`
- expression-editor token arrays with `showCus: false` for Query data filter values that reference workflow variables or calculations
- `arraySum`
- `JSONStringfy`
- readable lookup summary variables
- multi-item product/service/request lines should use sublists with row calculations and summary-bound total variables when the business process allows multiple selections
- policy-critical totals from sublists should be recalculated in quota/submit/routing/persistence preflight actions with `arraySum(<ListVariableId>, "<SubtotalFieldId>", [], [])`, even when a visible summary binding is present
- applicant/requester variables should be fixed business identities; Current User may default the applicant on a new request, but applicant profile reads, quota checks, workflow routes, and persistence should use the requester/applicant variable or snapshot variables
- editable applicant/requester controls must rerun dependent snapshot/profile/quota form actions on change when proxy submission is allowed
- user-profile-derived applicant data should be snapshotted into workflow/form variables, displayed readonly, and persisted through ContentList when needed for reporting/audit
- quota and benefit usage lists should include applicant identity, readable applicant name, cycle number/year, amount, status, and source application number
- if quota is occupied on submission, create the usage/occupation record when the workflow starts, include in-progress and approved/confirmed records in future quota checks, and release/update the matching record on rejection or final approval using a stored request/form/workflow correlation key
- employee-anniversary quota cycles should use a numeric cycle field when comparing usage records; for boarding-year eligibility, `ApplicantBoardingYears = dateDiff(ApplicantBoardingDate, now(), "year", [])`, with `0` meaning no family quota and values greater than `0` meaning eligible
- configuration lists such as attachment requirement rules must be read by form actions, workflows, dashboards, or reports in v1; otherwise remove/defer them instead of shipping dead configuration
- workflow branches from approval/review nodes must cover normal, exception, empty, and unexpected routing-variable cases; unknown policy values should route to review/fallback, not to a dead end
- core policy checks such as quota validation should run automatically on submit, not only through a manual check button
- submit guard actions should prove both the invalid/warning path and the valid path; conditional warning/confirm/check steps before submit usually need step-level `continue: true` so valid requests skip the warning and still reach Submit form
- required applicant identity controls with Default value = Current User should not also get redundant page-load Set variable default steps
- multi-value Set variables should be used only for independent assignments; keep ordered Set variable steps when later values depend on earlier assignments
- temp variables are frontend-only
- ContentList persistence rules

## Stop And Defer

Do not blindly implement every requested detail in v1. Defer features when they are optional, integration-heavy, advanced, unclear, or likely to make the first package hard to import and test.

Do not use "runtime-sensitive" alone as a reason to defer a core business capability. For core capabilities, require focused runtime proof and fallback behavior.

Stop before generation when:

- mandatory business decision gates are unanswered
- required v1 capabilities have been misclassified as v2 enhancements
- approval form design quality gates are not represented in the plan/spec
- generated form structure lacks grid-based field layout or Form bottom action/history placement

Use `yeeflow-feature-learning-orchestrator` when a requested app needs an unproven platform capability that should be learned from exports before production-style generation.
