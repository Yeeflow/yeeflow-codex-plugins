# Yeeflow UI Section Template Library

This library defines reusable Yeeflow UI section templates for full application generation. A full application composition checklist should reference these templates by `templateId`; validators should reject required sections that omit a template or satisfy it with placeholder controls.

Machine-readable registry: `docs/templates/yeeflow-ui-section-template-library.normalized.json`

## Template Contract

Each template includes:

- `templateId`
- purpose and usage
- required Yeeflow controls and child controls
- required data bindings and fields
- layout, padding, card, grid, and style rules
- required action bindings when applicable
- validation rules
- allowed fallback
- proof status: `export-proven`, `runtime-proven`, `inferred`, or `needs-golden-proof`

## Dashboard Templates

### Standard dashboard page shell

All generated dashboard templates must be placed inside the export-proven page shell:

- Page content area: full width with content-area padding set to zero.
- Top-level Navigator structure: `Main` container, then `Content` container, then all visible dashboard sections.
- `Main` and `Content` must have meaningful Navigator labels and must not leave sections as page-root siblings.
- Layout-only Grid controls must have display caption/display label disabled.
- Every control must have a meaningful Navigator label; default labels such as `Container`, `Grid`, `Text`, `Button`, `Summary`, `Dynamic field`, `Kanban`, and `Collection` are invalid for generated-final output.
- Dynamic controls must remain inside row-context item templates such as Kanban, Collection, or Timeline.

### `dashboard_header_action_bar`

- Purpose: Create a page-level dashboard header with title, subtitle, and safe primary/secondary actions.
- Use when: Any generated dashboard has user-facing work entry points or navigation.
- Required controls: Container, Grid, Text, Button.
- Required child controls: title text, supporting subtitle text, action area, at least one action or documented inactive action note.
- Required data bindings: Optional page context; actions must target a page/form/list when active.
- Required fields: None.
- Layout rules: `safe_padding`, `grid_row`, `section_spacing`.
- Style rules: clear typography hierarchy, action alignment, no raw default button labels.
- Required actions: active buttons need valid navigation/form/action binding.
- Validation rules: known title/subtitle, no placeholder text, no active unbound buttons.
- Allowed fallback: static action notes may replace buttons when action schema is not safe.
- Proof status: inferred from dashboard exports; action binding proof varies by target.

### `kpi_card_row`

- Purpose: Display operational metrics in card containers.
- Use when: A dashboard needs high-level counts, risk totals, SLA/expiry counts, or workload metrics.
- Required controls: Container, Grid, Text, Summary.
- Required child controls: at least four card-like containers when the checklist expects four KPIs; each card needs label, visible formatted value Text, context text, and optional status/accent. Add hidden Summary controls in a hidden container when flexible text display is needed.
- Required data bindings: source lists through Summary controls, matching `page.exts[]` summary entries, `attrs.save_var`, dashboard `tempVars[]`, and visible Text controls bound to the temp variables.
- Required fields: primary item field plus relevant status/date/risk fields.
- Layout rules: `safe_padding`, `grid_row`, `card_container`, `section_spacing`.
- Style rules: card background/border/shadow/radius where supported; 16px or greater gaps; value typography larger than label.
- Required actions: none by default.
- Validation rules: not plain text only, card structure present, required labels present, Summary controls resolve to source lists, `save_var` references declared temp variables, visible KPI values bind to temp variables, no static numeric KPI Text.
- Allowed fallback: labeled static aggregate placeholders only with documented aggregate-binding gap and explicit user approval.
- Proof status: export-proven and user-confirmed in Vendor Onboarding v4.1 using the Service Desk Pro Executive Dashboard summary-to-temp-variable pattern.

### `progress_summary_card`

- Purpose: Present completion, risk, score, or progress state in a focused card.
- Use when: A dashboard, detail page, or review workspace needs a percentage or score visualization.
- Required controls: Container, Progress circle or Progress bar, Text, Dynamic field where available.
- Required child controls: title, progress visual, numeric/label value, explanatory text.
- Required data bindings: progress/score/status field or documented aggregate fallback.
- Required fields: progress, score, or status field named by checklist.
- Layout rules: `card_container`, `section_spacing`.
- Style rules: progress visual aligned with summary copy; no bare progress control without context.
- Required actions: none.
- Validation rules: progress control present, business label present, data binding or fallback reason present.
- Allowed fallback: Progress bar may replace Progress circle.
- Proof status: export-proven for advanced controls; needs golden proof for final design polish.

