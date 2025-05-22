import { MicroAgentica } from "@agentica/core";
import {
  AutoBeAnalyzeHistory,
  AutoBeAssistantMessageHistory,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { randomUUID } from "crypto";
import typia from "typia";

import { Orchestration } from "../analyze/AnalyzeAgent";
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
    const started_at = new Date().toISOString();
    const planning = new Planning();
    const planner = Planner(ctx.vendor, planning);
    const innerAgent = new Orchestration(
      ctx.vendor,
      planner,
      planning,
      createReviewer,
    );

    const analyzeAgent = new MicroAgentica({
      controllers: [
        {
          name: "Analyze Agent For Planning",
          protocol: "class",
          application: typia.llm.application<Orchestration, "chatgpt">(),
          execute: innerAgent,
        },
      ],
      model: "chatgpt",
      vendor: {
        api: ctx.vendor.api,
        model: "gpt-4.1",
      },
      histories: [
        {
          text: props.userPlanningRequirements,
          type: "assistantMessage",
        },
      ],
    });

    const command = "Please write a proposal." as const;
    const conversations = await analyzeAgent.conversate(command);

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
      } satisfies AutoBeAnalyzeHistory;
    } else {
      throw new Error();
    }
  };
