import { AutoBeAnalyzeDocumentSection } from "@autobe/interface";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";

/**
 * Transform histories for the Analyze Document (Semantic Layer extraction)
 * agent.
 *
 * Provides the LLM with:
 *
 * 1. System prompt for SRS extraction
 * 2. The file's assembled markdown content
 * 3. The Evidence Layer sections with sectionIds for traceability
 * 4. The file's categoryId as a hint for relevant SRS categories
 */
export const transformAnalyzeDocumentHistory = (props: {
  fileIndex: number;
  filename: string;
  categoryId: string;
  content: string;
  sections: AutoBeAnalyzeDocumentSection[];
}): IAutoBeOrchestrateHistory => {
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.ANALYZE_DOCUMENT,
      },
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: [
          `## File Information`,
          ``,
          `- **File Index**: ${props.fileIndex}`,
          `- **Filename**: ${props.filename}`,
          `- **Category**: ${props.categoryId}`,
          ``,
          `## Evidence Layer Sections`,
          ``,
          `The following sections are available for \`sourceSectionIds\` references:`,
          ``,
          "```json",
          JSON.stringify(
            props.sections.map((s) => ({
              sectionId: s.sectionId,
              level: s.level,
              heading: s.heading,
            })),
            null,
            2,
          ),
          "```",
          ``,
          `## File Content`,
          ``,
          props.content,
        ].join("\n"),
      },
    ],
    userMessage:
      "Extract structured SRS data from this analysis file. Only populate SRS categories relevant to this file's content. Ensure every traceable item has valid sourceSectionIds referencing the Evidence Layer sections listed above.",
  };
};
