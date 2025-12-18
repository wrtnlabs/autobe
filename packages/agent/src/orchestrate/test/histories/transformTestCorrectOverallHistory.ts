import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { transformPreviousAndLatestCorrectHistory } from "../../common/histories/transformPreviousAndLatestCorrectHistory";
import { IAutoBeTestAgentResult } from "../structures/IAutoBeTestAgentResult";
import { IAutoBeTestFunctionFailure } from "../structures/IAutoBeTestFunctionFailure";
import { transformTestAuthorizationWriteHistory } from "./transformTestAuthorizationWriteHistory";
import { transformTestGenerationWriteHistory } from "./transformTestGenerationWriteHistory";
import { transformTestOperationWriteHistory } from "./transformTestOperationWriteHistory";
import { transformTestPrepareWriteHistories } from "./transformTestPrepareWriteHistories";

export const transformTestCorrectOverallHistory = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
    target: IAutoBeTestAgentResult;
    failures: IAutoBeTestFunctionFailure[];
  },
): Promise<IAutoBeOrchestrateHistory> => {
  const systemPrompt: string = (() => {
    switch (props.target.function.type) {
      case "operation":
        return AutoBeSystemPromptConstant.TEST_OPERATION_CORRECT_OVERALL;
      case "prepare":
        return AutoBeSystemPromptConstant.TEST_PREPARE_CORRECT_OVERALL;
      case "generate":
        return AutoBeSystemPromptConstant.TEST_GENERATE_CORRECT_OVERALL;
      case "authorize":
        return AutoBeSystemPromptConstant.TEST_AUTHORIZE_CORRECT_OVERALL;
      default:
        props.target.function satisfies never;

        throw new Error(
          `Unreachable: Cannot create correct system prompt of function kind`,
        );
    }
  })();

  const previous: IAutoBeOrchestrateHistory | undefined = await (async () => {
    switch (props.target.type) {
      case "operation":
        return await transformTestOperationWriteHistory(ctx, {
          instruction: props.instruction,
          scenario: {
            ...props.target.function.scenario,
            functionName: props.target.function.functionName,
          },
          artifacts: props.target.artifacts,
          authorizationFunctions: props.target.authorizeFunctions,
          generationFunctions: props.target.generateFunctions,
        });
      case "authorize":
        return transformTestAuthorizationWriteHistory({
          operation: props.target.operation,
          artifacts: props.target.artifacts,
        });
      case "generate":
        return transformTestGenerationWriteHistory(
          props.instruction,
          props.target.prepareFunction,
          props.target.operation,
          props.target.artifacts,
        );
      case "prepare":
        return transformTestPrepareWriteHistories({
          operation: props.target.operation,
          schema:
            ctx.state().interface!.document.components.schemas[
              props.target.function.dtoTypeName
            ],
          instruction: props.instruction,
        });
      default:
        props.target satisfies never;

        throw new Error(
          `Unreachable: Cannot create correct history of function kind`,
        );
    }
  })();

  // previous 히스토리의 첫 번째 시스템 프롬프트에 식별자 추가
  const previousHistories =
    previous?.histories
      .slice(0, -1)
      ?.map((h, i) =>
        i === 0 && h.type === "systemMessage"
          ? { ...h, text: `# [SYSTEM PROMPT: TEST_WRITE]\n\n${h.text}` }
          : h,
      ) ?? [];

  return {
    histories: [
      ...previousHistories,
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: `# [SYSTEM PROMPT: TEST_CORRECT]\n\n${systemPrompt}`,
      },
      ...(previous?.histories.slice(-1) ?? []),
      ...transformPreviousAndLatestCorrectHistory(
        props.failures.map((f) => ({
          script: f.target.function.content,
          diagnostics: f.failure.diagnostics,
        })),
      ),
    ],
    userMessage: "Fix the compile errors in the test code please",
  };
};
