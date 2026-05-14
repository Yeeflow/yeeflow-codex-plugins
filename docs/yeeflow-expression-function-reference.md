# Yeeflow Expression Function Reference

Source: `/Users/Renger/Downloads/expression training data generator.txt`.

Use the normalized machine-readable reference in `yeeflow-expression-functions.normalized.json` for validators and generators.

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
