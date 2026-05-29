# Application Generation Knowledge Gap Audit

Date: 2026-05-29

Branch: `codex/application-generation-knowledge-gap-audit`

## Executive Summary

The audit found that Yeeflow Builder Plugin v0.6.2 solved important import and package-shape problems, but it does not reliably turn previously learned Yeeflow feature knowledge into high-quality full application generation.

The main finding is a release-boundary and packaging gap:

- The v0.6.2 final tag points to `004fcbd1352548aa46250f24ccf4d86a808b3862`.
- Current `official/main` is newer at `1f78390cf3b9eb724bd5ca3812e7956f6be52839`.
- Several full-application quality, strict visual quality, and composition-checklist rules were added after the v0.6.2 final tag.
- In current main, `skills/installed/*` and `dist/yeeflow-builder-plugin/skills/*` are synchronized for the audited skills.
- The packaged archive `dist/yeeflow-builder-plugin-0.6.2.zip` is stale relative to current `dist/yeeflow-builder-plugin/skills` for seven application-generation skills. It does not include the later strict quality and composition-checklist guidance.

This means an installed official v0.6.2 plugin can include the import fixes while still lacking the later full-application quality enforcement work. Even where the knowledge exists in current source skills, it is still too instruction-heavy and not template-driven enough to force good page composition, custom forms, Collection/Kanban item templates, and action bindings.

## Scope

This audit did not generate or debug a new package. It reviewed repository studies, normalized refs, generated app plans, source skills, dist skill mirrors, and the v0.6.2 archive.

## Release Boundary

| Item | Result |
| --- | --- |
| Latest final release tag | `yeeflow-builder-plugin-v0.6.2` |
| v0.6.2 tag target | `004fcbd1352548aa46250f24ccf4d86a808b3862` |
| Current official main | `1f78390cf3b9eb724bd5ca3812e7956f6be52839` |
| Notable post-v0.6.2 commits | `f0ffc48` strict visual quality, `c1fc757` v4 composition checklist, `1f78390` checklist validator support |
| Dist skill directory count | 21 skills |
| Zip archive skill count | 21 skills |

The current repository contains knowledge that the immutable v0.6.2 release tag cannot contain unless a later release is built.

## Capability Inventory

