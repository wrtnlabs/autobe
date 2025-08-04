import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { PromptOptimizer, ContextOptimizer } from "../../../utils/rag";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceSchemaHistories = (
  state: AutoBeState,
  operations: AutoBeOpenApi.IOperation[],
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  // Optimize the massive 377-line INTERFACE_SCHEMA prompt
  const promptOptimization = PromptOptimizer.optimizeForStage(
    AutoBeSystemPromptConstant.INTERFACE_SCHEMA,
    'interface',
    {
      operations,
      requirements: JSON.stringify(state.analyze?.files || {})
    }
  );

  // Optimize operations context - this determines which schemas get generated
  // This is where 1200+ schemas come from, so aggressive filtering is beneficial
  let optimizedOperations = operations;
  if (operations.length > 50) {
    const optimizedContext = ContextOptimizer.optimizeForStage({
      stage: 'interface',
      requirements: JSON.stringify(state.analyze?.files || {}),
      maxItems: {
        operations: 50, // Limit operations that drive schema generation
        schemas: 100    // Derived schemas will be much less
      },
      thresholds: {
        operations: 0.15,
        schemas: 0.1
      }
    }, { operations, components: { schemas: {}, authorization: [] } });

    if (optimizedContext.operations.length > 0) {
      optimizedOperations = optimizedContext.operations;
      console.log(`[RAG] Interface schema operation filtering: ${operations.length} → ${optimizedOperations.length} operations (${Math.round((1 - optimizedOperations.length / operations.length) * 100)}% reduction)`);
    }
  }

  // Log prompt optimization
  if (promptOptimization.reductionPercent > 0) {
    console.log(`[RAG] Interface schema prompt optimization: ${Math.round(promptOptimization.reductionPercent * 100)}% reduction (${promptOptimization.originalLength} → ${promptOptimization.optimizedLength} chars)`);
  }

  return [
    {
      type: "systemMessage",
      id: v4(),
      created_at: new Date().toISOString(),
      text: promptOptimization.content,
    },
    ...transformInterfaceAssetHistories(state),
    {
      type: "assistantMessage",
      id: v4(),
      created_at: new Date().toISOString(),
      text: [
        "Here is the list of API operations you have to implement its types:",
        "",
        "```json",
        JSON.stringify(optimizedOperations),
        "```",
      ].join("\n"),
    },
  ];
};
