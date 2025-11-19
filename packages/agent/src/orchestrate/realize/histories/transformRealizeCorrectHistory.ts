import {
  AutoBeRealizeAuthorization,
  AutoBeRealizeFunction,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { transformPreviousAndLatestCorrectHistory } from "../../common/histories/transformPreviousAndLatestCorrectHistory";
import { IAutoBeRealizeFunctionFailure } from "../structures/IAutoBeRealizeFunctionFailure";
import { IAutoBeRealizeScenarioResult } from "../structures/IAutoBeRealizeScenarioResult";
import { getRealizeWriteCodeTemplate } from "../utils/getRealizeWriteCodeTemplate";
import { transformRealizeWriteHistories } from "./transformRealizeWriteHistories";

export function transformRealizeCorrectHistory<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    state: AutoBeState;
    scenario: IAutoBeRealizeScenarioResult;
    authorization: AutoBeRealizeAuthorization | null;
    function: AutoBeRealizeFunction;
    totalAuthorizations: AutoBeRealizeAuthorization[];
    dto: Record<string, string>;
    failures: IAutoBeRealizeFunctionFailure[];
    preliminary: AutoBePreliminaryController<"prismaSchemas">;
  },
): IAutoBeOrchestrateHistory {
  const writeHistories = transformRealizeWriteHistories(props);
  return {
    histories: [
      ...writeHistories.histories,
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.COMMON_CORRECT_CASTING,
      },
      {
        id: v7(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.REALIZE_CORRECT,
        created_at: new Date().toISOString(),
      },
      ...transformPreviousAndLatestCorrectHistory(
        props.failures.map((f) => ({
          script: f.function.content,
          diagnostics: f.diagnostics,
        })),
      ),
    ],
    userMessage: StringUtil.trim`
      Correct the TypeScript code implementation.

      The instruction to write at first was as follows, and the code you received is the code you wrote according to this instruction.
      When modifying, modify the entire code, but not the import statement.

      Below is template code you wrote:

      ${getRealizeWriteCodeTemplate({
        scenario: props.scenario,
        schemas: ctx.state().interface!.document.components.schemas,
        operation: props.scenario.operation,
        authorization: props.authorization ?? null,
      })}

      Current code is as follows:
      \`\`\`typescript
      ${props.function.content}
      \`\`\`
    `,
  };
}
