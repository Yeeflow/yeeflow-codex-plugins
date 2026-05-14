# Yeeflow Control To Field Mapping

Use this table when planning app-level persistence from approval form controls to data-list fields.

| Approval/control type | Data-list field type | Data-list control | Support | Fallback / notes |
| --- | --- | --- | --- | --- |
| calculated-column | Calculated | calculated-column | data-list-only |  |
| checkbox | Text | checkbox | schema-supported-runtime-unproven | radio or text label |
| cost-center-picker | Text | input | fallback |  |
| currency | Decimal | currency | generation-safe-with-rules |  |
| datepicker | Datetime | datepicker | generation-safe-with-rules |  |
| file-upload | File | file-upload | deferred |  |
| hyperlink | Text | hyperlink | fallback |  |
| icon-upload | File | icon-upload | deferred |  |
| identity-picker | Text | input | fallback | Text/input display value unless user/person field metadata is proven |
| input | Text | input | generation-safe | Default text mapping. |
| input_number | Decimal | input_number | generation-safe |  |
| list | Text | list | schema-supported-persistence-deferred |  |
| location-picker | Text | input | fallback |  |
| lookup | Text | lookup | generation-safe-with-local-target | Requires appid/listsetid/listid/listfield and resolved target list. |
| lookup-list | Text | lookup-list | deferred |  |
| metadata | Text | metadata | fallback |  |
| mutiple-metadata | Text | mutiple-metadata | fallback |  |
| organization-picker | Text | input | fallback |  |
| percent | Decimal | percent | schema-supported-runtime-unproven | input_number |
| radio | Text | radio | generation-safe | Use Rules.choices/options/items and store selected text. |
| rate | Decimal | rate | fallback |  |
| richtext | Text | richtext | schema-supported-runtime-unproven | textarea |
| signer | Text | signer | deferred |  |
| switch | Bit | switch | generation-safe |  |
| tag | Text | tag | fallback |  |
| textarea | Text | textarea | generation-safe | Use for multiline text where the list field stores Text. |
| time | Text | time | fallback | Text/input until time field runtime is proven |

## Rules

- Generation-safe mappings can be used in normal app packages after standard validation.
- Schema-supported mappings need isolated import/runtime proof before becoming defaults.
- Fallback mappings should store a simple display value in Text or Decimal until the native field runtime is proven.
- Deferred mappings must stop generation unless the user explicitly asks for research or provides an export proving the shape.
- `calculated-column` is data-list only; do not model it as an approval variable unless a real export proves the workflow interaction.
