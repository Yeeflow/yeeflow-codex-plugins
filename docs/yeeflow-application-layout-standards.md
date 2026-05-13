# Yeeflow Application Layout Standards

This document defines reusable layout structure for generated Yeeflow applications.

## Global Shell

Generated visual surfaces should use this shell where supported:

```text
Page or form
└─ Main
   └─ Content
      └─ semantic sections
```

`Main` is the root visual parent. `Content` holds visible user-facing content. Both names are stored as `nv_label`.

## Page Settings

Dashboard pages:

- hide header bar: `attrs.hideHeaderAll = true`
- padding: all sides `--sp--s0`
- no dashboard content-width setting is required yet because the studied export did not prove `cw`

Form pages:

- content width: `attrs.container.cw = "2"`
- padding: all sides `--sp--s0`

## Standard Sections

Use semantic section containers inside `Content`:

- `Page header`
- `Summary section`
- `Body section`
- `Form body`
- `Form bottom`
- `Collection section`
- `Field group`
- `Readonly section`
- `Empty state`

Sections should group real user tasks. Do not create decorative nested cards.

## Dashboard Layout

Default dashboard structure:

```text
Main
└─ Content
   ├─ Page header
   ├─ Summary section
   ├─ Body section
   └─ Empty state or Collection section
```

Use `Summary section` for KPI cards and short operational status. Use `Body section` for larger tables, Collections, charts, or guidance.

## Data List Form Layout

Default custom list form structure:

```text
Main
└─ Content
   ├─ Page header
   ├─ Field group
   └─ Readonly section
```

`Edit Item` should prioritize editable controls. `View Item` should prioritize readable fields and status/context.

## Approval Form Layout

Default approval form structure:

```text
Main
└─ Content
   ├─ Form body
   │  ├─ Request summary
   │  ├─ Request details
   │  └─ Approval decision
   └─ Form bottom
      ├─ workflowControlPanel
      └─ workflowHistory
```

Submission pages may omit reviewer-only fields. Task pages should mirror request fields as readonly and place decision fields in `Form body`.

## Responsive Guidance

Generated apps should prefer:

- one-column mobile structures
- two-column form groups only when field labels and values remain readable
- dashboard cards that wrap predictably
- Collections over ad hoc repeated static rows for list-like data

Avoid layouts that rely on precise viewport width or negative spacing.

## Validator Guidance

Validators may warn for missing shell containers, missing section names, incorrect form page width, non-zero page padding, or workflow controls outside `Form bottom`.
