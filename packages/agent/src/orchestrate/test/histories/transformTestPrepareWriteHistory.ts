import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBeTestPrepareProgrammer } from "../programmers/AutoBeTestPrepareProgrammer";

export async function transformTestPrepareWriteHistory<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
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
          You have to make ${AutoBeTestPrepareProgrammer.getFunctionName(props.typeName)} function.

          At first, here is the list of DTO types relavant with the ${props.typeName} type:

          \`\`\`json
          ${JSON.stringify(dto)}
          \`\`\`

          At second, when you composing ${props.typeName} typed data, 
          you have fill those properties:
          
          ${Object.keys(props.schema.properties)
            .map((s) => `- ${s}`)
            .join("\n")}

          At last, here is the template code you have to implement.
          Reference the template code, and fill the proper code to 
          each property.

          ${await AutoBeTestPrepareProgrammer.writeTemplateCode(props)}
        `,
      },
    ],
    userMessage: "Generate the test data preparation function for this DTO.",
  };
}
