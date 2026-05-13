# Yeeflow AI Builder Research

This repository tracks safe research artifacts for generating, validating, learning, and packaging Yeeflow application resources with Codex.

## Scope

Tracked content should focus on:

- Yeeflow package validators and wrapper builders
- generator scripts and small helper utilities
- sanitized feature-learning notes and baseline documentation
- Codex skill definitions and operating references
- sanitized examples that are small enough to review safely

Do not commit raw customer exports, tenant credentials, tokens, or unreviewed generated packages.

## Safety Rules

- Raw `.yap`, `.ydl`, `.ywf`, `.yaia`, and `.yaic` files are ignored by default.
- Decoded app/resource JSON is ignored by default because it may contain customer or tenant-specific data.
- Large generated packages and downloaded files stay outside the committed baseline.
- Promote only sanitized summaries into `docs/` or small reviewed samples into `examples/`.

## Main Areas

- `docs/` - feature studies, baseline notes, validation findings, and runtime evidence summaries.
- `generated/` - placeholder for reviewed generated outputs that are intentionally promoted later.
- `examples/` - placeholder for very small sanitized examples.
- `skills/` - repository notes for skill definitions and installation tracking.
- root `*.js` and `*.mjs` files - validators, wrapper builders, and generators.

## Validation Pattern

For generated Yeeflow apps, the preferred proof chain is:

```bash
node validate-yap-package.js <resource-or-yap> --mode generator --stage final
node validate-yap-graph.js <resource-or-yap> --mode generator --stage final
node build-yap-wrapper.js <resource.json> <output.yap> --validation-mode generator
```

Runtime import tests should be documented in `docs/` after they pass.
