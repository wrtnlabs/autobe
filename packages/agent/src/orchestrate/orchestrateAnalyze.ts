import {
  AutoBeAnalyzeHistory,
  AutoBeAssistantMessageHistory,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { randomUUID } from "crypto";

import { Orchestration } from "../analyze/AnalyzeAgent";
import { createAnalyst } from "../analyze/CreateAnalyst";
import { createReviewer } from "../analyze/CreateReviewer";
import { Planner } from "../analyze/Planner";
import { Planning } from "../analyze/Planning";
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

    const planning = new Planning();
    const planner = Planner(ctx.vendor, planning);

    const command = "Please write a proposal." as const;

    const agent = createAnalyst({
      execute: new Orchestration(ctx.vendor, planner, planning, createReviewer),
      api: ctx.vendor.api,
      userPlanningRequirements,
    });
    const conversations = await agent.conversate(command);

    const lastMessage = conversations[conversations.length - 1];
    console.log("lastMessage: ", lastMessage.type);
    if (lastMessage.type === "assistantMessage") {
      const completed_at = new Date().toISOString();
      return {
        id: randomUUID(),
        type: "assistantMessage",
        text: lastMessage.text,
        started_at,
        completed_at,
      } satisfies AutoBeAssistantMessageHistory;
    } else if (lastMessage.type === "describe") {
      return {
        id: randomUUID(),
        type: "analyze",
        completed_at: new Date().toISOString(),
        started_at,
        description: "",
        reason: "",
        files: planning.allFiles(),
        step: 1,
      } satisfies AutoBeAnalyzeHistory;
    } else {
      throw new Error();
    }
  };
