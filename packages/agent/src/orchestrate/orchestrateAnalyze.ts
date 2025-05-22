import {
  AutoBeAnalyzeHistory,
  AutoBeAssistantMessageHistory,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { randomUUID } from "crypto";

import { AnalyzeAgent } from "../analyze/AnalyzeAgent";
import { createReviewer } from "../analyze/CreateReviewer";
import { AutoBeContext } from "../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../context/IAutoBeApplicationProps";

/** @todo Kakasoo */
export const orchestrateAnalyze =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeAnalyzeHistory> => {
    const userPlanningRequirements = props.userPlanningRequirements;
    if (!userPlanningRequirements) {
      throw new Error(
        `Unable to prepare a proposal because there is no user requirement`,
      );
    }

    const started_at = new Date().toISOString();

    const agent = new AnalyzeAgent(createReviewer, ctx);
    const response = await agent.conversate(
      [
        `Please write a user requirement report.`,
        "```json",
        JSON.stringify(userPlanningRequirements),
        "```",
      ].join("\n"),
    );

    return {
      id: randomUUID(),
      type: "assistantMessage",
      text: response,
      started_at,
      completed_at: new Date().toISOString(),
    } satisfies AutoBeAssistantMessageHistory;
  };
