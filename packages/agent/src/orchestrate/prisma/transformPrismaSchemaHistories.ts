import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBePrisma } from "@autobe/interface";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { PromptOptimizer } from "../../utils/rag";

export const transformPrismaSchemaHistories = (
  requirementAnalysisReport: Record<string, string>,
  targetComponent: AutoBePrisma.IComponent,
  otherComponents: AutoBePrisma.IComponent[],
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  // Optimize system prompt for Prisma schema generation
  const promptOptimization = PromptOptimizer.optimizeForStage(
    AutoBeSystemPromptConstant.PRISMA_SCHEMA,
    'prisma',
    {
      targetComponent,
      otherComponents,
      requirementAnalysisReport
    }
  );

  // Log token reduction for monitoring
  if (promptOptimization.reductionPercent > 0) {
    console.log(`[RAG] Prisma schema prompt optimization: ${Math.round(promptOptimization.reductionPercent * 100)}% reduction (${promptOptimization.originalLength} → ${promptOptimization.optimizedLength} chars)`);
  }

  return [
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: promptOptimization.content,
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: [
        "Here is the input data for generating Prisma DB schema.",
        "",
        "```",
        JSON.stringify({
          requirementAnalysisReport,
          otherComponents,
          targetComponent,
        }),
        "```",
      ].join("\n"),
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: [
        "You've already taken a mistake that creating models from the other components.",
        "Note that, you have to make models from the target component only. Never make",
        "models from the other components. The other components' models are already made.",
        "",
        "```json",
        JSON.stringify({
          targetComponent,
        }),
        "```",
      ].join("\n"),
    },
  ];
};