### `business_alert_card`

- Purpose: Show a business-specific risk, warning, or required action.
- Use when: A page needs to surface compliance, expiry, review, or blocking issues.
- Required controls: Alert, Container, Text, optional Dynamic field.
- Required child controls: alert title, alert description, supporting context text.
- Required data bindings: related risk/status/expiry/review fields when data-bound.
- Required fields: at least one business risk/status/date/action field when specified by checklist.
- Layout rules: `card_container`, `section_spacing`.
- Style rules: meaningful severity styling where supported; no default alert copy.
- Required actions: optional; only active when binding is valid.
- Validation rules: fail `Alert`, `Here is the description`, and placeholder content.
- Allowed fallback: none for default content; static business-specific text is acceptable if dynamic alert binding is deferred.
- Proof status: export-proven for Alert control; business-content rule inferred from runtime failures.

### `data_table_section`

- Purpose: Present a configured table of records with meaningful display columns.
- Use when: A page needs searchable/scannable record lists.
- Required controls: Data table and enclosing Container/section.
- Required child controls: section title, Data table, configured columns.
- Required data bindings: `attrs.data.list` with AppID, ListID, Type, Title, and ListSetID where dashboard rules require it.
- Required fields: every display column must include source `Field` and visible `FieldName`.
- Layout rules: `safe_padding`, `section_spacing`, optional `card_container`.
- Style rules: table is visually grouped under a section title; not dumped directly at page edge.
- Required actions: optional row action only when valid.
- Validation rules: source list resolves, columns exist, `Field` and `FieldName` exist, required fields present.
- Allowed fallback: Collection/list cards only if Data table is unsupported and fields are preserved.
- Proof status: runtime-proven for Vendor Onboarding Data table binding.

### `kanban_status_board`

- Purpose: Display records grouped by status/risk/category with useful card content.
- Use when: Work needs status movement, review queues, or operational triage.
- Required controls: Kanban, Container, Text, Dynamic field, optional Button/Icon.
- Required child controls: board title, Kanban lanes, item template with at least three dynamic fields, action area or documented no-action reason.
- Required data bindings: source list and category/status field.
- Required fields: title/name, status/category, owner or date, risk/priority where relevant.
- Layout rules: `card_container`, `section_spacing`, `grid_row` where surrounding layout uses columns.
- Style rules: item template must look like a card, not a blank lane or title-only item.
- Required actions: view/edit/update/delete only when bound to valid actions.
- Validation rules: item template dynamic field count, required fields, action binding when required.
- Allowed fallback: Collection board with grouped sections and same item fields.
- Proof status: runtime-proven in focused Collection/Kanban action package for scoped actions; needs golden proof for polished full-app board.

### `collection_card_board`

- Purpose: Display records as cards or grouped card sections.
- Use when: A status board, quick review queue, or related-record card list is better than a table.
- Required controls: Collection, Container, Text, Dynamic field, optional Button/Icon.
- Required child controls: board title, item template with at least three dynamic fields, action area or documented no-action reason.
- Required data bindings: source list and item-template current item context.
- Required fields: title/name, status, owner/date, risk/priority or business-specific field.
- Layout rules: `card_container`, `section_spacing`, optional `grid_row`.
- Style rules: card-like item template with readable hierarchy and badges where supported.
- Required actions: view/edit/update/delete only when bound to valid actions.
- Validation rules: dynamic fields and action references resolve; no placeholder-only cards.
- Allowed fallback: Data table if cards are unsafe, with documented reason.
- Proof status: runtime-proven in focused Collection/Kanban action package for scoped actions; needs golden proof for polished full-app cards.

### `quick_links_icon_list`

- Purpose: Provide clear navigation shortcuts to common app tasks.
- Use when: A dashboard needs fast movement to forms, views, print pages, or workspaces.
- Required controls: Icon list or Container/Grid cards with Text and Button.
- Required child controls: label, icon or visual marker, description or target context, action binding or inactive note.
- Required data bindings: navigation targets; no list binding required.
- Required fields: none.
- Layout rules: `card_container`, `grid_row`, `section_spacing`.
- Style rules: compact cards or icon rows; no unlabeled buttons.
- Required actions: navigation/form open action for active quick links.
- Validation rules: link labels present; active links have action binding.
- Allowed fallback: static shortcut notes when navigation action schema is unsafe.
- Proof status: inferred; needs golden proof for navigation polish.

