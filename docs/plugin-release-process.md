# Yeeflow Builder Plugin Release Process

This document defines the v0 release packaging process for the private Yeeflow Builder Plugin.

## Release Inputs

Release from a reviewed Git branch, not from an unreviewed working tree. For v0, the active branch is:

```text
codex/yeeflow-builder-plugin-v0
```

Plugin root:

```text
dist/yeeflow-builder-plugin/
```

Current release archive:

```text
dist/yeeflow-builder-plugin-0.4.0.zip
```

Current release status:

- v0.1.0 private Git marketplace install: passed.
- v0.2.0 private Git marketplace install: passed with `yeeflow-builder-plugin-v0.2.0-rc1`.
- v0.3.0 private Git marketplace install: passed with `yeeflow-builder-plugin-v0.3.0-rc1`.
- v0.4.0 private Git marketplace install: passed with `yeeflow-builder-plugin-v0.4.0-rc1`.
- ZIP package smoke test: passed locally.
- Git marketplace install: passed.
- Production/public marketplace: not applicable.
- Partner-safe edition: planned, not released.

Verified marketplace install values:

```text
Source:
https://github.com/rengerhu/yeeflow-ai-builder-research.git

Git ref:
yeeflow-builder-plugin-v0.4.0-rc1

Sparse paths:
.agents/plugins/marketplace.json
dist/yeeflow-builder-plugin
```

Expected Codex result: marketplace `Yeeflow Internal`, plugin `Yeeflow Builder`, category `Developer Tools`, and successful plugin install. If metadata or icon assets do not refresh after a tag update, remove and re-add the marketplace. Fallback icon rendering is not a release blocker when install succeeds and the package includes icon paths.

Smoke prompts tested:

- Application builder lifecycle summary.
- Feature-learning orchestrator use cases.
- Custom-code-generator Smart Lookup Picker support.
- Materialization validation behavior for generated `.yap` packages.
- Runtime-test-orchestrator lifecycle summary and result classifications.
- Package-validator import-safety and `.yap` versus `.yapk` policy.
- YAPK package generator schema-backed inspection and signing-boundary guidance.
- Plugin-release-manager RC versus final tag workflow.
- Application-generator Document Library v2 generation and generated-folder guidance.
- Package-validator materialization blocker handling for generated `.yap` packages.
- Runtime-test-orchestrator document library form-host runtime classification.
- Dashboard-generator data-bound document-library dashboard guidance.

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
- Promotes New Document Library baseline, dashboard-control learning, and document-library resource learning into bundled skills.
- Adds document library form-host runtime status and runtime-study guidance.
- Expands generated `.yap` materialization inspection and package/list/graph validation coverage.
- Strengthens package-validator and runtime-test-orchestrator guidance for materialization blockers and runtime classification.

Known limitations:

- Skills-only plugin.
- No OAuth.
- No Yeeflow API integration.
- No MCP server.
- `.yapk` mutation is not supported.
- Next rebuild should include `yeeflow-yapk-package-generator`, `validate-yapk-package.js`, `scripts/inspect-yapk-schema-standard.mjs`, YAPK study docs, normalized refs, and safe summary JSON. Do not include raw `.yapk` files, raw Resource strings, raw Sign values, decoded full payloads, raw API responses, private IDs, or screenshots.
- Runtime testing still requires Yeeflow access.
- Public form custom code support is not claimed unless tested.
- Partner-safe edition is planned but not released.

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

- Adds a runtime test orchestration skill for import/open smoke tests, dashboard/data-bound validation, forms, workflows, expressions, ContentList persistence, lifecycle tests, and runtime result classification.
- Adds a package validator skill for package graph checks, workflow/list/form/dashboard/custom-code inspection, materialization rules, FlowKey safety, field/list integrity, and `.yap` versus `.yapk` policy.
- Adds a plugin release manager skill for detecting changed bundled skills, choosing versions, rebuilding the private plugin package, creating RC tags, recording install smoke tests, and finalizing non-RC tags only after install proof.

Known limitations:

- Skills-only plugin.
- No OAuth.
- No Yeeflow API integration.
- No MCP server.
- `.yapk` mutation is not supported.
- Runtime testing still requires Yeeflow access.
- Public form custom code support is not claimed unless tested.
- Partner-safe edition is planned but not released.

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

- Adds generated `.yap` materialization hard rules to the app build workflow.
- Requires globally unique `FieldID` values across a generated app package.
- Requires each field's `ListID` to match its parent data list.
- Treats duplicate field display names as generated-package materialization risk.
- Preserves real `TenantID`, `CreatedBy`, and `ModifiedBy` values instead of remapping them into generated ID families.
- Adds materialization inspection before custom code runtime testing when an imported app opens as an empty shell or fields do not materialize.

Known limitations:

- Skills-only plugin.
- No OAuth.
- No Yeeflow API integration.
- No MCP server.
- `.yapk` mutation is not supported.
- Runtime testing still requires Yeeflow access.
- Public form custom code support is not claimed unless tested.
- Partner-safe edition is planned but not released.

## Versioning Policy

Use semantic versioning:

- `0.1.0` for the initial private skills-only package.
- `0.2.0`, `0.3.0`, and later minor versions for new bundled skills, meaningful documentation additions, release-process changes, or expanded validated capability.
- Patch versions such as `0.1.1` for small documentation fixes, packaging metadata corrections, validation-script fixes, or non-behavioral cleanup.

