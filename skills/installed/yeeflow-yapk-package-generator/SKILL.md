---
name: yeeflow-yapk-package-generator
description: Inspect, validate, compare, and plan Yeeflow .yapk existing-application upgrade packages using the product YAPK schema, including AppExportPackageInfo wrapper checks, Resource Brotli/AppPackageInfo decode attempts, signing-boundary guidance, safe redacted summaries, and future edit-encode-sign-runtime generation workflow.
---

# Yeeflow YAPK Package Generator

## Public Tenant Safety

- Never hardcode a tenant-specific Yeeflow URL. Use `https://<yourdomain>.yeeflow.com` in docs and examples.
- For live API calls, prefer `YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1` and `YEEFLOW_API_KEY`; do not ask users to paste secrets into chat.
- Use `YEEFLOW_TENANT_URL` only for tenant/app links, for example `https://<yourdomain>.yeeflow.com`; never use a tenant URL as the API base.
- Treat `YEEFLOW_BASE_URL` as a legacy API base URL alias only, not as a tenant URL.
- Support `YEEFLOW_PROFILE` where scripts support profiles. It selects one active local tenant profile per run using `YEEFLOW_<PROFILE>_API_KEY`, `YEEFLOW_<PROFILE>_TENANT_URL`, and `YEEFLOW_<PROFILE>_TENANT_ID`.
- Validate and redact environment variables before API calls and never print API keys, raw API responses, tenant IDs, private URLs, raw `Resource`, raw `Sign`, decoded payloads, or generated runtime packages.
- Keep generated examples tenant-neutral unless the user explicitly requests a target-tenant-specific package and provides safe mappings.

Use this skill for Yeeflow `.yapk` version-management packages for existing application upgrades.

## YAPK From Scratch Hardening

YAPK-from-scratch generation is allowed only after the inner application content passes package/app/workflow publish-readiness validation. Generate and validate `AppPackageInfo` first, then Brotli/base64/sign only after content validators, graph validators, workflow publish-readiness checks, and placeholder scans pass.

Shared YAP/YAPK application-content rule from Vendor Onboarding v1.12: generated dashboard Data table controls must use `attrs.listarr[].Field` for the actual source field internal name and `attrs.listarr[].FieldName` for the visible label. Missing `Field` can pass superficial label checks but fail at runtime with the deleted-fields query error. Preserve the same current-dashboard and YAP import rules when the inner content is later wrapped as YAPK: current dashboard shell `Type = 103`, `LayoutView = null`, `Ext2 = "{\"src\":true}"`, fixed `AppID = 41` for YAP imports, API-issued IDs for generated object IDs, integer `Field.Category`, unique IDs, populated `ReplaceIds`, and `CustomType = ListSite_<root ListID>` where applicable.

YAPK schema v2 rule from Vendor Onboarding v1.13-v1.15: generated `.yapk` packages must be top-level `AppExportPackageInfo`, and `Resource` must be `base64(Brotli(JSON.stringify(AppPackageInfo)))`. Do not wrap YAP `ListExportResult` or direct `ListExportInfo` inside YAPK `Resource`. Decoded `AppPackageInfo` must include schema-required arrays and objects: `ListSet`, `Pages`, `Forms`, `FormReports`, `FormNewReports`, `DataReports`, `Groups`, `Tags`, `Metadatas`, `Agents`, `Connections`, `Knowledges`, `Themes`, `Components`, `PortalInfo`, and `Childs`. When no portal is included, product import feedback requires `PortalInfo: null`; do not emit an empty object or empty array. Each `Childs[]` entry must use `Fields`, not YAP `Defs`, plus `List`, `Layouts`, `RemindRules`, `PublicForms`, and `FlowMappings`. `LongAsString` fields such as wrapper `TenantID`, wrapper `ListID`, and layout `LayoutID` stay numeric strings. Schema integer IDs such as `ListID`, `FieldID`, `ID`, and `RefId` must be emitted without JavaScript rounding; use lossless parsing/writing. For generated Vendor Onboarding-style packages, keep `AppID = 41`, use the generate-unique-ids API for new generated package/object IDs, and validate dashboard Data table `Field` bindings before signing.

Signing and `verifysign` validate wrapper/resource integrity, not full business publish-readiness. Do not run `setsign` for generated content when any of these are present: missing/non-1 root or child list flags, unresolved sequence-flow variables, undeclared Set Variable targets, undeclared assignment-expression variables, unresolved required placeholders, or tenant-specific user/group/position placeholders.

Generation order for new content: build `AppPackageInfo`, validate decoded content, run workflow publish-readiness checks, scan placeholders, Brotli-compress `Resource`, base64 encode, update wrapper metadata, call `setsign`, call `verifysign`, and write the generated `.yapk` outside git, normally to Downloads. Never commit generated `.yapk` packages, raw `Resource`, raw `Sign`, decoded full payloads, API responses, tenant IDs, or private data.

Business Travel hardening rules: set `Flags = 1` on root app/list-set and child list resources; declare every workflow variable used by sequence flows, Set Variable nodes, task assignments, form bindings, summaries, and ContentList mappings; remove stale renamed variables from conditions; do not use placeholders such as `__POSITION_ID_REQUIRED_*`; direct position assignment requires a real numeric tenant position ID or a user-approved post-import binding/fallback. Preserve the proof boundary: these rules harden content validation and do not prove arbitrary YAPK-from-scratch generation for all app types or tenant-specific routing.

Current proof boundary:

- `.yapk` wrapper schema is product-schema-backed as `AppExportPackageInfo`.
- Product schema describes `Resource` as a Brotli compressed string whose decompressed JSON should match `AppPackageInfo`.
- In the current local study, readable historical `.yapk` artifacts did not Brotli-decode through tested variants, so Resource decode is not yet artifact-proven for those files.
- A focused runtime-generation attempt against `Projects Center_1-v1..0.yapk` found that the original Resource emits complete parseable `AppPackageInfo` JSON from a streaming Brotli decoder before ending with `Z_BUF_ERROR`. Product's provided C# compression helper returns `MemoryStream.ToArray()` after `BrotliStream.Flush()` but before disposing the `BrotliStream`, which explains an unfinished Brotli stream. Treat this as a tolerant decode path, not as a general permission to ignore decompression errors.
- The same focused experiment added one minimal data list, re-encoded Resource with finalized standard Brotli, called `setsign`, and passed `verifysign`. User confirmed v1.4 upgraded successfully, the generated text-only list appeared, the add form rendered, and saving a record succeeded. Treat only this minimal text-only data-list-add path as runtime-proven.
- After `.env.local` credentials were added, the signing service accepted the same original `Projects Center_1-v1..0.yapk` wrapper when `/v1` was appended to the configured base URL: `setsign` returned a 32-byte sign and `verifysign` passed for both regenerated and original signs. This proves server-side signing/verification for the original valid Resource, not local Resource decoding or content mutation.
- `setsign` / `verifysign` are evidence-backed for wrappers with already-valid existing Resource payloads.
- Wrapper-only signed packages can be accepted but do not change app content when `Resource` is unchanged.
- `.yap` gzip Resource encoding is not valid `.yapk` Resource encoding.
- Offline `.yapk` content generation is proven only for the focused minimal text-only data-list-add path tested in `Projects Center_1-v1..0.yapk`; broader field types and richer app mutations remain experimental until separately runtime-proven.

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

Until step 7 succeeds for the exact mutation type, classify output as schema study, planning guidance, or experimental validation only. Continue using `.yap` for generated new/cloned application creation. For `.yapk`, the current proven generation scope is a minimal text-only data list.

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
- runtime result: upgrade succeeded, but add-item save still failed
- conclusion: `TableCode` was not the missing save-path piece

The v1.4 text-only isolation package removes the `Test Date` field to test whether the save failure is caused by DateTime control materialization:

- generated package: `/Users/Renger/Downloads/Projects Center_1-v1.4-yapk-runtime-text-only.yapk`
- fields: `Name`, `Test Status`, `Test Notes`
- `setsign`/`verifysign`: passed
- inspector/validator: passed
- runtime result: upgrade succeeded, list rendered, add form rendered, and saving a new item succeeded
- conclusion: first complete runtime proof for decode -> edit -> encode -> sign -> verify -> upgrade -> add-item-save, scoped to a minimal text-only data list

Do not generalize this to DateTime fields yet. v1.1 and v1.3 both failed record creation while including the generated DateTime field, and v1.2 failed upgrade when the DateTime field casing was changed.

Ask product to confirm whether the provided `BrotliHelper.Compress(byte[])` should dispose/close `BrotliStream` before reading `MemoryStream.ToArray()`.

When using the signing APIs:

- load `.env.local` without printing values
- if `.env.local` is marked macOS `dataless`, stop before reading it and ask the user to hydrate the file; read attempts may hang indefinitely
- require `YEEFLOW_API_KEY`
- use `YEEFLOW_API_BASE_URL` for signing API calls; the standard value is `https://api.yeeflow.com/v1`
- treat `YEEFLOW_BASE_URL` only as a legacy API base URL alias
- use `YEEFLOW_TENANT_URL` only for tenant/app links, not for signing API calls
- when `YEEFLOW_PROFILE` is set, read the matching profile key and tenant URL while keeping other profiles inactive for that run
- never print or persist raw API responses, `Resource`, or `Sign`
- treat a successful `setsign`/`verifysign` on an unchanged Resource as wrapper/signing proof only

Sub List Dynamic Runtime Proof V1.2 note: the user-corrected `Sub List Dynamic Runtime Proof-V1.1.yapk` is the baseline for grid/header fixes. Generate V1.2 from that YAPK rather than the older `.yap`: tolerant-decode the V1.1 Resource, remove the stale standalone V1 header grid, wrap body-grid field controls in containers, re-encode with finalized standard Brotli, update wrapper PackageId/Version/Date/Notes, then run `setsign` and `verifysign`. The generated V1.2 package signed and verified; do not claim runtime proof until V1.2 is upgraded/imported and manually tested.

Sub List Dynamic Runtime Proof V1.4 note: V1.3 rendering was user-confirmed for the Purchase Request Dynamic Sub List, but the row menu only had Duplicate/Delete. V1.4 is generated from V1.3 by mutating only the Purchase Request form row menu to Duplicate, Insert before, Insert after, Move up, and Move down, preserving visible Delete in the last column. Sign and verify the wrapper as usual, but keep Insert/Move runtime behavior pending until user testing confirms it.

Sub List Dynamic Runtime Proof V1.5 note: V1.4 decoded locally with the five menu items but runtime still showed the old Duplicate/Delete menu. The earlier add-form generation had collapsed the Purchase Request `ProcModelID`, `DefResourceID`, and `DeployedDefID` to the same rounded large value. For form-definition mutations in YAPK upgrades, bump the target form `DefResourceID` and `DeployedDefID` along with `DefResource` so Yeeflow materializes the fresh deployed form definition. V1.5 applies that fix and remains runtime-pending.

If product states the format is exactly `base64(Brotli(AppPackageInfo JSON))`, ask for one of:

- a fresh `.yapk` known to decode with that exact path,
- the expected safe byte statistics for the decoded Brotli payload,
- confirmation that this specific package was generated by the same schema-standard exporter,
- or the product-side decode trace/error for this exact package.