### `recent_activity_timeline`

- Purpose: Show chronological activity, history, or milestones.
- Use when: A dashboard or detail page needs recent changes or review events.
- Required controls: Vertical Timeline or Collection fallback, Container, Dynamic field.
- Required child controls: date, title, type/status, actor, description.
- Required data bindings: activity/history source list.
- Required fields: Activity Date, Activity Title, Activity Type, Actor, Description or checklist equivalents.
- Layout rules: `section_spacing`, optional `card_container`.
- Style rules: chronological visual grouping, not a plain unlabelled list.
- Required actions: none by default.
- Validation rules: item template fields present; source list resolves.
- Allowed fallback: Collection with timeline-style item template.
- Proof status: render-proven for timeline controls; needs golden proof for polished app activity feed.

## Data List Form Templates

### `detail_view_header_summary`

- Purpose: Give a record detail page a strong summary header.
- Use when: A View form or detail page opens a primary record.
- Required controls: Container, Grid, Text, Dynamic field, Dynamic user, optional Button.
- Required child controls: title field, status/risk badges, owner/user, key dates, safe actions or notes.
- Required data bindings: current list item fields.
- Required fields: primary title/name, status, risk/priority, owner.
- Layout rules: `safe_padding`, `card_container`, `grid_row`, `section_spacing`.
- Style rules: card-like header with hierarchy and badge-like statuses.
- Required actions: edit/open related actions only when valid.
- Validation rules: nonblank form, required fields, card structure, no placeholder actions.
- Allowed fallback: read-only header without buttons when actions are unsafe.
- Proof status: export-proven custom form bindings; needs golden proof for detail-page composition.

### `tabbed_detail_page`

- Purpose: Organize detail pages into Overview, Documents, Compliance, Tasks, and History sections.
- Use when: A primary record has multiple related data areas.
- Required controls: Tabs or sectioned Containers/Toggle, Divider, related section controls.
- Required child controls: tab/section labels, content containers for each required area.
- Required data bindings: current record and related lists where sections are data-bound.
- Required fields: checklist section fields.
- Layout rules: `safe_padding`, `section_spacing`, `card_container`.
- Style rules: clear section navigation; no empty tab bodies.
- Required actions: optional section actions only when valid.
- Validation rules: required labels and content controls present.
- Allowed fallback: sectioned layout when Tabs are not safe.
- Proof status: advanced controls export-proven; needs golden proof for full detail layout.

### `sectioned_new_edit_form`

- Purpose: Create a usable New/Edit form with business sections and field groups.
- Use when: Users create or edit list records.
- Required controls: Container, Grid/Flex grid, Field/list-bound controls, Text, optional Alert.
- Required child controls: section title, grouped fields, help text when useful.
- Required data bindings: host list fields.
- Required fields: fields named by the checklist section.
- Layout rules: `safe_padding`, `section_card`, `grid_row`, `section_spacing`.
- Style rules: section cards, two-column desktop field grid where supported, clear labels.
- Required actions: Save/Submit only when valid form action binding exists.
- Validation rules: form is nonblank, required fields present, grouped into sections.
- Allowed fallback: single-column section cards when grid settings are unsafe.
- Proof status: export-proven custom form field bindings; needs golden proof for polished generated form.

### `required_documents_checklist`

- Purpose: Collect or display required onboarding documents.
- Use when: A form or detail page needs document requirements and file uploads.
- Required controls: Dynamic Sub List or Data table/related Collection, Field, Dynamic file, Container.
- Required child controls: document type, required flag, file attachment, expiry/review status.
- Required data bindings: document checklist sub-list or Vendor Documents list.
- Required fields: Document Type, Required, File Attachment, Expiry Date, Review Status where available.
- Layout rules: `section_card`, `section_spacing`.
- Style rules: table/checklist layout with clear document rows.
- Required actions: Add/remove/upload only when sub-list actions are valid.
- Validation rules: source and fields present; no blank checklist.
- Allowed fallback: related Vendor Documents Data table when Dynamic Sub List is not safe.
- Proof status: export-proven Dynamic Sub List/print patterns; runtime scope depends on host.

### `related_records_section`

