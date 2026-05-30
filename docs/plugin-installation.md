# Yeeflow Builder Plugin Installation

This document covers public Git marketplace installation guidance for the Yeeflow Builder Plugin v0. The plugin is currently a skills-only Codex plugin with no OAuth and no MCP servers. API-backed helper scripts, when used, read tenant settings only from local environment variables.

## Distribution Options

The supported v0 distribution paths are:

- Git marketplace install from the official Yeeflow repository.
- ZIP package sharing from the matching release archive when a marketplace install is not available.

Use tenant-neutral configuration for all public installs. Do not use an internal test tenant URL as a default.

## Verified Private Marketplace Install

The repo includes a marketplace catalog at:

```text
.agents/plugins/marketplace.json
```

Use this when Codex asks to add a plugin marketplace from a GitHub repo, Git URL, or local folder. The marketplace entry points to the bundled plugin folder:

```text
./dist/yeeflow-builder-plugin
```

Latest RC install status: v0.6.3 RC1 is ready for private marketplace smoke testing. Latest final install status remains v0.6.2 passed.

v0.6.3 RC1 install smoke test values:

- RC tag to test: `yeeflow-builder-plugin-v0.6.3-rc1`
- Install result: pending private marketplace smoke
- Final tag: not created yet
- Marketplace name: `Yeeflow Internal`
- Category: `Developer Tools`
- Plugin name: `Yeeflow Builder`
- Expected version: `0.6.3`
- Expected bundled skills: `21`
- Smoke-test question: `What application generation hard checks are included in v0.6.3?`

Use these values in Codex's Add marketplace dialog for v0.6.3 RC testing:

```text
Source:
https://github.com/Yeeflow/yeeflow-codex-plugins.git

Git ref:
yeeflow-builder-plugin-v0.6.3-rc1

Sparse paths:
.agents/plugins/marketplace.json
dist/yeeflow-builder-plugin
```

v0.6.2 install smoke test result:

- RC tag tested: `yeeflow-builder-plugin-v0.6.2-rc1`
- RC package commit: `01645e6d5bb2ea0dc53f484312c01e34fe08126d`
- Install result: passed
- Final tag: `yeeflow-builder-plugin-v0.6.2`
- Marketplace name: `Yeeflow Internal`
- Category: `Developer Tools`
- Plugin name: `Yeeflow Builder`
- Expected version: `0.6.2`
- Expected bundled skills: `21`
- Smoke-test question: `What YAP and YAPK generation fixes are included in v0.6.2?`

Use these values in Codex's Add marketplace dialog for the final v0.6.2 release:

```text
Source:
https://github.com/Yeeflow/yeeflow-codex-plugins.git

Git ref:
yeeflow-builder-plugin-v0.6.2

Sparse paths:
.agents/plugins/marketplace.json
dist/yeeflow-builder-plugin
```

v0.6.1 install smoke test result:

- RC tag tested: `yeeflow-builder-plugin-v0.6.1-rc1`
- RC target commit: `e9dd4fead685f920560924a8762dc1432a5c4579`
- Install result: passed
- Final tag: `yeeflow-builder-plugin-v0.6.1`
- Marketplace name: `Yeeflow Internal`
- Category: `Developer Tools`
- Plugin name: `Yeeflow Builder`
- Expected version: `0.6.1`
- Expected bundled skills: `21`
- Smoke-test question: `How does v0.6.1 handle Yeeflow tenant URLs and .env.local configuration?`

Use these values in Codex's Add marketplace dialog for the final v0.6.1 release:

```text
Source:
https://github.com/Yeeflow/yeeflow-codex-plugins.git

Git ref:
yeeflow-builder-plugin-v0.6.1

Sparse paths:
.agents/plugins/marketplace.json
dist/yeeflow-builder-plugin
```

## macOS Git / Command Line Tools Prerequisite

Codex installs the marketplace by running `git clone`. On macOS, Git may require Apple Command Line Tools. If Git or Apple Command Line Tools are not installed, Codex can fail before it downloads the Yeeflow plugin repository.

The common error looks like:

```text
xcode-select: note: No developer tools were found, requesting install.
```

This is a local macOS Git prerequisite issue, not a Yeeflow plugin package problem.

Install Command Line Tools and verify Git:

```sh
xcode-select --install
git --version
```

Accept the macOS installation dialog and wait for it to finish. Then retry adding the plugin marketplace in Codex.

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

After `git --version` works, retry the marketplace install with the v0.6.3 RC1 values above.

## Prompt To Ask Codex On macOS

Users who prefer not to type Terminal commands manually can paste this into Codex. This prompt is for the user's local Codex/macOS environment only; it does not belong inside the plugin runtime.

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

v0.6.0 RC install smoke test result:

