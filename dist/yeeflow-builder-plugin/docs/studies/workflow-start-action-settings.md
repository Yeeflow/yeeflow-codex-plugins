# Workflow Start Action Settings

## Purpose

This study documents Start action settings found in `Test ABC (3).yap`, focused on allow terminate, allow recall, condition storage, and Start email notification configuration.

Proof boundary:

- `export-proven`: found in `Test ABC (3).yap`.
- `product-documented`: described in Yeeflow Help Center.
- `validator-backed`: checked by local validators after this study.
- `runtime-proven`: not claimed here.

No workflow was submitted, no request was recalled or terminated, and no email delivery was tested.

## Sources

Source export:

```text
/Users/Renger/Downloads/Test ABC (3).yap
```

Comparison exports:

```text
/Users/Renger/Downloads/Test ABC.yap
/Users/Renger/Downloads/Test ABC (1).yap
/Users/Renger/Downloads/Test ABC (2).yap
```

Reference:

- Yeeflow Help Center: Start Action
  https://support.yeeflow.com/en/articles/8661635-start-action

## Export Inventory

`Test ABC (3).yap` decoded successfully with large numeric IDs preserved as strings.

| Item | Count / value | Proof |
|---|---:|---|
| Approval forms | 1 | export-proven |
| Workflow type | 2 | export-proven |
| Workflow shapes | 38 | export-proven |
| Start nodes | 1 | export-proven |
| Assignment Task nodes | 12 | export-proven |
| Start incoming flows | 0 | export-proven |
| Start outgoing flows | 12 | export-proven |

## Start Action Fields

The Start node is stored as a `StartNoneEvent` shape. Settings are in `StartNoneEvent.properties`.

| Field | Observed shape | Notes | Proof |
|---|---|---|---|
| `name` | `Start` | Display label. | export-proven |
| `isenabledemail` | `true` | Enables start/submission notification configuration. | export-proven |
| `to` | expression-button rich text | Contains applicant and submitter email expressions; redacted in reusable docs. | export-proven |
| `subject` | expression-button rich text | References workflow/instance name. | export-proven |
| `html` | expression-button HTML body | References applicant, workflow name, form number, and form URL. | export-proven |
| `taskurl` | UUID-like page reference | Redact as `<REDACTED_TASK_FORM_PAGE_ID>`. | export-proven |
| `terminate` | `false` | Allow Terminate toggle value. | export-proven |
| `terminate-conditions` | `null` | No terminate condition rows configured in the source export. | export-proven |
| `revoke-conditions` | condition array | Allow Recall condition rows. | export-proven |

## Allow Terminate

The export uses:

```json
{
  "terminate": false,
  "terminate-conditions": null
}
```

The Help Center describes Allow Terminate as a submitter-facing option that can be controlled by a condition editor. In this export, the field is present and disabled. Runtime terminate behavior is not tested.

## Allow Recall

The export uses `revoke-conditions` to store the recall condition. One condition row was observed.

Redacted normalized shape:

```json
{
  "revoke-conditions": [
    {
      "key": "<REDACTED_CONDITION_ID>",
      "pre": "and",
      "left": {
        "type": 1,
        "value": {
          "exprType": "variable",
          "valueType": "text",
          "id": "RequestNo",
          "type": "expr"
        }
      },
      "op": "s.!=",
      "right": {
        "type": 2,
        "value": [
          {
            "type": "str",
            "value": "<REDACTED_CONDITION_LITERAL>"
          }
        ]
      },
      "group": "string"
    }
  ]
}
```

This matches the newer operand-wrapper condition style: left operand uses `type: 1` direct selector; right operand uses `type: 2` expression editor tokens. Runtime recall behavior is not tested.

## Start Email Notification

Start email settings are configured on the Start node itself.

| Concept | Export shape | Notes | Proof |
|---|---|---|---|
| Enabled | `isenabledemail: true` | Enables submission/start notification. | export-proven |
| Recipients | `to` expression buttons | Applicant email and submitter email labels were observed; values redacted. | export-proven |
| Subject | `subject` expression-button rich text | Includes workflow name token. | export-proven |
| Body | `html` rich text | Includes applicant name, workflow name, form number, and form URL tokens. | export-proven |

Email delivery was not tested and must not be claimed.

## Help Center Comparison

| Help Center concept | Export-proven field/shape | Match status | Notes | Proof level |
|---|---|---|---|---|
| Start action has no incoming connector | `incoming: []` | matched | Export has zero incoming flows. | product-documented + export-proven |
| Start action initiates workflow | `StartNoneEvent` with 12 outgoing flows | matched | Runtime submit not tested. | product-documented + export-proven |
| Allow Terminate | `terminate`, `terminate-conditions` | matched | Export shows disabled terminate plus null conditions. | product-documented + export-proven |
| Allow Recall | `revoke-conditions` | partially matched | Export proves condition storage, but no explicit recall boolean was found. | product-documented + export-proven |
| Condition Editor | condition row with operand wrappers | matched | Shape aligns with existing workflow condition learning. | export-proven + validator-backed |
| Enable Email | `isenabledemail`, `to`, `subject`, `html` | matched | Delivery not tested. | product-documented + export-proven |

## Generation Rules

- Preserve Start node `incoming: []` and at least one outgoing sequence flow.
- Preserve `terminate` and `terminate-conditions` together when found.
- Preserve `revoke-conditions` as condition rows; do not convert to legacy HTML condition strings.
- Preserve `isenabledemail`, `to`, `subject`, and `html` together for Start notification.
- Do not generate real fixed email recipients in reusable packages.
- Do not claim terminate, recall, condition gating, or email delivery behavior without a focused runtime pass.

## Validator Recommendations

Validators should warn, not hard-error in compatibility mode, for:

- Start nodes with incoming flows
- Start nodes without outgoing flows
- non-boolean `terminate`
- non-array/non-null `terminate-conditions`
- non-array/non-null `revoke-conditions`
- email-enabled Start nodes missing `to`, `subject`, or `html`

## Known Gaps

- No enabled terminate example was found.
- No explicit recall boolean separate from `revoke-conditions` was found.
- Start condition runtime gating was not tested.
- Start email delivery was not tested.
