# Yeeflow Package API Automation Runtime Proof

## Purpose

This proof records the first controlled runtime test of the Yeeflow package automation helper against the published package APIs. It uses only redacted summaries and does not include API keys, tenant IDs, workspace IDs, uploaded file IDs, app IDs, package IDs, raw API responses, raw `Resource`, raw `Sign`, decoded payloads, screenshots, package contents, or private URLs.

## Inputs

- Branch: `codex/yeeflow-package-api-automation-study`
- YAP package filename: `vendor-onboarding-compliance-management.v1.12-current-dashboard-data-table-fields-fixed.yap`
- YAPK package filename: `vendor-onboarding-v41-page1-dashboard.yapk`
- Environment source: local `.env.local`, ignored by Git
- Required environment presence: API base, API key, tenant URL, tenant ID, and workspace ID were present

## Local Preflight

- `.env.local` existed, was ignored by Git, and was not tracked.
- YAP package validation completed with zero errors and warnings only.
- YAP graph validation completed with zero errors and warnings only.
- YAPK package validation passed with zero errors.
- Dry-runs passed for upload, import, install, and upgrade request shaping.
- Import/install/upgrade dry-runs reported `workspaceId: present` and redacted the `WorkspaceID` request field.

## Upload Response Shape

The upload endpoint was runtime-tested with `.yap` and `.yapk` files.

Confirmed shape:

- Endpoint: `POST /files/upload`
- HTTP status: `200`
- Content type: `text/plain; charset=utf-8`
- Response body shape: text that parses as a JSON object
- Top-level metadata field names: `id`, `name`, `fileSize`
- Helper extraction target field names: `Id`, `Name`, `FileSize`

The helper now parses `text/plain` responses as JSON when the response text is JSON-shaped, extracts package-file metadata internally, and redacts metadata IDs in user output.

## YAP Import Status

YAP import was attempted with the product-documented direct `Resource` payload shape.

Redacted result:

- Endpoint: `POST /listset/package/import`
- HTTP status: `200`
- API status: non-zero
- Response top-level field names: `Status`, `Message`, `TotalCount`
- Request `WorkspaceID`: redacted
- Request `Resource`: redacted

Conclusion: `.yap` import automation is not runtime-proven yet. The HTTP request is accepted, but the API status is non-zero. Product clarification is needed on the failing condition or whether this endpoint expects a different package/import context for this package.

## YAPK Upload Proof

YAPK upload was runtime-proven.

Redacted result:

- Endpoint: `POST /files/upload`
- HTTP status: `200`
- Success: true
- Content type: `text/plain; charset=utf-8`
- Response top-level field names: `id`, `name`, `fileSize`
- File metadata present: yes
- Metadata values: redacted

## YAPK Install Proof

YAPK install was runtime-proven at the API acceptance level.

Redacted result:

- Endpoint: `POST /listset/package/install`
- HTTP status: `200`
- API status: `0`
- Response top-level field names: `Data`, `Status`, `TotalCount`
- Returned data field names: `ID`, `Continue`, `Status`
- Package file metadata was passed from the upload response and redacted in helper output.
- Async/continuation signal: `Continue` was present and false.

Proof boundary: this proves the package automation API accepted and completed the YAPK install request. It does not prove browser/runtime rendering of the installed app; that remains a separate runtime UI verification step.

## Upgrade Status

Upgrade was not executed.

Deferred reason: upgrade should only run when a specific disposable target app is explicitly identified and the operation is confirmed to affect only that target. This run proved install using a disposable package but did not establish a safe upgrade target identity for a follow-up mutation.

## Confirmed Payload Shapes

- Upload: multipart file upload to `POST /files/upload?isImg=false`; response metadata parsed from text/plain JSON.
- Import: direct JSON body with `AppID`, `WorkspaceID`, `Title`, `Description`, `IconUrl`, `Resource`, `Manage`, `Write`, and `Read`; not proven due non-zero API status.
- Install: JSON body with redacted `WorkspaceID` and `PackageFile.{Id,Name,FileSize}` from upload metadata.
- Upgrade: dry-run only, JSON body with redacted `WorkspaceID`, `PackageFile.{Id,Name,FileSize}`, and `UpgradeCheck`.

## Safety Boundary

No `.env.local`, generated packages, uploaded package contents, raw API responses, raw `Resource`, raw `Sign`, decoded payloads, screenshots, private URLs, tenant IDs, workspace IDs, uploaded file IDs, app IDs, or package IDs are committed or recorded here.
