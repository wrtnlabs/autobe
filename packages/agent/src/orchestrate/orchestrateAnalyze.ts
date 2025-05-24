import {
  AutoBeAnalyzeHistory,
  AutoBeAssistantMessageHistory,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { randomUUID } from "crypto";
import { IPointer } from "tstl";

import { AnalyzeAgent } from "../analyze/AnalyzeAgent";
import { createReviewerAgent } from "../analyze/CreateReviewerAgent";
import { AutoBeContext } from "../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../context/IAutoBeApplicationProps";

type Filename = string;
type FileContent = string;

/** @todo Kakasoo */
export const orchestrateAnalyze =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeAnalyzeHistory> => {
    const pointer: IPointer<{ files: Record<Filename, FileContent> } | null> = {
      value: null,
    };

    const userPlanningRequirements = props.userPlanningRequirements;
    if (!userPlanningRequirements) {
      throw new Error(
        `Unable to prepare a proposal because there is no user requirement`,
      );
    }

    const created_at = new Date().toISOString();
    const agent = new AnalyzeAgent(createReviewerAgent, ctx, pointer);
    const response = await agent.conversate(
      [
        `Please write a user requirement report.`,
        "```json",
        JSON.stringify(userPlanningRequirements),
        "```",
      ].join("\n"),
    );

    if (pointer.value?.files) {
      return {
        id: randomUUID(),
        completed_at: new Date().toISOString(),
        description: "",
        reason: "",
        files: pointer.value?.files,
        created_at,
        step: 0,
        type: "analyze",
      } satisfies AutoBeAnalyzeHistory;
    }
    return {
      id: randomUUID(),
      type: "assistantMessage",
      text: response,
      created_at,
      completed_at: new Date().toISOString(),
    } satisfies AutoBeAssistantMessageHistory;
  };
