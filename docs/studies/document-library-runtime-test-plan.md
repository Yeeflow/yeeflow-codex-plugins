# Yeeflow Document Library Runtime Test Plan

Target environment: `https://codex.yeeflow.com/`

Run this only after local validation passes.

## Import And Open

1. Import the generated `.yap`.
2. Confirm the imported app name matches the generated baseline.
3. Open the app.
4. Confirm the app does not open as an empty shell or `Start to build with Components`.
5. Confirm the document library appears in app navigation.
6. Open the document library.

## Library Structure

Confirm:

- library opens without query errors.
- default view opens.
- default document fields are present:
  - Upload File / `Text4`
  - Name / `Title`
  - Type / `Text1`
  - Size/FileSize / `Bigint2`
- support fields are present or safely hidden:
  - ParentID / `Bigint1`
  - Extension / `Text2`
  - UniqueName / `Text3`

## Upload Behavior

Use only a safe disposable test file with no private content.

Test:

- upload control opens.
- upload succeeds.
- Name is populated with the file name or expected display value.
- Type and/or Extension populate as expected.
- Size/FileSize populates as expected.
- record persists after refresh.
- list query still works after upload.

## Forms

If custom forms are included:

- New form opens.
- Edit form opens.
- View form opens.
- Upload File control renders on all included forms where expected.
- form assignment follows `ListModel.LayoutView.add/edit/view`.

## Folder Behavior

Test only if generated and safe:

- create a folder.
- open the folder.
- upload a file into the folder.
- confirm `ParentID` behavior through export-back or safe metadata inspection.

## Result Classification

Use these labels:

- runtime-proven
- partially proven
- validation-only
- blocked by package/materialization
- blocked by Yeeflow runtime context
- not tested

Validation-only success must not be reported as runtime proof.

## First Runtime Attempt

Baseline package: `document-library-runtime-baseline.v1.yap`

Result: blocked by Yeeflow runtime context / import create failure.

Observed evidence:

- local validation passed before import.
- Yeeflow accepted the `.yap` upload and showed the package name and description.
- clicking OK on the import metadata step returned `Tip: Created failed`.
- the app was not created, so app open, library open, upload, folder, and persistence checks were not reached.

Do not patch this baseline until the failing import response or an exported-back Type `16` minimal package identifies the missing or invalid property. Current status is validation-only, not runtime-proven.

## Sample Isolation Attempt

Source studied: `/Users/Renger/Downloads/Document Library Sample.yap`

What the sample proved:

- document-library-only app exports can have `Item.Layouts = []`.
- root `LayoutView` can be only `{"sortVer":1}` with no navigation `sort[]`.
- top-level `Resource.SimplePortal` is `null` in both known-good exports.
- the minimal document library has seven native fields, one empty Type `0` view, and one `New file` upload form with no `ListModel.LayoutView` assignment.

Baseline v2 changes:

- generated from `Document Library Sample.yap` rather than `Projects Center.yap`.
- removed generated root Type `103` Home page and root navigation.
- removed partial New-only custom-form assignment.
- kept one Type `16` library with no uploaded rows.

Runtime result: still blocked by Yeeflow runtime context / import create failure. Yeeflow accepted the upload and metadata dialog, then returned `Tip: Created failed`.

Baseline v3 changes:

- changed top-level `Resource.SimplePortal` from `[]` to `null`.
- switched to a fresh Yeeflow-like `2059...` ID family.
- local package, graph, materialization, wrapper round-trip, and standalone document-library validation pass with warnings only.

Runtime status for v3: validation-only. A clean v3 import attempt still needs to be repeated with reliable browser/network evidence before claiming runtime proof.

## Runtime-Proven Minimal Baseline

Package: `document-library-sample-new-library-only.v1.yap`

Source shape: `New Document Library` from `/Users/Renger/Downloads/Document Library Sample.yap`

Result: runtime-proven for import/open by user manual test.

What is proven:

- A document-library-only app can contain a single Type `16` child resource cloned from `New Document Library`.
- The base document-library definition is the `New Document Library` shape, not the earlier generated `Baseline Documents` experiment.
- The seven native fields are sufficient for import/open when paired with the sample's minimal library view/form structure.
- The default Type `0` view should preserve the sample's empty string `LayoutView = ""`; changing it to `null` is not the canonical base shape.
- The `New file` Type `1` upload form can remain unassigned in `ListModel.LayoutView` for a newly-created-library baseline.
- Root app `Item.Layouts = []`, root `LayoutView = {"sortVer":1}`, and top-level `Resource.SimplePortal = null` are valid for this minimal document-library-only package.

What remains unproven:

- upload persistence behavior.
- folder create/open behavior.
- custom New/Edit/View form assignment for generated libraries.
- configured views with additional custom fields in a generated package.
