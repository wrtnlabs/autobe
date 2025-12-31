import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeScenarioEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { transformAnalyzeWriteHistories } from "./transformAnalyzeWriteHistories";

export const transformAnalyzeReviewHistories = (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    myFile: AutoBeAnalyzeFile;
    preliminary: AutoBePreliminaryController<
      "analysisFiles" | "previousAnalysisFiles"
    >;
  },
): IAutoBeOrchestrateHistory => ({
  histories: [
    ...transformAnalyzeWriteHistories(ctx, {
      scenario: props.scenario,
      file: props.myFile,
      preliminary: null,
    }).histories.slice(0, -2),
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.ANALYZE_REVIEW,
    },
    ...props.preliminary.getHistories(),
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        Review the ${props.myFile.filename} document.
        
        Note that, never review others.
      `,
    },
  ],
  userMessage: "Review the requirement document",
});
