# Document Library v2 Runtime Study: Enterprise Document Center

Date: 2026-05-18

Branch: `codex/document-library-v2-document-center`

Generated app: `Enterprise Document Center`

Generated package artifact: `enterprise-document-center-v2.yap`

Runtime upload copy used for test: `/Users/Renger/Downloads/enterprise-document-center-v2-runtime-upload.yap`

The runtime upload copy was removed after testing. The generated `.yap` artifact remains ignored/uncommitted in the workspace.

## Scope

This pass tested the next Document Library generation layer beyond the minimal `New Document Library` base definition.

The generated app contains three Type 16 document libraries:

- Company Policies
- Project Documents
- Templates and Forms

Each library preserves the runtime-passed native document-library base shape:

- `ListModel.Type = 16`
- native/default fields: `Title`, `Bigint1`, `Text1`, `Bigint2`, `Text2`, `Text3`, `Text4`
- `Text4` remains the file-upload field
- default Type 0 view with `LayoutView = ""`
- one unassigned `New file` form
- no uploaded file rows
- no document binaries

## Local Validation

Local validation passed before runtime import:

- `node --check generate-enterprise-document-center-v2.mjs`
- `node --check validate-yap-package.js`
- `node --check validate-yap-graph.js`
- `node --check validate-ydl-list.js`
- `node --check scripts/inspect-yap-materialization.mjs`
- package validation on `enterprise-document-center-v2.resource.json`
- graph validation on `enterprise-document-center-v2.resource.json`
- materialization inspection on `enterprise-document-center-v2.resource.json`
- standalone `validate-ydl-list.js` checks for all three generated document-library resources
- JSON parse checks for generated app/resource/report files
- `git diff --check`

All validator failures were zero. Warnings remained for runtime-sensitive document-library behavior and the root app not including a Type 103 dashboard/page resource.

## Runtime Result

Status: partial runtime proof.

Runtime-tested in `https://codex.yeeflow.com/`.

Observed results:

- Package upload was accepted.
- Import metadata was read correctly:
  - app name: `Enterprise Document Center`
  - description: document-library v2 generation package with multiple Type 16 libraries, custom fields, and custom views
- Import completed without the previous `Tip Created failed` error.
- App appeared in Shared Workspace search results.
- App opened into the first document library instead of an empty shell.
- App did not open to `Start to build with Components`.
- Navigation showed all three document libraries.
- Each document library opened:
  - Company Policies
  - Project Documents
  - Templates and Forms
- Custom view tabs appeared for each library.
- Company Policies displayed:
  - All Items
  - All Policies
  - Active Policies
  - Policies Pending Review
  - By Department
- Project Documents displayed:
  - All Items
  - All Project Documents
  - By Project
  - Contracts
  - Latest Versions
- Templates and Forms displayed:
  - All Items
  - All Templates
  - Active Templates
  - By Department
- Company Policies display-field menu exposed generated custom fields:
  - Department
  - Policy Category
  - Effective Date
  - Review Date
  - Owner
  - Status
- The Add menu exposed document-library actions:
  - New Folder
  - New File
  - Batch Upload

## Folder Runtime Notes

The generated package intentionally did not pre-generate folder rows because the exact import-safe folder-row payload remains runtime-sensitive.

Manual folder creation was tested after import:

- Templates and Forms: created `HR Forms`; the row appeared and Yeeflow showed `Added Successfully`.
- Company Policies: submitted `HR Policies`; Yeeflow showed `Added Successfully`, but the table did not visibly refresh with the folder row during the spot-check.

Therefore:

- Manual folder creation is partially runtime-proven.
- Generated folder rows are not runtime-proven.
- Folder persistence after refresh is not yet fully proven.
- Full folder plans for all libraries should remain a runtime/manual setup recommendation until the generated folder-row shape is proven.

## Upload Runtime Notes

Upload behavior was not tested in this pass.

Do not claim runtime proof for uploaded-file persistence, automatic population of `Name`, `Type`, `Size`, `Extension`, `UniqueName`, or `Upload file`, or real document binary handling from this package.

The proven claim is limited to import/open acceptance of the `Text4` file-upload field shape inherited from the runtime-passed `New Document Library` base.

## Generation Rule Outcome

This pass supports the following generation rule:

- A generated app may include multiple Type 16 document libraries based on the canonical `New Document Library` shape.
- Simple custom fields can be added to Type 16 document libraries using proven Yeeflow list field patterns.
- Multiple Type 0 custom views can be generated for Type 16 document libraries.
- Minimal generated packages should continue to exclude uploaded file rows and document binaries.
- Folder rows should not be generated until their import-safe payload is proven. Use manual runtime folder creation for now.

## Remaining Gaps

- Generated folder row import shape.
- Folder persistence after refresh across all generated libraries.
- Actual uploaded-file behavior with a harmless test file.
- Rich assigned New/Edit/View custom-form mappings beyond the unassigned `New file` base form.
- Whether a Type 103 dashboard/page should be added to avoid root-app warnings in larger app packages.
