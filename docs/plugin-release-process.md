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
dist/yeeflow-builder-plugin-0.1.0.zip
```

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
