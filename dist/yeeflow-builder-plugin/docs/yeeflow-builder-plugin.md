# Yeeflow Builder Plugin

The Yeeflow Builder Plugin is a skills-only Codex plugin for Yeeflow application builders. It packages proven Yeeflow skills so Codex can plan, generate, validate, test, and improve Yeeflow application work without adding OAuth or MCP servers. API-backed helper scripts require local environment variables and must not hardcode a tenant-specific URL.

Package status: v0.6.1 RC1 is prepared for tenant-neutral public sharing hardening and `.env.local` profile guidance. Latest final release tag: `yeeflow-builder-plugin-v0.6.0`. v0.6.1 final tagging must wait until marketplace install smoke testing passes. The official public Git install source is `https://github.com/Yeeflow/yeeflow-codex-plugins.git`.

## Package Contents

The plugin lives at `dist/yeeflow-builder-plugin/` and includes:

- `.codex-plugin/plugin.json` with private plugin metadata and a skills-only manifest.
- `skills/yeeflow-application-builder/`
- `skills/yeeflow-feature-learning-orchestrator/`
- `skills/yeeflow-application-generator/`
- `skills/yeeflow-approval-form-generator/`
- `skills/yeeflow-data-list-generator/`
- `skills/yeeflow-dashboard-generator/`
- `skills/yeeflow-expression-generator/`
- `skills/yeeflow-custom-code-generator/`
- `skills/yeeflow-runtime-test-orchestrator/`
- `skills/yeeflow-package-validator/`
- `skills/yeeflow-plugin-release-manager/`
- `skills/yeeflow-api-operator/`
- `skills/yeeflow-yapk-package-generator/`
- `scripts/` helper checks referenced by bundled skills.
- `yeeflow-expression-utils.js` support utility for expression smoke validation.

## Bundled Skills

`yeeflow-application-builder` is the top-level controller for real requirement-to-application work. Use it when the goal is to design and build a Yeeflow business application from requirements, forms, screenshots, SOPs, or app ideas.

`yeeflow-feature-learning-orchestrator` coordinates learning from real exports and runtime evidence. Use it when Yeeflow behavior is unknown, not yet proven, or needs an export-first learning pass before generation.

`yeeflow-application-generator` creates and validates small application-level `.yap` packages, including multi-list app shells, navigation, lookup relationships, approval forms, and app package wrappers.

`yeeflow-approval-form-generator` generates, inspects, validates, and improves approval form definitions, decoded `.ywf` JSON, `.ywf` wrappers, and approval-form resources inside `.yap` exports.

`yeeflow-data-list-generator` generates, inspects, validates, and improves `.ydl` data-list definitions, fields, views, custom list forms, lookup relationships, metadata, and sample data.

`yeeflow-dashboard-generator` generates, learns, validates, and improves Yeeflow dashboard pages and widgets, including data-bound KPI, chart, table, filter, and navigation patterns.

`yeeflow-expression-generator` generates and validates Yeeflow expression token arrays for calculated controls, dynamic display rules, validations, filters, workflow conditions, defaults, request numbers, and formulas.

`yeeflow-custom-code-generator` generates, updates, debugs, documents, and redesigns Yeeflow custom code controls for runtime-proven contexts such as forms, tables, dashboards, editors, and data-driven components.

`yeeflow-runtime-test-orchestrator` standardizes Yeeflow runtime test planning, execution evidence, and result classification for generated or modified application packages.

`yeeflow-package-validator` standardizes package validation before import or runtime testing, including materialization rules, field/list integrity, workflow checks, and `.yap` versus `.yapk` safety policy.

`yeeflow-yapk-package-generator` inspects and validates `.yapk` existing-application upgrade packages with the product YAPK schema, redacted Resource decode attempts, signing-boundary guidance, and future edit/encode/sign/runtime proof workflow. Its current proof remains focused on minimal text-only data-list generation; broad YAPK mutation and non-list resources are not proven.

