# Yeeflow Environment Configuration

This guide explains how to configure local Yeeflow settings for the Yeeflow Builder Plugin and helper scripts.

## What `.env.local` Is

`.env.local` is a local-only environment file in your working copy. It lets scripts read your Yeeflow API key, shared API endpoint, and tenant URL without putting secrets in prompts, docs, generated packages, or Git history.

Never commit `.env.local`. Keep it on your machine only.

## Why It Is Needed

Most Yeeflow Builder workflows can plan, generate, and validate packages without live API access. Some workflows need local credentials, such as read-only API smoke checks, tenant reference lookup, YAPK signing helpers, or focused runtime-proof preparation.

When live access is needed, use `.env.local` instead of pasting credentials into chat.

## Single-Tenant Setup

Create `.env.local` in the repository or project root:

```env
YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1
YEEFLOW_API_KEY=<your Yeeflow API key>
YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
YEEFLOW_TENANT_ID=<optional tenant id if required>
YEEFLOW_WORKSPACE_ID=<your workspace id>
```

`YEEFLOW_API_BASE_URL` is the shared Yeeflow API endpoint. `YEEFLOW_TENANT_URL` is your tenant app URL. Do not use your tenant URL as the API base URL.

`YEEFLOW_WORKSPACE_ID` is required only for package import/install/upgrade automation. Keep it in `.env.local`; do not commit workspace IDs.

## Multi-Tenant Profile Setup

Users who manage multiple tenants can keep several profiles in the same local `.env.local` file:

```env
YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1

# Select the active tenant for this run.
# Only one profile is active at a time.
YEEFLOW_PROFILE=dev

YEEFLOW_DEV_API_KEY=<dev API key>
YEEFLOW_DEV_TENANT_URL=https://devcompany.yeeflow.com
YEEFLOW_DEV_TENANT_ID=<optional>
YEEFLOW_DEV_WORKSPACE_ID=<dev workspace id>

YEEFLOW_PROD_API_KEY=<prod API key>
YEEFLOW_PROD_TENANT_URL=https://company.yeeflow.com
YEEFLOW_PROD_TENANT_ID=<optional>
YEEFLOW_PROD_WORKSPACE_ID=<prod workspace id>

YEEFLOW_CLIENT_A_API_KEY=<client A API key>
YEEFLOW_CLIENT_A_TENANT_URL=https://client-a.yeeflow.com
YEEFLOW_CLIENT_A_TENANT_ID=<optional>
YEEFLOW_CLIENT_A_WORKSPACE_ID=<client A workspace id>
```

`YEEFLOW_PROFILE` is an optional plugin/script selector, not a Yeeflow server-side setting. It selects one active tenant profile for the current script run.

If `YEEFLOW_PROFILE=prod`, scripts read:

- `YEEFLOW_PROD_API_KEY`
- `YEEFLOW_PROD_TENANT_URL`
- `YEEFLOW_PROD_TENANT_ID`

All other profiles remain available but inactive for that run. You can define any number of profiles as long as each profile name is unique. Profile names are normalized to uppercase and should use only letters, numbers, and underscores.

## Switching Tenants

Change `YEEFLOW_PROFILE` before running the script:

```env
YEEFLOW_PROFILE=dev
```

```env
YEEFLOW_PROFILE=prod
```

```env
YEEFLOW_PROFILE=client_a
```

Only the selected profile is active for that run.

## Variable Reference

- `YEEFLOW_API_BASE_URL`: the shared API endpoint for Yeeflow API calls. Prefer `https://api.yeeflow.com/v1`. Scripts normalize trailing slashes and avoid double `/v1`.
- `YEEFLOW_API_KEY`: the default API key used when `YEEFLOW_PROFILE` is not set.
- `YEEFLOW_TENANT_URL`: the tenant app URL used for links and tenant-specific browser/runtime references, such as `https://<yourdomain>.yeeflow.com`. Do not use it as the API base URL.
- `YEEFLOW_TENANT_ID`: optional tenant ID for scripts that explicitly require it. Do not commit real tenant IDs.
- `YEEFLOW_WORKSPACE_ID`: optional for read-only API lookup, required for package import/install/upgrade automation. Do not commit real workspace IDs.
- `YEEFLOW_PROFILE`: optional local selector for multi-tenant profiles. It is not sent to Yeeflow as a server-side setting.
- `YEEFLOW_<PROFILE>_API_KEY`: the API key for the selected profile.
- `YEEFLOW_<PROFILE>_TENANT_URL`: the tenant app URL for the selected profile.
- `YEEFLOW_<PROFILE>_TENANT_ID`: optional tenant ID for the selected profile.
- `YEEFLOW_<PROFILE>_WORKSPACE_ID`: workspace ID for package import/install/upgrade automation when the selected profile is active.

## Package Automation API Configuration

Package import/install/upgrade automation requires:

```env
YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1
YEEFLOW_API_KEY=<your api key>
YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
YEEFLOW_TENANT_ID=<your tenant id if needed>
YEEFLOW_WORKSPACE_ID=<your workspace id>
```

The workspace ID is used in the `WorkspaceID` request field for package import, install, and upgrade APIs. Helper scripts report only whether it is present or missing; they must not print the actual value.

## Legacy `YEEFLOW_BASE_URL`

Older scripts may still read `YEEFLOW_BASE_URL`. Treat it only as a legacy API base URL alias. Do not use `YEEFLOW_BASE_URL` to mean tenant URL going forward. Prefer `YEEFLOW_API_BASE_URL` for API calls and `YEEFLOW_TENANT_URL` for tenant/app links.

## Troubleshooting

Missing API key: confirm `.env.local` contains `YEEFLOW_API_KEY`, or the active profile key such as `YEEFLOW_PROD_API_KEY`.

Missing workspace ID for package automation: confirm `.env.local` contains `YEEFLOW_WORKSPACE_ID`, or the active profile value such as `YEEFLOW_PROD_WORKSPACE_ID`.

Wrong tenant URL: confirm `YEEFLOW_TENANT_URL` or `YEEFLOW_<PROFILE>_TENANT_URL` is a tenant root such as `https://<yourdomain>.yeeflow.com`.

Using tenant URL as API base: set `YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1`. Do not set it to `https://<yourdomain>.yeeflow.com`.

Double `/v1`: use `https://api.yeeflow.com/v1` without a trailing slash. Scripts should normalize trailing slashes and avoid adding `/v1` twice.

Profile name mismatch: if `YEEFLOW_PROFILE=client_a`, define `YEEFLOW_CLIENT_A_API_KEY`, `YEEFLOW_CLIENT_A_TENANT_URL`, and optionally `YEEFLOW_CLIENT_A_TENANT_ID`.

## Security Reminders

- Do not commit `.env.local`.
- Do not share API keys in chat, docs, screenshots, packages, or logs.
- Do not commit tenant IDs, workspace IDs, private tenant URLs, raw API responses, raw `Resource`, raw `Sign`, decoded payloads, screenshots, or generated runtime packages.
- Use placeholders in public docs and examples.
- Do not hardcode tenant URLs into generated apps unless the user explicitly requires a tenant-specific package.
