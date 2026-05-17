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
