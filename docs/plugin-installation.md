# Yeeflow Builder Plugin Installation

This document covers private distribution and installation guidance for the Yeeflow Builder Plugin v0. The plugin is currently a skills-only Codex plugin with no OAuth, no Yeeflow API integration, and no MCP servers.

## Distribution Options

The supported v0 distribution paths are:

- Git repo sharing from the private repository and release branch.
- ZIP package sharing from `dist/yeeflow-builder-plugin-0.1.0.zip`.

Organization-level private marketplace distribution is a future option. Do not assume it is available until Codex admin setup, supported marketplace configuration, and the target environment's install flow are confirmed.

## Verified Private Marketplace Install

The repo includes a marketplace catalog at:

```text
.agents/plugins/marketplace.json
```

Use this when Codex asks to add a plugin marketplace from a GitHub repo, Git URL, or local folder. The marketplace entry points to the bundled plugin folder:

```text
./dist/yeeflow-builder-plugin
```

Verified install status: passed on 2026-05-18.

Use these values in Codex's Add marketplace dialog:

```text
Source:
https://github.com/rengerhu/yeeflow-ai-builder-research.git

Git ref:
yeeflow-builder-plugin-v0.1.0-rc6

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
dist/yeeflow-builder-plugin-0.1.0.zip
```

Unzip it into a local plugin directory or upload it through a verified Codex plugin install flow if that flow supports ZIP packages.

```bash
unzip dist/yeeflow-builder-plugin-0.1.0.zip -d <plugin-parent-directory>
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
- Replace `0.1.0` only with a release that has matching release notes and validation evidence.
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

## Known Limitations

- Skills-only plugin.
- No OAuth.
- No Yeeflow API integration.
- No MCP server.
- `.yapk` mutation is not supported.
- Runtime testing still requires Yeeflow access.
- Public form custom code support is not claimed unless tested.
