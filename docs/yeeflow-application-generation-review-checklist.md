# Yeeflow Application Generation Review Checklist

Use this checklist before packaging, after local validation, and after runtime testing for generated Yeeflow applications. It is a review aid for future generation tasks; it does not replace the package/form/list/workflow validators.

## 1. Scope And Package Type

- [ ] The requested app type is clear: new/cloned `.yap` package or existing-app `.yapk` upgrade package.
- [ ] For new/cloned `.yap`, the package uses a fresh ID family and a fresh safe FlowKey/form key.
- [ ] For existing-app upgrades, `.yapk` is treated as read-only/server-generated unless a valid Yeeflow Version management baseline and signing/encoding proof exists.
- [ ] The app does not include dead configuration lists; every v1 list is used by forms, workflow, dashboard, reports, or documented runtime proof.
- [ ] Business-critical capabilities are either implemented in v1 or marked as required runtime proof items with fallback behavior.

## 2. Local Validation Gate

- [ ] Package wrapper validates.
- [ ] App graph validates.
- [ ] Approval form definitions validate.
- [ ] Data list definitions validate.
- [ ] Workflow action configuration validates.
- [ ] Expression smoke checks cover generated formulas, query filters, workflow conditions, and sublist summaries where applicable.
- [ ] The package is not sent to Yeeflow runtime testing until local validation passes, unless the task is explicitly an isolation/proof experiment.

## 3. Runtime Test Gate

Before claiming runtime proof, complete `docs/yeeflow-runtime-test-checklist-template.md` for the tested package.

Minimum runtime smoke proof:

- [ ] App imports and opens.
- [ ] Dashboards render.
- [ ] Data lists open without `datas/query` 400 responses.
- [ ] Approval forms open from the app and, when needed, from submitted workflow tasks.
- [ ] At least one valid submit path completes without workflow node errors.

Production-like runtime proof:

- [ ] Requester/applicant logic works for the intended requester and proxy scenarios.
- [ ] Product/sublist row calculations and summary totals update after row commit/blur.
- [ ] Policy-critical totals are recalculated through safe preflight actions before routing, quota, or persistence decisions.
- [ ] Query data filters use the runtime-proven filter shape and return only expected rows.
- [ ] Workflow branches cover normal, exception, empty, and unexpected values.
- [ ] Submit, approve, reject, return, and resubmission paths pass when included.
- [ ] `ContentList` and usage/audit list lifecycle events persist expected rows and readable values.
- [ ] Dashboard KPIs match source list data after runtime records change.

## 4. Runtime Safety Review

- [ ] Temp variables are used only for frontend form state, not backend persistence, audit records, dashboard sources, or workflow routing that must survive submission.
- [ ] FlowKey/form key text does not collide with reserved JSON property names.
- [ ] Wrapped or export-back inspection shows no corrupted `prefix` / `pr<id>x` binding keys.
- [ ] Requester/applicant variables, profile snapshots, and quota/eligibility calculations use the intended identity variable rather than accidental Current User context after submission.
- [ ] Hardcoded tenant user IDs are avoided unless export-backed and valid for the target tenant.
- [ ] Attachment controls include tested behavior or explicit guidance/fallback when binary persistence is not proven.

## 5. Form Design Quality Gate

- [ ] Approval forms use page-level background and the learned `Main` / `Content` / `Form body` / `Form bottom` shell.
- [ ] Header, request summary, and metric/status rows are present when the business process needs quick review context.
- [ ] Normal fields use two-column grids; long text, upload, rich text, sublist, and guidance controls use full-row layout.
- [ ] Workflow Action Panel and Flow History are placed in `Form bottom`.
- [ ] Text and icon controls use learned inline-width behavior and meaningful designer `nv_label` values.
- [ ] Runtime-sensitive controls have fallback behavior or focused proof notes.
- [ ] The runtime form has no visible caption clutter, overlapping content, unreadable colors, or layout regressions.

## 6. Reporting Language

- [ ] Use "locally validated" when only local validators and wrapper checks passed.
- [ ] Use "runtime smoke-tested" only after import/open/dashboard/list/form and at least one valid workflow path are tested.
- [ ] Use "runtime baseline passed" only when branch, persistence, dashboard KPI, and included return/rejection paths have evidence.
- [ ] List every blocked or deferred runtime item explicitly in the final report.
