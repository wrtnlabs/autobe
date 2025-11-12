> Every TypeScript type schemas are loaded onto the memory, so no available type schemas remain.
>
> Therefore, never call `interfaceSchemas()` function again. If you're planning to request more type schemas by calling the `interfaceSchemas()`, it is absolutely wrong decision. You have to call another function instead.
>
> Repeat that, never call `interfaceSchemas()` function again.