`yeeflow-plugin-release-manager` standardizes Yeeflow Builder Plugin rebuilds, version decisions, release candidates, install smoke testing, and final tag creation.

`yeeflow-api-operator` provides safe read-only Yeeflow REST API connectivity checks and organization/reference-data lookup when local credentials are available. Its v1 scope is users, departments, locations, and positions; it must not run write APIs or expose secrets/private records.

## Builder vs. Learning Orchestrator

Use `yeeflow-application-builder` when the user wants a real business app built from requirements. It must act like a Yeeflow business solution architect: clarify the business process, decide the safest native Yeeflow structure, keep v1 scope conservative, and coordinate generator skills only after the application plan passes business gates.

Use `yeeflow-feature-learning-orchestrator` when the task is to learn unknown Yeeflow behavior from real exports, screenshots, runtime tests, manual fixes, or exported-back comparisons. Feature learning and app building are separate workflows. Unknown platform behavior should be proven through the learning workflow before it is treated as a builder capability.

## Starting a New App Build

Start with `yeeflow-application-builder`. Provide the requirement document, screenshots, SOPs, form samples, workflow expectations, data model notes, and any known Yeeflow constraints.

The builder should:

1. Run business clarification gates before generation.
2. Identify lists, approval forms, dashboards, expressions, workflows, and custom-code needs.
3. Prefer native Yeeflow controls before custom code.
4. Generate a new application package as `.yap`.
5. Validate child lists, approval forms, expressions, dashboards, wrappers, and app graph relationships.
6. Record runtime test planning and runtime results before accepting a baseline.

New app creation outputs `.yap`.

## Tenant Configuration

Each Yeeflow tenant has a unique URL:

```text
https://<yourdomain>.yeeflow.com
```

Use this tenant root for app/browser links, and use the shared Yeeflow API endpoint for API calls:

```env
YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1
YEEFLOW_API_KEY=<your Yeeflow API key>
YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
YEEFLOW_TENANT_ID=<optional tenant id if required>
```

`YEEFLOW_API_BASE_URL` should normally be `https://api.yeeflow.com/v1`; scripts normalize trailing slashes and avoid double `/v1`. `YEEFLOW_TENANT_URL` should be the tenant root, such as `https://<yourdomain>.yeeflow.com`, and must not be used as the API base. `YEEFLOW_BASE_URL` is a legacy API base URL alias only. Keep `.env.local`, API keys, tenant IDs, private URLs, raw API responses, raw `Resource`, raw `Sign`, decoded payloads, and generated runtime packages out of Git.

For a complete `.env.local` setup guide, see [Environment Configuration](environment-configuration.md).

For multiple tenants, use profile variables:

```env
YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1
YEEFLOW_PROFILE=client_a

YEEFLOW_CLIENT_A_API_KEY=<client A API key>
YEEFLOW_CLIENT_A_TENANT_URL=https://client-a.yeeflow.com
YEEFLOW_CLIENT_A_TENANT_ID=<optional>
```

`YEEFLOW_PROFILE` selects one active local profile per script run and is not a Yeeflow server-side setting.

## Starting a Learning Pass

Start with `yeeflow-feature-learning-orchestrator` when the behavior is not already proven. Provide the real `.yap`, `.ywf`, `.ydl`, screenshots, manual runtime steps, failure messages, or exported-back comparison files.

The learning workflow should:

1. Study real exports before generation.
2. Document the observed structure and unknowns.
3. Build focused minimal proof packages only when needed.
4. Run or plan runtime import tests.
5. Compare exported-back results when available.
6. Promote only proven patterns into references, validators, or generator rules.
7. Document accepted baselines and limitations.

Runtime pass evidence must be documented before accepting a baseline.

## Custom Code Generation

Use `yeeflow-custom-code-generator` for runtime-proven custom-code contexts. It can produce full code files, modify existing code, debug broken code, create user guides from code, or plan placement of existing scripts inside a Yeeflow application.

