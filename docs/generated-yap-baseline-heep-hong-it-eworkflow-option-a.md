# Generated `.yap` Baseline: Heep Hong IT eWorkflow Option A v8

This document records the Heep Hong IT eWorkflow Option A diagnostic baseline that fixed the data-list grid query failure.

## Working Package

```text
heep-hong-it-eworkflow-option-a.v8.yap
```

Decoded source:

```text
heep-hong-it-eworkflow-option-a-app-def.v8.json
```

Generated form Def:

```text
heep-hong-it-eworkflow-option-a-purchase-requisition-approval-form-def.v8.json
```

## Scope

Option A includes:

- root app shell for `Heep Hong IT eWorkflow`
- `Centers / Departments` data list
- `Funding Sources` data list
- `IT Equipment Catalog` data list
- `IT Purchase Requisitions` data list
- `IT Purchase Requisition` approval form
- internal lookup relationships from the request list/form to master lists
- `ContentList` persistence to `IT Purchase Requisitions`

Option A intentionally excludes New Joiner, IT Access Right, online payment, SSO implementation, CRM integration, reports/dashboards beyond the simple app page, AI Agents/Copilots, document libraries, external connections, and custom code.

## Runtime Failure Found In v7

v7 imported and opened. The app navigation and data-list components were visible. List metadata endpoints returned successfully, including:

- `api/crafts/list/{AppID}/{ListID}`
- `api/crafts/defs/listid`
- `api/crafts/layouts/listid`

But every data-list grid row query failed:

```text
api/crafts/datas/{AppID}/{ListID}/query -> 400
```

The failure persisted with:

- the actual grid columns and `Created` sort
- `Columns: ["Title"]` without sort
- `Columns: []` without sort
- system-only columns without sort
- no imported sample records

This ruled out sample data, a specific visible column, and the grid sort as root causes.

## Root Cause

Generated child data lists were defining `Title` like a normal custom business field:

```json
{
  "FieldName": "Title",
  "Status": 1,
  "IsSystem": false,
  "IsIndex": false
}
```

Yeeflow accepted enough metadata to render list headers, but the backend row-data query path failed.

## Correct Pattern

Every generated data list must preserve `Title` as Yeeflow's native primary/display field:

```json
{
  "FieldName": "Title",
  "Status": 0,
  "IsSystem": true,
  "IsIndex": true
}
```

The display label can still be business-specific:

- `Center / Department Name`
- `Funding Source Name`
- `Equipment Name`
- `Request No.`

The underlying field metadata must remain native/system/indexed. Additional business text fields should use `Text1`, `Text2`, and later slots.

## v8 Result

v8 changed only the generated child data-list `Title` metadata and used a fresh generated namespace:

- ID family: `224...`
- FlowKey/form key: `HHP`
- sample data remained disabled for diagnostic isolation

The user confirmed v8 fixed the data-list query error.

## Validator Rule

Generator/final validation must fail if any generated data list has `FieldName === "Title"` and any of these are true:

- `Status !== 0`
- `IsSystem !== true`
- `IsIndex !== true`

This rule is enforced in:

- `validate-ydl-list.js`
- `validate-yap-package.js`
- `validate-yap-graph.js`
