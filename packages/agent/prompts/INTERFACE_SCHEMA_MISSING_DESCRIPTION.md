**Missing Required Field: "description"**

Every schema element must have a "description" field. This is the standard
OpenAPI field that appears in Swagger UI, SDK documentation, and other
API documentation tools. Write descriptions for API consumers, focusing
on WHAT and WHY rather than implementation details.

**Writing guidelines**:
- Reference the corresponding database schema table's documentation
- Use multiple paragraphs for complex types (separated by line breaks)
- Focus on business meaning, relationships, and constraints
- Keep language accessible to API consumers
- Write all descriptions in English

**For type schemas**: Describe the purpose, business meaning, when/why the
type is used, relationships to other entities, and consumer-visible constraints.

**For property schemas**: Describe what the property represents in the
business domain, why it exists, validation rules, value ranges, and format
requirements. For nullable/optional properties, explain the reason if the
underlying DB column is non-null.

You must add this field. The validator will continue to reject your schema
until every schema element has a "description" value.