Custom code support must only be claimed for contexts that are runtime-proven. Public form custom code support is not claimed unless tested. When a standard Yeeflow control, expression, workflow action, form action, dashboard widget, or lookup configuration can meet the need cleanly, prefer the native option.

## `.yap` vs `.yapk`

New app creation outputs `.yap`.

Existing app upgrade `.yapk` is schema-backed as `AppExportPackageInfo`, but content mutation remains unsupported until Resource decode/edit/Brotli encode/sign/verify/runtime-upgrade is proven. Do not claim externally edited `.yapk` packages are valid upgrades. Do not mutate generated `.yap` or `.yapk` files as part of plugin packaging.

For existing app work, use `.yapk` exports for inspection, validation, and change planning only unless a proven Yeeflow-safe upgrade mechanism exists.

## Validation and Runtime Expectations

Validation should include structural checks, app graph checks, child list validation, approval form validation, expression validation, dashboard reference checks, package wrapper round trips where available, and JSON/JavaScript syntax checks for skill references and scripts.

Dashboard KPIs, charts, and tables must be data-bound, not static mockups. Runtime tests should confirm import behavior, navigation behavior, data binding, form behavior, workflow behavior, dashboard rendering, and exported-back differences where applicable.

Local validation is not the same as Yeeflow runtime proof. Accepted baselines must record what was structurally validated, what was runtime tested, what remains unproven, and what fallback was used.

## v0.5.23 Scope

v0.5.23 includes the Data List LayoutView Add form hardening. The broken generated package had no Type `1` New/Edit/View layouts, omitted `ListModel.LayoutView.add/edit/view`, and used a display-settings shape with only `opentype.add`, `modalsize.add`, and object-shaped `sort`. That caused the default Data List `+ New item` Add modal to keep loading.

The generator now creates concrete Type `1` New Item, Edit Item, and View Item layouts, resolves `ListModel.LayoutView.add/edit/view` to real local layout IDs, and omits unsafe display-settings `sort: [{ SortName, SortByDesc }]`. Validators hard-fail generated packages with `LAYOUTVIEW_ADD_LAYOUT_MISSING` and `LAYOUTVIEW_SORT_OBJECT_UNSUPPORTED`.

Runtime proof is user-confirmed for the generated fixed Container/Button action runtime package: `Action Runtime Requests` opened, the default `+ New item` button was clicked, and the Add modal rendered successfully. This proves Add modal rendering for that package only; Add form save/data mutation, other layout modes, Public Forms, Document Library layouts, Form Reports, and unrelated generated app patterns remain unproven.

## v0.6.0 Scope

v0.6.0 adds Advanced Controls learning and runtime proof while carrying forward v0.5.27 Collection/Kanban action runtime proof, v0.5.26 YAPK-from-scratch hardening, v0.5.25 Kanban/Collection/Timeline Dynamic controls learning and runtime proof, v0.5.24 Dynamic Sub List and Print Page support, v0.5.23 LayoutView hardening, and v0.5.22 YAPK support.

Included Advanced Controls: Tab, Toggle, Timer, Icon list, Divider, Alert, Progress bar, Spacer, Progress circle, Steps bar, QR Code, Barcode, Embed, and Document embed.

Runtime proof: `/Users/Renger/Downloads/advanced-controls-runtime-proof.v1.yap` imported successfully, `Advanced Controls Runtime Dashboard` opened, Tab switching worked, Toggle expand/collapse worked, Timer/Icon list/Divider/Alert/Progress bar/Spacer/Progress circle/Steps bar/QR Code/Barcode rendered, Embed rendered safely without breaking the page, Document embed rendered a safe empty state, and no missing binding/render/action error appeared.

Proof boundary: this runtime proof is limited to the generated Advanced Controls runtime package and covers rendering/basic interactions only. It does not prove QR scan behavior, Barcode scan behavior, external iframe content loading beyond safe render, non-empty document preview, dynamic value changes, or Approval Form/Public Form host behavior.

## v0.6.1 RC Scope

