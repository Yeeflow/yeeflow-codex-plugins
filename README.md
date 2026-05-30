# Yeeflow Codex Plugins

## Overview

This repository publishes official Yeeflow Codex plugin packages for builders who use Codex to plan, generate, validate, and test Yeeflow application work. The current final release is the Yeeflow Builder Plugin v0.6.3.

The repository is safe to share publicly: it is designed to contain plugin metadata, bundled skills, validators, sanitized documentation, and release artifacts. It must not contain tenant credentials, raw Yeeflow exports, decoded payloads, runtime screenshots, private tenant URLs, or generated runtime packages.

## What Is Included

- `.agents/plugins/marketplace.json` for Codex marketplace installation.
- `dist/yeeflow-builder-plugin` with the bundled Yeeflow Builder Plugin.
- `dist/yeeflow-builder-plugin-0.6.3.zip` as the current release archive.
- Public installation and usage documentation in `docs/`.
- Sanitized validators, generation helpers, and proof-boundary notes.

## Yeeflow Builder Plugin

Yeeflow Builder helps Codex work with Yeeflow application packages and reusable Yeeflow building patterns. Version 0.6.3 includes:

- Reference app UI section template corpus and template-conformance guidance.
- Vendor Onboarding v4.1 application-generation hard checks.
- Yeeflow system schema specification and data-list schema validation.
- Dashboard hardening for `Main > Content`, Grid display-label off, meaningful Navigator labels, action-button bindings, dynamic-control context, and KPI Summary-to-temp-variable cards.
- Data-list hardening for native `Title`, field naming/index/storage validation, choice options, lookup display fields, default display fields, and sample-data dependency ordering.
- Proven YAP/YAPK import-generation fixes from Vendor Onboarding runtime proof.
- YAPK-first application delivery defaults for new app creation, with YAP explicit-only.
- Current dashboard generation fixes and Data table `Field` / `FieldName` binding validation.
- API-issued ID handling, large ID preservation, unique ID validation, `Field.Category` integer checks, and `PortalInfo: null` for no-portal YAPK packages.
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
yeeflow-builder-plugin-v0.6.3

Sparse paths:
.agents/plugins/marketplace.json
dist/yeeflow-builder-plugin
```

Expected marketplace: `Yeeflow Internal`
Expected plugin: `Yeeflow Builder`
Expected version: `0.6.3`
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
YEEFLOW_WORKSPACE_ID=<your workspace id>
```

Prompt to ask Codex to create the local file:

```text
Create a local .env.local file in this project. Do not commit it.

Add these placeholder variables:

YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1
YEEFLOW_API_KEY=<my Yeeflow API key>
YEEFLOW_TENANT_URL=https://<mycompany>.yeeflow.com
YEEFLOW_TENANT_ID=<optional tenant id if required>
YEEFLOW_WORKSPACE_ID=<your workspace id>

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

### Package Automation API Configuration

Package import/install/upgrade automation also requires `YEEFLOW_WORKSPACE_ID` in local `.env.local`:

```env
YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1
YEEFLOW_API_KEY=<your api key>
YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
YEEFLOW_TENANT_ID=<your tenant id if needed>
YEEFLOW_WORKSPACE_ID=<your workspace id>
```

The workspace ID is required only for package import/install/upgrade APIs. Store it locally, never commit `.env.local`, and keep helper output redacted.

## Application Delivery Defaults

For new Yeeflow application creation, generate a YAPK package by default. Generate a YAP file only when the user explicitly asks for YAP or when a fallback/debug task specifically requires it. Validate the YAPK locally before upload or install.

If `.env.local` contains both `YEEFLOW_API_KEY` and `YEEFLOW_WORKSPACE_ID`, ask whether the user wants to automatically install the generated app into that workspace. Do not auto-install without confirmation.

For changes to an existing app, generate a new versioned YAPK package. Use the upgrade package API only when the target application/package is clearly identified, safe, and explicitly confirmed. If install returns a known duplicate/already-installed response, report that the package appears to already be installed and suggest upgrade flow, manual test cleanup, or a renamed/new-version package.

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

## How To Get Better Application Generation Results

For higher-quality generated applications, tell Codex the business process, target users/roles, required data lists and fields if known, desired pages, required forms, dashboards, workflows, important actions, desired UI style, web-app patterns you like, whether dashboards should be table-based, card-based, Kanban-based, timeline-based, or mixed, and whether custom CSS/custom code is allowed. Ask Codex to create an app plan first, confirm assumptions or ask clarifying questions, generate the full planned application instead of a simple version, and validate data tables, field bindings, layout padding, UI/UX control mapping, and plan-to-package coverage before returning the package.

Sample prompt:

```text
Generate a complete Yeeflow application for [business process]. Think like a web application product designer first. Create a detailed app plan with a UI/UX and Control Mapping section before building. Choose the best combination of Yeeflow controls for each page, such as Data table, Collection, Kanban, Timeline, Tabs, Toggle, Steps bar, Progress controls, Sub List Dynamic content, QR Code, Barcode, Embed, Document embed, custom CSS, or Custom code if needed. Do not build a simple MVP unless I ask for one. Implement the full planned application in one package where feasible, and validate that every data-bound control has fields, every page has good padding/layout, and the generated package matches the plan.
```

Generated dashboards and Data List custom forms should use safe left/right padding, section/card/container grouping, and fully configured data-bound controls. Prefer fewer well-configured controls over many incomplete controls.

## Using UI Mockups Or Screenshots As Design References

You can ask Codex to design app UI images first, or provide your own mockups/screenshots, before asking it to generate a Yeeflow package. For best results, ask Codex to convert the visuals into a Yeeflow UI implementation spec first. The spec should map every visible page section to Yeeflow controls, data bindings, actions, style settings, custom CSS, or Custom code if needed.

Sample prompt:

```text
I have UI mockup images for a Yeeflow application. Use them as design references. First extract a Yeeflow UI implementation spec in Markdown. For every visible page section, map the UI to Yeeflow controls, data bindings, actions, style settings, custom CSS, or Custom code if needed. Do not simplify the design. Then generate the full YAPK package from the spec and validate the package against the spec before returning it.
```

This workflow helps preserve design quality and reduces underbuilt/simple output. Pixel-perfect reproduction is not guaranteed, but generated packages should preserve the mockup's structure, major controls, padding, cards, tables, item templates, actions, and print layout intent.

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
yeeflow-builder-plugin-v0.6.3
```

Latest final release is `yeeflow-builder-plugin-v0.6.3`. Do not move published release tags.

## Support / Feedback

Use the official Yeeflow repository issues or your Yeeflow support channel to report installation problems, validation gaps, or documentation improvements. Include the plugin version, install source, Git ref, and a sanitized description of the workflow.
