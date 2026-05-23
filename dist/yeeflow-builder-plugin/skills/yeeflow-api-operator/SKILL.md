---
name: yeeflow-api-operator
description: Safely use Yeeflow REST APIs from Codex when local credentials are available. Use for read-only Yeeflow organization and reference-data lookups, API connectivity checks, directory/master-data discovery, users, departments, locations, positions, or when app planning/runtime tests need authorized org data without exposing secrets.
---

# Yeeflow API Operator

## Purpose

Use this skill when Codex needs safe, credential-aware Yeeflow REST API access. The v1 boundary is read-only directory and master-data access for users, departments, locations, and positions.

This skill is separate from package generation. It can support planning, validation, and runtime-test setup, but it must not create, update, delete, enable, disable, assign, remove, or mutate Yeeflow data.

## When To Use

Use this skill for prompts such as:

- "Test my Yeeflow API connection."
- "Check if Codex can read Yeeflow users."
- "List available Yeeflow departments safely."
- "Use Yeeflow API to find department IDs for app generation."
- "Read locations and positions for approval routing setup."

Use the API only when local credentials are available and the user has asked for API-backed lookup or when a Yeeflow workflow would otherwise require real org/reference data.

## When Not To Use

- Do not use this skill for normal Yeeflow package generation when no real org data is needed.
- Do not ask the user to paste API keys into chat.
- Do not run write APIs.
- Do not commit `.env.local`, raw API responses, credentials, tokens, users, emails, phone numbers, tenant IDs, or private identifiers.
- Do not add write operations until they are separately studied, safety-reviewed, and runtime-proven.

## Required Environment

The workspace should provide credentials locally, preferably in `.env.local` at the project root:

```env
YEEFLOW_API_KEY=your_api_key_here
YEEFLOW_BASE_URL=https://codex.yeeflow.com
```

Rules:

- Load the key only from `process.env.YEEFLOW_API_KEY`.
- Never print the key or include it in logs, docs, commits, or final answers.
- Ensure `.env.local` is gitignored before running API checks.
- If `.env.local` or the key is missing, explain setup steps and ask the user to store the key locally, not in chat.

`YEEFLOW_BASE_URL` may be an app/site base URL. The directory endpoints are documented under the official Yeeflow developer API base, and the current helper tries the env base, env base plus `/v1`, and the known documented developer API base as a read-only fallback.

## Supported Read-Only Operations

Initial supported endpoints:

- Test API key and base URL presence.
- Test Yeeflow API connectivity.
- `POST /users/search`
- `GET /departments?parentId=0`
- `GET /locations`
- `GET /positions`

Report only:

- env-var presence, never values
- HTTP status
- API status
- counts
- endpoint success/failure
- response keys
- redacted sample schema/shape

For user/person data, show counts and redacted field shapes by default. Do not show full names, emails, phone numbers, or broad identity dumps. Return IDs only when explicitly needed for app generation or runtime testing, and keep scope narrow.

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

For detailed behavior and latest proven results, read `references/yeeflow-directory-api-connectivity.md`.

## Failure Handling

- Missing `.env.local`: explain where to create it and what variables are required.
- Missing `YEEFLOW_API_KEY`: ask the user to store the key locally; do not ask them to paste it.
- Authentication/authorization failure: report HTTP/API status and likely causes such as expired key, wrong tenant/account, insufficient permission, or wrong base; do not echo credentials.
- `404` on `YEEFLOW_BASE_URL`: try the known documented developer API base only for these read-only directory endpoints.
- Non-JSON or unexpected responses: report status and response shape only; do not dump body content.

## Coordination With App Work

When app planning or generation needs real users, departments, locations, or positions, use this skill only if credentials are locally available and API lookup is authorized. Do not invent org data when lookup is available and authorized. Do not require API access for normal package generation.

For approval workflow assignment task assignee generation, use read-only lookup only when real users, departments, locations, or positions are explicitly needed and authorized. Report only counts, status, and redacted shapes; never save or commit raw API responses.

For export-learning work, you may build memory-only or ignored-temp reference sets to classify redacted assignment task references as user, department, location, or position categories. Do not commit raw ID maps, names, emails, tenant IDs, or raw records. API category confirmation supports schema interpretation only; it does not prove workflow runtime routing.

The v1 API Operator does not include a user-group lookup endpoint. If an Assignment Task export contains a user-group assignee, classify it from the export shape only, redact the group reference, and document that a future safe read-only user-group lookup would be needed before API category confirmation.

Keep generated packages free of private user data unless the user explicitly requires it, the data is safe to include, and the scope is narrow. Prefer placeholders, empty groups, requester/current-user expressions, or post-import configuration when that is safer.
