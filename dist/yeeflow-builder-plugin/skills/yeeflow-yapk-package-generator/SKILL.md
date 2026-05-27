---
name: yeeflow-yapk-package-generator
description: Inspect, validate, compare, and plan Yeeflow .yapk existing-application upgrade packages using the product YAPK schema, including AppExportPackageInfo wrapper checks, Resource Brotli/AppPackageInfo decode attempts, signing-boundary guidance, safe redacted summaries, and future edit-encode-sign-runtime generation workflow.
---

# Yeeflow YAPK Package Generator

Use this skill for Yeeflow `.yapk` version-management packages for existing application upgrades.

Current proof boundary:

- `.yapk` wrapper schema is product-schema-backed as `AppExportPackageInfo`.
- Product schema describes `Resource` as a Brotli compressed string whose decompressed JSON should match `AppPackageInfo`.
- In the current local study, readable historical `.yapk` artifacts did not Brotli-decode through tested variants, so Resource decode is not yet artifact-proven for those files.
- A focused runtime-generation attempt against `Projects Center_1-v1..0.yapk` found that the original Resource emits complete parseable `AppPackageInfo` JSON from a streaming Brotli decoder before ending with `Z_BUF_ERROR`. Product's provided C# compression helper returns `MemoryStream.ToArray()` after `BrotliStream.Flush()` but before disposing the `BrotliStream`, which explains an unfinished Brotli stream. Treat this as a tolerant decode path, not as a general permission to ignore decompression errors.
- The same focused experiment added one minimal data list, re-encoded Resource with finalized standard Brotli, called `setsign`, and passed `verifysign`. User confirmed v1.1 upgraded successfully, the generated list appeared, and the add form rendered, but saving a record failed with `Add failed`. Treat runtime upgrade/list/form materialization as proven and record creation as not proven.
- After `.env.local` credentials were added, the signing service accepted the same original `Projects Center_1-v1..0.yapk` wrapper when `/v1` was appended to the configured base URL: `setsign` returned a 32-byte sign and `verifysign` passed for both regenerated and original signs. This proves server-side signing/verification for the original valid Resource, not local Resource decoding or content mutation.
- `setsign` / `verifysign` are evidence-backed for wrappers with already-valid existing Resource payloads.
- Wrapper-only signed packages can be accepted but do not change app content when `Resource` is unchanged.
- `.yap` gzip Resource encoding is not valid `.yapk` Resource encoding.
- Offline `.yapk` content generation is not production-supported until edit -> Brotli encode -> sign -> verify -> runtime upgrade succeeds.

## Default Workflow

1. Preserve originals. Do not copy raw `.yapk` files into the repo.
2. Inspect wrapper metadata with redaction. Never print raw `Resource`, `Sign`, tenant IDs, app IDs, list IDs, package IDs, private URLs, API keys, raw API responses, or decoded full payloads.
3. Validate wrapper required keys:
   - `PackageId`
   - `TenantID`
   - `AppID`
   - `ListID`
   - `Title`
   - `Description`
   - `IconUrl`
   - `Resource`
   - `Notes`
   - `Author`
   - `Date`
   - `Version`
   - `Sign`
4. Check schema rules:
   - `TenantID` and `ListID` should be numeric strings.
   - `Date` should be UTC `yyyy-MM-ddTHH:mm:ssZ`.
   - `Resource` must not use the `.yap` `[______gizp______]` prefix.
5. Attempt Resource decode using project tooling:
   - `node scripts/inspect-yapk-schema-standard.mjs <package.yapk>`
   - `node validate-yapk-package.js <package.yapk> [--baseline <baseline.yapk>]`
6. If Resource decodes, validate decoded `AppPackageInfo` shape:
   - required top-level keys: `ListSet`, `Pages`, `Forms`, `FormReports`, `FormNewReports`, `DataReports`, `Groups`, `Tags`, `Metadatas`, `Agents`, `Connections`, `Knowledges`, `Themes`, `Components`, `PortalInfo`, `Childs`
   - `ListPackageInfo` children require `List`, `Fields`, `Layouts`, `RemindRules`, `PublicForms`, `FlowMappings`
   - `FieldName` must end with digits and suffix must equal `FieldIndex`
   - `InternalName` must match `^[a-zA-Z0-9_]+$`
   - `NoRule.Prefix` must contain `{index}`
   - `List.Type` uses the product enum values
   - `List.Flags` includes `Show = 1`
7. Compare packages using safe stats only:
   - Resource string length
   - decoded byte length
   - Brotli success/failure
   - decoded top-level key list when available
   - list/page/form/report/module counts
   - Resource changed/unchanged boolean
   - common-prefix/suffix and same-position byte ratio

## Generation Boundary

