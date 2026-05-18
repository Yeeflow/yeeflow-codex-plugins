# Yeeflow Document Library Generation Rules

These rules are promoted from the `Projects Center.yap` export study.

## Generator Rules

- Treat Document Library as a first-class app child resource.
- Generate it with `ListModel.Type = 16`.
- Keep the same child-resource envelope used by data lists: `ListModel`, `Defs`, `Layouts`, `ListDatas`, `FlowMappings`, `PublicForms`, and `RemindRules`.
- Link it into root app navigation with `Type = 16`.
- Use `CustomType = "ListSite_<root app list id>"` for app-owned libraries.
- Preserve native document-library metadata instead of applying normal data-list `Title` rules blindly.
- Do not fake uploaded document rows in baseline packages.
- Do not generate folders until folder runtime behavior is proven.
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

Document-library views can reuse data-list view generation where compatible. A newly created library may export an empty default view `LayoutView`; this is allowed as compatibility evidence. Generated runtime baselines should include at least one configured view with `layout`, `query`, `sort`, `filter`, and `rowColor` when possible.

## Custom Forms

Document-library custom forms reuse the data-list custom form storage shape. Generate New/Edit/View custom forms only when the intended mapping is clear:

- `ListModel.LayoutView.add`
- `ListModel.LayoutView.edit`
- `ListModel.LayoutView.view`

The first baseline may use a single upload form only. New/Edit/View mapping is validation-only until generated runtime proof confirms behavior.

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

- Runtime import behavior for generated Type `16` libraries.
- The first generated fresh-ID baseline uploaded successfully but Yeeflow returned `Created failed` at the final import step. No structural patch should be made until the server response or a smaller exported-back Type `16` package identifies the missing property.
- Folder create/open/query behavior.
- Upload persistence and how Name, Type, Extension, Size, UniqueName, and Upload File are populated after upload.
- Whether New/Edit/View custom form assignment has additional document-library-specific runtime constraints.
