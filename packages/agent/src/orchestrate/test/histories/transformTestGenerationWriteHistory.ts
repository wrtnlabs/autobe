import {
  AutoBeOpenApi,
  AutoBeTestPrepareWriteFunction,
} from "@autobe/interface";
import { StringUtil, transformOpenApiDocument } from "@autobe/utils";
import {
  HttpMigration,
  IHttpMigrateApplication,
  ILlmSchema,
  OpenApi,
} from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { IAutoBeTestArtifacts } from "../structures/IAutoBeTestArtifacts";

export function transformTestGenerationWriteHistory<
  Model extends ILlmSchema.Model,
>(
  instruction: string,
  prepareFunction: AutoBeTestPrepareWriteFunction,
  operation: AutoBeOpenApi.IOperation,
  artifacts: IAutoBeTestArtifacts,
): IAutoBeOrchestrateHistory {
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.TEST_GENERATE_WRITE,
      },
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          Here is the list of input material composition.

          Generate a resource generation function based on the following information.

          ## Instructions

          The following instructions were extracted from the user's requirements
          and conversations. These instructions may contain specific guidance about
          how generation functions should be implemented, including authentication
          patterns, error handling approaches, and data transformation strategies.

          Follow these instructions when implementing the generation function.
          Carefully distinguish between:
          - Suggestions or recommendations (consider these as guidance)
          - Direct specifications or explicit commands (these must be followed exactly)

          ${instruction}

          ## Prepare Function

          Here is the prepare function that creates test data for this resource.
          Your generation function must use this prepare function to create the input data.

          \`\`\`json
          ${JSON.stringify(prepareFunction, null, 2)}
          \`\`\`

          ## API Operation

          Here is the API operation that your generation function will call.
          Pay special attention to:
          - responseBody.typeName: This is the EXACT type name you must import and return
          - endpoint (method and path): To find the matching SDK function
          - requestBody.typeName: To understand the input type structure
          - parameters: URL path parameters that may be needed for the API call

          \`\`\`json
          ${JSON.stringify(operation, null, 2)}
          \`\`\`

          ## DTO Definitions

          These are the DTO type definitions available in the codebase.
          Use these to understand the structure of request and response types.

          ${transformTestGenerationWriteHistory.structures(artifacts)}

          ## API SDK Functions

          Here are the available SDK functions you can use to call the API.
          Find the appropriate function that matches the operation endpoint.

          ${transformTestGenerationWriteHistory.functional(artifacts)}

          ## E2E Mockup Functions

          Just reference, and never follow this code as it is.

          \`\`\`json
          ${JSON.stringify(artifacts.e2e)}
          \`\`\`

        `,
      },
    ],
    userMessage: `Generate the resource generation function based on the prepare function "${prepareFunction.functionName}" and the API operation.`,
  };
}

export namespace transformTestGenerationWriteHistory {
  export function structures(artifacts: IAutoBeTestArtifacts): string {
    return StringUtil.trim`
      ${Object.keys(artifacts.document.components.schemas)
        .map((k) => `- ${k}`)
        .join("\n")}

      \`\`\`json
      ${JSON.stringify(artifacts.dto)}
      \`\`\`
    `;
  }

  export function functional(artifacts: IAutoBeTestArtifacts): string {
    const document: OpenApi.IDocument = transformOpenApiDocument(
      artifacts.document,
    );
    const app: IHttpMigrateApplication = HttpMigration.application(document);
    return StringUtil.trim`
      Method | Path | Function Accessor
      -------|------|-------------------
      ${app.routes
        .map((r) =>
          [r.method, r.path, `api.functional.${r.accessor.join(".")}`].join(
            " | ",
          ),
        )
        .join("\n")}

      \`\`\`json
      ${JSON.stringify(artifacts.sdk)}
      \`\`\`
    `;
  }
}