Do not claim `.yapk` generation is solved just because the wrapper validates or signs.

Future generation requires all of:

1. Decode `Resource` to schema-valid `AppPackageInfo`. If standard Brotli ends with `Z_BUF_ERROR`, a streaming decoder may be used only when the emitted UTF-8 text parses as complete JSON with the expected `AppPackageInfo` keys.
2. Edit the decoded object safely.
3. Brotli encode the updated `AppPackageInfo`.
4. Put the encoded Resource into a valid wrapper.
5. Sign with a product-supported signing path.
6. Verify the signature.
7. Runtime upgrade in Yeeflow and confirm the intended content changed.

Until step 7 succeeds, classify output as schema study, planning guidance, or experimental validation only. Continue using `.yap` for generated new/cloned application creation.

When editing decoded `AppPackageInfo`, preserve 64-bit numeric IDs. Plain JavaScript `JSON.parse` rounds large IDs and must not be used for app-content mutation unless a lossless JSON parser is used. The first focused edit used Python JSON handling for the app payload and Node only for byte-level compression/API calls.

## What To Load

Use these project references when present:

- `docs/yeeflow-yapk-version-package-study.md`
- `docs/studies/normalized/yapk-schema-standard/`
- `yeeflow-yapk-schema-standard-summary.json`
- `validate-yapk-package.js`
- `scripts/inspect-yapk-schema-standard.mjs`

Also use:

- `yeeflow-package-validator` for import-safety framing.
- `yeeflow-runtime-test-orchestrator` when a user explicitly asks for runtime upgrade proof.
- `yeeflow-application-builder` only for business-solution design or `.yap` clone alternatives.

## Stop Conditions

Stop and report the proof boundary when:

- Resource does not Brotli-decode to JSON.
- Resource decodes but fails schema-critical `AppPackageInfo` checks.
- The task requires app-content mutation but no product-supported Resource-generation/signing/runtime proof is available.
- The only successful change is wrapper metadata or `Sign`, because unchanged Resource means unchanged app content.
- Any raw package, payload, private ID, API response, secret, screenshot, or decoded full payload would need to be committed.

## Runtime-generation Experiment Notes

For `Projects Center_1-v1..0.yapk`, the safe result is:

- wrapper JSON parse: succeeded
- Resource base64 decode: succeeded
- Resource standard Brotli sync decode: failed with final `unexpected end of file`
- Resource tolerant streaming decode: emitted complete parseable `AppPackageInfo` JSON
- requested data-list add: completed locally
- finalized standard Brotli re-encode: completed
- `setsign`/`verifysign`: passed
- generated package: `/Users/Renger/Downloads/Projects Center_1-v1.1-yapk-runtime-test.yapk`
- runtime upgrade/list/form materialization: user-proven
- record creation: failed with `Add failed`

The v1.2 add-fix package adjusted save-path-sensitive list metadata:

- generated list `TableCode`: `flowcraft`
- date field `FieldName`: `Datetime4`
- date field `FieldType`: `Datetime`
- layout references updated to `Datetime4`
- generated package: `/Users/Renger/Downloads/Projects Center_1-v1.2-yapk-runtime-add-fix.yapk`
- `setsign`/`verifysign`: passed
- runtime add-item retest: pending

User runtime result for v1.2:

- upgrade failed
- error: `Data list: YAPK Runtime Test List (field invalid 'Test Date Datetime4!=DateTime4')`
- conclusion: do not change this package's generated date field from `DateTime4` / `DateTime` to `Datetime4` / `Datetime`

The v1.3 table-code-only package keeps the upgrade-valid date field shape and changes only:

- generated list `TableCode`: `flowcraft`
- generated package: `/Users/Renger/Downloads/Projects Center_1-v1.3-yapk-runtime-tablecode-fix.yapk`
- `setsign`/`verifysign`: passed
- inspector/validator: passed
- runtime add-item retest: pending

Ask product to confirm whether the provided `BrotliHelper.Compress(byte[])` should dispose/close `BrotliStream` before reading `MemoryStream.ToArray()`.

When using the signing APIs:

- load `.env.local` without printing values
- require `YEEFLOW_API_KEY`
- use `YEEFLOW_BASE_URL` with the same candidate logic as the Yeeflow API scripts: try the configured base and append `/v1` when needed
- never print or persist raw API responses, `Resource`, or `Sign`
- treat a successful `setsign`/`verifysign` on an unchanged Resource as wrapper/signing proof only

If product states the format is exactly `base64(Brotli(AppPackageInfo JSON))`, ask for one of:

- a fresh `.yapk` known to decode with that exact path,
- the expected safe byte statistics for the decoded Brotli payload,
- confirmation that this specific package was generated by the same schema-standard exporter,
- or the product-side decode trace/error for this exact package.
