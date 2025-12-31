# Loaded Realize Transformer Functions

The following Realize Transformer functions have been loaded into your context through previous `process()` calls with `type: "getRealizeTransformers"`.

These transformer functions convert database query results into API response DTOs. Use them to:
- Understand how database records are transformed to response format
- Reuse existing transformer logic for nested response objects
- Verify date conversion and field mapping patterns
- Check null vs undefined handling for optional fields
- Identify neighbor dependencies between transformers for nested DTOs

> **Note**: These transformers are already in your conversation history. Reference them directly without calling `process()` again for the same DTO type names.

{{CONTENT}}
