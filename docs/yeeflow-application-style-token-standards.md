# Yeeflow Application Style Token Standards

This document defines how generated Yeeflow applications should use root style tokens.

The source is `/Users/Renger/Downloads/root_styles.txt`. Treat it as read-only evidence and do not inject the full stylesheet into generated apps.

## Color Semantics

| Semantic use | Preferred token |
| --- | --- |
| primary action / selected state | `--c--primary` |
| secondary accent | `--c--secondary` |
| success / approved / active good state | `--c--success` |
| warning / pending / attention | `--c--warning` |
| danger / rejected / failed | `--c--danger` |
| neutral borders and muted structure | `--c--neutral` and neutral variants |
| page/card background | `--c--background` |
| body text | `--c--text` or `--c--text-normal` |

Use light variants for badge backgrounds and base tokens for badge text/borders where style attributes allow it.

## Typography

Use:

- `--fs--base` for normal body text and field labels
- `--fs--s` / `--fs--xs` for helper text and metadata
- `--fs--l` / `--fs--h6` for section headings
- `--fs--h5` / `--fs--h4` for dashboard panel headings
- `--fs--h3` through `--fs--h1` sparingly for page-level headings

Use:

- `--fw--regular` for normal text
- `--fw--medium` for labels
- `--fw--semi-bold` for section/card headings
- `--fw--bold` only for high-emphasis metrics or page titles

Do not use editorial typography in product UI.

## Spacing

Use:

- `--sp--s0` for standard page shell padding
- `--sp--s100` for compact inline gaps
- `--sp--s150` / `--sp--s200` for field gaps
- `--sp--s200` / `--sp--s300` for card padding
- `--sp--s300` / `--sp--s400` for section gaps
- larger spacing only for dashboard overview pages, not dense operational forms

## Borders, Radius, And Depth

Recommended defaults:

- input/button radius: `6px`
- standard card radius: `8px`
- large panel radius: `12px`
- standard border: `var(--c--neutral-light-active)`
- shadows: sparse and subtle

Prefer neutral borders and spacing over decorative shadows.

## Component Style Guidance

Buttons:

- primary actions use `--c--primary`
- destructive actions use `--c--danger`
- secondary actions use neutral borders/backgrounds

Switches and radios:

- prefer native Yeeflow control behavior
- keep state styling token-aligned
- do not invent one-off option palettes

Status badges:

- approved/active: success
- pending/review: warning
- rejected/error: danger
- draft/inactive/info: neutral or primary depending on context

Dynamic styles:

- preserve existing dynamic class behavior
- use source status semantics to choose token-aligned styles
- do not remove dynamic classes from studied exports unless replacing them with a proven native equivalent

## Export Reality

Yeeflow may store either token references or resolved hex values. Generators should prefer tokens where schema-supported, but validators should warn rather than fail when resolved values are present.
