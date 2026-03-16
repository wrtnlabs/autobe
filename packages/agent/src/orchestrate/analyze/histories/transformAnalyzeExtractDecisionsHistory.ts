import {
  AutoBeAnalyze,
  AutoBeAnalyzeWriteSectionEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";

/**
 * Transform histories for key decision extraction from a single file.
 *
 * Provides the extractor with:
 *
 * 1. The system prompt for decision extraction
 * 2. The full section content of ONE file
 *
 * Each file is processed independently in parallel, so only one file's content
 * is included per call.
 */
export const transformAnalyzeExtractDecisionsHistory = (
  _ctx: AutoBeContext,
  props: {
    file: AutoBeAnalyze.IFileScenario;
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
  },
): IAutoBeOrchestrateHistory => {
  // Build full section content for this file
  const fileContent = props.sectionEvents
    .map((sectionsForModule, moduleIndex) =>
      sectionsForModule
        .map((sectionEvent, unitIndex) =>
          sectionEvent.sectionSections
            .map(
              (section) =>
                `### [M${moduleIndex + 1}.U${unitIndex + 1}] ${section.title}\n\n${section.content}`,
            )
            .join("\n\n"),
        )
        .join("\n\n"),
    )
    .join("\n\n---\n\n");

  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.ANALYZE_EXTRACT_DECISIONS,
      },
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          ## File: ${props.file.filename}

          ## Full Section Content

          ${fileContent}
        `,
      },
    ],
    userMessage: `Extract all binary and discrete decisions from the file "${props.file.filename}". Return structured decisions for cross-file contradiction detection.`,
  };
};
