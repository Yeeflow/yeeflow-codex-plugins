# Yeeflow Package API Automation Study

## Purpose

The product team published four package automation APIs on 2026-05-29. These endpoints can help Codex move from local package generation to controlled API-backed import, install, and upgrade workflows.

This study records the safe integration plan. It does not include API keys, raw API responses, tenant URLs, private IDs, raw package `Resource`, raw `Sign`, decoded payloads, generated packages, or screenshots.

## APIs Studied

Source docs:

- `POST https://api.yeeflow.com/v1/files/upload`
- `POST https://api.yeeflow.com/v1/listset/package/import`
- `POST https://api.yeeflow.com/v1/listset/package/install`
- `POST https://api.yeeflow.com/v1/listset/package/upgrade`

All four endpoints use the `apiKey` header. Use `YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1` and `YEEFLOW_API_KEY` from local environment variables only.

## Endpoint Summary

| API | Purpose | Required inputs | Response shape in docs | Automation status |
| --- | --- | --- | --- | --- |
| Upload file content | Upload a local package file for later install/upgrade | `apiKey`, package file content, `isImg=false` query | Docs show `200 OK` with no body | Supported as dry-run and guarded execution. File body contract needs runtime confirmation. |
| Import list set template package | Import a `.yap` ListExportResult package | `AppID`, `WorkspaceID`, `Title`, `Description`, `IconUrl`, `Resource`, `Manage`, `Write`, `Read` | `Data.ActionLogID`, `Data.Completed`, `Status`, `Message`, `TotalCount` | Supported as guarded execution from `.yap` wrapper metadata. |
| Install package | Install a `.yapk` package | `WorkspaceID`, `PackageFile.{Id,Name,FileSize}` | `Data.ID`, `Data.Continue`, `Data.Status`, `Data.LogTxt`, `Status`, `Message`, `TotalCount` | Supported as guarded execution after upload or with explicit package-file metadata. |
| Upgrade package | Upgrade existing app from `.yapk` package | `WorkspaceID`, `PackageFile.{Id,Name,FileSize}`, `UpgradeCheck` | `Data.ID`, `Data.Continue`, `Data.Status`, `Data.LogTxt`, `Status`, `Message`, `TotalCount` | Supported as guarded execution after upload or with explicit package-file metadata. |

## Safe Automation Helper

The helper is:

```bash
node scripts/yeeflow-package-api-automation.mjs
```

It defaults to dry run. It never prints API keys, raw package `Resource`, raw `Sign`, raw decoded payloads, tenant IDs, private URLs, or full API responses. It reports endpoint, package file name/size, request summary, HTTP/API status, response keys, and redacted data shape.

Examples:

```bash
node scripts/yeeflow-package-api-automation.mjs \
  --operation import-yap \
  --package ~/Downloads/app.yap \
  --workspace-id "<workspace-id>"
```

```bash
node scripts/yeeflow-package-api-automation.mjs \
  --operation install-yapk \
  --package ~/Downloads/app.yapk \
  --workspace-id "<workspace-id>"
```

```bash
node scripts/yeeflow-package-api-automation.mjs \
  --operation upgrade-yapk \
  --package ~/Downloads/upgrade.yapk \
  --workspace-id "<workspace-id>" \
  --upgrade-check true
```

Add `--execute` only after local validation has passed and the user explicitly approves a tenant mutation.

## Required Preflight Before Execute

Before any import/install/upgrade API call:

1. Validate the generated `.yap` or `.yapk` locally.
2. Run package graph and materialization validators where applicable.
3. Run strict visual/composition/template checks for full app generation.
4. Confirm package type:
   - `.yap` uses the import endpoint.
   - `.yapk` uses install or upgrade endpoint.
5. Confirm `WorkspaceID` from an authorized safe workspace.
6. Confirm the API profile and tenant in local `.env.local`, without printing secrets.
7. Use dry-run output first.
8. Use `--execute` only after explicit approval.

## Open Questions

The upload endpoint documentation currently shows the endpoint and `apiKey` auth but does not fully document the package file request body. The helper supports `multipart/form-data` by default and a raw octet-stream fallback. Runtime confirmation is still required to know the exact upload response body and whether it reliably returns `PackageFile.Id`, `Name`, and `FileSize`.

If upload returns no package-file metadata, callers can pass:

```bash
--package-file-id "<uploaded-file-id>" \
--package-file-name "package.yapk" \
--package-file-size 12345
```

## Proof Boundary

This branch is API-contract and helper implementation work. It does not claim live runtime proof of package import, install, or upgrade. The next proof should run against a disposable workspace with safe local credentials and a disposable generated package, then record only redacted status summaries.
