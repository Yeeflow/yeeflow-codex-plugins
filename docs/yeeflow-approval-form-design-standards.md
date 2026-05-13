# Yeeflow Approval Form Design Standards

Generated approval forms should be structured for request submission and task review.

## Required Shell

Submission and task pages use:

- `attrs.container.cw = "2"`
- zero padding
- `Main`
- `Content`
- `Form body`
- `Form bottom`

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

## Validator Guidance

Warn for missing full width, zero padding, missing `Main`, missing `Content`, missing `Form body`, missing `Form bottom`, workflow controls outside `Form bottom`, and excessive arbitrary decision/status colors.