| Capability | Source study/proof doc | Runtime proof status | Skills that should contain it | Repo skill includes it | Dist mirror includes it | v0.6.2 archive includes it | v4 appeared to apply it | Gap found |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Collection control basics | `docs/studies/kanban-collection-dynamic-controls.md`; normalized `kanban-collection-dynamic-controls/*` | Import/open/render proof for focused package; limited runtime proof boundary | application-builder, application-generator, dashboard-generator, package-validator | Yes | Yes | Partial | Weakly | Knowledge exists, but no high-quality card template forced use |
| Kanban control basics | `docs/studies/kanban-collection-dynamic-controls.md`; normalized `kanban-collection-dynamic-controls/*` | Import/open/render proof for focused package; limited runtime proof boundary | application-builder, application-generator, dashboard-generator, package-validator | Yes | Yes | Partial | Weakly | Generated boards were underbuilt or placeholder-like |
| Collection/Kanban actions | `docs/studies/collection-kanban-actions.md`; `docs/studies/collection-kanban-actions-runtime-proof.md`; normalized `collection-kanban-actions/*` | User-confirmed focused runtime proof; limited to tested package | application-builder, application-generator, dashboard-generator, package-validator, runtime-test-orchestrator | Yes | Yes | Partial | Weakly | Action validation knowledge exists but generator did not produce rich valid item actions |
| Dynamic controls inside item templates | `docs/studies/kanban-collection-dynamic-controls.md`; normalized dynamic field/user/file/image refs | Export-proven and focused import/open proof; runtime display proof limited | application-builder, application-generator, dashboard-generator, data-list-generator, package-validator | Yes | Yes | Partial | Weakly | No reusable item-template composition library forces dynamic fields |
| Dynamic Sub List | `docs/studies/data-list-print-page-dynamic-sub-list.md`; normalized `data-list-print-page-dynamic-sub-list/*` and `sub-list-dynamic-content/*` | Export-proven and focused package validation; runtime scope limited by package | application-builder, application-generator, data-list-generator, package-validator | Yes | Yes | Partial | Not meaningfully | Generator did not apply sub-list/form section templates to Vendor forms |
| Print Page | `docs/studies/data-list-print-page-dynamic-sub-list.md`; normalized print page refs | Export-proven print page shape and action pattern | application-builder, application-generator, data-list-generator, package-validator | Yes | Yes | Partial | Weakly | The full app lacked a high-quality print-page template |
| Timeline | normalized `timeline-controls-dynamic-controls/*` | Focused import/open/render proof; non-empty media/user display not broadly proven | application-builder, application-generator, dashboard-generator, package-validator | Yes | Yes | Partial | Weakly | Recent activity/history sections were not forced to use a meaningful timeline/card pattern |
| Advanced Controls | `docs/studies/advanced-controls.md`; normalized `advanced-controls/*` | Export-proven summaries and focused runtime-proof patterns depending on control | application-builder, application-generator, dashboard-generator, data-list-generator, package-validator | Yes | Yes | Partial | Partly | Controls existed but often with generic/default content |
| Data List custom forms | `docs/studies/data-list-custom-form-fields.md`; normalized `data-list-custom-forms/*` | Export-proven custom forms and layout assignment; runtime save/action proof varies | application-builder, application-generator, data-list-generator, package-validator | Yes | Yes | Partial | Poorly | Forms were blank/generic because no mandatory form-section templates are enforced |
| Current dashboard structure | `docs/studies/vendor-onboarding-dashboard-version-study.md`; normalized `vendor-onboarding-dashboard-version/*` | Vendor Onboarding v1.12 YAP import proof; v1.15 YAPK install proof | application-generator, dashboard-generator, yapk-package-generator, package-validator | Yes | Yes | Yes | Yes | This technical rule was applied better than visual composition rules |
| Data table `Field`/`FieldName` binding | `docs/studies/vendor-onboarding-dashboard-version-study.md`; normalized `current-dashboard-data-table-binding.normalized.json` | Proven by v1.12 import and later full UI installs | application-generator, dashboard-generator, package-validator | Yes | Yes | Yes | Yes | Technical binding rule applied; table presence still not enough for app quality |
| YAP/YAPK import rules | `docs/studies/vendor-onboarding-yapk-runtime-proof.md`; normalized `vendor-onboarding-yapk/*`; `docs/studies/application-creation-quality-hardening.md` | YAP v1.12 import, YAPK v1.15 install, later full UI YAPK install | application-generator, yapk-package-generator, package-validator | Yes | Yes | Mostly | Mostly | Import rules are stronger than design rules; YAP edge cases still need separate debugging |
| Full-scope app planning | `docs/generated-app-plans/vendor-onboarding-compliance-ui-implementation-spec.md`; `docs/studies/application-generation-quality-hardening.md` | Planning docs exist; runtime quality proof failed for v2/v3/v4 | application-builder, application-generator, runtime-test-orchestrator | Yes | Yes | No for later checklist guidance | Weakly | Planning was not translated into executable templates before generation |
| Strict visual quality and composition checklist | `docs/studies/vendor-onboarding-full-ui-quality-failure-analysis.md`; `docs/generated-app-plans/vendor-onboarding-v4-composition-checklist.*` | Validator exists; v3/v4 showed gates were still too structural | application-builder, application-generator, package-validator, runtime-test-orchestrator | Yes on current main | Yes on current main | No for post-v0.6.2 guidance | Structurally | Zip staleness plus validator/template weakness allowed poor output |

## Skill Packaging Audit

The audited source skills and dist skill mirrors match exactly:

- `yeeflow-application-builder`
- `yeeflow-application-generator`
- `yeeflow-dashboard-generator`
- `yeeflow-data-list-generator`
- `yeeflow-yapk-package-generator`
- `yeeflow-package-validator`
- `yeeflow-runtime-test-orchestrator`
- `yeeflow-feature-learning-orchestrator`
- `yeeflow-approval-form-generator`

The packaged archive `dist/yeeflow-builder-plugin-0.6.2.zip` differs from current dist mirrors for seven of those skills:

- `yeeflow-application-builder`
- `yeeflow-application-generator`
- `yeeflow-dashboard-generator`
- `yeeflow-data-list-generator`
- `yeeflow-yapk-package-generator`
- `yeeflow-package-validator`
- `yeeflow-runtime-test-orchestrator`

