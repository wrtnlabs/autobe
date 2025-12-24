import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { transformPreviousAndLatestCorrectHistory } from "../../common/histories/transformPreviousAndLatestCorrectHistory";
import { IAutoBeTestFunctionFailure } from "../structures/IAutoBeTestFunctionFailure";
import { IAutoBeTestProcedure } from "../structures/IAutoBeTestProcedure";
import { transformTestAuthorizeWriteHistory } from "./transformTestAuthorizeWriteHistory";
import { transformTestGenerateWriteHistory } from "./transformTestGenerationWriteHistory";
import { transformTestOperationWriteHistory } from "./transformTestOperationWriteHistory";
import { transformTestPrepareWriteHistory } from "./transformTestPrepareWriteHistory";

export const transformTestCorrectOverallHistory = async (
  ctx: AutoBeContext,
  props: {
    instruction: string;
    procedure: IAutoBeTestProcedure;
    failures: IAutoBeTestFunctionFailure[];
  },
): Promise<IAutoBeOrchestrateHistory> => {
  const systemPrompt: string = (() => {
    switch (props.procedure.function.type) {
      case "operation":
        return AutoBeSystemPromptConstant.TEST_OPERATION_CORRECT_OVERALL;
      case "prepare":
        return AutoBeSystemPromptConstant.TEST_PREPARE_CORRECT_OVERALL;
      case "generate":
        return AutoBeSystemPromptConstant.TEST_GENERATE_CORRECT_OVERALL;
      case "authorize":
        return AutoBeSystemPromptConstant.TEST_AUTHORIZE_CORRECT_OVERALL;
      default:
        props.procedure.function satisfies never;

        throw new Error(
          `Unreachable: Cannot create correct system prompt of function kind`,
        );
    }
  })();

  const previous: IAutoBeOrchestrateHistory | undefined = await (async () => {
    switch (props.procedure.type) {
      case "operation":
        return await transformTestOperationWriteHistory(ctx, {
          instruction: props.instruction,
          scenario: {
            ...props.procedure.function.scenario,
            functionName: props.procedure.function.name,
          },
          artifacts: props.procedure.artifacts,
          authorizationFunctions: props.procedure.authorizes,
          generationFunctions: props.procedure.generates,
        });
      case "authorize":
        return await transformTestAuthorizeWriteHistory(ctx, {
          operation: props.procedure.operation,
          artifacts: props.procedure.artifacts,
        });
      case "generate":
        return await transformTestGenerateWriteHistory(ctx, {
          instruction: props.instruction,
          prepare: props.procedure.prepare,
          operation: props.procedure.operation,
          artifacts: props.procedure.artifacts,
        });
      case "prepare":
        return await transformTestPrepareWriteHistory(ctx, {
          typeName: props.procedure.typeName,
          schema: props.procedure.schema,
          document: ctx.state().interface!.document,
          instruction: props.instruction,
        });
      default:
        props.procedure satisfies never;
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
          script: f.procedure.function.content,
          diagnostics: f.failure.diagnostics,
        })),
      ),
    ],
    userMessage: "Fix the compile errors in the test code please",
  };
};
