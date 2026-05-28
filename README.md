# Yeeflow Codex Plugins

## Overview

This repository publishes official Yeeflow Codex plugin packages for builders who use Codex to plan, generate, validate, and test Yeeflow application work. The current final release is the Yeeflow Builder Plugin v0.6.1.

The repository is safe to share publicly: it is designed to contain plugin metadata, bundled skills, validators, sanitized documentation, and release artifacts. It must not contain tenant credentials, raw Yeeflow exports, decoded payloads, runtime screenshots, private tenant URLs, or generated runtime packages.

## What Is Included

- `.agents/plugins/marketplace.json` for Codex marketplace installation.
- `dist/yeeflow-builder-plugin` with the bundled Yeeflow Builder Plugin.
- `dist/yeeflow-builder-plugin-0.6.1.zip` as the current release archive.
- Public installation and usage documentation in `docs/`.
- Sanitized validators, generation helpers, and proof-boundary notes.

## Yeeflow Builder Plugin

Yeeflow Builder helps Codex work with Yeeflow application packages and reusable Yeeflow building patterns. Version 0.6.1 includes:

- Tenant-neutral public sharing hardening and `.env.local` profile guidance.
- Advanced Controls support.
- Collection/Kanban actions support.
- YAPK-from-scratch hardening.
- Kanban, Collection, and Timeline support.
- Dynamic Sub List and Print Page support.
- LayoutView hardening.
- YAPK support.

The plugin preserves proof boundaries. Local validation is not import proof, import proof is not runtime proof, and runtime proof applies only to the tested scope.

## Installation

Use Codex's plugin marketplace installation flow with:

```text
Source:
https://github.com/Yeeflow/yeeflow-codex-plugins.git

Git ref:
yeeflow-builder-plugin-v0.6.1

Sparse paths:
.agents/plugins/marketplace.json
dist/yeeflow-builder-plugin
```

Expected marketplace: `Yeeflow Internal`
Expected plugin: `Yeeflow Builder`
Expected version: `0.6.1`
Expected bundled skills: `21`

## macOS Git Prerequisite

Codex installs the marketplace by running `git clone`. On macOS, Git may require Apple Command Line Tools. If installation fails with an `xcode-select` message saying no developer tools were found, install Command Line Tools first:

```sh
xcode-select --install
git --version
```

If tools are already installed but Git still fails, try:

```sh
sudo xcode-select --reset
git --version
```

If full Xcode is installed and reset does not work, switch developer tools to Xcode:

```sh
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
git --version
```

After `git --version` works, retry adding the plugin marketplace in Codex. This error happens before the Yeeflow plugin is downloaded, so it is not caused by the plugin package.

## Recommended Install Source

Use the official Yeeflow repository for shared or user-facing installs:

```text
https://github.com/Yeeflow/yeeflow-codex-plugins.git
```

Development and experimental work should happen outside the official release branch until reviewed and promoted.

## Tenant Configuration

Each Yeeflow tenant has a unique URL:

```text
https://<yourdomain>.yeeflow.com
```

Do not use an internal test tenant URL as a default. API calls use the shared Yeeflow API endpoint, while tenant/app links use the tenant URL.

For a full setup guide, see [Environment Configuration](docs/environment-configuration.md).

## Environment Variables

For local API-backed checks, create a gitignored `.env.local` file in your working copy. For a single tenant:

```env
YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1
YEEFLOW_API_KEY=<your Yeeflow API key>
YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
YEEFLOW_TENANT_ID=<optional tenant id if required>
```

Prompt to ask Codex to create the local file:

```text
Create a local .env.local file in this project. Do not commit it.

Add these placeholder variables:

YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1
YEEFLOW_API_KEY=<my Yeeflow API key>
YEEFLOW_TENANT_URL=https://<mycompany>.yeeflow.com
YEEFLOW_TENANT_ID=<optional tenant id if required>

Then verify .env.local is ignored by Git.
```

For users managing multiple Yeeflow tenants, keep one shared API base and select one active profile per script run:

```env
YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1

# Select the active tenant for this run. This is a local script/plugin selector,
# not a Yeeflow server-side setting.
YEEFLOW_PROFILE=dev

YEEFLOW_DEV_API_KEY=<dev API key>
YEEFLOW_DEV_TENANT_URL=https://devcompany.yeeflow.com
YEEFLOW_DEV_TENANT_ID=<optional>

YEEFLOW_PROD_API_KEY=<prod API key>
YEEFLOW_PROD_TENANT_URL=https://company.yeeflow.com
YEEFLOW_PROD_TENANT_ID=<optional>

YEEFLOW_CLIENT_A_API_KEY=<client A API key>
YEEFLOW_CLIENT_A_TENANT_URL=https://client-a.yeeflow.com
YEEFLOW_CLIENT_A_TENANT_ID=<optional>
```

`YEEFLOW_PROFILE` selects only one active profile for the current run. If `YEEFLOW_PROFILE=prod`, scripts read `YEEFLOW_PROD_API_KEY`, `YEEFLOW_PROD_TENANT_URL`, and `YEEFLOW_PROD_TENANT_ID`; other profiles remain inactive. Profile names may contain letters, numbers, and underscores. Users can define any number of unique profiles.

Use `YEEFLOW_API_BASE_URL` for API calls. The recommended value is `https://api.yeeflow.com/v1`; helper scripts normalize trailing slashes and avoid double `/v1`. Use `YEEFLOW_TENANT_URL` for app links such as `https://<yourdomain>.yeeflow.com`. `YEEFLOW_BASE_URL` is a legacy API base URL alias only and must not mean tenant URL going forward. Scripts must not print API keys or raw API responses.

## Basic Usage Examples

Ask Codex:

```text
Use Yeeflow Builder to plan a small approval application for purchase requests.
```

```text
Generate a Yeeflow application package and validate it before import.
```

```text
Validate this YAP package and report import blockers without overclaiming runtime proof.
```

## Common Workflows

- Plan a Yeeflow application from requirements.
- Generate a `.yap` new-application package.
- Inspect or validate a `.yapk` existing-application upgrade package.
- Validate generated packages before import.
- Prepare focused runtime-test plans.
- Learn Yeeflow behavior from sanitized exports and documented runtime evidence.

## Safety And Proof Boundaries

- Do not commit `.env.local`, API keys, tokens, private URLs, tenant IDs, raw `.yap` or `.yapk` exports, decoded payloads, raw `Resource`, raw `Sign`, API responses, screenshots, or generated runtime packages.
- Prefer placeholders such as `https://<yourdomain>.yeeflow.com` in docs.
- Keep generated package examples tenant-neutral unless the user explicitly requires target-tenant-specific values.
- Record proof honestly: validator-backed, import-proven, render-only, partial runtime proof, or runtime-proven for a specific tested scope.

## Versioning And Releases

The current final release is:

```text
yeeflow-builder-plugin-v0.6.1
```

Latest final release: `yeeflow-builder-plugin-v0.6.1`. Do not move published release tags.

## Support / Feedback

Use the official Yeeflow repository issues or your Yeeflow support channel to report installation problems, validation gaps, or documentation improvements. Include the plugin version, install source, Git ref, and a sanitized description of the workflow.
