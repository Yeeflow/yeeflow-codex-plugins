# Yeeflow Builder Plugin User Guide

## Who This Plugin Is For

Yeeflow Builder is for Yeeflow users, partners, and solution builders who use Codex to plan, generate, inspect, validate, and test Yeeflow application packages. It is useful when you need a structured Yeeflow app design, a generated `.yap` package, a `.yapk` upgrade-package inspection, or a focused validation/runtime-test plan.

## Prerequisites

- Codex with plugin marketplace installation support.
- Access to a Yeeflow tenant when runtime import or API-backed checks are needed.
- A Yeeflow API key only for workflows that explicitly need API access.
- A local working copy where `.env.local` is gitignored.

## Installation From The Official Yeeflow Repo

Use Codex's Add marketplace flow:

```text
Source:
https://github.com/Yeeflow/yeeflow-codex-plugins.git

Git ref:
yeeflow-builder-plugin-v0.6.1-rc1

Sparse paths:
.agents/plugins/marketplace.json
dist/yeeflow-builder-plugin
```

After installation, ask Codex to confirm the installed Yeeflow Builder Plugin version. The expected version is `0.6.1`.

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
- Wrong version: check the Git ref is `yeeflow-builder-plugin-v0.6.1-rc1`.
- API check fails: verify `.env.local`, `YEEFLOW_API_BASE_URL`, `YEEFLOW_API_KEY`, and any active `YEEFLOW_PROFILE`; do not paste secrets into chat.
- Import fails: run validators first and inspect blocking errors before retrying.
- Runtime behavior differs by tenant: replace tenant-specific users, groups, positions, or external connections with safe placeholders or explicit post-import configuration.
