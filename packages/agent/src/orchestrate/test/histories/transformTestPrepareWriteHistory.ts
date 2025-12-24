import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { getTestExternalDeclarations } from "../compile/getTestExternalDeclarations";
import { AutoBeTestPrepareProgrammer } from "../programmers/AutoBeTestPrepareProgrammer";

export async function transformTestPrepareWriteHistory(
  ctx: AutoBeContext,
  props: {
    typeName: string;
    schema: AutoBeOpenApi.IJsonSchema.IObject;
    document: AutoBeOpenApi.IDocument;
    instruction: string;
  },
): Promise<IAutoBeOrchestrateHistory> {
  const dto: Record<string, string> =
    await AutoBeTestPrepareProgrammer.writeStructures(ctx, props.typeName);
  return {
    histories: [
      {
        id: v7(),
        type: "systemMessage",
        created_at: new Date().toISOString(),
        text: AutoBeSystemPromptConstant.TEST_PREPARE_WRITE,
      },
      {
        id: v7(),
        type: "assistantMessage",
        created_at: new Date().toISOString(),
        text: StringUtil.trim`
          Here is the list of input material composition.

          Generate a resource preparation function based on the following information.

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

          ## Function Name

          You have to make ${AutoBeTestPrepareProgrammer.getFunctionName(props.typeName)} function.

          ## DTO Types

          Here is the list of DTO types relevant with the ${props.typeName} type:

          \`\`\`json
          ${JSON.stringify(dto)}
          \`\`\`

          ### Properties

          When you composing ${props.typeName} typed data, you have check those properties:
          
          ${Object.keys(props.schema.properties)
            .map((s) => `- ${s}`)
            .join("\n")}
            
          ## External Definitions

          Here is the external declaration files (d.ts) you can reference.

          \`\`\`json
          ${JSON.stringify(await getTestExternalDeclarations(ctx))}
          \`\`\`

          ## Template Code

          Here is the template code you have to implement.
          
          Reference the template code, and fill the proper code to each property.

          ${AutoBeTestPrepareProgrammer.writeTemplateCode(props)}
        `,
      },
    ],
    userMessage: "Generate the test data preparation function for this DTO.",
  };
}
