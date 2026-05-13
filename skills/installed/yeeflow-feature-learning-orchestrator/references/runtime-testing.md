# Runtime Testing

Use the Codex Yeeflow environment only when the user explicitly asks Codex to import or test generated packages:

`https://codex.yeeflow.com/`

## Import Flow

1. Open `https://codex.yeeflow.com/`.
2. Go to Shared Workspace.
3. Click New application.
4. Choose Import application.
5. Upload or drag the generated `.yap` file into the import dialog.
6. Click Next step.
7. Complete import.
8. Open the imported application.
9. Verify app shell, navigation, data lists, forms, workflows, and runtime behavior.

Codex may operate Chrome directly for this runtime testing when the user has explicitly asked it to test in the Yeeflow environment.

## Runtime Checklist

- import popup shows expected name, description, and icon
- app imports successfully
- imported app opens
- root app shell renders
- navigation renders and links resolve
- dashboards, document libraries, reports, lists, forms, or other target feature components appear
- data lists open without `api/crafts/datas/{AppID}/{ListID}/query` returning `400`
- metadata endpoints return expected data
- views and sample rows load
- forms open
- workflows publish or run when in scope
- runtime actions work
- records save correctly
- feature-specific behavior works

## Evidence To Capture On Failure

Use Chrome console and network evidence:

- failed API endpoint
- request payload
- response body
- status code
- metadata endpoint status
- query endpoint status
- console errors
- network errors
- exact user action that triggered the error

Redact secrets, tokens, tenant credentials, connection strings, and personal data that is not needed for debugging.

## Runtime Query Smoke Rule

After import, data lists must open without:

`api/crafts/datas/{AppID}/{ListID}/query -> 400`

If query fails but metadata endpoints succeed, inspect field metadata first, especially the native `Title` field.

