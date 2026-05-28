# Quick Start

## Install The Plugin

Add the official Yeeflow Codex plugin marketplace:

```text
Source:
https://github.com/Yeeflow/yeeflow-codex-plugins.git

Git ref:
yeeflow-builder-plugin-v0.6.0

Sparse paths:
.agents/plugins/marketplace.json
dist/yeeflow-builder-plugin
```

## Configure `.env.local`

Create `.env.local` only in your local workspace:

```env
YEEFLOW_BASE_URL=https://<yourdomain>.yeeflow.com
YEEFLOW_API_KEY=<your Yeeflow API key>
```

Use the tenant root URL. Current helper scripts append `/v1` when a v1 API endpoint is required. Keep `.env.local` out of Git.

## Verify Plugin Version

Ask Codex:

```text
What Yeeflow Builder Plugin version is installed?
```

Expected version:

```text
0.6.0
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
- Confirm the Git ref is `yeeflow-builder-plugin-v0.6.0`.
- Confirm sparse paths include both marketplace and plugin folder paths.
- Confirm `.env.local` is present only locally and is gitignored.
- Confirm `YEEFLOW_BASE_URL` is a tenant root such as `https://<yourdomain>.yeeflow.com`.
- Confirm API-backed checks never print API keys or raw API responses.
- Run validators before import.
- Treat runtime proof as scoped to the exact actions tested.
