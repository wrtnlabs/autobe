import { IAutoBeDatabaseValidation } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { IAutoBeDatabaseCorrectApplication } from "../structures/IAutoBeDatabaseCorrectApplication";

export const transformPrismaCorrectHistory = (props: {
  result: IAutoBeDatabaseValidation.IFailure;
  preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "databaseSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
  >;
  previousWrite: IAutoBeDatabaseCorrectApplication.IWrite | null;
}): IAutoBeOrchestrateHistory => ({
  histories: [
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.DATABASE_CORRECT,
    },
    ...props.preliminary.getHistories(),
    ...(props.previousWrite !== null
      ? [
          {
            id: v7(),
            created_at: new Date().toISOString(),
            type: "assistantMessage" as const,
            text: StringUtil.trim`
              Previously submitted correction (your last write):

              Planning:
              ${props.previousWrite.planning}

              Models:
              \`\`\`json
              ${JSON.stringify(props.previousWrite.models, null, 2)}
              \`\`\`

              You may revise these models by submitting another write, or call
              complete if they are correct.
            `,
          },
        ]
      : []),
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
    "Resolve the compilation errors in the provided database schema files.",
});
