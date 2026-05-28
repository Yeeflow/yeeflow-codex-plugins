# Yeeflow Codex Plugins

## Overview

This repository publishes official Yeeflow Codex plugin packages for builders who use Codex to plan, generate, validate, and test Yeeflow application work. The current public package is the Yeeflow Builder Plugin v0.6.0.

The repository is safe to share publicly: it is designed to contain plugin metadata, bundled skills, validators, sanitized documentation, and release artifacts. It must not contain tenant credentials, raw Yeeflow exports, decoded payloads, runtime screenshots, private tenant URLs, or generated runtime packages.

## What Is Included

- `.agents/plugins/marketplace.json` for Codex marketplace installation.
- `dist/yeeflow-builder-plugin` with the bundled Yeeflow Builder Plugin.
- `dist/yeeflow-builder-plugin-0.6.0.zip` as the current release archive.
- Public installation and usage documentation in `docs/`.
- Sanitized validators, generation helpers, and proof-boundary notes.

## Yeeflow Builder Plugin

Yeeflow Builder helps Codex work with Yeeflow application packages and reusable Yeeflow building patterns. Version 0.6.0 includes:

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
yeeflow-builder-plugin-v0.6.0

Sparse paths:
.agents/plugins/marketplace.json
dist/yeeflow-builder-plugin
```

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

Do not use an internal test tenant URL as a default. When a prompt, script, or runtime test needs tenant access, configure the tenant root through `YEEFLOW_BASE_URL`.

## Environment Variables

For local API-backed checks, create a gitignored `.env.local` file in your working copy:

```env
YEEFLOW_BASE_URL=https://<yourdomain>.yeeflow.com
YEEFLOW_API_KEY=<your Yeeflow API key>
```

Use the tenant root for `YEEFLOW_BASE_URL`. Current helper scripts try the configured value first and append `/v1` when a v1 API endpoint is required. Some read-only directory probes may also try the documented developer API base as a fallback. Scripts must not print API keys or raw API responses.

If a future script explicitly requires `YEEFLOW_TENANT_ID`, document the source and scope before use. Do not commit tenant IDs.

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

The current official release is:

```text
yeeflow-builder-plugin-v0.6.0
```

Do not move published release tags. Documentation and hardening patches on `main` may prepare the next patch release, but a new tag should be created only after review and install smoke testing.

## Support / Feedback

Use the official Yeeflow repository issues or your Yeeflow support channel to report installation problems, validation gaps, or documentation improvements. Include the plugin version, install source, Git ref, and a sanitized description of the workflow.
