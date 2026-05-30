---
name: yeeflow-api-operator
description: Safely use Yeeflow REST APIs from Codex when local credentials are available. Use for read-only Yeeflow organization and reference-data lookups, API connectivity checks, directory/master-data discovery, users, departments, locations, positions, groups, assignment-routing API coverage, or when app planning/runtime tests need authorized org data without exposing secrets.
---

# Yeeflow API Operator

## Public Tenant Safety

- Never hardcode a tenant-specific Yeeflow URL. Use `https://<yourdomain>.yeeflow.com` in docs and examples.
- For live API calls, prefer `YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1` and `YEEFLOW_API_KEY`; do not ask users to paste secrets into chat.
- Use `YEEFLOW_TENANT_URL` only for tenant/app links, for example `https://<yourdomain>.yeeflow.com`; never use a tenant URL as the API base.
- Treat `YEEFLOW_BASE_URL` as a legacy API base URL alias only, not as a tenant URL.
- Support `YEEFLOW_PROFILE` where scripts support profiles. It selects one active local tenant profile per run using `YEEFLOW_<PROFILE>_API_KEY`, `YEEFLOW_<PROFILE>_TENANT_URL`, and `YEEFLOW_<PROFILE>_TENANT_ID`. Package automation also reads `YEEFLOW_<PROFILE>_WORKSPACE_ID` when a profile is active.
- Validate and redact environment variables before API calls and never print API keys, raw API responses, tenant IDs, private URLs, raw `Resource`, raw `Sign`, decoded payloads, or generated runtime packages.
- Keep generated examples tenant-neutral unless the user explicitly requests a target-tenant-specific package and provides safe mappings.

## Purpose

Use this skill when Codex needs safe, credential-aware Yeeflow REST API access. The v1 boundary is read-only directory and master-data access for users, departments, locations, positions, user groups, group members, and position assignments.

This skill is separate from package generation. It can support planning, validation, and runtime-test setup. Directory/master-data calls remain read-only by default.

Package import/install/upgrade APIs are a separate, explicitly mutating path. Use them only when the user asks to automate package import, install, or upgrade, local package validation has passed, and the user approves execution. Never run package automation as part of normal lookup.

## When To Use

Use this skill for prompts such as:

- "Test my Yeeflow API connection."
- "Check if Codex can read Yeeflow users."
- "List available Yeeflow departments safely."
- "Use Yeeflow API to find department IDs for app generation."
- "Read locations and positions for approval routing setup."
- "Check whether an Assignment Task user group or job position reference resolves to users."

Use the API only when local credentials are available and the user has asked for API-backed lookup or when a Yeeflow workflow would otherwise require real org/reference data.

## When Not To Use

- Do not use this skill for normal Yeeflow package generation when no real org data is needed.
- Do not ask the user to paste API keys into chat.
- Do not run write APIs unless the user explicitly asks for package import/install/upgrade automation and you use the guarded package helper with `--execute`.
- Do not commit `.env.local`, raw API responses, credentials, tokens, users, emails, phone numbers, tenant IDs, or private identifiers.
- Do not add write operations until they are separately studied, safety-reviewed, and runtime-proven.

## Required Environment

The workspace should provide credentials locally, preferably in `.env.local` at the project root:

```env
YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1
YEEFLOW_API_KEY=<your Yeeflow API key>
YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
YEEFLOW_TENANT_ID=<optional tenant id>
YEEFLOW_WORKSPACE_ID=<your workspace id>
```

Rules:

- Load the API base from `YEEFLOW_API_BASE_URL`, with `YEEFLOW_BASE_URL` supported only as a legacy API base URL alias.
- Load the key from `YEEFLOW_API_KEY` or, when `YEEFLOW_PROFILE` is set, from `YEEFLOW_<PROFILE>_API_KEY`.
- Load tenant/app links from `YEEFLOW_TENANT_URL` or, when `YEEFLOW_PROFILE` is set, from `YEEFLOW_<PROFILE>_TENANT_URL`. Load package automation workspace IDs from `YEEFLOW_WORKSPACE_ID`, or from `YEEFLOW_<PROFILE>_WORKSPACE_ID` when a profile is active.
- Never print the key or include it in logs, docs, commits, or final answers. Never print workspace IDs either; report only present or missing.
- Ensure `.env.local` is gitignored before running API checks.
- If `.env.local` or the key is missing, explain setup steps and ask the user to store the key locally, not in chat.

Use `YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1` for live API calls. Use `YEEFLOW_TENANT_URL` for tenant/app links such as `https://<yourdomain>.yeeflow.com`. Do not use a tenant URL as the API base. `YEEFLOW_PROFILE` is a local script selector, not a Yeeflow server-side setting; it activates exactly one profile for a run.

## Supported Read-Only Operations

Initial supported endpoints:

- Test API key and base URL presence.
- Test Yeeflow API connectivity.
- `POST /users/search`
- `GET /users/{id}`
- `GET /departments?parentId=0`
- `GET /locations`
- `GET /locations/{id}`
- `GET /positions`
- `GET /positions/{id}/users`
- `GET /positions/{id}/users?bindingType=2&targetID={departmentId}`
- `GET /positions/{id}/users?bindingType=3&targetID={locationId}`
- `GET /groups`
- `GET /groups/{id}/users`

