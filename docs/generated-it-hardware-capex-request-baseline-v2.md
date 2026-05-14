# Generated IT Hardware CAPEX Request Baseline v2

## Package

- App: `IT Hardware CAPEX Request`
- Runtime import name: `IT Hardware CAPEX Request Runtime V2`
- Generated app JSON: `it-hardware-capex-request-app-def.v2.json`
- Approval form Def JSON: `it-hardware-capex-request-approval-form-def.v2.json`
- List validation JSON: `it-hardware-capex-request-list-def.v2.json`
- Wrapper: `it-hardware-capex-request.generated.v2.yap`
- User-test copy: `/Users/Renger/Downloads/IT Hardware CAPEX Request Generated v2.yap`
- Generator: `generate-it-hardware-capex-request-v2.mjs`
- ID family: `439...`
- Flow key: `CPX2`

## What Changed From v1

V1 imported but workflow publishing failed in Yeeflow with:

`Configuration error on node Request Submission: TaskUrl is null`

V2 keeps the same app/form/list scope and adds:

- fresh ID family
- fresh FlowKey/form key
- explicit `Request Submission` workflow task
- both `taskurl` and runtime-required `TaskUrl` on task/start workflow nodes
- standard Approved/Rejected outcome routing for the request-submission task

## Resources

- Root app shell with one Type 103 `Overview` dashboard.
- Data list: `IT Hardware CAPEX Requests`.
- Custom list forms: `Edit Item`, `View Item`.
- App-level approval form: `IT Hardware CAPEX Request`.
- Submission page: `IT Hardware CAPEX Request Form`.
- Task page: `IT Hardware CAPEX Request Task`.

## UI Runtime Result

Runtime import testing on `https://codex.yeeflow.com/` confirmed:

- app imports successfully
- app opens from Shared Workspace
- dashboard renders with the generated summary panel
- dashboard Collection renders sample records `CAPEX-1001` and `CAPEX-1002`
- data list opens without `datas/query` 400
- list sample rows render
- approval form opens in runtime
- card-style sections render with native Yeeflow controls
- currency, number, radio/dropdown, checkbox, switch, rich text, file upload, image upload, picker, and signer surfaces render
- workflow designer opens
- workflow publish succeeds

Full request submission and downstream approval task completion were not exhaustively exercised in this pass because several controls are environment-dependent picker/upload/signature surfaces. The workflow publish success proves the v1 `TaskUrl` blocker is resolved.

## Validation

- `node --check generate-it-hardware-capex-request-v2.mjs`: pass
- `validate-yap-package.js`: pass with warnings, 0 errors
- `validate-yap-graph.js`: pass, 0 warnings
- `validate-ywf-def.js`: pass with warnings, 0 errors
- `validate-ydl-list.js`: pass with warnings, 0 errors
- control/field schema smoke: pass
- `build-yap-wrapper.js`: pass
- wrapper round trip: decoded equals source, package validation passed, graph validation passed, no placeholders

## Generator Rules Learned

- Local validation accepted lowercase `taskurl`, but Yeeflow runtime publish also requires uppercase `TaskUrl`.
- App-level approval workflow tasks should include both `taskurl` and `TaskUrl` when generating importable packages.
- A generated `MultiAssignmentTask` must reference the approval/task page, not the request submission page, to satisfy the current validator and runtime shape.
- Request submission can be represented as an explicit workflow task, but it should still use standard Approved/Rejected outcome conditions unless a real export proves another submission outcome shape.

## Known Warnings

- `text-editor` and `icon` controls are schema-supported/unclassified.
- `richtext`, `checkbox`, file upload, icon upload, signer, identity picker, location picker, and cost-center picker are runtime-unproven or environment-dependent in this generated package.
- File, image, and signer values are not persisted through `ContentList` in v2.
- InclusiveGateway conditional routing remains deferred to a future isolated workflow-routing package.
