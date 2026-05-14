# Yeeflow Data List Form Design Standards

Generated data lists should provide predictable custom forms by default.

## Required Custom Forms

Every generated data list should include:

- `Edit Item`
- `View Item`

New and Edit should use `Edit Item`. View should use `View Item`.

## Required Shell

Both forms use:

- `attrs.container.cw = "2"`
- zero padding
- `Main` -> `Content`

## Edit Form Pattern

`Edit Item` should be input optimized:

- group related fields into `Field group`
- keep required fields near the top
- use concise field labels
- use helper text only when it clarifies data entry
- use native controls first

## View Form Pattern

`View Item` should be display optimized:

- use readonly/display controls where available
- group important identifiers and status near the top
- use `Readonly section` for non-editable detail
- avoid presenting the view form as a disabled copy of the edit form when a cleaner display layout is possible

## Field Grouping

Recommended groups:

- `Basic information`
- `Details`
- `Status`
- `System information`
- `Readonly section`

Keep group names business-friendly and avoid field-slot names.

## Style

Use root-token-aligned styles:

- white or background-token sections
- neutral borders
- `6px` control radius
- `8px` or `12px` section radius
- `--fs--base` body text
- `--sp--s150` / `--sp--s200` field gaps

## Native Title Rule

Generated lists must preserve native `Title` metadata. Business labels may be displayed on `Title`, but `Title` is not a normal custom field.

## Validator Guidance

Warn for missing Edit/View forms, incorrect display settings, missing `Main` / `Content`, non-full-width form pages, non-zero padding, and excessive arbitrary colors.

Data-list custom form headings, helper text, card labels, and empty-state text should follow the shared Text control standard in `docs/yeeflow-text-control-generation-standards.md`. Default to native `heading` Text controls with inline width, `[null, token]` typography presets, plain string colors, and meaningful `nv_label`.
