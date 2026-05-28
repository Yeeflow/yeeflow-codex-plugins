# Quick Start

## Install The Plugin

Add the official Yeeflow Codex plugin marketplace:

```text
Source:
https://github.com/Yeeflow/yeeflow-codex-plugins.git

Git ref:
yeeflow-builder-plugin-v0.6.1-rc1

Sparse paths:
.agents/plugins/marketplace.json
dist/yeeflow-builder-plugin
```

## Configure `.env.local`

Create `.env.local` only in your local workspace:

```env
YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1
YEEFLOW_API_KEY=<your Yeeflow API key>
YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
YEEFLOW_TENANT_ID=<optional tenant id if required>
```

Use `YEEFLOW_API_BASE_URL` for API calls. The standard value is `https://api.yeeflow.com/v1`. Use `YEEFLOW_TENANT_URL` for browser/app links to your tenant root, such as `https://<yourdomain>.yeeflow.com`. Keep `.env.local` out of Git.

For the complete setup, profile, and troubleshooting guide, see [Environment Configuration](environment-configuration.md).

Optional multi-tenant profile mode:

```env
YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1
YEEFLOW_PROFILE=dev

YEEFLOW_DEV_API_KEY=<dev API key>
YEEFLOW_DEV_TENANT_URL=https://devcompany.yeeflow.com
YEEFLOW_DEV_TENANT_ID=<optional>

YEEFLOW_PROD_API_KEY=<prod API key>
YEEFLOW_PROD_TENANT_URL=https://company.yeeflow.com
YEEFLOW_PROD_TENANT_ID=<optional>
```

`YEEFLOW_PROFILE` is a local selector for plugin/scripts, not a Yeeflow server-side setting. Only one profile is active per run. Switch tenants by changing `YEEFLOW_PROFILE=dev`, `YEEFLOW_PROFILE=prod`, or another unique profile name such as `YEEFLOW_PROFILE=client_a`. Scripts read the matching `YEEFLOW_<PROFILE>_API_KEY`, `YEEFLOW_<PROFILE>_TENANT_URL`, and optional `YEEFLOW_<PROFILE>_TENANT_ID`.

## Verify Plugin Version

Ask Codex:

```text
What Yeeflow Builder Plugin version is installed?
```

Expected version:

```text
0.6.1
```

## Run A Basic Prompt

```text
Use Yeeflow Builder to plan a small issue intake application with one data list, one dashboard, and a validation plan.
```

Review the plan before asking Codex to generate a package.

## Generate And Validate A Small Application Package

```text
Generate the small issue intake Yeeflow application package and validate it before import. Keep all tenant-specific values out of the generated package.
```

Expected validation should include package checks, graph checks, wrapper checks, and a proof-boundary summary.

## Import Into Yeeflow

Import the validated package into your own Yeeflow tenant:

```text
https://<yourdomain>.yeeflow.com
```

Record whether import, open, rendering, save, submit, workflow, or other runtime actions were actually tested. Do not claim untested behavior.

## Troubleshooting Checklist

- Confirm the install source is the official Yeeflow repo.
- Confirm the Git ref is `yeeflow-builder-plugin-v0.6.1-rc1`.
- Confirm sparse paths include both marketplace and plugin folder paths.
- Confirm `.env.local` is present only locally and is gitignored.
- Confirm `YEEFLOW_API_BASE_URL` is `https://api.yeeflow.com/v1`.
- Confirm `YEEFLOW_TENANT_URL` is a tenant root such as `https://<yourdomain>.yeeflow.com`.
- Treat `YEEFLOW_BASE_URL` only as a legacy API base URL alias when an older script still reads it.
- Confirm API-backed checks never print API keys or raw API responses.
- Run validators before import.
- Treat runtime proof as scoped to the exact actions tested.
