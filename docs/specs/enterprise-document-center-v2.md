# Enterprise Document Center V2

## Purpose

Enterprise Document Center is a Yeeflow application for organizing company documents across policies, projects, and reusable templates. The v2 goal is to prove generation beyond the minimal document-library base by using multiple Type `16` document libraries, simple custom fields, and additional document-library views.

## Canonical Base

Every generated document library starts from the runtime-passed `New Document Library` base definition:

- `ListModel.Type = 16`
- seven native/default fields: `Title`, `Bigint1`, `Text1`, `Bigint2`, `Text2`, `Text3`, `Text4`
- `Text4` remains the `file-upload` field
- default Type `0` view keeps `LayoutView = ""`
- one unassigned `New file` form
- no uploaded/list data rows and no document binaries

The older generated `Baseline Documents` shape is not used as the base definition.

## Libraries

### Company Policies

Purpose: Store HR, IT, Finance, and compliance policies.

Custom fields:

- Department
- Policy Category
- Effective Date
- Review Date
- Owner
- Status

Views:

- Default empty view from the base definition
- All Policies
- Active Policies
- Policies Pending Review
- By Department

Folder plan for runtime testing:

- HR Policies
- IT Policies
- Finance Policies
- Compliance Policies

### Project Documents

Purpose: Store project requirements, contracts, meeting notes, and delivery documents.

Custom fields:

- Project Name
- Document Category
- Customer
- Version
- Owner
- Status

Views:

- Default empty view from the base definition
- All Project Documents
- By Project
- Contracts
- Latest Versions

Folder plan for runtime testing:

- Requirements
- Contracts
- Meeting Notes
- Deliverables

### Templates and Forms

Purpose: Store reusable company templates and standard forms.

Custom fields:

- Template Type
- Department
- Version
- Approved By
- Status

Views:

- Default empty view from the base definition
- All Templates
- Active Templates
- By Department

Folder plan for runtime testing:

- HR Forms
- Finance Forms
- Project Templates
- Legal Templates

## Folder Handling

V2 does not pre-generate folder rows. Current learning only infers folder support from `Bigint1` / `ParentID`; the actual folder row shape is not yet export-backed or runtime-proven for generated packages. Folders should be created manually during runtime testing and documented as runtime proof if they appear and persist after refresh.

## Expected V2 Proof

V2 is expected to prove:

- multiple generated Type `16` document libraries in one app.
- custom text, choice, and date fields on document libraries.
- additional Type `0` views with configured `LayoutView` JSON.
- root app navigation entries for document-library resources.
- manual folder creation if tested in Yeeflow.

V2 should not overclaim:

- uploaded file persistence unless a safe dummy file is actually uploaded.
- generated folder row support.
- assigned New/Edit/View custom form mappings beyond the unassigned `New file` form.
