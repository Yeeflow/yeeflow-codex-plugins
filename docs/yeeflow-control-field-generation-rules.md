# Yeeflow Control And Field Generation Rules

This document operationalizes the normalized control and field references for Yeeflow generators.

## Approval Form Controls

- Consult `control-configurations.normalized.json` before using a control type.
- Default to proven-safe controls: input, textarea, input_number, currency, radio, switch, datepicker, lookup, list, container, section, heading, workflowControlPanel, and workflowHistory.
- Require `binding` for generated value-entry controls when the value must persist.
- Use `attrs.required` for required behavior and keep custom validators in `attrs.control_validation`.
- Use `attrs.control_display` for dynamic show/hide/readonly/style only when the rule shape is copied from a studied export.
- Use `attrs.control_event_rule` only when the action is explicitly modeled and validated.
- Yeeflow page/control JSON often stores style and config values as `[null, value]`; schema validators should unwrap that representation before checking primitive value type or enum membership.

## Data List Fields

- Consult `field-configurations.normalized.json` before using a field/control type.
- Preserve native Title metadata in every generated list:
  - `FieldName: "Title"`
  - `Status: 0`
  - `IsSystem: true`
  - `IsIndex: true`
  - `FieldIndex: 0` when present in the package style
- Use `Rules.required`, `Rules.placeholder`, `Rules.choices`, numeric, date, and lookup rules only when type-compatible.
- For internal app-level lookup samples, local target sample IDs may be included in `ReplaceIds`.
- For standalone/external lookup samples, external IDs must be excluded from `ReplaceIds`.

## Fallback And Stop Rules

- Prefer Text fallback for user, organization, location, cost center, tag, metadata, hyperlink, signer, and file/image display values until native runtime is proven.
- For data-list persistence, prefer Text fallback for requester/user values unless a focused data-list identity/user field export proves the native persisted field shape. Approval forms may still use identity-picker for current-user workflow assignment when that pattern is proven.
- Prefer Decimal fallback for percent and rate until native display behavior is proven.
- Defer file upload, icon upload, signer, metadata tree, lookup-list, and sublist persistence unless a focused export/import proves the shape.
- Do not guess enum values, picker max-selection settings, lookup metadata, or calculated-column formulas.

## Validator Policy

- Unknown control or field type: warning in compatibility, stricter warning/error in generator final where the generator is expected to know the shape.
- Invalid enum value: warning or error depending on proven support and final stage.
- Invalid primitive value type: warning unless it breaks a required proven field/control.
- Missing lookup target metadata: error for generated packages.
- Runtime-unproven types: warning with a stop condition for production-like generation.

## Skill Scope Decision

A standalone `yeeflow-control-field-schema` skill was not created in this learning pass. The reference is cross-cutting, but the operational use belongs inside the existing approval-form, data-list, and application generators. Keeping the normalized references in the project and pointing existing skills at them avoids a duplicated skill surface while still allowing a dedicated schema skill later if this grows into an independent authoring workflow.