Do not bump a version only because the branch was rebased or repackaged with no content change. Do bump the version when the archive contents change after a release has been shared.

## Release Notes Expectations

Each shared release should have concise release notes that include:

- Version and date.
- Commit hash.
- Plugin archive path.
- Included skills.
- Behavior changes, if any.
- Documentation changes.
- Validation checks run.
- Known limitations.
- Partner-safety status: internal-only or partner-safe.

For internal releases, state whether the release includes internal research notes and experimental workflows.

## Release Checklist

Run this checklist before sharing a Git branch, release tag, or ZIP archive:

- `plugin.json` parses.
- Plugin manifest keeps `name: yeeflow-builder`.
- Plugin manifest points to `./skills/`.
- All included skills have `SKILL.md`.
- All included skills have `agents/openai.yaml`.
- Referenced files exist.
- JavaScript and MJS syntax checks pass.
- JSON parse checks pass for included JSON references.
- Skill mirror checks pass against the source skills in `skills/installed/`.
- Safety scan passes.
- Package size is reasonable.
- Archive integrity passes when a ZIP is present.
- No `.yap`, `.yapk`, `.ydl`, or `.ywf` packages are included.
- No `.env`, secrets, private keys, tokens, or credentials are included.
- No screenshots or downloaded exports are included.
- No customer data is included.
- No tenant-specific runtime data is included.
- No raw Yeeflow exports are included unless explicitly approved for internal research packaging.
- No raw `.yapk` `Resource`, `Sign`, tenant/app/list/package IDs, raw signing API responses, or decoded opaque payloads are included. Wrapper-signing study notes must stay redacted and must not claim `.yapk` app-content mutation support.

## Suggested Local Validation Commands

Run from the repo root.

Parse the plugin manifest:

```bash
node -e 'const fs=require("fs"); JSON.parse(fs.readFileSync("dist/yeeflow-builder-plugin/.codex-plugin/plugin.json","utf8")); console.log("plugin.json OK")'
```

Check required skill files:

```bash
for skill in yeeflow-application-builder yeeflow-feature-learning-orchestrator yeeflow-application-generator yeeflow-approval-form-generator yeeflow-data-list-generator yeeflow-dashboard-generator yeeflow-expression-generator yeeflow-custom-code-generator; do
  test -f "dist/yeeflow-builder-plugin/skills/$skill/SKILL.md" || exit 1
  test -f "dist/yeeflow-builder-plugin/skills/$skill/agents/openai.yaml" || exit 1
done
echo "required skill files OK"
```

Run JavaScript syntax checks:

```bash
find dist/yeeflow-builder-plugin -type f \( -name '*.js' -o -name '*.mjs' \) -print0 |
  while IFS= read -r -d '' file; do node --check "$file" >/dev/null || exit 1; done
echo "node --check OK"
```

Run JSON parse checks:

```bash
find dist/yeeflow-builder-plugin -type f -name '*.json' -print0 |
  while IFS= read -r -d '' file; do node -e 'const fs=require("fs"); JSON.parse(fs.readFileSync(process.argv[1],"utf8"));' "$file" || exit 1; done
echo "JSON parse OK"
```

Run a mirror check:

```bash
for skill in yeeflow-application-builder yeeflow-feature-learning-orchestrator yeeflow-application-generator yeeflow-approval-form-generator yeeflow-data-list-generator yeeflow-dashboard-generator yeeflow-expression-generator yeeflow-custom-code-generator; do
  diff -qr "skills/installed/$skill" "dist/yeeflow-builder-plugin/skills/$skill" || exit 1
done
echo "skill mirror consistency OK"
```

Run a safety scan:

```bash
find dist/yeeflow-builder-plugin -type f |
  rg '\.(yap|yapk|ywf|ydl|docx|xlsx|pptx|png|jpg|jpeg|gif|webp|mov|mp4|env|pem|key)$|(^|/)\.env($|\.)|screenshot|download|export|secret|credential' || true
```

The expected result is no output. If the scan returns a file, inspect it before release. A term match can be benign, but package files, screenshots, exports, secrets, or tenant data must not be included.

Check whitespace:

```bash
git diff --check
```

Check ZIP archive integrity:

```bash
unzip -t dist/yeeflow-builder-plugin-0.1.0.zip
```

## ZIP Packaging

If no repo-specific plugin package command is available, create the ZIP from the `dist` folder:

```bash
cd dist
rm -f yeeflow-builder-plugin-0.1.0.zip
zip -qr yeeflow-builder-plugin-0.1.0.zip yeeflow-builder-plugin
unzip -t yeeflow-builder-plugin-0.1.0.zip
```

Only regenerate the ZIP when the plugin folder contents intentionally change. If a release archive has already been shared, create a new semantic version instead of silently replacing it.

## Release Workflow

1. Start from the reviewed release branch.
2. Confirm the plugin folder is not duplicated.
3. Confirm the included skills still mirror `skills/installed/`.
4. Update release docs and release notes.
5. Run the release checklist.
6. Rebuild the ZIP only if plugin contents changed.
7. Commit with a clear release message.
8. Push the release branch.
9. Share either the Git branch/release tag or the ZIP artifact with installation instructions.

## Known Limitations

- Skills-only plugin.
- No OAuth.
- No Yeeflow API integration.
- No MCP server.
- `.yapk` mutation is not supported.
- Runtime testing still requires Yeeflow access.
- Public form custom code support is not claimed unless tested.
- Organization-level private marketplace distribution remains future work until the Codex environment support path is verified.