v0.6.1 adds tenant-neutral public sharing hardening and `.env.local` profile guidance while preserving v0.6.0 Advanced Controls support and all earlier v0.5.27 through v0.5.22 capability milestones.

Included environment hardening:

- `docs/environment-configuration.md`
- `.env.example`
- `YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1` for API calls
- `YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com` for tenant/app links
- `YEEFLOW_PROFILE` multi-tenant profile mode, with one active tenant profile per script run
- `YEEFLOW_BASE_URL` retained only as a legacy API base alias/fallback
- shared env helper scripts and updated API/YAPK scripts

Proof boundary: v0.6.1 is a public-sharing, documentation, environment-resolution, and packaging-hygiene patch. It does not add new runtime capability proof beyond v0.6.0 and earlier documented milestones.

## Current Limitations

- This package is skills-only.
- No OAuth is included.
- No embedded Yeeflow API credentials, OAuth flow, or MCP server is included.
- Yeeflow API usage is limited to the `yeeflow-api-operator` read-only helper unless future API operations are separately studied, safety-reviewed, and runtime-proven.
- No MCP servers are included.
- `.yapk` mutation is not supported.
- The bundle includes 21 skills, including `yeeflow-yapk-package-generator`.
- YAPK support carries forward the v0.5.22 boundary: minimal text-only data-list generation path is focused proof only; DateTime/non-text fields, broader YAPK mutation, forms/pages/dashboards/workflows/reports inside YAPK, and general YAPK generation remain unproven.
- Public form custom code is not claimed unless explicitly runtime-tested.
- Runtime proof still depends on Yeeflow import/testing access.
- The plugin package mirrors current repo skills and the Data List LayoutView Add form hardening.

## Manual Install or Upload

If no repo-specific packaging command is available, use `dist/yeeflow-builder-plugin/` as the plugin root. The manifest is `dist/yeeflow-builder-plugin/.codex-plugin/plugin.json`, and bundled skills are under `dist/yeeflow-builder-plugin/skills/`.

## Verified Install

The v0.5.23 private marketplace smoke passed for RC tag `yeeflow-builder-plugin-v0.5.23-rc1`.

Install source:

```text
https://github.com/Yeeflow/yeeflow-codex-plugins.git
```

Sparse paths:

```text
.agents/plugins/marketplace.json
dist/yeeflow-builder-plugin
```

Expected result: marketplace `Yeeflow Internal`, plugin `Yeeflow Builder`, category `Developer Tools`, and successful plugin install.

If metadata or icon changes do not appear after updating the Git ref, remove and re-add the marketplace. The package includes plugin and marketplace icon paths, but fallback icon display may still occur because of Codex marketplace UI/cache behavior and is not an install blocker.

The v0.3.0 private marketplace install smoke test passed with RC tag `yeeflow-builder-plugin-v0.3.0-rc1`.

Install source:

```text
https://github.com/Yeeflow/yeeflow-codex-plugins.git
```

Sparse paths:

```text
.agents/plugins/marketplace.json
dist/yeeflow-builder-plugin
```

Expected result: marketplace `Yeeflow Internal`, plugin `Yeeflow Builder`, category `Developer Tools`, and successful plugin install.

New bundled skills verified in v0.3.0:

- `yeeflow-runtime-test-orchestrator`
- `yeeflow-package-validator`
- `yeeflow-plugin-release-manager`

The v0.2.0 private marketplace install smoke test passed with RC tag `yeeflow-builder-plugin-v0.2.0-rc1`.

Install through Codex's private marketplace flow with:

```text
Source:
https://github.com/Yeeflow/yeeflow-codex-plugins.git

Git ref:
yeeflow-builder-plugin-v0.2.0-rc1

Sparse paths:
.agents/plugins/marketplace.json
dist/yeeflow-builder-plugin
```

Expected result: marketplace `Yeeflow Internal`, plugin `Yeeflow Builder`, category `Developer Tools`, and successful plugin install.

