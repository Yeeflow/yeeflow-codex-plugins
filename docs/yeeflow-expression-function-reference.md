# Yeeflow Expression Function Reference

Sources:

- first-pass expression foundation: `expression training data generator.txt`
- second-pass enriched function knowledge base: `expression training data generator_2.txt`
- expression-editor screenshots for UI context and observed function-tab behavior

Use the normalized machine-readable reference in `yeeflow-expression-functions.normalized.json` for validators and generators.
Use `yeeflow-expression-function-knowledge-base.normalized.json` for richer bilingual descriptions, parameter names, business scenarios, and keywords.

## Selection Guidance

Choose functions by business intent before choosing by name:

| Intent | Preferred functions | Notes |
| --- | --- | --- |
| Amount formatting | `formatNumber`, `round`, `fixed` | Use `formatNumber(value, digits, thousandths)` when the result is user-facing text. |
| Deadline or due-date calculation | `dateAdd`, `dateDiff`, `now` | Use `dateAdd` for offset dates and `dateDiff` for overdue/duration checks. |
| Conditional value/text | `iif`, `isTrue`, `isFalse` | Use direct boolean comparisons for routing and display rules where possible. |
| Required-if validation | `isNullOrEmpty`, comparison operators | Native required flags stay preferred for unconditional required fields. |
| Request number generation | `concat` or `&`, `dateFormat`, `now`, `UniqueID` | Preserve exact `UniqueID` capitalization. |
| List/sublist totals | `arraySum`, `arrayCount`, `arrayAverage`, `arrayMin`, `arrayMax` | Only generate after the list variable and column names are resolved. |
| Safe object attribute access | `getAttr` | Use when nested object path access is proven for the target context. |
| Text cleanup | `trim`, `replace`, `lower`, `upper` | Useful for normalization and generated summaries. |
| Duplicate removal | `removeDuplicates` | Use for arrays after the array variable is resolved. |

## Enrichment Notes

- The second-pass knowledge base enriched 54 of 55 baseline functions.
- `strIndex` is baseline-only in the second pass. Keep the exact camel-case name and do not rename it to `strindex`.
- The Function tab screenshot shows `addWorkDays` and `addWorkHours`, but the second file does not provide parameter metadata. Treat them as observed but not generation-safe yet.
- Function examples in the knowledge base are human-readable expression strings. Generated packages must convert them to Yeeflow JSON token arrays.

## Math

| Function | Params | Returns | Notes |
| --- | --- | --- | --- |
| `abs` | 1 | number | Absolute value. |
| `ceil` | 1 | number | Smallest integer not less than value. |
| `fixed` | 2 | number | Truncate to digits. |
| `floor` | 1 | number | Largest integer not greater than value. |
| `log` | 1-2 | number | Natural log or log with base. |
| `max` | 1-4 | number | Maximum input. |
| `min` | 1-4 | number | Minimum input. |
| `pow` | 2 | number | Power. |
| `rand` | 0 | number | Random 0 <= v < 1. |
| `round` | 1-2 | number | Round, optional digits. |

## String And Conversion

| Function | Params | Returns | Notes |
| --- | --- | --- | --- |
| `concat` | 1-4 | text | Concatenate strings. |
| `formatNumber` | 3 | text | Numeric display string. |
| `left` | 2 | text | Leftmost characters. |
| `len` | 1 | number | Array count or text length. |
| `lower` | 1 | text | Lowercase. |
| `number` | 1 | number | Convert to number, invalid/null to 0. |
| `repeat` | 2 | text | Repeat text. |
| `replace` | 4 | text | Replace all/first/last using type 1/0/2. |
| `right` | 2 | text | Rightmost characters. |
| `split` | 2 | array | Split text. |
| `strIndex` | 2-3 | number | Find text position. |
| `subString` | 3 | text | Substring. |
| `text` | 1 | text | Convert to text. |
| `trim` | 1 | text | Trim whitespace. |
| `upper` | 1 | text | Uppercase. |

## Date And Time

| Function | Params | Returns | Notes |
| --- | --- | --- | --- |
| `date` | 3-6 | date | Build date string from year/month/day and optional time. |
| `dateAdd` | 3 | date | Add year/month/day/hour/minute/second interval. |
| `dateDiff` | 4 | number | Difference between two dates. |
| `dateFormat` | 2 | text | Format date with tokens such as YYYY, MM, DD, HH, mm, ss. |
| `datePart` | 2 | number | Year, Quarter, Month, dayofweek, day, hour, minute, second. |
| `datePicker` | 2 | date | Date picker expression helper. |
| `day` | 1 | number | Day of month. |
| `hour` | 1 | number | Hour. |
| `minute` | 1 | number | Minute. |
| `month` | 1 | number | Month. |
| `now` | 0 | date | Current date/time. |
| `second` | 1 | number | Second. |
| `weekNum` | 1-2 | number | Week number, optional ISO flag. |
| `year` | 1 | number | Year. |

## Array

| Function | Params | Returns | Notes |
| --- | --- | --- | --- |
| `arrayAverage` | 1-4 | number | Optional column/filter column/filter value. |
| `arrayConcat` | 2 | array | Concatenate two arrays. |
| `arrayCount` | 1-4 | number | Count items/non-empty column values. |
| `arrayIndex` | 2 | number | Index of value, -1 if missing. |
| `arrayMax` | 1-4 | number | Max with optional column/filter. |
| `arrayMin` | 1-4 | number | Min with optional column/filter. |
| `arraySum` | 1-4 | number | Sum with optional column/filter. |
| `join` | 1-2 | text | Join array values. |
| `removeDuplicates` | 1 | array | Unique values. |

## Logical, System, Utility

| Function | Params | Returns | Notes |
| --- | --- | --- | --- |
| `iif` | 3 | unknown | Condition, then, else. |
| `isFalse` | 1 | boolean | False-like check. |
| `isNullOrEmpty` | 1 | boolean | Null or empty string. |
| `isTrue` | 1 | boolean | True-like check. |
| `currentUser` | 0 | text | Current user ID. |
| `UniqueID` | 0 | text | Unique ID. |
| `getAttr` | 2-3 | unknown | Object path lookup with optional default. |
