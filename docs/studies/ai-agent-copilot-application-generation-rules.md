# AI Agent And Copilot Application Generation Rules

Classification: generated-package validation guidance with limited runtime import proof from the Asia Tech visitor Copilot package.

## Current Proof Boundary

Generated app-contained AI Agent and Copilot resources can be included in a Yeeflow app package when local references are complete, scoped to application resources, and free of external connections or credentials.

The Asia Tech visitor Copilot package proved:

- generated package import was accepted by Yeeflow
- the imported app card appeared in the workspace
- app-contained AI resources did not block package import at the card-creation level

It did not prove:

- opening generated Agent or Copilot configuration
- Copilot chat execution
- Agent execution
- image extraction runtime behavior
- AI-driven data-list mutation

Do not upgrade generated Agent/Copilot execution claims until those surfaces are opened and tested in a controlled runtime pass.

## Safe Generation Shape

For generated application packages:

- Keep Agents and Copilots inside `OtherModules` with generated IDs.
- Keep all tool scopes inside the generated app/listset when possible.
- Prefer Access application resources tools over external connectors.
- Preserve connected-Agent references as explicit dependencies.
- Keep quick prompts instructional and non-destructive.
- Do not include external API keys, OAuth connections, real tenant connections, or live email-sending configuration.
- Do not include real uploaded images or real contact data.

## Validation Expectations

Generated packages should validate:

- AI resource IDs are present and generated.
- Agent/Copilot settings parse as JSON.
- connected-Agent references resolve to generated Agents.
- Access application resources tool scopes reference generated lists.
- no external connections are required for baseline import.
- no secrets or credential-looking values appear in generated resources.

Warnings are still appropriate for:

- runtime-sensitive list mutation tools.
- connected-Agent tools that have not been opened in runtime.
- image/file inputs that have not been runtime-executed.
- workflow AI Assistant nodes that reference Agents but have not been executed.

## Runtime Test Policy

The first safe runtime pass should inspect structure without executing AI:

- import package
- open app
- open data lists and dashboards
- open Copilot configuration and verify quick prompts
- open Agent configuration and verify inputs/tools
- open workflow designer and AI Assistant node
- avoid Copilot chat, Agent execution, image upload, workflow execution, and email sending unless the run is explicitly controlled and uses fake data only
