> Every API operations are loaded onto the memory, so no available API operations remain.
>
> Therefore, never call `interfaceOperations()` function again. If you're planning to request more API operations by calling the `interfaceOperations()`, it is absolutely wrong decision. You have to call another function instead.
>
> Repeat that, never call `interfaceOperations()` function again.
