# Expression Function Reference

Use the workspace `yeeflow-expression-functions.normalized.json` for the validator-safe machine-readable function list. Use `yeeflow-expression-function-knowledge-base.normalized.json` for bilingual descriptions, parameter names, business scenarios, and keywords.

Important functions:

- `arraySum`, `arrayCount`, `arrayAverage`, `arrayMin`, `arrayMax`
- `concat`
- `currentUser`
- `date`, `dateAdd`, `dateDiff`, `dateFormat`, `datePart`, `now`
- `formatNumber`, `fixed`, `round`
- `iif`, `isFalse`, `isNullOrEmpty`, `isTrue`
- `number`, `text`
- `UniqueID`

Function selection rules:

- Amount display: `formatNumber`, `round`, `fixed`.
- Deadline/date offsets: `dateAdd`; duration/overdue checks: `dateDiff` plus `now`.
- Conditional text/value: `iif`; boolean routing should usually use direct comparison operators.
- Required-if validation: `isNullOrEmpty`.
- Request numbers: `concat` or `&`, `dateFormat`, `now`, `UniqueID`.
- List/sublist totals: `arraySum`, `arrayCount`, `arrayAverage`, `arrayMin`, `arrayMax`.
- Object paths: `getAttr` only when object-shaped values are export-backed.
- Text cleanup: `trim`, `replace`, `lower`, `upper`.
- Duplicate removal: `removeDuplicates`.

Preserve exact names: `strIndex`, `UniqueID`, and `subString`. `addWorkDays` and `addWorkHours` are visible in the Expression Editor function tab but not generation-safe until parameter metadata is captured.
