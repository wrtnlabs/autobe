import {
  AutoBeOpenApi,
  AutoBeRealizeAuthorization,
  AutoBeRealizeOperationFunction,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { transformPreviousAndLatestCorrectHistory } from "../../common/histories/transformPreviousAndLatestCorrectHistory";
import { AutoBeRealizeOperationProgrammer } from "../programmers/AutoBeRealizeOperationProgrammer";
import { IAutoBeRealizeFunctionFailure } from "../structures/IAutoBeRealizeFunctionFailure";
import { IAutoBeRealizeScenarioResult } from "../structures/IAutoBeRealizeScenarioResult";
import { getRealizeWriteCodeTemplate } from "../utils/getRealizeWriteCodeTemplate";
import { transformRealizeOperationWriteHistory } from "./transformRealizeOperationWriteHistory";

export function transformRealizeOperationCorrectHistory(props: {
  state: AutoBeState;
  authorizations: AutoBeRealizeAuthorization[];
  function: AutoBeRealizeOperationFunction;
  dto: Record<string, string>;
  failures: IAutoBeRealizeFunctionFailure<AutoBeRealizeOperationFunction>[];
  preliminary: AutoBePreliminaryController<
    "databaseSchemas" | "realizeCollectors" | "realizeTransformers"
  >;
}): IAutoBeOrchestrateHistory {
  const document: AutoBeOpenApi.IDocument = props.state.interface!.document;
  const operation: AutoBeOpenApi.IOperation = document.operations.find(
    (o) =>
      o.method === props.function.endpoint.method &&
      o.path === props.function.endpoint.path,
  )!;
  const scenario: IAutoBeRealizeScenarioResult =
    AutoBeRealizeOperationProgrammer.getScenario({
      authorizations: props.authorizations,
      operation,
    });
  const writeHistories: IAutoBeOrchestrateHistory =
    transformRealizeOperationWriteHistory({
      state: props.state,
      scenario,
      authorization: scenario.decoratorEvent ?? null,
      totalAuthorizations: props.authorizations,
      dto: props.dto,
      preliminary: props.preliminary,
    });
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
        text: AutoBeSystemPromptConstant.REALIZE_OPERATION_CORRECT,
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
        scenario,
        operation,
        authorization: scenario.decoratorEvent ?? null,
        schemas: props.state.interface!.document.components.schemas,
      })}

      Current code is as follows:
      \`\`\`typescript
      ${props.function.content}
      \`\`\`
    `,
  };
}
