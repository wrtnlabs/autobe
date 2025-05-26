import {
  AutoBeAnalyzeHistory,
  AutoBeAssistantMessageHistory,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import { v4 } from "uuid";

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

    const step = ctx.state().analyze?.step ?? 0;
    const created_at = new Date().toISOString();
    ctx.dispatch({
      type: "analyzeStart",
      reason: userPlanningRequirements,
      step,
      created_at,
    });

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
      const history: AutoBeAnalyzeHistory = {
        id: v4(),
        type: "analyze",
        reason: userPlanningRequirements,
        description: "",
        files: pointer.value.files,
        step,
        created_at,
        completed_at: new Date().toISOString(),
      };
      ctx.dispatch({
        type: "analyzeComplete",
        files: pointer.value.files,
        step,
        created_at,
      });
      return history;
    }
    const history: AutoBeAssistantMessageHistory = {
      id: v4(),
      type: "assistantMessage",
      text: response,
      created_at,
      completed_at: new Date().toISOString(),
    };
    ctx.dispatch({
      type: "assistantMessage",
      text: response,
      created_at,
    });
    return history;
  };
