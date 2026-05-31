# Quick Start

## Install The Plugin

Add the official Yeeflow Codex plugin marketplace:

```text
Source:
https://github.com/Yeeflow/yeeflow-codex-plugins.git

Git ref:
yeeflow-builder-plugin-v0.6.4-rc1

Sparse paths:
.agents/plugins/marketplace.json
dist/yeeflow-builder-plugin
```

Expected marketplace: `Yeeflow Internal`
Expected plugin: `Yeeflow Builder`
Expected version: `0.6.4`
Expected bundled skills: `21`

### macOS Git Prerequisite

Codex installs the marketplace by running `git clone`. On macOS, Git may require Apple Command Line Tools. If Codex shows an `xcode-select` error saying no developer tools were found, install Command Line Tools and verify Git:

```sh
xcode-select --install
git --version
```

If Git still fails after the tools are installed:

```sh
sudo xcode-select --reset
git --version
```

If full Xcode is installed and reset does not work:

```sh
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
git --version
```

After `git --version` works, retry adding the plugin marketplace in Codex. This failure happens before the Yeeflow plugin is downloaded, so it is not a plugin package issue.

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

## Configure `.env.local`

Create `.env.local` only in your local workspace:

```env
YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1
YEEFLOW_API_KEY=<your Yeeflow API key>
YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
YEEFLOW_TENANT_ID=<optional tenant id if required>
YEEFLOW_WORKSPACE_ID=<your workspace id>
```

Use `YEEFLOW_API_BASE_URL` for API calls. The standard value is `https://api.yeeflow.com/v1`. Use `YEEFLOW_TENANT_URL` for browser/app links to your tenant root, such as `https://<yourdomain>.yeeflow.com`. Keep `.env.local` out of Git.

`YEEFLOW_WORKSPACE_ID` is required only for package import/install/upgrade automation. Store it in `.env.local`, do not commit it, and rely on helper redaction instead of printing the value.

For the complete setup, profile, and troubleshooting guide, see [Environment Configuration](environment-configuration.md).

## Create Or Deliver An Application

New application creation defaults to YAPK. Ask Codex for YAP only when you specifically need a `.yap` file or a debugging fallback.

If local `.env.local` contains `YEEFLOW_API_KEY` and `YEEFLOW_WORKSPACE_ID`, Codex should ask before automatically installing the generated YAPK into the configured workspace. Without confirmation, Codex should only generate and validate the YAPK and provide manual install guidance.

For existing app changes, Codex should create a new versioned YAPK package and use the upgrade package API only after the target application is clearly identified and approved.

Optional multi-tenant profile mode:

```env
YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1
YEEFLOW_PROFILE=dev

YEEFLOW_DEV_API_KEY=<dev API key>
YEEFLOW_DEV_TENANT_URL=https://devcompany.yeeflow.com
YEEFLOW_DEV_TENANT_ID=<optional>
YEEFLOW_DEV_WORKSPACE_ID=<dev workspace id>

YEEFLOW_PROD_API_KEY=<prod API key>
YEEFLOW_PROD_TENANT_URL=https://company.yeeflow.com
YEEFLOW_PROD_TENANT_ID=<optional>
YEEFLOW_PROD_WORKSPACE_ID=<prod workspace id>
```

`YEEFLOW_PROFILE` is a local selector for plugin/scripts, not a Yeeflow server-side setting. Only one profile is active per run. Switch tenants by changing `YEEFLOW_PROFILE=dev`, `YEEFLOW_PROFILE=prod`, or another unique profile name such as `YEEFLOW_PROFILE=client_a`. Scripts read the matching `YEEFLOW_<PROFILE>_API_KEY`, `YEEFLOW_<PROFILE>_TENANT_URL`, optional `YEEFLOW_<PROFILE>_TENANT_ID`, and package automation `YEEFLOW_<PROFILE>_WORKSPACE_ID`.

## Verify Plugin Version

Ask Codex:

```text
What Yeeflow Builder Plugin version is installed?
```

Expected version:

```text
0.6.4
```

## Run A Basic Prompt

```text
Use Yeeflow Builder to plan a complete issue intake application. Before generating any package, create a Markdown app plan, ask clarifying questions if core requirements are unclear, and include the data lists, forms, dashboards, workflows, layout approach, validation checklist, and proof boundary.
```

Review the plan before asking Codex to generate a package. Unless you explicitly want a simple/MVP package, ask Codex to implement the full planned application.

For best results, describe your preferred web-app experience too: target users, desired pages, whether dashboards should use tables, cards, Kanban, timelines, or a mix, and whether custom CSS or Custom code is allowed. Ask Codex to include a `UI/UX and Control Mapping` section that explains why each Yeeflow control was selected.

Example:

```text
Generate a complete Yeeflow application for [business process]. Think like a web application product designer first. Create a detailed app plan with a UI/UX and Control Mapping section before building. Choose the best combination of Yeeflow controls for each page, such as Data table, Collection, Kanban, Timeline, Tabs, Toggle, Steps bar, Progress controls, Sub List Dynamic content, QR Code, Barcode, Embed, Document embed, custom CSS, or Custom code if needed. Do not build a simple MVP unless I ask for one. Implement the full planned application in one package where feasible, and validate that every data-bound control has fields, every page has good padding/layout, and the generated package matches the plan.
```

If you already have UI mockups or screenshots, use them as design references:

```text
I have UI mockup images for a Yeeflow application. Use them as design references. First extract a Yeeflow UI implementation spec in Markdown. For every visible page section, map the UI to Yeeflow controls, data bindings, actions, style settings, custom CSS, or Custom code if needed. Do not simplify the design. Then generate the full YAPK package from the spec and validate the package against the spec before returning it.
```

## Generate And Validate The Planned Application Package

```text
Generate the complete planned issue intake Yeeflow application package and validate it before import. Keep all tenant-specific values out of the generated package. Validate Data table display columns, field bindings, dashboard/form padding, and package coverage against the app plan before returning the final file.
```

Expected validation should include package checks, graph checks, wrapper checks, and a proof-boundary summary.

## Import Into Yeeflow

Import the validated package into your own Yeeflow tenant:

```text
https://<yourdomain>.yeeflow.com
```

Record whether import, open, rendering, save, submit, workflow, or other runtime actions were actually tested. Do not claim untested behavior.

## Troubleshooting Checklist

- Confirm the install source is the official Yeeflow repo.
- Confirm the Git ref is `yeeflow-builder-plugin-v0.6.4-rc1` for RC smoke testing. Use `yeeflow-builder-plugin-v0.6.4` only after the final tag is created.
- On macOS, confirm `git --version` works before adding the marketplace.
- Confirm sparse paths include both marketplace and plugin folder paths.
- Confirm `.env.local` is present only locally and is gitignored.
- Confirm `YEEFLOW_API_BASE_URL` is `https://api.yeeflow.com/v1`.
- Confirm `YEEFLOW_TENANT_URL` is a tenant root such as `https://<yourdomain>.yeeflow.com`.
- Treat `YEEFLOW_BASE_URL` only as a legacy API base URL alias when an older script still reads it.
- Confirm API-backed checks never print API keys or raw API responses.
- Run validators before import.
- Treat runtime proof as scoped to the exact actions tested.
