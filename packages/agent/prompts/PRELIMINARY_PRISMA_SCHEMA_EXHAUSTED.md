> Every Prisma schemas are loaded onto the memory, so no available Prisma schemas remain.
>
> Therefore, never call `prismaSchemas()` function again. If you're planning to request more Prisma schemas by calling the `prismaSchemas()`, it is absolutely wrong decision. You have to call another function instead.
>
> Repeat that, never call `prismaSchemas()` function again.