- RC tag tested: `yeeflow-builder-plugin-v0.6.0-rc1`
- Install result: passed
- Marketplace name: `Yeeflow Internal`
- Category: `Developer Tools`
- Plugin name: `Yeeflow Builder`
- Expected version: `0.6.0`
- Expected bundled skills: `21`

Use these values in Codex's Add marketplace dialog for the final v0.6.0 release:

```text
Source:
https://github.com/Yeeflow/yeeflow-codex-plugins.git

Git ref:
yeeflow-builder-plugin-v0.6.0

Sparse paths:
.agents/plugins/marketplace.json
dist/yeeflow-builder-plugin
```

For API-backed workflows, configure the shared API base URL and your tenant URL locally:

```env
YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1
YEEFLOW_API_KEY=<your Yeeflow API key>
YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
YEEFLOW_TENANT_ID=<optional tenant id if required>
```

`YEEFLOW_API_BASE_URL` is for API calls and should normally be `https://api.yeeflow.com/v1`. `YEEFLOW_TENANT_URL` is for tenant/app links and should be the tenant root, such as `https://<yourdomain>.yeeflow.com`. `YEEFLOW_BASE_URL` is a legacy API base URL alias only and must not mean tenant URL going forward. Never commit `.env.local`, API keys, tenant IDs, raw API responses, or private tenant URLs.

For a complete `.env.local` setup guide, see [Environment Configuration](environment-configuration.md).

Optional profile mode lets users keep multiple tenants in one local `.env.local` and select one active tenant per script run:

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

`YEEFLOW_PROFILE` is a local selector, not a Yeeflow server-side setting. If it is set to `prod`, scripts read `YEEFLOW_PROD_API_KEY`, `YEEFLOW_PROD_TENANT_URL`, and `YEEFLOW_PROD_TENANT_ID`; other profiles are inactive for that run.

Smoke-test question:

```text
What Advanced Controls support is included in v0.6.0?
```

Expected answer: v0.6.0 adds Advanced Controls learning and runtime proof. It includes Tab, Toggle, Timer, Icon list, Divider, Alert, Progress bar, Spacer, Progress circle, Steps bar, QR Code, Barcode, Embed, and Document embed. Runtime proof confirms the generated package imports, the Advanced Controls Runtime Dashboard opens, Tab switching works, Toggle expand/collapse works, and Timer/Icon list/Divider/Alert/Progress/Spacer/Progress circle/Steps bar/QR Code/Barcode/Embed safe render/Document embed empty state render without missing binding/render errors. The proof does not cover QR scan behavior, Barcode scan behavior, external iframe content loading beyond safe render, non-empty document preview, dynamic value changes, or Approval/Public Form host behavior. Prior v0.5.27 through v0.5.22 milestones remain included.

v0.4.0 RC install smoke test result:

- RC tag tested: `yeeflow-builder-plugin-v0.4.0-rc1`
- Install result: passed
- Marketplace name: `Yeeflow Internal`
- Category: `Developer Tools`
- Plugin name: `Yeeflow Builder`

Use these values in Codex's Add marketplace dialog for the tested RC:

```text
Source:
https://github.com/Yeeflow/yeeflow-codex-plugins.git

Git ref:
yeeflow-builder-plugin-v0.4.0-rc1

Sparse paths:
.agents/plugins/marketplace.json
dist/yeeflow-builder-plugin
```

v0.3.0 RC install smoke test result:

- RC tag tested: `yeeflow-builder-plugin-v0.3.0-rc1`
- Install result: passed
- Marketplace name: `Yeeflow Internal`
- Category: `Developer Tools`
- Plugin name: `Yeeflow Builder`
- New bundled skills:
  - `yeeflow-runtime-test-orchestrator`
  - `yeeflow-package-validator`
  - `yeeflow-plugin-release-manager`

Use these values in Codex's Add marketplace dialog for the tested RC:

```text
Source:
https://github.com/Yeeflow/yeeflow-codex-plugins.git

Git ref:
yeeflow-builder-plugin-v0.3.0-rc1

Sparse paths:
.agents/plugins/marketplace.json
dist/yeeflow-builder-plugin
```

v0.2.0 RC install smoke test result:

- RC tag tested: `yeeflow-builder-plugin-v0.2.0-rc1`
- Install result: passed
- Marketplace name: `Yeeflow Internal`
- Category: `Developer Tools`
- Plugin name: `Yeeflow Builder`

Use these values in Codex's Add marketplace dialog for the tested RC:

```text
Source:
https://github.com/Yeeflow/yeeflow-codex-plugins.git

Git ref:
yeeflow-builder-plugin-v0.2.0-rc1

Sparse paths:
.agents/plugins/marketplace.json
dist/yeeflow-builder-plugin
```

Expected Codex result:

