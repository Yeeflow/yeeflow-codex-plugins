# Yeeflow Data List Generation Rules

These rules apply to standalone `.ydl` list packages and child data lists embedded inside `.yap` application packages.

## Field Identity Rules

- `FieldName` must be unique inside each data list.
- `InternalName` must be unique inside each data list.
- `DisplayName` should be unique inside each data list; duplicate visible names are a Yeeflow materialization risk.
- Preserve native `Title` field metadata while allowing its display label to match the business concept.

## YAP App Materialization Rules

For child data lists inside a generated `.yap` application:

- Every `FieldID` must be unique across the whole application.
- Do not reuse the same field ID range for every list.
- Allocate `FieldID` values from an app-level allocator.
- Every field's `ListID` must equal the parent data-list `ListID`.
- When remapping `FieldID`, do not remap `field.ListID` to the new `FieldID`.
- Every generated child list must contain fields owned by that child list before import.
- Every child list must pass standalone `validate-ydl-list` and app-level `validate-yap-package`.

Correct field shape:

```json
{
  "ListModel": { "ListID": "6182000000000000100" },
  "Defs": [
    {
      "FieldID": "6182000000000010001",
      "ListID": "6182000000000000100",
      "FieldName": "Title",
      "DisplayName": "Request Title"
    }
  ]
}
```

Incorrect field shape:

```json
{
  "FieldID": "6182000000000010001",
  "ListID": "6182000000000010001"
}
```

The incorrect shape can create a list shell without attaching custom fields.
