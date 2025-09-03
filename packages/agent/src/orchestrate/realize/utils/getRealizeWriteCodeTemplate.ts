import { AutoBeOpenApi, AutoBeRealizeAuthorization } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";

import { IAutoBeRealizeScenarioResult } from "../structures/IAutoBeRealizeScenarioResult";
import { getRealizeWriteImportStatements } from "./getRealizeWriteImportStatements";

/**
 * Generate a TypeScript function template for the Realize Agent to complete
 *
 * This utility creates a function skeleton with proper imports, parameters, and
 * return type that the AI needs to implement. The template includes:
 *
 * - Import statements for required dependencies
 * - Function signature with all parameters
 * - Return type specification
 *
 * @example
 *   // Returns a template like:
 *   ```typescript
 *   import { MyGlobal } from "../MyGlobal";
 *   // ... other imports
 *
 *   async function post__users_create(
 *     body: IUserCreateRequest
 *   ): Promise<IUserResponse> {
 *     ...
 *   }
 *   ```;
 *
 * @param scenario - The realize scenario containing function metadata
 * @param operation - OpenAPI operation definition
 * @param authorization - Authorization context if endpoint is authenticated
 * @returns Complete TypeScript code template as a formatted string
 */
export function getRealizeWriteCodeTemplate(
  scenario: IAutoBeRealizeScenarioResult,
  operation: AutoBeOpenApi.IOperation,
  authorization: AutoBeRealizeAuthorization | null,
): string {
  // Collect all function parameters in order
  const functionParameters: string[] = [];

  // Add authentication parameter if needed (e.g., user: IUser, admin: IAdmin)
  if (authorization && authorization.role.name) {
    // Debug: Log the values to check what's being used
    const authParameter = `${authorization.role.name}: ${authorization.payload.name}`;
    functionParameters.push(authParameter);
  }

  // Add path parameters (e.g., id, postId, etc.)
  const pathParameters = operation.parameters.map((param) => {
    const paramType = param.schema.type;
    const paramFormat =
      "format" in param.schema
        ? ` & tags.Format<'${param.schema.format}'>`
        : "";
    return `${param.name}: ${paramType}${paramFormat}`;
  });
  functionParameters.push(...pathParameters);

  // Add request body parameter if present
  if (operation.requestBody?.typeName) {
    const bodyParameter = `body: ${operation.requestBody.typeName}`;
    functionParameters.push(bodyParameter);
  }

  // Format parameters for props object
  const hasParameters = functionParameters.length > 0;

  let formattedSignature: string;
  if (hasParameters) {
    const propsFields = functionParameters
      .map((param) => `  ${param}`)
      .join(";\n");

    formattedSignature = `props: {\n${propsFields};\n}`;
  } else {
    formattedSignature = "";
  }

  // Determine return type
  const returnType = operation.responseBody?.typeName ?? "void";

  // Generate the complete template
  return StringUtil.trim`
    Complete the code below, disregard the import part and return only the function part.

    \`\`\`typescript
    ${getRealizeWriteImportStatements(operation).join("\n")} 

    // ONLY YOU HAVE TO WRITE THIS, AND USE IMPORTED.
    export async function ${scenario.functionName}(${formattedSignature}): Promise<${returnType}> {
      ...
    }
    \`\`\`
  `;
}
