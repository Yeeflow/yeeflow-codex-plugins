# YAPK Runtime Generation Proof

Date: 2026-05-27

Branch: `codex/yapk-runtime-generation-proof`

## Input

Input package label: `Projects Center_1-v1..0.yapk`

Local source path used for read-only inspection: `/Users/Renger/Downloads/Projects Center_1-v1..0.yapk`

Redaction rule: this proof note does not include raw `.yapk` files, raw `Resource` strings, `Sign` values, decoded full payloads, tenant/app/list/package IDs, private URLs, API responses, secrets, tokens, screenshots, or private data.

## Decode Result

Wrapper parse: succeeded.

Wrapper shape:

- UTF-8 JSON with BOM.
- Required wrapper key count: 13.
- Required wrapper keys were present.

Resource inspection:

| Check | Result |
| --- | --- |
| Resource base64 decode | succeeded |
| Resource string length | 65688 |
| Resource decoded byte length | 49264 |
| Resource entropy estimate | 7.9930 |
| Brotli decode of base64 bytes | failed |
| Brotli decode of raw Resource UTF-8 bytes | failed |
| Brotli decode of base64url-normalized bytes | failed |

Schema-standard `AppPackageInfo` parse: not reached because Brotli decode failed.

Decoded structure summary: unavailable. No decoded JSON top-level keys or list/page/form/report counts could be produced safely because the Resource did not decompress to JSON.

## Decode Debug Follow-up

Product confirmation received after the first run: YAPK `Resource` should be exactly `base64(Brotli(AppPackageInfo JSON))`.

Additional safe diagnostics were run against the same input package:

| Diagnostic | Result |
| --- | --- |
| Strict base64 alphabet and padding | passed |
| Resource length modulo 4 | 0 |
| Base64 round-trip after decode/re-encode | unchanged |
| JSON wrapper completeness | closing object present |
| Local Brotli control stream | passed |
| Node Brotli full decoded Resource | failed: unexpected end of file |
| Node Brotli with large-window decoder parameter | failed: unexpected end of file |
| Homebrew Brotli CLI | failed: corrupt input |
| Small header skip attempts | no JSON output |
| Arbitrary trailer trimming with offsets 0-16 | no JSON output |
| gzip/zlib/raw inflate/unzip/zstd checks | failed |
| Local `YEEFLOW_API_KEY` for `verifysign` | unavailable |

Interpretation:

- The failure is not caused by JSON BOM handling, non-strict base64, missing base64 padding, URL-safe base64, whitespace, or local Brotli support.
- The decoded bytes are stable and complete as represented in the wrapper, but standard Brotli decoders do not accept them as a complete Brotli stream.
- This conflicts with the product-confirmed format for this specific package unless there is another package/source issue, version layer, export option, or product-specific transformation not represented in the schema statement.

## Requested Edit

Requested change: add one minimal data list named `YAPK Runtime Test List`.

Edit result: not attempted.

Reason: the experiment hit the hard stop before mutation. The input package did not decode through the product-schema Brotli path, so there was no schema-valid `AppPackageInfo` object to edit.

## Encode, Sign, and Verify Result

Re-encode result: not attempted.

Signing result: not attempted.

Verification result: not attempted.

Generated package path: none.

Reason: blind mutation is unsafe. The proof boundary requires successful decode before edit, encode, signing, verification, and runtime upgrade testing.

## Local Validation

Commands used:

- `node scripts/inspect-yapk-schema-standard.mjs <input.yapk>`
- `node validate-yapk-package.js <input.yapk>`

Safe validator result:

- wrapper parse succeeded
- Resource base64 decode succeeded
- Brotli decode failed
- validation status: failed at `YAPK_RESOURCE_BROTLI_DECODE_FAILED`

## Proof Boundary

This experiment does not prove `.yapk` generation.

Current result:

**Failed at decode.** The product schema says `Resource` is Brotli-compressed `AppPackageInfo`, but this `Projects Center_1-v1..0.yapk` package did not Brotli-decode through the tested schema-standard variants.

Preserved boundaries:

- Wrapper schema inspection is possible.
- Resource base64 outer decoding is possible.
- Resource Brotli/AppPackageInfo decoding is not proven for this package.
- No Resource edits were made.
- No re-encoded Resource was produced.
- No signing or verification was attempted.
- No manual runtime package was generated.
- Offline `.yapk` content mutation remains unsupported.

## Product Question

Ask product whether this package uses an additional Resource encoding, encryption, checksum, package-version layer, or non-standard Brotli settings before/after the schema-described `AppPackageInfo` payload.

Also ask product for a fresh schema-standard `.yapk` pair known to satisfy:

1. base64 decode `Resource`
2. Brotli decompress
3. parse decompressed UTF-8 JSON
4. validate JSON as `AppPackageInfo`

## Next Step

Obtain a fresh product-confirmed schema-standard `.yapk` package and rerun the decode test. Only if decode succeeds should the next experiment attempt the focused data-list add, Brotli re-encode, `setsign`, `verifysign`, and manual Yeeflow upgrade proof.
