# Application Planning Key Design Decisions

Use this reference during app planning and generation-readiness review.

## Requester / Applicant Model

When an app has a requester, applicant, employee, beneficiary, or request-for identity:

- decide whether the applicant is always the current user or can be changed for proxy submission
- if the applicant field is editable, bind field-change actions to reload dependent snapshot/profile/quota logic
- Current User may default `RequesterApplicant` on a new request
- applicant business logic must use `RequesterApplicant` or applicant snapshot variables after defaulting
- task viewers, reviewers, HR, finance, and admins must not overwrite applicant data from their own Current User context
- if the field has Default value = Current User, do not add a redundant Set variable step that also defaults it from Current User

## Profile Snapshot Model

For user-profile-derived business data:

- snapshot required profile fields into workflow/form variables
- make snapshot fields readonly unless HR is intentionally allowed to edit them
- persist snapshots through ContentList when they are needed for reporting/audit
- handle missing profile data with HR verification fallback
- never fall back to the current task viewer for applicant profile values after submission

## Quota / Eligibility Model

When a requirement includes annual quota, benefit eligibility, entitlement, or employee tenure:

- identify the quota cycle: calendar year, employee anniversary year, or custom cycle
- identify quota occupation timing: submission, final approval, or another event
- identify release behavior on rejection/cancel
- identify whether eligibility depends on hire/boarding date
- use numeric cycle fields when comparing usage by non-calendar cycles
- query usage records by applicant identity + cycle + active/occupied status
- use `arraySum` for usage aggregation
- use form actions to rerun quota checks on initialization, driver-field change, and submit
- when quota is occupied on submission, create the usage record at workflow start/submission, not after final approval
- include in-progress/occupied records in future quota checks so concurrent in-flight requests consume quota
- update the usage record to approved/confirmed on final approval
- release, reject, delete, or otherwise exclude the usage record on rejection/cancel
- store a correlation key such as form instance id, workflow instance id, request instance key, or application number so the matching usage record can be updated later
- if update/delete is not runtime-proven, keep the create-on-submission behavior as a required v1 proof item and document HR/manual release fallback instead of leaving the usage list idle

Employee-anniversary example:

- `ApplicantBoardingYears = dateDiff(ApplicantBoardingDate, now(), "year", [])`
- if `ApplicantBoardingYears = 0`, effective family annual quota is `0`
- if `ApplicantBoardingYears > 0`, the applicant is eligible for that cycle
- persist numeric `QuotaCycleNumber` on usage records and query usage by the same number

## Multiple Product Selection

When users can request multiple products, services, benefits, or items:

- design selection as a sublist/listref
- use a lookup as the first column
- autofill product type, name, price, and other derived fields
- make autofilled and calculated fields readonly
- calculate row subtotal with current-object expressions
- bind row subtotal summary to a top-level total variable
- use the total variable for quota, workflow routing, validation, and persistence
- persist a readable product summary when direct row persistence is not proven

## Data List Runtime Purpose

Every generated v1 data list must have a declared runtime purpose:

- who maintains it
- who reads it
- which form action, workflow action, ContentList node, dashboard, or report writes to it
- whether it is used for calculations, routing, reporting, audit, or configuration

Do not include a configuration, usage, audit, or reporting list in v1 if nothing reads or writes it. Either use it in the app or mark it v2/deferred and omit it from the v1 package unless the user explicitly wants a placeholder.

For configuration lists such as attachment requirement rules:

- either query or lookup the list at runtime to drive guidance/validation
- or keep a static v1 mapping and remove/defer the list until runtime use is proven
- do not generate dead configuration lists that look maintained but never affect the form/process

## Form Action Planning

For dependent form logic:

- use page-load/init actions for first load
- use field-change actions when a key driver field changes
- run policy-critical recalculations on submit
- keep dependent calculations in ordered Set variable steps
- use multi-value Set variables only for independent assignments where order does not matter
- use `attrs.querydata_filters` for Query data filters
- submit guard actions should call reusable checks, conditionally warn/confirm, then run Submit form
- conditional guard steps before Submit usually require `continue: true`

## Workflow Branch Coverage

For every workflow node with multiple outgoing branches:

- list all outgoing conditions during planning
- confirm that routing variables are required, auto-derived, or protected by fallback branches
- cover yes/no/empty/unexpected values when a branch depends on a choice flag
- route unknown or empty policy-driving values to review/fallback rather than a workflow dead end
- avoid reversing business meaning: custom/high-value/exception paths usually go to the specialist review branch, while normal paths continue to standard persistence
