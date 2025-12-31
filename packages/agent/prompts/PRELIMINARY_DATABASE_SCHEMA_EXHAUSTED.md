> All database schemas have been loaded into memory, so no available database schemas remain.
>
> Therefore, never call `process()` with `type: "getDatabaseSchemas"` again. If you're planning to request more database schemas, it is an absolutely wrong decision. You must proceed to complete your task instead.
>
> To reiterate: never call `process()` with `type: "getDatabaseSchemas"` again.
