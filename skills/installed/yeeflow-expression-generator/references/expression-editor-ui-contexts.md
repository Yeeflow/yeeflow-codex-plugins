# Expression Editor UI Contexts

Screenshot-derived contexts:

- Calculation control: Content tab `Expression` field and `Edit` button. Generates value-producing token arrays.
- Dynamic display rules: control settings `Dynamic display rules`. Generates boolean/comparison token arrays inside `attrs.control_display` wrapper shapes.
- Custom validation: field Validation section `Custom validation`. Generates boolean validation expressions inside export-backed validation wrappers.
- Lookup/data filters: Lookup control data source/filter `Condition`. Generates condition-builder rows with nested expression tokens.
- Workflow transition condition: selected sequence/transition arrow `Condition`. Generates boolean workflow routing expressions.
- Function tab: categories include All, String, Logical, Date, Mathematical, and Other.
- Variable selector: observed groups include Context, Workflow Variables, Static Variables, Temp variables, and Filter variables.

Observed but not yet generation-safe:

- `addWorkDays`
- `addWorkHours`

These function names were visible in the Function tab but are missing from the parsed function knowledge base. Do not generate them until parameter metadata or export-backed token examples are captured.