If metadata or icon changes do not appear after updating the Git ref, remove and re-add the marketplace. The package includes plugin and marketplace icon paths, but fallback icon display may still occur because of Codex marketplace UI/cache behavior and is not an install blocker.

Smoke prompts tested for v0.2.0:

- Application builder lifecycle summary.
- Feature-learning orchestrator use cases.
- Custom-code-generator Smart Lookup Picker support.
- Materialization validation behavior for generated `.yap` packages.

## Release Notes

### v0.4.0

Previous version: `0.3.0`.

New version: `0.4.0`.

RC tag tested: `yeeflow-builder-plugin-v0.4.0-rc1`.

Private marketplace install smoke test: passed.

Changed bundled skills:

- `yeeflow-application-generator`
- `yeeflow-approval-form-generator`
- `yeeflow-dashboard-generator`
- `yeeflow-data-list-generator`
- `yeeflow-feature-learning-orchestrator`
- `yeeflow-package-validator`
- `yeeflow-runtime-test-orchestrator`

Main improvements:

- Adds Document Library v2 document center generation guidance and generated-folder support.
- Promotes New Document Library and dashboard-control learning into bundled Yeeflow app-generation guidance.
- Adds document library form-host runtime status and runtime-study guidance.
- Expands package materialization validators and list/graph/package checks for generated `.yap` safety.
- Strengthens runtime/package validation orchestration around materialization blockers and document-library controls.

Known limitations remain unchanged: skills-only package, no OAuth, no Yeeflow API integration, no MCP server, no `.yapk` mutation support, runtime testing still requires Yeeflow access, public form custom code support is not claimed unless tested, and partner-safe edition is planned but not released.

### v0.3.0

Previous version: `0.2.0`.

New version: `0.3.0`.

RC tag tested: `yeeflow-builder-plugin-v0.3.0-rc1`.

Private marketplace install smoke test: passed.

Added bundled skills:

- `yeeflow-runtime-test-orchestrator`
- `yeeflow-package-validator`
- `yeeflow-plugin-release-manager`

Changed bundled skills:

- None of the existing eight core bundled skills changed since `yeeflow-builder-plugin-v0.2.0`.

Main improvements:

- Adds a standard runtime testing lifecycle and runtime result classifications.
- Adds a standard Yeeflow package validation lifecycle before import/runtime testing.
- Adds a standard plugin rebuild, RC, install-smoke, and final-tag release workflow.

Known limitations remain unchanged: skills-only package, no OAuth, no Yeeflow API integration, no MCP server, no `.yapk` mutation support, runtime testing still requires Yeeflow access, public form custom code support is not claimed unless tested, and partner-safe edition is planned but not released.

### v0.2.0

Previous version: `0.1.0`.

New version: `0.2.0`.

RC tag tested: `yeeflow-builder-plugin-v0.2.0-rc1`.

Private marketplace install smoke test: passed.

Changed bundled skills:

- `yeeflow-application-builder`
- `yeeflow-feature-learning-orchestrator`
- `yeeflow-application-generator`
- `yeeflow-data-list-generator`
- `yeeflow-custom-code-generator`

Main improvements:

- Adds generated `.yap` materialization hard rules.
- Requires globally unique app-level `FieldID` allocation.
- Requires fields to keep the parent data-list `ListID`.
- Treats duplicate field display names as materialization risk.
- Keeps real `TenantID`, `CreatedBy`, and `ModifiedBy` out of generated `ReplaceIds`.
- Adds materialization inspection before custom code runtime testing when app shell/list fields do not materialize.

Known limitations remain unchanged: skills-only package, no OAuth, no Yeeflow API integration, no MCP server, no `.yapk` mutation support, runtime testing still requires Yeeflow access, public form custom code support is not claimed unless tested, and partner-safe edition is planned but not released.

## Distribution Docs

Use these docs for release and sharing workflows:

- [Plugin installation](plugin-installation.md)
- [Plugin release process](plugin-release-process.md)
- [Partner-safe edition](plugin-partner-safe-edition.md)