- Purpose: Show child/related records on a detail page.
- Use when: Documents, reviews, tasks, or history are related to a primary record.
- Required controls: Data table, Collection, Timeline, or Document embed depending on related data.
- Required child controls: section title, configured columns or item template fields.
- Required data bindings: related source list filtered or contextualized by current record when safe.
- Required fields: checklist section fields.
- Layout rules: `section_card`, `section_spacing`.
- Style rules: readable section title and grouped table/cards.
- Required actions: add/view/edit only when valid.
- Validation rules: related section not blank; fields and source present.
- Allowed fallback: read-only related list/table with documented filter binding gap.
- Proof status: inferred from Data table, Collection, Timeline, and custom form studies.

### `print_page_summary`

- Purpose: Create a read-only print-oriented record summary.
- Use when: A generated app needs a printable Vendor/Quotation/Record summary.
- Required controls: Container, Grid, Text, Dynamic field, Divider.
- Required child controls: print header, summary fields, status badges, review/compliance summary.
- Required data bindings: current list item fields.
- Required fields: primary title/name, code/id, status/risk, owner/contact fields where applicable.
- Layout rules: `print_layout`, `safe_padding`, `section_spacing`, `no_mutating_actions`.
- Style rules: print-friendly spacing, section dividers, no active mutation buttons.
- Required actions: none on the print page.
- Validation rules: read-only, nonblank, fields present.
- Allowed fallback: vendor code text if QR/barcode is unsafe.
- Proof status: export-proven Print Page target; needs golden proof for final print aesthetics.

### `print_page_document_checklist`

- Purpose: Print document status and checklist rows.
- Use when: Printable output includes required documents or compliance evidence.
- Required controls: Data table or Dynamic Sub List, Container, Text.
- Required child controls: document type, status, expiry, reviewer/notes.
- Required data bindings: related documents or sub-list rows.
- Required fields: Document Type, Review Status, Expiry Date, Reviewer/Notes where available.
- Layout rules: `print_layout`, `section_spacing`, `no_mutating_actions`.
- Style rules: compact printable rows with clear headers.
- Required actions: none.
- Validation rules: table/list fields present; no mutation actions.
- Allowed fallback: static checklist rows only with documented data-binding gap.
- Proof status: export-proven print Dynamic Sub List pattern.

### `print_page_qr_barcode_section`

- Purpose: Add scannable or textual record identity to print output.
- Use when: A print page needs QR code, barcode, or safe record code fallback.
- Required controls: QR Code or Barcode, Container, Text, Dynamic field.
- Required child controls: code value, label, fallback text.
- Required data bindings: record code/id field.
- Required fields: Vendor Code or equivalent record code.
- Layout rules: `print_layout`, `section_spacing`.
- Style rules: compact right/left aligned identity block.
- Required actions: none.
- Validation rules: QR/barcode or fallback code present.
- Allowed fallback: plain Vendor Code field when QR/barcode control is not safe.
- Proof status: advanced controls export-proven; needs golden proof for print integration.

## Item Template And Action Templates

### `kanban_card_with_dynamic_fields`

- Purpose: Standardize Kanban card content.
- Use when: A Kanban item template is required.
- Required controls: Kanban item template, Dynamic field, optional Dynamic user, Button/Icon.
- Required child controls: title, status/risk badge, owner/date, action area.
- Required data bindings: current Kanban item context.
- Required fields: at least three dynamic business fields.
- Layout rules: `card_container`, `section_spacing`.
- Style rules: card hierarchy, badge-like status/risk, no title-only cards.
- Required actions: view action when checklist requires actions.
- Validation rules: dynamic field count, required fields, action binding.
- Allowed fallback: Collection card template with same field/action contract.
- Proof status: runtime-proven for focused Collection/Kanban action package.

### `collection_card_with_dynamic_fields`

- Purpose: Standardize Collection card content.
- Use when: A Collection item template is required.
- Required controls: Collection item template, Dynamic field, optional Dynamic user/file/image, Button/Icon.
- Required child controls: title, status/risk/priority, owner/date, action area or no-action note.
- Required data bindings: current Collection item context.
- Required fields: at least three dynamic business fields.
- Layout rules: `card_container`, `grid_row` where cards are grouped.
- Style rules: readable card hierarchy; no blank or title-only cards.
- Required actions: view/edit/update/delete only when checklist requires and bindings are valid.
- Validation rules: dynamic field count, fields present, action binding.
- Allowed fallback: Data table with equivalent columns and documented reason.
- Proof status: runtime-proven for focused Collection/Kanban action package.

