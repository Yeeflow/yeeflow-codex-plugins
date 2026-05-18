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