- Marketplace name: `Yeeflow Internal`
- Category: `Developer Tools`
- Plugin name: `Yeeflow Builder`
- Plugin install: succeeds

For future Git-based marketplace installs, use a release tag that includes this marketplace catalog. If sparse paths are requested, include both the marketplace catalog and the plugin folder:

```text
.agents/plugins/marketplace.json
dist/yeeflow-builder-plugin
```

If marketplace metadata or icon assets do not refresh after a tag update, remove and re-add the `Yeeflow Internal` marketplace. Codex may cache marketplace metadata by source/ref.

Icon behavior: `rc6` includes plugin-level and marketplace-entry icon paths. If Codex still shows the fallback four-dot icon, treat it as marketplace UI/cache behavior rather than a package or install failure. Fallback icon rendering is not an install blocker.

## Release Status

v0.4.0 status:

- Private Git marketplace install: passed with `yeeflow-builder-plugin-v0.4.0-rc1`.
- ZIP package smoke test: passed locally.
- Git marketplace install: passed.
- Production/public marketplace: not applicable.
- Partner-safe edition: planned, not released.

v0.3.0 status:

- Private Git marketplace install: passed with `yeeflow-builder-plugin-v0.3.0-rc1`.
- ZIP package smoke test: passed locally.
- Git marketplace install: passed.
- Production/public marketplace: not applicable.
- Partner-safe edition: planned, not released.

v0.2.0 status:

- Private Git marketplace install: passed with `yeeflow-builder-plugin-v0.2.0-rc1`.
- ZIP package smoke test: passed locally.
- Git marketplace install: passed.
- Production/public marketplace: not applicable.
- Partner-safe edition: planned, not released.

v0.1.0 status:

- Private Git marketplace install: passed.
- ZIP package smoke test: passed.
- Git marketplace install: passed.
- Production/public marketplace: not applicable.
- Partner-safe edition: planned, not released.

## v0.1.0 Package Smoke Test

Smoke test status: passed for install preparation on 2026-05-18.

Tested archive:

```text
dist/yeeflow-builder-plugin-0.1.0.zip
```

Confirmed results:

- Archive exists.
- `unzip -t` passes.
- Archive extracts to a single `yeeflow-builder-plugin/` root folder.
- Extracted package contains `.codex-plugin/plugin.json`.
- `plugin.json` parses with `name: yeeflow-builder` and display name `Yeeflow Builder`.
- Extracted package contains all eight bundled skill folders.
- Every bundled skill has `SKILL.md`.
- Every bundled skill has `agents/openai.yaml`.
- Lightweight skill smoke checks passed for application-builder lifecycle guidance, feature-learning routing guidance, and custom-code Smart Lookup Picker support boundaries.

ZIP UI install status: not separately verified. Use the verified private Git marketplace flow above for Codex plugin installation.

## Install From Git

Internal users can get the plugin from the private Git repository by cloning or fetching the branch that contains the plugin package.

Recommended branch:

```bash
git fetch origin codex/yeeflow-builder-plugin-v0
git checkout codex/yeeflow-builder-plugin-v0
```

Plugin root:

```text
dist/yeeflow-builder-plugin/
```

Manifest:

```text
dist/yeeflow-builder-plugin/.codex-plugin/plugin.json
```

Use the plugin root folder as the local plugin source in the Codex environment that supports local/private plugin installation. The exact install UI or command must be confirmed in the target Codex environment; this repo does not currently include a verified organization marketplace or automated plugin upload command.

## Update From Git

To update an existing local checkout:

```bash
git fetch origin
git checkout codex/yeeflow-builder-plugin-v0
git pull --ff-only
```

After updating, re-point or refresh the local plugin source if the Codex environment caches plugin files. Then verify the bundled skills are discoverable.

Recommended branch and release usage:

- Use `codex/yeeflow-builder-plugin-v0` for active v0 plugin work and review.
- Use tagged releases or immutable release branches for broader internal rollout.
- Avoid installing from an unreviewed local working tree.
- Keep partner-safe builds separate from the internal edition.

## Install From ZIP

The current ZIP artifact is:

```text
dist/yeeflow-builder-plugin-0.2.0.zip
```

Unzip it into a local plugin directory or upload it through a verified Codex plugin install flow if that flow supports ZIP packages.

```bash
unzip dist/yeeflow-builder-plugin-0.2.0.zip -d <plugin-parent-directory>
```

The extracted plugin root should be:

```text
<plugin-parent-directory>/yeeflow-builder-plugin/
```

Use ZIP sharing when:

- The recipient does not need Git history.
- The package is a reviewed release artifact.
- The recipient needs a fixed version, not a moving branch.
- Sharing is internal and approved for the content included in the package.

Replacement rules:

