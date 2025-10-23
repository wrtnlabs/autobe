# AST Design

## AST Philosophy

AutoBE's AST (Abstract Syntax Tree) design philosophy is **simplification**. While OpenAPI 3.0 spec is very complex and flexible, AutoBE uses a simplified AST that extracts only the core information needed for backend generation.

The purpose of simplification is **clarity**. Complex structures burden both AI agents and compilers. Keeping only core information makes parsing fast, validation easy, and error tracking clear.

## AutoBeOpenApi Structure

`AutoBeOpenApi.IDocument` is AutoBE's simplified OpenAPI representation.

**operations**: Array of all API endpoints. Each Operation includes path, method, parameters, request body, and response schema. Flattens OpenAPI's complex nested structure for easy traversal.

**schemas**: Map of all schemas used by the API. Contains DTO type definitions and maps to Prisma models. Resolves circular references and ensures type safety.

**security**: Defines authentication/authorization mechanisms. Specifies security schemes like JWT, API Key, OAuth, and permissions required by each Operation.

## Simplification Strategies

The following strategies are used when converting from OpenAPI to AutoBE AST.

**Flattening**: Flattens nested structures. Converts `paths[path][method]` structure to `operations[]` array for single-level access.

**Reference Resolution**: Resolves all `$ref` to actual schemas. AI agents can see types directly without following references.

**Type Normalization**: Normalizes OpenAPI's various type representations to consistent format. Merges `allOf`, `oneOf`, `anyOf` into single schemas when possible.

**Metadata Extraction**: Extracts only important metadata. Keeps descriptions, examples, deprecated flags - information needed for generation - and omits the rest.

## AST Validation

AST is validated by compilers.

**Structure Validation**: Verifies AST follows expected type structure. Validates required field existence, type matching, value ranges.

**Semantic Validation**: Checks logical consistency of AST content. Detects path conflicts, circular references, and non-existent schema references.

**Prisma Alignment**: Verifies all fields referenced by AST actually exist in Prisma schema. This prevents the most common errors in Realize stage.

## Benefits of Simplified AST

Simplified AST provides several advantages.

**Fast Parsing**: Generating and reusing AST once is faster than parsing complex OpenAPI documents every time.

**Clear Validation**: Simple structure simplifies validation logic. Error messages are also clearer.

**AI-Friendly**: AI agents better understand concise structures. Token usage also decreases.

**Type Safety**: AST types defined in TypeScript are validated at compile time, preventing runtime errors.

For detailed AST type definitions, refer to the `AutoBeOpenApi` namespace in `@autobe/interface` package.
