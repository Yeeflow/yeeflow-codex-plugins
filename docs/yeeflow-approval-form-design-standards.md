# Yeeflow Approval Form Design Standards

Generated approval forms should be structured for request submission and task review.

## Required Shell

Submission and task pages use:

- `attrs.container.cw = "2"`
- zero padding
- page-level background when a full-page background is required
- `Main`
- `Content`
- `Form body`
- `Form bottom`

`Main` should remain primarily structural. Do not put full-page background color on `Main`; set it on `page.formdef.attrs.background`.

## Form Header

Submission forms with a top request summary should place that area inside a `Form header` container.

`Form header` should carry:

- background
- border
- border radius
- `attrs.style.overflow = [null, "hidden"]`

Use `Request summary panel` and `Request metric row` inside `Form header`. If a gradient is required, use native background first and then `attrs.common.css` on the target container when Yeeflow native background settings cannot express it.

## Form Body

`Form body` contains business content:

- request summary
- applicant/requester fields
- request details
- readonly mirrored fields
- reviewer decision fields
- conditional fields

Recommended child sections:

- `Request summary`
- `Applicant details`
- `Request details`
- `Approval decision`
- `Reviewer notes`

## Form Bottom

`Form bottom` appears at the end of `Content`.

Default controls:

1. `workflowControlPanel`
2. `workflowHistory`

Omit either control only when the user explicitly asks or a real export proves that the form type should omit it.

## Submission Page

The submission page should:

- prioritize editable requester fields
- show conditional fields close to their controlling field
- avoid reviewer-only decision fields
- include Action Panel and Flow History unless explicitly omitted

## Task Page

Task pages should:

- mirror submitted request fields readonly where useful
- include reviewer decision fields
- keep approval comments/decision controls near the decision section
- preserve workflow logic and routing

## Conditional Fields

Conditional fields should:

- have clear business labels
- be placed near the triggering field
- use compatible condition value types
- be mirrored on task pages when reviewers need context

## Style

Use:

- neutral surfaces
- semantic decision/status colors
- `--fs--base` for body text
- `--fs--l` / `--fs--h6` for section headings
- `--sp--s150` / `--sp--s200` field gaps
- neutral borders before shadows

Let native Action Panel and Flow History styling apply unless a studied export proves a safe override.

Text and icon controls should be generated with explicit positioning:

- `heading` / `text-editor`: default to `attrs.common.positioning.widthtype = [null, "2"]`
- `icon`: default to `attrs.common.positioning.widthtype = [null, "2"]`
- section icons should usually be wrapped in square badge containers with centered alignment

Standard field sections should use a `flex_grid` with two desktop/tablet columns and one mobile column. Place long controls such as `textarea`, `richtext`, and `list` outside the grid or make them span the full row after span behavior is export-proven.

Generated forms should detect calculated-looking fields. `Subtotal` should not be a normal editable field when quantity and unit price exist; use a native `calculated` control when safe, or a readonly display with the formula documented as deferred.

For detailed patterns from the manually improved CAPEX export, see `docs/yeeflow-form-design-quality-rules.md` and `docs/it-hardware-capex-request-runtime-v2-ui-study.md`.

## Validator Guidance

Warn for missing full width, zero padding, missing page-level background on rich full-page forms, background on `Main`, missing `Main`, missing `Content`, missing `Form body`, missing `Form bottom`, missing `Form header` when a request summary exists, workflow controls outside `Form bottom`, text/icon controls without inline width, field sections without grids, calculated-looking editable fields, runtime-sensitive picker/image attrs, and excessive arbitrary decision/status colors.
