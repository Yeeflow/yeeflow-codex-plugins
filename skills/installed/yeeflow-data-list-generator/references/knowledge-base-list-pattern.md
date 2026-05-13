# Knowledge Base List Pattern

Source studied: `/Users/Renger/Downloads/Knowledge Base_1.yap`

Use this reference for Knowledge Base-style generated child lists inside app-level `.yap` packages.

## Source Lists

- `Categories`: category name, icon, description, parent category lookup
- `Sections`: section name, description, category lookup
- `Articles`: article title, summary, content, feature image, category lookup, section lookup

## Safe Runtime-Proven Generated Lists

Start with only:

`Categories`

- `Title` as Category Name
- `Text1` as Description

`Articles`

- `Title` as Article Title
- `Text1` as Summary
- `Text2` as Category Label

## Hard Rules

- Keep every generated `Title` field native: `Status: 0`, `IsSystem: true`, `IsIndex: true`, `FieldIndex: 0`.
- Do not copy the source `Title.Status: 1` values into generated packages.
- Use plain text `Category Label` for the first runtime baseline instead of article-to-category lookup metadata.
- Do not include `Categories.Parent category` in the first package because it is a self lookup and creates a dependency cycle.
- Do not include `Sections`, article-to-category lookup, or article-to-section lookup until each lookup pattern has imported and opened cleanly in an isolated package.
- When local app-level lookup samples are reintroduced, the target category sample record IDs may be local generated IDs and must be included in `ReplaceIds`.
- Do not place Knowledge Base `Articles.Category` lookup in `Text3`; v5-v7 import tests showed Articles stayed on a loading spinner even with blank lookup values and the lookup hidden from the list view.
- The source template places `Articles.Category` in `Text4`. Treat `Text4` lookup as the next pending proof and keep the v4 plain text `Category Label` baseline until it passes runtime testing.

## Runtime Lessons

- A package can import while list runtime still fails; list navigation must be opened as part of the proof.
- v2/v3 showed that Home/Categories can work while Articles remains on a spinner.
- v4 proved Articles after removing first-stage lookup metadata and setting native `Title.FieldIndex: 0`.
- v5/v6/v7 showed that an unresolved lookup list runtime issue can persist even without local lookup sample values and even when the lookup column is not visible in the list layout.

## Validation Notes

Embedded child lists in an app-level `.yap` are validated through `validate-yap-package.js` and `validate-yap-graph.js`. Standalone `.ydl` validation requires a standalone `.ydl` resource shape and is not authoritative for embedded child list objects.