- Do not overwrite an installed ZIP package silently.
- Keep one installed folder per released version when testing upgrades.
- Replace an installed version only with a release that has matching release notes and validation evidence.
- Do not rename the plugin manifest `name`; it remains `yeeflow-builder`.

## Organization Marketplace

An organization-level private marketplace may become the preferred distribution path later. Treat it as future work until the following are verified:

- Codex environment supports private marketplace registration for this organization.
- Admin permissions and approval workflow are known.
- Plugin source path or archive upload mechanics are documented.
- Installation, update, rollback, and removal behavior are tested.
- Skills-only plugins are discoverable after marketplace installation.

Do not claim marketplace support beyond what is verified in the target Codex environment.

## Verify Installation

After installation or update, confirm the plugin manifest and bundled skills are available:

- `plugin.json` parses and shows `name: yeeflow-builder`.
- The plugin points to `./skills/`.
- The eight bundled skills are discoverable.
- No OAuth, MCP, app, or Yeeflow API connector is requested during install.

Expected bundled skills:

- `yeeflow-application-builder`
- `yeeflow-feature-learning-orchestrator`
- `yeeflow-application-generator`
- `yeeflow-approval-form-generator`
- `yeeflow-data-list-generator`
- `yeeflow-dashboard-generator`
- `yeeflow-expression-generator`
- `yeeflow-custom-code-generator`

## Smoke Tests

Run lightweight prompt smoke tests after installation. These are behavior-discovery tests, not Yeeflow runtime import tests.

Application builder lifecycle summary:

```text
Use yeeflow-application-builder. Summarize the required lifecycle for building a new Yeeflow app from requirements, including clarification gates, .yap output, validation, and runtime baseline documentation.
```

Expected result: Codex explains a business-first app build workflow, uses `.yap` for new app creation, requires business clarification gates before generation, and separates local validation from runtime acceptance.

Feature learning orchestrator use cases:

```text
Use yeeflow-feature-learning-orchestrator. Explain when a task should be routed to feature learning instead of application building.
```

Expected result: Codex routes unknown Yeeflow behavior, export study, minimal proof packages, runtime import testing, export-back comparison, and baseline documentation to learning rather than app delivery.

Custom code Smart Lookup Picker support:

```text
Use yeeflow-custom-code-generator. Explain the runtime-proven support boundaries for Smart Lookup Picker custom code, including where support is and is not claimed.
```

Expected result: Codex describes custom code support only for runtime-proven contexts, does not claim untested public form support, and avoids presenting custom code as the default when native Yeeflow controls can solve the requirement.

v0.2.0 install smoke prompts tested:

- Application builder lifecycle summary.
- Feature-learning orchestrator use cases.
- Custom-code-generator Smart Lookup Picker support.
- Materialization validation behavior for generated `.yap` packages.

v0.3.0 install smoke prompts tested:

- Runtime-test-orchestrator lifecycle summary and result classifications.
- Package-validator import-safety and `.yap` versus `.yapk` policy.
- YAPK package generator schema-backed inspection and signing-boundary guidance.
- Plugin-release-manager RC versus final tag workflow.
- Existing application-builder lifecycle summary.

v0.4.0 install smoke prompts tested:

- Application-generator Document Library v2 generation and generated-folder guidance.
- Package-validator materialization blocker handling for generated `.yap` packages.
- Runtime-test-orchestrator document library form-host runtime classification.
- Dashboard-generator data-bound document-library dashboard guidance.

## Known Limitations

- Skills-only plugin.
- No OAuth.
- No Yeeflow API integration.
- No MCP server.
- `.yapk` mutation is not supported.
- v0.5.23 RC includes 21 bundled skills, including `yeeflow-yapk-package-generator`.
- v0.5.23 RC includes Data List LayoutView Add form hardening: generated Data Lists now need concrete Type `1` New/Edit/View layout targets in `ListModel.LayoutView.add/edit/view`, and validators hard-fail `LAYOUTVIEW_ADD_LAYOUT_MISSING` plus `LAYOUTVIEW_SORT_OBJECT_UNSUPPORTED`.
- v0.5.23 private marketplace smoke test passed for RC tag `yeeflow-builder-plugin-v0.5.23-rc1`; final release tag is `yeeflow-builder-plugin-v0.5.23`.
- Runtime proof for the LayoutView fix covers Add modal rendering for the fixed Container/Button action runtime package only; Add save/data mutation, other layout modes, Public Forms, Document Library layouts, Form Reports, and unrelated generated app patterns remain unproven.
- YAPK support carries forward the v0.5.22 boundary: minimal text-only data-list generation path is focused proof only; broader YAPK mutation and non-list resource generation remain unproven.
- Runtime testing still requires Yeeflow access.
- Public form custom code support is not claimed unless tested.
