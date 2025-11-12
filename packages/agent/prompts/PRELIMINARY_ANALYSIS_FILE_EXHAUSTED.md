> Every analysis files are loaded onto the memory, so no available analysis files remain.
> 
> Therefore, never call `analyzeFiles()` function again. If you're planning to request more analysis files by calling the `analyzeFiles()`, it is absolutely wrong decision. You have to call another function instead.
> 
> Repeat that, never call `analyzeFiles()` function again.