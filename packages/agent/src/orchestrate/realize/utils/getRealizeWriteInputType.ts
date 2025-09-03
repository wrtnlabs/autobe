import { AutoBeOpenApi, AutoBeRealizeAuthorization } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";

/**
 * Generate TypeScript type definition string for provider function props
 *
 * This utility creates the exact props interface that the Realize Agent's
 * generated provider functions must accept. It combines:
 *
 * - Authentication context (user/admin/member from authorization)
 * - URL path parameters (e.g., id, boardId, postId)
 * - Request body type (if applicable)
 *
 * The output is injected into REALIZE_WRITE_ARTIFACT.md template to tell the AI
 * exactly what parameter type the function should accept.
 *
 * @example
 *   // For DELETE /posts/:id (authenticated)
 *   // Returns: "props: { user: IUser; id: string & tags.Format<'uuid'>; }"
 *
 * @example
 *   // For GET /public/info (no auth, no params)
 *   // Returns: "// No props parameter needed - function should have no parameters"
 *
 * @param operation - OpenAPI operation definition containing parameters and
 *   auth requirements
 * @param authorization - Authorization context with user/role information (if
 *   authenticated endpoint)
 * @returns TypeScript interface string like "props: { user: IUser; id: string;
 *   body: IRequest; }"
 */
export function getRealizeWriteInputType(
  operation: AutoBeOpenApi.IOperation,
  authorization: AutoBeRealizeAuthorization | null,
): string {
  const functionParameterFields: string[] = [];

  // Add authentication field (user/admin/member) if endpoint requires auth
  const hasAuthentication = authorization && operation.authorizationRole;
  if (hasAuthentication) {
    const authFieldName = operation.authorizationRole;
    const authFieldType = authorization.payload.name;
    functionParameterFields.push(`${authFieldName}: ${authFieldType};`);
  }

  // Add URL path parameters (e.g., /posts/:id → id parameter)
  const pathParameters = operation.parameters;
  pathParameters.forEach((pathParam) => {
    const paramName = pathParam.name;
    const paramType = pathParam.schema.type;
    const paramFormat =
      "format" in pathParam.schema
        ? ` & tags.Format<'${pathParam.schema.format}'>`
        : "";

    const parameterField = `${paramName}: ${paramType}${paramFormat};`;
    functionParameterFields.push(parameterField);
  });

  // Add request body if present (POST/PUT/PATCH operations)
  const hasRequestBody = operation.requestBody?.typeName;
  if (hasRequestBody) {
    const bodyTypeName = operation.requestBody?.typeName;
    functionParameterFields.push(`body: ${bodyTypeName};`);
  }

  // Format as TypeScript props interface or indicate no parameters needed
  const hasParameters = functionParameterFields.length > 0;

  if (!hasParameters) {
    return `// No props parameter needed - function should have no parameters`;
  }

  const formattedFields = functionParameterFields
    .map((field) => `  ${field}`)
    .join("\n");

  return StringUtil.trim`
    props: {
    ${formattedFields}
    }`;
}
