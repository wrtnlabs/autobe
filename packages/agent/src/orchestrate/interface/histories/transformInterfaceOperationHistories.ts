import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { PromptOptimizer, ContextOptimizer } from "../../../utils/rag";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceOperationHistories = (
  state: AutoBeState,
  endpoints: AutoBeOpenApi.IEndpoint[],
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  // Optimize the 302-line INTERFACE_OPERATION prompt
  const promptOptimization = PromptOptimizer.optimizeForStage(
    AutoBeSystemPromptConstant.INTERFACE_OPERATION,
    'interface',
    {
      endpoints,
      requirements: JSON.stringify(state.analyze?.files || {})
    }
  );

  // Optimize endpoint context - this is where 500+ endpoints can be filtered
  const requirements = JSON.stringify(state.analyze?.files || {});
  
  // Apply semantic filtering to endpoints if there are many
  let optimizedEndpoints = endpoints;
  if (endpoints.length > 25) {
    // Use RAG to filter most relevant endpoints
    const relevantEndpoints = ContextOptimizer.optimizeForStage({
      stage: 'interface',
      requirements,
      maxItems: {
        operations: 25, // Limit to top 25 endpoints per batch
        schemas: 50
      },
      thresholds: {
        operations: 0.15, // Moderate filtering for interface stage
        schemas: 0.1
      }
    }, undefined, undefined, undefined);

    if (relevantEndpoints.operations.length > 0) {
      // Map operations back to endpoints
      optimizedEndpoints = relevantEndpoints.operations.map(op => ({
        method: op.method,
        path: op.path,
        summary: op.summary,
        tags: (op as any).tags
      }));
      
      console.log(`[RAG] Interface operations endpoint filtering: ${endpoints.length} → ${optimizedEndpoints.length} endpoints (${Math.round((1 - optimizedEndpoints.length / endpoints.length) * 100)}% reduction)`);
    }
  }

  // Log prompt optimization
  if (promptOptimization.reductionPercent > 0) {
    console.log(`[RAG] Interface operation prompt optimization: ${Math.round(promptOptimization.reductionPercent * 100)}% reduction (${promptOptimization.originalLength} → ${promptOptimization.optimizedLength} chars)`);
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
        "You have to make API operations for the given endpoints:",
        "",
        "```json",
        JSON.stringify(optimizedEndpoints),
        "```",
      ].join("\n"),
    },
  ];
};