For the first six application-quality-critical skills plus the runtime orchestrator, current main contains guidance such as `Full Application Visual Quality Gate`, `composition checklist`, and `import/install success is not enough`, but the v0.6.2 archive does not. `yeeflow-feature-learning-orchestrator` and `yeeflow-approval-form-generator` matched between current dist and the archive.

## Why v0.6.2 Solved Import But Not App Quality

The v0.6.2 release was primarily an import-generation milestone. It included the proven YAP/YAPK package-shape rules, current dashboard shell, API ID handling, large ID preservation, and Data table `Field`/`FieldName` binding fixes.

The later full-application quality lessons were discovered after v0.6.2:

- Full UI v2 imported but had poor application quality.
- Full UI v3 passed strict validation but still looked nearly unchanged from v2.
- The v4 composition checklist was added to make generation more enforceable.

Those later lessons are present on current main, but not in the v0.6.2 final tag. The official installed v0.6.2 plugin therefore should not be expected to apply the post-release composition checklist unless a newer release is built and installed.

## V4 Generation Gap Analysis

The v4 attempt still exposed deeper workflow problems beyond the release boundary:

- The checklist and validator can describe required sections, but the generator can still satisfy them with low-quality controls unless concrete layout templates are mandatory.
- A section ID plus control presence does not prove visual fidelity.
- A KPI card row is not acceptable if it renders as plain text blocks without a strong card/grid layout.
- A button label is not enough; the control needs a valid action or should not render as active.
- Collection/Kanban sections need item templates with dynamic fields, status/risk display, and valid actions; the generator did not consistently produce that.
- Custom forms need actual layout templates for view, new/edit, and print pages; the generator still relied too much on generic/default form creation.
- Prior feature proofs were focused and local. They prove safe shapes, not that a full app generator will combine them into a polished application.
- The generator workflow appears to be driven by broad natural-language instructions and a bespoke package script rather than a reusable library of proven Yeeflow UI section templates.

## Root Causes

| Category | Finding |
| --- | --- |
| A. Knowledge missing from bundled skill | Partly true for the v0.6.2 archive: post-release quality/checklist guidance is not in the archive. |
| B. Knowledge present but too vague | True: current skills state the rules but do not provide enough concrete page/control templates to force high-quality output. |
| C. Workflow does not force use | True: full app generation can proceed without proving every planned section maps to a concrete template and action binding. |
| D. Validator accepts placeholders | True: earlier strict/composition gates still allowed structural compliance with weak visual output. |
| E. No reusable high-quality templates | True: there is no canonical template library for KPI cards, dashboard headers, Kanban cards, detail views, form sections, and print pages. |
| F. No golden reference app | True: feature studies are many, but there is no high-quality full app export used as a golden benchmark. |
| G. Too much broad instruction | True: natural-language checklist guidance is necessary but insufficient for repeatable package generation. |
| H. Import fixes distracted from app quality | True: the recent proof cycles optimized installability first, and visual/application composition lagged behind. |

## Recommended Fixes

1. Build a Yeeflow UI section template library before generating another broad full app.

   Required templates should include dashboard header, KPI card row, alert card, action bar, Kanban card, Collection card, detail summary header, steps section, tabbed detail sections, new request form cards, required document checklist, print page summary, and timeline/activity section.

2. Create a golden reference application export.

   Manually design or product-export a small high-quality application that uses the required dashboard, custom form, Kanban/Collection, action, and print-page patterns. Decode it into normalized refs and use it as the validator benchmark.

3. Make generation page-by-page.

   Generate and validate each required page/form/dashboard against the composition checklist before assembling the final package. Do not generate the full package in one jump.

4. Upgrade the composition checklist from section existence to template conformance.

   Each checklist section should name a `templateId`, required child controls, required style/layout attributes, required data bindings, required action bindings, and allowed fallbacks.

5. Add screenshot-based runtime review to the proof loop.

   Package inspection can catch schema problems, but visual fidelity needs screenshot/runtime comparison against the approved mockups or a golden reference.

6. Release a v0.6.3 candidate only after rebuilding the plugin archive.

   Current main has newer skill guidance than the v0.6.2 tag/archive. A future release should rebuild the archive after the template library and stronger validators land.

## Release Recommendation

Do not build a release from this audit alone. The next technical step should be to create reusable high-quality Yeeflow UI section templates and a golden reference app export, then generate Vendor Onboarding v4.1 page by page using both the composition checklist and the template library.