### `item_action_bar_edit_delete_update`

- Purpose: Standardize item-level actions on Kanban/Collection cards.
- Use when: Cards need edit, delete, status update, or workflow actions.
- Required controls: Button or Icon controls bound to local Collection/Kanban actions.
- Required child controls: visible labels/icons, action ids, current-item context.
- Required data bindings: current item `ListDataID` and target layout/fields where needed.
- Required fields: target update fields when update actions are present.
- Layout rules: `section_spacing`.
- Style rules: compact action row; destructive action visually distinguishable where supported.
- Required actions: edit/delete/update must resolve; otherwise omit active control.
- Validation rules: no unresolved action ids, variables, fields, or target layouts.
- Allowed fallback: static action notes with reason.
- Proof status: runtime-proven for focused Collection/Kanban action package.

### `selection_bulk_toolbar`

- Purpose: Standardize bulk actions for selected card/list records.
- Use when: Users need multi-select update/delete/review operations.
- Required controls: Container, Text, Checkbox/Icon selection, Button.
- Required child controls: selection count, selected state indicator, bulk action buttons.
- Required data bindings: selected IDs/count temp variables and target update/delete actions.
- Required fields: target update fields for bulk status changes.
- Layout rules: `card_container`, `section_spacing`.
- Style rules: toolbar visible only when selection count is greater than zero where dynamic display is safe.
- Required actions: bulk buttons need valid page/local action binding.
- Validation rules: selected IDs/count variables and actions resolve.
- Allowed fallback: omit active bulk toolbar and document deferred reason.
- Proof status: runtime-proven in focused Collection/Kanban action package for scoped behavior.

## Reference Corpus Coverage

The template library is now mapped against four existing Yeeflow reference exports. These exports are treated as export evidence only unless a separate focused runtime proof exists.

| Template ID | Reference evidence | Current proof status | Remaining limitation |
| --- | --- | --- | --- |
| `dashboard_header_action_bar` | Projects Center_2 dashboard actions; Company Overview dashboard headers | export-proven | Action targets must still resolve per generated package. |
| `kpi_card_row` | Sales Management summary controls; Projects Center summaries | needs-golden-proof | Existing exports prove metrics/summary controls, not the polished four-card KPI row required for Vendor Onboarding. |
| `progress_summary_card` | Company Overview progress controls; Projects Center progress indicators | export-proven | Aggregate/binding formulas remain package-specific. |
| `business_alert_card` | Company Overview Alert controls | export-proven | Business-specific copy is not proven by generic reference alert content and remains mandatory. |
| `data_table_section` | Sales Management dashboard and Account view Data tables with `Field`/`FieldName` columns | runtime-proven | Row actions and filters remain separate checks. |
| `kanban_status_board` | Company Overview Kanban; Data Lists Kanban views; Projects/Sales Kanban views | runtime-proven | Drag/drop and all action variants require focused runtime proof. |
| `collection_card_board` | Company Overview Collection of activity; Projects Center card collections | runtime-proven | Some export collections are sparse, so generated cards must still meet dynamic-field minimums. |
| `quick_links_icon_list` | Projects Center action buttons; Company Overview Icon list | export-proven | Full quick-link navigation cards need action validation. |
| `recent_activity_timeline` | Company Overview vertical/horizontal timeline controls | export-proven | Timeline interaction beyond render is not proven. |
| `detail_view_header_summary` | Company Overview, Projects Center, and Sales detail/view pages | export-proven | Badge styling and actions need package validation. |
| `tabbed_detail_page` | Company Overview Tab/Toggle pages; Projects detail navigation | export-proven | Exact generated host shape must match dashboard or form host. |
| `sectioned_new_edit_form` | Data Lists custom forms; Sales New/Edit forms; Projects edit forms | export-proven | Card polish and spacing still need template conformance. |
| `required_documents_checklist` | Data Lists Dynamic Sub List; Projects document forms | export-proven | Vendor-style checklist lifecycle still needs golden or focused validation. |
| `related_records_section` | Projects detail related collections; Sales Account related Data tables | export-proven | Related-list filters/current-record context must resolve per package. |
| `print_page_summary` | No clear print-page layout in inspected exports | needs-golden-proof | New golden reference still needed. |
| `print_page_document_checklist` | No clear print document checklist in inspected exports | needs-golden-proof | New golden reference still needed. |
| `print_page_qr_barcode_section` | Company Overview QR Code and Barcode controls | needs-golden-proof | QR/barcode print-page integration still needs proof. |
| `kanban_card_with_dynamic_fields` | Company Overview Kanban item template with dynamic fields/actions | runtime-proven | Generated packages must resolve action targets and current-item fields. |
| `collection_card_with_dynamic_fields` | Company Overview Collection item template with dynamic fields/actions | runtime-proven | Generated packages must resolve action targets and current-item fields. |
| `item_action_bar_edit_delete_update` | Company Overview item action buttons; prior focused runtime proof | runtime-proven | Runtime mutation claim remains scoped to focused proof package. |
| `selection_bulk_toolbar` | Company Overview bulk Mark completed/Delete selected actions; prior focused runtime proof | runtime-proven | Selected IDs/count variables must resolve per generated package. |