Report only:

- env-var presence, never values
- HTTP status
- API status
- counts
- endpoint success/failure
- response keys
- redacted sample schema/shape

For user/person data, show counts and redacted field shapes by default. Do not show full names, emails, phone numbers, or broad identity dumps. Return IDs only when explicitly needed for app generation or runtime testing, and keep scope narrow.

## Package Automation Operations

The product team published package automation APIs on 2026-05-29:

- `POST /files/upload`
- `POST /listset/package/import`
- `POST /listset/package/install`
- `POST /listset/package/upgrade`

Use the shared helper from the repository root:

```bash
node scripts/yeeflow-package-api-automation.mjs --operation import-yap --package <file.yap>
node scripts/yeeflow-package-api-automation.mjs --operation install-yapk --package <file.yapk>
node scripts/yeeflow-package-api-automation.mjs --operation upgrade-yapk --package <file.yapk>
```

WorkspaceID is required for import/install/upgrade and is read from `YEEFLOW_WORKSPACE_ID` or the active profile-specific workspace variable; `--workspace-id` is only a redacted one-run override. The helper defaults to dry run. Add `--execute` only after explicit user approval. It prints env-var presence, package name/size, request summary, HTTP/API status, response keys, and redacted data shape only. It must not print API keys, raw API responses, raw package `Resource`, raw `Sign`, decoded payloads, private URLs, tenant IDs, or uploaded file IDs.

Before executing package automation, validate the package locally with the relevant `.yap` or `.yapk` validators, confirm the target workspace is disposable or approved, and record the proof boundary. A successful API response is not a substitute for visible runtime verification of the imported/installed/upgraded app.

## Safety And Redaction

Redact by default:

- names
- emails
- phone numbers
- user IDs
- department/location/position IDs when shown as samples
- tenant IDs
- manager fields
- audit-user fields
- addresses
- account codes
- employee numbers
- photos
- job titles
- private identifiers

Never write raw API responses to tracked files. If a temporary response capture is explicitly needed for debugging, keep it under ignored `tmp/`, redact it before sharing, and do not commit it.

## Connectivity Smoke Test

Prefer the skill-local helper when this skill is installed in a plugin:

```bash
node generated-skills/yeeflow-api-operator/scripts/yeeflow-directory-connectivity-test.mjs
```

From the repository root, the shared workspace helper is also available:

```bash
node scripts/yeeflow-directory-connectivity-test.mjs
```

The helper parses `.env.local` into `process.env` only when values are not already set. It prints only presence, statuses, counts, response keys, and redacted sample shapes.

For Assignment Task routing API coverage, use:

```bash
node scripts/yeeflow-assignment-routing-api-coverage-test.mjs "/path/to/export.yap"
```

This helper decodes the export in memory, extracts assignment references, and tests only documented read-only coverage endpoints. It reports counts, status, redacted schema shapes, and reference-category counts only.

For detailed behavior and latest proven results, read `references/yeeflow-directory-api-connectivity.md`.
For assignment-routing coverage, read `docs/studies/yeeflow-api-operator-assignment-routing-coverage.md` in the source repository when available.

## Failure Handling

- Missing `.env.local`: explain where to create it and what variables are required.
- Missing `YEEFLOW_API_KEY`: ask the user to store the key locally; do not ask them to paste it.
- Missing `YEEFLOW_WORKSPACE_ID` for package automation: ask the user to store it locally or configure the active profile workspace variable; do not print the value.
- Authentication/authorization failure: report HTTP/API status and likely causes such as expired key, wrong tenant/account, insufficient permission, or wrong base; do not echo credentials.
- `404` on the configured API base: verify `YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1`; do not substitute the tenant URL as the API base.
- Non-JSON or unexpected responses: report status and response shape only; do not dump body content.

## Coordination With App Work

When app planning or generation needs real users, departments, locations, or positions, use this skill only if credentials are locally available and API lookup is authorized. Do not invent org data when lookup is available and authorized. Do not require API access for normal package generation.

For approval workflow assignment task assignee generation, use read-only lookup only when real users, departments, locations, or positions are explicitly needed and authorized. Report only counts, status, and redacted shapes; never save or commit raw API responses.

For export-learning work, you may build memory-only or ignored-temp reference sets to classify redacted assignment task references as user, department, location, or position categories. Do not commit raw ID maps, names, emails, tenant IDs, or raw records. API category confirmation supports schema interpretation only; it does not prove workflow runtime routing.

User-group lookup is now supported through documented read-only `GET /groups` and `GET /groups/{id}/users`. Use it only to confirm category/member-count/readability for authorized runtime setup; do not dump group members or commit user/group data.

The public OpenAPI docs do not currently expose a `GET /departments/{id}`, `GET /positions/{id}`, or combined department+location position-assignment endpoint. Do not invent those calls; use the documented list/tree and position-assignment endpoints instead.

Keep generated packages free of private user data unless the user explicitly requires it, the data is safe to include, and the scope is narrow. Prefer placeholders, empty groups, requester/current-user expressions, or post-import configuration when that is safer.
