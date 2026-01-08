import { AutoBeOpenApi, AutoBeTestPrepareFunction } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { getTestExternalDeclarations } from "../compile/getTestExternalDeclarations";
import { AutoBeTestGenerateProgrammer } from "../programmers/AutoBeTestGenerateProgrammer";
import { IAutoBeTestArtifacts } from "../structures/IAutoBeTestArtifacts";
import { transformTestOperationWriteHistory } from "./transformTestOperationWriteHistory";

export async function transformTestGenerateWriteHistory(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    prepare: AutoBeTestPrepareFunction;
    operation: AutoBeOpenApi.IOperation;
    artifacts: IAutoBeTestArtifacts;
  },
): Promise<IAutoBeOrchestrateHistory> {
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

          ${props.instruction}

          ## Prepare Function

          Here is the prepare function that creates test data for this resource.
          Your generation function must use this prepare function to create the input data.

          \`\`\`json
          ${JSON.stringify(props.prepare)}
          \`\`\`

          ## API Operation

          Here is the API operation that your generation function will call.
          Pay special attention to:
          - responseBody.typeName: This is the EXACT type name you must import and return
          - endpoint (method and path): To find the matching SDK function
          - requestBody.typeName: To understand the input type structure
          - parameters: URL path parameters that may be needed for the API call

          \`\`\`json
          ${JSON.stringify(props.operation)}
          \`\`\`

          ## DTO Definitions

          These are the DTO type definitions available in the codebase.
          Use these to understand the structure of request and response types.

          ${await transformTestOperationWriteHistory.structures(ctx, props.artifacts)}

          ## API SDK Functions

          Here are the available SDK functions you can use to call the API.
          Find the appropriate function that matches the operation endpoint.

          ${transformTestOperationWriteHistory.functional(props.artifacts, [])}

          ## E2E Mockup Functions

          Just reference, and never follow this code as it is.

          \`\`\`json
          ${JSON.stringify(props.artifacts.e2e)}
          \`\`\`

          ## External Definitions
          
          Here is the external declaration files (d.ts) you can reference.

          \`\`\`json
          ${JSON.stringify(await getTestExternalDeclarations(ctx))}
          \`\`\`

          ## Template Code

          Here is the template code you have to implement.

          Reference the template code, and fill the proper code to each section.

          ${AutoBeTestGenerateProgrammer.writeTemplateCode(props)}
        `,
      },
    ],
    userMessage: `Generate the resource generation function based on the prepare function "${props.prepare.name}" and the API operation.`,
  };
}
