# Form Actions Phase 2 Query Submit Test v1 Baseline

## Generated Package

- App: `Form Actions Phase 2 Query Submit Test v1`
- Runtime import label used for the final test: `Form Actions Phase 2 Query Submit Test v1 Filter Patch`
- Generator: `generate-form-actions-phase-2-query-submit-test-v1.mjs`
- Workspace package: `Form Actions Phase 2 Query Submit Test v1.generated.yap`
- Download copy: `/Users/Renger/Downloads/Form Actions Phase 2 Query Submit Test v1.generated.yap`

The `.yap`, generated package JSON, decoded form/list JSON, and validation JSON remain ignored and are not intended for Git staging.

## Local Validation

Ran successfully:

- `node --check generate-form-actions-phase-2-query-submit-test-v1.mjs`
- `node generate-form-actions-phase-2-query-submit-test-v1.mjs`
- `node scripts/smoke-expression-validation.mjs`
- `node validate-yap-package.js form-actions-phase-2-query-submit-test-v1-app-def.json --mode generator --stage final`
- `node validate-yap-graph.js form-actions-phase-2-query-submit-test-v1-app-def.json --mode generator --stage final`
- `node validate-ywf-def.js form-actions-phase-2-query-submit-test-v1-approval-form-def.json --mode final`
- `node validate-ydl-list.js form-actions-phase-2-query-submit-test-v1-source-list-def.json`
- `node validate-ydl-list.js form-actions-phase-2-query-submit-test-v1-target-list-def.json`
- `node workflow-action-config-validator.js form-actions-phase-2-query-submit-test-v1-app-def.json`
- `node build-yap-wrapper.js ...`
- wrapper package and graph validation

Validator result summary:

- package validation: pass with warnings, 0 errors
- graph validation: pass, 0 errors
- approval form validation: pass with warnings, 0 errors
- source/target list validation: pass with warnings, 0 errors
- wrapper round trip: pass

## Runtime Result

Runtime target: `https://codex.yeeflow.com/`

Result: partial pass during Codex runtime testing; user follow-up identified the missing filter wiring.

Passed:

- app imports
- app opens
- source data list opens and sample rows load
- target data list opens without `datas/query` 400
- approval form opens
- Query data multiple item action runs from a button click
- Query data multiple result collection maps into the `Query Results` sub list
- query result count maps into a display/workflow value
- Query data single item action runs from a button click
- single-query field mapping populates form values
- `arraySum` over the query result collection runs and returned `2300`
- `JSONStringfy` displays the query collection JSON
- Save changes action succeeds and does not advance workflow
- custom Submit form action submits into the workflow
- reviewer task opens for the current user
- approval completes
- ContentList creates a readable target-list record
- Text controls remained editor-safe and inline-width

Deferred / partial from the generated package:

- The Query data `Active == true` filter was ignored by runtime because the generated package did not configure the actual Query data step `Data filter -> Condition` setting. The generator wrote an `attrs.querydata_filter` helper array, but the designer/runtime did not treat that as the Query data step's Data filter condition.
- `vLookup` remains deferred because no safe export-backed expression token shape has been proven.
- Query Amount Sum was runtime-proven in the action test but was not persisted in the final submitted record because the final submit path did not rerun the arraySum action before submit.

User follow-up with patched export:

- Manually opening the Query data step and setting `Data filter -> Condition` to `Active Equals ON` made the filter work.
- The filter behavior itself is runtime-proven once configured in the correct step setting.
- The patched export stores the working condition in `attrs.querydata_filters` plural:

```json
{
  "querydata_filters": [
    {
      "key": "d7bf4cd0-0b69-47f6-9fbd-fc6cee84c78e",
      "pre": "and",
      "left": "Bit1",
      "op": "0",
      "right": "true",
      "showCus": true
    }
  ]
}
```

## Runtime Evidence

Source list loaded three packaged records:

- `SRC-001`, `Laptop replacement`, `Approved`, `1200`, `Active = true`
- `SRC-002`, `Software license renewal`, `Approved`, `800`, `Active = true`
- `SRC-003`, `Archived monitor request`, `Closed`, `300`, `Active = false`

Multiple Query action result:

- sub list loaded `SRC-003`, `SRC-002`, and `SRC-001`
- Loaded Count displayed `3`
- this proves query execution, selected-field mapping, count output, and list-variable population, but not filter correctness

Single Query action result:

- Query Title: `SRC-003`
- Query Request Title: `Archived monitor request`
- Query Approval Status: `Closed`
- Query Amount: `300`
- Query Final Notes: `Inactive sample`

Expression action result:

- `arraySum(__temp_var_CollectionofQueryItems, "Amount", [], [])` returned `2300`
- `JSONStringfy(__temp_var_CollectionofQueryItems)` displayed:

```json
[{"Title":"SRC-001","Amount":"1200"},{"Title":"SRC-002","Amount":"800"},{"Title":"SRC-003","Amount":"300"}]
```

Save changes result:

- button action returned a success toast
- the workflow did not advance

Submit / approval / persistence result:

- custom Submit form button created workflow instance `20552123947196252162026051500001`
- reviewer task opened for `Renger from Yeeflow`
- reviewer approval completed
- target list row was created with:
  - Request Title: `Phase 2 Submit Action Request`
  - Loaded Count: `3.00`
  - Selected Query Title: `SRC-003`
  - Selected Query Status: `Closed`
  - Approval Status: `Approved`
  - Created From Workflow: `Yes`

## Generation Guidance

Runtime-proven for generated approval forms:

- `querydata` multiple can populate a form list/sublist variable.
- `querydata_totalcount` can populate a count value for display and later persistence when copied into a workflow variable.
- `querydata` single can map selected fields into form/workflow variables.
- Query result collections can be aggregated with `arraySum`.
- Query result collections can be displayed/debugged with export-backed `JSONStringfy`.
- `submit` with default attrs can submit the form/workflow from an action button.
- `submit` with `attrs.submitType = "3"` can Save changes without progressing workflow.

Filter correction:

- Query filters belong in the Query data step's `Data filter -> Condition` configuration.
- Generate `attrs.querydata_filters` plural.
- Do not rely on the generated `attrs.querydata_filter` singular helper path; runtime ignored it in this baseline.
- For Bit/Yes-No source fields, use `right: "true"` for ON, not `right: "ON"`.
