# Yeeflow Document Library Generation Rules

These rules are promoted from the `Projects Center.yap` and `Document Library Sample.yap` export studies.

Runtime update: `document-library-sample-new-library-only.v1.yap`, generated from only the `New Document Library` resource in `Document Library Sample.yap`, imported and ran successfully in Yeeflow by user manual test. Treat that `New Document Library` shape as the canonical minimal base definition for future generated document libraries. Do not treat the earlier generated `Baseline Documents` experiment as the base definition.

V2 runtime update: `Enterprise Document Center` imported and opened in Yeeflow with three Type `16` document libraries generated from the canonical `New Document Library` base. Runtime accepted multiple libraries, simple custom fields, and multiple configured views. The package still generated no file rows or document binaries. Folder rows remain ungenerated; manual folder creation was partially runtime-tested after import.

## Generator Rules

- Treat Document Library as a first-class app child resource.
- Generate it with `ListModel.Type = 16`.
- Keep the same child-resource envelope used by data lists: `ListModel`, `Defs`, `Layouts`, `ListDatas`, `FlowMappings`, `PublicForms`, and `RemindRules`.
- Link it into root app navigation with `Type = 16` for mixed/richer apps. For document-library-only packages that intentionally mirror `Document Library Sample.yap`, root `LayoutView = {"sortVer":1}` and `Item.Layouts = []` are export-proven and should validate with warnings.
- Use `CustomType = "ListSite_<root app list id>"` for app-owned libraries.
- Keep top-level `Resource.SimplePortal = null`; both known-good document-library exports use `null`, while generated packages with `[]` failed at Yeeflow create.
- Preserve native document-library metadata instead of applying normal data-list `Title` rules blindly.
- Do not fake uploaded document rows in baseline packages.
- Do not generate folder rows until their import-safe payload is proven. Runtime may create folders manually after import.
- Do not include raw file/document content, private document metadata, or downloaded files in generated packages.

## Required Default Fields

Generate these export-proven document-library fields:

| FieldName | Display label | FieldType | Control Type | Notes |
| --- | --- | --- | --- | --- |
| `Title` | Name | `Text` | `input` | Native name field; keep `IsSystem = true`, `IsIndex = true`, and `Rules.isLibrary = true` |
| `Bigint1` | ParentID | `Bigint` | `input_number` | Folder hierarchy field; `Rules.isNotInListFiles = true` |
| `Text1` | Type | `Text` | `input` | Document type marker |
| `Bigint2` | FileSize | `Bigint` | `input_number` | Size field; view label may display as Size; readonly |
| `Text2` | Extension | `Text` | `input` | Extension field; readonly |
| `Text3` | UniqueName | `Text` | `input` | Unique stored-name field; not shown in list files |
| `Text4` | Upload File | `Text` | `file-upload` | Upload control; `required = true`, `isLabrary = true` |

## Views

Document-library views can reuse data-list view generation where compatible. A newly created library may export an empty default view `LayoutView = ""`; this is runtime-proven for the one-library `New Document Library` baseline. For the minimal runtime baseline, preserve the sample-proven empty-string default view before adding configured view JSON. The v2 `Enterprise Document Center` runtime pass accepted additional configured Type `0` views for multiple document libraries.

## Custom Forms

Document-library custom forms reuse the data-list custom form storage shape. Generate New/Edit/View custom forms only when the intended mapping is clear:

- `ListModel.LayoutView.add`
- `ListModel.LayoutView.edit`
- `ListModel.LayoutView.view`

The runtime-proven minimal `New Document Library` baseline has one `New file` upload form but no `ListModel.LayoutView` assignment. Configured libraries assign `add`, `edit`, and `view` together. Avoid partial New-only assignment until runtime proof confirms it is safe.

## Validator Rules

- Recognize `ListModel.Type = 16` as document library.
- Warn on missing or unusual document-library default fields.
- Warn when `Text4` is not a `file-upload` field with library upload rules.
- Warn when `Bigint1` / ParentID is missing.
- Validate FieldID uniqueness across the app.
- Validate field `ListID` ownership.
- Validate view references when view JSON is present.
- Validate custom form bindings against document-library fields.
- Warn if document-library `ListDatas` includes upload/file values.

## Remaining Unknowns

- Runtime import/open behavior for the minimal generated Type `16` `New Document Library` shape is proven by `document-library-sample-new-library-only.v1.yap`.
- Runtime import/open behavior for multiple generated Type `16` libraries with simple custom fields and configured views is partially proven by `Enterprise Document Center`.
- Baseline v1 and v2 uploaded successfully but Yeeflow returned `Created failed` at the final import step. Baseline v3 was validation-only and used the misleading generated title `Baseline Documents`; do not use it as the canonical base. The runtime-proven base is the `New Document Library` sample clone with default view `LayoutView = ""`.
- Generated folder-row import shape and full folder open/query/persistence behavior.
- Upload persistence and how Name, Type, Extension, Size, UniqueName, and Upload File are populated after upload.
- Whether New/Edit/View custom form assignment has additional document-library-specific runtime constraints.
