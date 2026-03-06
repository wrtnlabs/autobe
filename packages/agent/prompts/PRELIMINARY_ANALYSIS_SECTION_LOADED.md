# Loaded Analysis Sections

The following requirement analysis sections have been loaded into your context through previous `process()` calls with `type: "getAnalysisSections"`.

{{PREVIOUS}}

These materials are now available for you to reference. Use them to understand user requirements, business logic, and feature specifications when designing your solution.

> **Note**: These sections are already in your conversation history. Reference them directly without calling `process()` again for the same section IDs.

## Project Prefix

The project prefix is a short identifier used consistently across all generated artifacts including database table names, API function names, and DTO type names. For example, if the prefix is "shopping", tables might be named `shopping_customers` and DTOs might be named `IShoppingCartCommodity`.

{{PREFIX}}

## Actors

Actors represent the different user types and roles that interact with the system. Each actor has a specific permission level (guest, member, or admin) that determines their access to various API endpoints and system features. Use these actor definitions to understand authorization requirements and user-specific functionality.

{{ACTORS}}

## Analysis Sections

{{CONTENT}}
