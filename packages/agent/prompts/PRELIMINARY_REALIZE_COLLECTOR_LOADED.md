# Loaded Realize Collector Functions

The following Realize Collector functions have been loaded into your context through previous `process()` calls with `type: "getRealizeCollectors"`.

These collector functions transform API request DTOs into Prisma CreateInput structures. Use them to:
- Understand how Create DTOs are converted to database input format
- Reuse existing collector logic for nested create operations
- Verify UUID generation and foreign key resolution patterns
- Check which collectors handle auth context and path parameter references
- Identify neighbor dependencies between collectors for nested operations

> **Note**: These collectors are already in your conversation history. Reference them directly without calling `process()` again for the same DTO type names.

{{CONTENT}}
