# Yeeflow Builder Plugin User Guide

## Who This Plugin Is For

Yeeflow Builder is for Yeeflow users, partners, and solution builders who use Codex to plan, generate, inspect, validate, and test Yeeflow application packages. It is useful when you need a structured Yeeflow app design, a generated `.yap` package, a `.yapk` upgrade-package inspection, or a focused validation/runtime-test plan.

## Prerequisites

- Codex with plugin marketplace installation support.
- Git available locally. On macOS, this may require Apple Command Line Tools.
- Access to a Yeeflow tenant when runtime import or API-backed checks are needed.
- A Yeeflow API key only for workflows that explicitly need API access.
- A local working copy where `.env.local` is gitignored.

## Installation From The Official Yeeflow Repo

Use Codex's Add marketplace flow:

```text
Source:
https://github.com/Yeeflow/yeeflow-codex-plugins.git

Git ref:
yeeflow-builder-plugin-v0.6.2

Sparse paths:
.agents/plugins/marketplace.json
dist/yeeflow-builder-plugin
```

After installation, ask Codex to confirm the installed Yeeflow Builder Plugin version. The expected version is `0.6.2`.

## macOS Git Prerequisite

Codex adds the marketplace by running `git clone`. On macOS, Git may require Apple Command Line Tools. If the marketplace add fails with an `xcode-select` error saying no developer tools were found, fix Git first:

```sh
xcode-select --install
git --version
```

If tools are already installed but Git still fails:

```sh
sudo xcode-select --reset
git --version
```

If full Xcode is installed and reset does not work:

```sh
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
git --version
```

After `git --version` works, retry adding the plugin marketplace in Codex. This error happens before the plugin repository is cloned, so it is not caused by the Yeeflow plugin package.

Prompt to ask Codex on macOS:

```text
I’m using Codex on macOS and adding a plugin marketplace failed with an xcode-select error saying no developer tools were found. Please help me fix the local Git prerequisite.

Please check whether git is available by running:
git --version

If Git is missing because Apple Command Line Tools are not installed, run:
xcode-select --install

Then tell me to accept the macOS installation dialog and wait for it to finish.

After installation, verify again:
git --version

If Git still fails but Command Line Tools or Xcode are installed, try:
sudo xcode-select --reset
git --version

If full Xcode is installed and reset does not work, help me switch developer tools to:
/Applications/Xcode.app/Contents/Developer

Do not change my Yeeflow plugin files. Only help fix the local macOS Git / Command Line Tools prerequisite so Codex can run git clone.
```

## Configuring Tenant URL And API Key

Each Yeeflow tenant has a unique URL:

```text
https://<yourdomain>.yeeflow.com
```

For local API-backed workflows, create `.env.local` in the project root:

```env
YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1
YEEFLOW_API_KEY=<your Yeeflow API key>
YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
YEEFLOW_TENANT_ID=<optional tenant id if required>
```

`YEEFLOW_API_BASE_URL` is for API calls and should normally be `https://api.yeeflow.com/v1`. `YEEFLOW_TENANT_URL` is for tenant/app links and should be the tenant root, such as `https://<yourdomain>.yeeflow.com`. Do not use a tenant URL as the API base URL. `YEEFLOW_BASE_URL` is supported only as a legacy API base URL alias for older scripts; do not use it to mean tenant URL going forward. Do not paste API keys into chat, documentation, commits, or generated packages.

For full `.env.local` setup and troubleshooting, see [Environment Configuration](environment-configuration.md).

For multiple tenants, define profiles and select one active tenant per run:

