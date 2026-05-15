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
- recommend the best Yeeflow-native application structure
- separate v1 must-have scope from v2/v3 enhancements
- prefer a working, high-quality app over an overloaded first package
- use proven runtime-safe patterns from the installed skills
- mark unproven features clearly and test them before depending on them
- make reasonable assumptions when requirements are unclear, document them, and keep moving unless the assumption would be risky

## Default Lifecycle

For requirement-to-application requests, load `references/requirement-to-yap-generation-lifecycle.md` and follow it end to end:

1. Requirement intake
2. Business process understanding
3. App architecture design
4. Data model design
5. Form and UI/UX design
6. Workflow design
7. Expression/calculation design
8. Sublist/summary design
9. Form action/query-data design, if needed
10. Dashboard/reporting design, if needed
11. Safe v1 scope decision
12. App spec creation
13. `.yap` generation
14. Local validation
15. Runtime import testing when requested or included in the user's build/test request
16. Runtime issue fixing
17. Documentation
18. Skill updates only if new reusable knowledge is learned
19. Git commit/push
20. Final `.yap` output

Also load `references/business-solution-design-principles.md` before designing the app structure.

## Proven Standards To Apply

Use the current Yeeflow generation foundation by default:

- fresh ID family
- fresh FlowKey/form key
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
- `arraySum`
- `JSONStringfy`
- readable lookup summary variables
- temp variables are frontend-only
- ContentList persistence rules

## Stop And Defer

Do not blindly implement every requested detail in v1. Defer features when they are unsupported, runtime-sensitive, integration-heavy, unclear, or likely to make the first package hard to import and test.

Use `yeeflow-feature-learning-orchestrator` when a requested app needs an unproven platform capability that should be learned from exports before production-style generation.
