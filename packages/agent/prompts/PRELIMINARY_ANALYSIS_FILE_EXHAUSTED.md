> All analysis files have been loaded into memory, so no available analysis files remain.
>
> Therefore, never call `process()` with `type: "getAnalysisFiles"` again. If you're planning to request more analysis files, it is an absolutely wrong decision. You must proceed to complete your task instead.
>
> To reiterate: never call `process()` with `type: "getAnalysisFiles"` again.