```env
YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1

# Local selector only; not a Yeeflow server-side setting.
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

If `YEEFLOW_PROFILE=prod`, scripts read only `YEEFLOW_PROD_API_KEY`, `YEEFLOW_PROD_TENANT_URL`, and `YEEFLOW_PROD_TENANT_ID` for that run. Other profiles remain available but inactive. Users can define any number of unique profiles using letters, numbers, and underscores.

## Generating Applications

Start with a clear requirement and ask for a plan before package generation when workflow, approval, permission, or tenant-specific routing choices matter.

Example prompt:

```text
Use Yeeflow Builder to generate a Yeeflow application plan for an employee equipment request process. Include lists, forms, dashboards, workflows, validation steps, and proof boundaries.
```

When the plan is accepted:

```text
Generate the Yeeflow application package and validate it before import.
```

## Getting Better Application Generation Results

For stronger generated applications, include the business process, target users/roles, required data lists and fields if known, desired pages, required forms, dashboards, workflows, important actions, desired UI style, web-app patterns you like, whether dashboards should be table-based, card-based, Kanban-based, timeline-based, or mixed, and whether custom CSS/custom code is allowed. Ask Codex to create an app plan first, confirm assumptions or ask clarifying questions, generate the full planned application instead of a simple version, and validate data tables, field bindings, layout padding, UI/UX control mapping, and plan-to-package coverage before returning the package.

High-quality generation prompt:

```text
Generate a complete Yeeflow application for [business process]. Think like a web application product designer first. Create a detailed app plan with a UI/UX and Control Mapping section before building. Choose the best combination of Yeeflow controls for each page, such as Data table, Collection, Kanban, Timeline, Tabs, Toggle, Steps bar, Progress controls, Sub List Dynamic content, QR Code, Barcode, Embed, Document embed, custom CSS, or Custom code if needed. Do not build a simple MVP unless I ask for one. Implement the full planned application in one package where feasible, and validate that every data-bound control has fields, every page has good padding/layout, and the generated package matches the plan.
```

## Using UI Mockups Or Screenshots As Design References

Users can ask Codex to first design app UI images, or provide mockups/screenshots from another design process. Codex should then extract a Yeeflow UI implementation spec before package generation. The spec should map visible page sections to Yeeflow controls, data bindings, actions, style settings, custom CSS, or Custom code when standard controls are not enough.

Prompt:

```text
I have UI mockup images for a Yeeflow application. Use them as design references. First extract a Yeeflow UI implementation spec in Markdown. For every visible page section, map the UI to Yeeflow controls, data bindings, actions, style settings, custom CSS, or Custom code if needed. Do not simplify the design. Then generate the full YAPK package from the spec and validate the package against the spec before returning it.
```

This improves structural/design fidelity. It does not promise pixel-perfect reproduction, but the generated package should preserve the mockup's pages, major sections, controls, bindings, actions, spacing, and print/layout intent.

## Working With YAP And YAPK Packages

Use `.yap` for new application packages. Use `.yapk` for existing application upgrade packages and treat signing as a separate proof boundary.

Example prompt:

```text
Generate a YAPK package from scratch only after validating the inner AppPackageInfo content. Do not sign if placeholder IDs, workflow publish blockers, or unresolved references remain.
```

The plugin should never commit raw `.yap`, `.yapk`, `.ydl`, `.ywf`, or `.yaia` files unless a task explicitly promotes a reviewed, sanitized artifact.

## Validating Generated Packages

Example prompt:

```text
Validate this generated Yeeflow package before import. Report blockers, warnings, proof boundaries, and exact commands used.
```

Typical validation checks include package shape, graph references, workflow action configuration, data-list fields, custom forms, expressions, dashboard bindings, wrapper round trip, and materialization readiness.

## Runtime-Proof Style Tests

Runtime proof should be focused and scoped. A small proof package is preferred over a full business app when validating a new control, workflow behavior, or package shape.

Example prompt:

```text
Create a focused runtime-test plan for Advanced Controls in my Yeeflow tenant. Use my configured YEEFLOW_TENANT_URL for links and YEEFLOW_API_BASE_URL for API calls. Do not include tenant-specific IDs in committed files.
```

Runtime proof must state exactly what was tested, what passed, and what remains unproven.

## Avoiding Tenant-Specific Output

- Use `https://<yourdomain>.yeeflow.com` in documentation.
- Use `YEEFLOW_TENANT_URL` for tenant URLs and `YEEFLOW_API_BASE_URL` for API calls.
- Prefer requester/current-user expressions or post-import configuration for assignments.
- Do not hardcode user, group, department, location, position, app, list, package, tenant, or private URL values unless the user explicitly requires a target-tenant-specific package.
- Never commit raw API responses or decoded payloads.

## Known Proof Boundaries

- Validation is not import proof.
- Import success is not runtime behavior proof.
- Render-only proof does not prove save, submit, scan, upload, workflow execution, notification delivery, or assignment routing.
- YAPK `setsign` and `verifysign` prove wrapper/resource signing integrity, not generated app correctness.
- Broad YAPK generation remains constrained to the runtime-proven scopes documented in release notes.

## Troubleshooting

- Plugin does not appear: re-add the marketplace and verify sparse paths.
- Plugin marketplace add fails on macOS with `xcode-select`: install or reset Apple Command Line Tools, verify `git --version`, then retry the marketplace add.
- Wrong version: check the Git ref is `yeeflow-builder-plugin-v0.6.2`.
- API check fails: verify `.env.local`, `YEEFLOW_API_BASE_URL`, `YEEFLOW_API_KEY`, and any active `YEEFLOW_PROFILE`; do not paste secrets into chat.
- Import fails: run validators first and inspect blocking errors before retrying.
- Runtime behavior differs by tenant: replace tenant-specific users, groups, positions, or external connections with safe placeholders or explicit post-import configuration.
