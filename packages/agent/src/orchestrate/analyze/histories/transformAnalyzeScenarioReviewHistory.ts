import { AutoBeAnalyzeScenarioEvent } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";

/**
 * Transform histories for scenario review.
 *
 * Provides the reviewer with:
 *
 * 1. The user's original requirements (conversation history)
 * 2. The scenario output to validate against
 */
export const transformAnalyzeScenarioReviewHistory = (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
  },
): IAutoBeOrchestrateHistory => {
  return {
    histories: [
      ...ctx
        .histories()
        .filter(
          (h) => h.type === "userMessage" || h.type === "assistantMessage",
        ),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.ANALYZE_SCENARIO_REVIEW,
      },
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          ## Scenario Result to Review

          **Prefix**: ${props.scenario.prefix}
          **Language**: ${JSON.stringify(props.scenario.language ?? "en")}

          **Actors**:
          ${props.scenario.actors
            .map((a) => `- **${a.name}** (${a.kind}): ${a.description}`)
            .join("\n")}

          **Entities**:
          ${props.scenario.entities
            .map(
              (e) =>
                `- **${e.name}**: ${e.attributes.slice(0, 8).join(", ")}${
                  e.relationships?.length
                    ? `\n  Relationships: ${e.relationships.join("; ")}`
                    : ""
                }`,
            )
            .join("\n")}

          **Features**: ${
            props.scenario.features.length
              ? props.scenario.features.map((f) => f.id).join(", ")
              : "None (standard REST CRUD)"
          }
        `,
      },
    ],
    userMessage:
      "Review this scenario against the user's original requirements and provide your verdict.",
  };
};
