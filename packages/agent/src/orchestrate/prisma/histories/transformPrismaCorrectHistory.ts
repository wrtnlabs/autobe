import { IAutoBePrismaValidation } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformPrismaCorrectHistory = (props: {
  result: IAutoBePrismaValidation.IFailure;
  preliminary: AutoBePreliminaryController<"analysisFiles" | "prismaSchemas">;
}): IAutoBeOrchestrateHistory => ({
  histories: [
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.PRISMA_CORRECT,
    },
    ...props.preliminary.createHistories(),
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        Below are the list of errors what you have to fix:
        
        \`\`\`json
        ${JSON.stringify(props.result.errors)}
        \`\`\`
      `,
    },
  ],
  userMessage:
    "Resolve the compilation errors in the provided Prisma schema files.",
});
