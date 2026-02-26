import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteSectionEvent,
  AutoBeAnalyzeWriteUnitEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

/**
 * Transform histories for cross-file lightweight review of section metadata.
 *
 * This transformer provides ONLY section titles, keywords, and purposes from
 * ALL files — NOT full content. This keeps the input well within context limits
 * even with hundreds of sections.
 */
export const transformAnalyzeSectionCrossFileReviewHistory = (
  _ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    allFileSummaries: Array<{
      file: AutoBeAnalyzeFile.Scenario;
      moduleEvent: AutoBeAnalyzeWriteModuleEvent;
      unitEvents: AutoBeAnalyzeWriteUnitEvent[];
      sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
      status: "approved" | "rewritten" | "new";
    }>;
    constraintReport: string;
    attributeOwnershipReport: string;
    enumConsistencyReport: string;
    preliminary: null | AutoBePreliminaryController<"previousAnalysisFiles">;
  },
): IAutoBeOrchestrateHistory => {
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.ANALYZE_SECTION_CROSS_FILE_REVIEW,
      },
      ...(props.preliminary?.getHistories() ?? []),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
        ## Language

        The language of the document is ${JSON.stringify(props.scenario.language ?? "en-US")}.

        ## All Files' Section Metadata for Cross-File Consistency Review

        Below is lightweight metadata (titles, keywords, purposes) from ALL files.
        Full content has already been validated in per-file review.

        ${props.allFileSummaries
          .map(
            (
              { file, moduleEvent, unitEvents, sectionEvents, status },
              fileIndex,
            ) => `
        ---
        ## File ${fileIndex + 1}: ${file.filename} [Status: ${status === "approved" ? "✅ Previously Approved" : status === "rewritten" ? "🔄 Rewritten" : "🆕 New"}]

        **Title**: ${moduleEvent.title}
        **Summary**: ${moduleEvent.summary}

        ${sectionEvents
          .map((sectionsForModule, moduleIndex) => {
            const moduleSection = moduleEvent.moduleSections[moduleIndex];
            const unitEvent = unitEvents[moduleIndex];
            return `
        ### Module ${moduleIndex + 1}: ${moduleSection?.title ?? "Unknown"}

        ${sectionsForModule
          .map((sectionEvent, unitIndex) => {
            const unitSection = unitEvent?.unitSections[unitIndex];
            return `
        #### Unit ${moduleIndex + 1}.${unitIndex + 1}: ${unitSection?.title ?? "Unknown"}
        **Keywords**: ${unitSection?.keywords.join(", ") ?? "None"}

        Sections:
        ${sectionEvent.sectionSections
          .map((section) => {
            const attrKeys = extractBridgeAttributeKeys(section.content);
            return `- **${section.title}**${attrKeys ? ` [attrs: ${attrKeys}]` : ""}`;
          })
          .join("\n")}
        `;
          })
          .join("\n")}
        `;
          })
          .join("\n")}
        `,
          )
          .join("\n")}

        ## Constraint Consistency Report (Numeric/Limit Conflicts)

        ${props.constraintReport}

        ## Attribute Ownership Report (Cross-File Duplication)

        ${props.attributeOwnershipReport}

        ## Enum Consistency Report (Cross-File Value Conflicts)

        ${props.enumConsistencyReport}

        ## Cross-File Consistency Criteria

        Please evaluate across ALL files:
        1. Are values and constraints consistent across all files?
        2. Is terminology aligned (same concepts = same terms)?
        3. Are naming conventions consistent?
        4. Is there content duplication between files?
        5. Is structural depth proportionate across files?
      `,
      },
    ],
    userMessage:
      "Review ALL files' section metadata for cross-file consistency and provide per-file approved/rejected verdicts.",
  };
};

// ─── Internal helpers ───

const DOWNSTREAM_CONTEXT_REGEX =
  /\*\*\[DOWNSTREAM CONTEXT\]\*\*([\s\S]*?)\n---/g;

const CROSS_REFERENCE_PATTERN = /\((?:defined in|see)\s+["']?[^)]+["']?\)/i;

/**
 * Extract Entity.attribute keys from Bridge Block content.
 *
 * Returns a compact comma-separated string of attribute keys (e.g.,
 * "User.status, User.email, Todo.title") for lightweight cross-file visibility.
 * Only keys are included — not full specifications — to minimize context size.
 */
const extractBridgeAttributeKeys = (content: string): string => {
  const keys: string[] = [];
  const matches = content.matchAll(DOWNSTREAM_CONTEXT_REGEX);

  for (const match of matches) {
    const block = match[1] ?? "";
    const lines = block.split("\n");
    let inAttributes = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.startsWith("**Attributes Specified**")) {
        inAttributes = true;
        continue;
      }
      if (
        line.startsWith("**") &&
        !line.startsWith("**Attributes Specified**")
      ) {
        inAttributes = false;
        continue;
      }
      if (!inAttributes || !line.startsWith("-")) continue;

      const body = line.replace(/^-+\s*/, "");
      const colonIndex = body.indexOf(":");
      if (colonIndex < 0) continue;

      const key = body.slice(0, colonIndex).trim();
      const value = body.slice(colonIndex + 1).trim();

      // Skip cross-references and None
      if (CROSS_REFERENCE_PATTERN.test(value)) continue;
      if (/^none$/i.test(value)) continue;
      // Only Entity.attribute format
      if (!key.includes(".")) continue;

      keys.push(key);
    }
  }

  return keys.join(", ");
};