Reference corpus conclusion: the existing exports are enough to strengthen most dashboard, custom form, Data table, Kanban/Collection, timeline, and action templates. A new golden app is still needed for polished KPI card rows and print-page composition, especially print summary, print document checklist, and QR/barcode integration on print pages.

## Additional KPI And Print Golden References

Additional reference exports were studied to close the remaining KPI and print gaps. Treat these as export-proven structure and binding evidence only unless a separate runtime proof exists.

| Template ID | Additional reference evidence | Updated proof status | Remaining limitation |
| --- | --- | --- | --- |
| `kpi_card_row` | `DEMO Innovation Ecosystem Platform (1).yap` / `NHIC Innovation Overview`; `Service Desk Pro (2).yap` / `Executive Dashboard` | export-proven | Aggregate correctness and runtime values remain package-specific. |
| `dashboard_header_action_bar` | NHIC and Service Desk dashboard header/filter/action rows | export-proven | Action targets and filter variables must still resolve per generated package. |
| `progress_summary_card` | Service Desk and NHIC Summary/chart metric groups | export-proven | Generated packages must validate aggregate bindings and business labels. |
| `data_table_section` | `Online Library.yap` / `Print Inventory`; `Sales Quotation.yap` / `Print Page` | runtime-proven for dashboard Data table binding, export-proven for print line-item/table sections | Dashboard Data table and print line-item/list controls use different schemas and must be validated separately. |
| `print_page_summary` | `Sales Quotation.yap` / `Print Page`; `Online Library.yap` / `Print Inventory` | export-proven | Browser print/page-break behavior still needs runtime/manual proof. |
| `print_page_document_checklist` | Online Library multi-item inventory print table; Sales Quotation single-record line-item table/list | export-proven | Generated print tables/checklists must be read-only and bind configured fields. |
| `print_page_qr_barcode_section` | Online Library `Detail Page` and `Barcode Scan` prove QR/barcode controls; Sales Quotation proves print layout | needs-golden-proof | QR/barcode controls inside an actual print-page layout are still only partially covered. |

Expanded corpus conclusion: polished KPI rows, print summaries, print item/checklist/table sections, and QR/barcode print sections are now sufficiently export-proven for page-by-page generation. A new broad golden app is no longer needed for known template-library gaps; browser print/page-break behavior and scanned QR destination behavior remain runtime/manual proof boundaries.

## QR Code Print Page References

`Online Library (1).yap` and `Sales Quotation (1).yap` close the remaining QR/barcode print template gap.

| Template ID | QR print evidence | Updated proof status | Remaining limitation |
| --- | --- | --- | --- |
| `print_page_qr_barcode_section` | `Online Library (1).yap` / `Print Inventory` includes `list-qrcode` inside a repeated Collection item context; `Sales Quotation (1).yap` / `Print Page` includes `list-qrcode` inside the single-record print page container. | export-proven | Browser print rendering, page breaks, and scanned QR destination behavior still need runtime/manual proof. |

QR generation rule: place QR controls inside the print page or inside the print item template/repeated row context. Bind the QR value to current item/current record context or a business code field. Do not generate static placeholder QR URLs. If QR binding is not safe, use a field-bound business code fallback such as Vendor Code, Quote Number, Inventory Code, or Serial Number and document the deferment.
