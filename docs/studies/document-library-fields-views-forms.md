# Yeeflow Document Library Fields, Views, And Forms

Sources studied: `Projects Center.yap` and `Document Library Sample.yap`, read-only.

## Default Field Signature

The user-provided default field names match the export at the storage-field level, with one important export detail: the upload field is stored as `FieldType = Text` and `Type = file-upload`, not as a separate literal `Attachment` field type.

| Purpose | Display label in export | FieldName | FieldType | Control Type | Key rules |
| --- | --- | --- | --- | --- | --- |
| File name | Name | `Title` | `Text` | `input` | `isLibrary = true`; `IsSystem = true`; `IsIndex = true` |
| Folder parent | ParentID | `Bigint1` | `Bigint` | `input_number` | `isNotInListFiles = true` |
| File type marker | Type | `Text1` | `Text` | `input` | display label enabled |
| File size | FileSize in field defs, Size in views | `Bigint2` | `Bigint` | `input_number` | `readonly = true` |
| File extension | Extension | `Text2` | `Text` | `input` | `readonly = true` |
| Unique stored file name | UniqueName | `Text3` | `Text` | `input` | `isUnique = true`; `isNotInListFiles = true` |
| Uploaded file | Upload File | `Text4` | `Text` | `file-upload` | `required = true`; `isLabrary = true`; `PROP_MAXSIZE = 2147483648` |

Generation should preserve all seven fields for a baseline document library. The four user-highlighted fields remain the minimum business-facing set, but the export proves `Bigint1`, `Text2`, and `Text3` are native document-library support fields.

## Custom Fields

`Documents` includes custom lookup fields after the native document fields:

- `Text5` Associate project
- `Text6` Associate tasks
- `Text7` Associate issue

These use normal lookup field rules with local app/list/listset/display-field references. This supports reusing existing lookup validation, while still treating the parent resource as a document library.

## Views

`Documents` has two Type `0` views:

- `All Items`
- `My Documents`

Configured document-library views use the same high-level view JSON keys as data-list views:

- `layout`
- `query`
- `sort`
- `filter`
- `rowColor`

The newly created `New Document library` / `New Document Library` resources have one default Type `0` view with empty `LayoutView`. This should be accepted as an export-proven newly-created-library shape. The minimal generated baseline should keep the empty view first; configured view JSON can be added after import/open proof.

## Custom Forms

Document libraries use the same Type `1` custom form storage model as data lists:

- `Layout.Type = 1`
- `Layout.Ext2 = "{\"src\":true}"`
- `Layout.LayoutView = null`
- `Layout.LayoutInResources[0].ID = LayoutID`
- `Layout.LayoutInResources[0].RefId = LayoutID`
- `Layout.LayoutInResources[0].Resource` is JSON with `children`, `title`, `filterVars`, `attrs`, `ver`, and `tempVars`

`Documents` maps:

- New item to `Upload document`
- Edit item to `Edit document`
- View item to `Document detail page`

`New Document library` / `New Document Library` has one `New file` form, but no `ListModel.LayoutView` mapping was present in either export. Baseline v1 used a partial New-only assignment and failed import; baseline v2 removed that assignment and still failed, so this is not confirmed as the only root cause, but partial assignment remains runtime-sensitive.

## Expression Notes

The configured detail/edit forms include a heading with a `list_field` expression bound to `Title` for displaying the document name. No workflow expressions or approval forms were present in this export.

## Folder And Upload Notes

No actual uploaded document rows were included in `ListDatas`. Folder support is inferred from the exported `Bigint1` / `ParentID` field and must remain validation-only until a focused folder runtime test proves create/open/query behavior.
