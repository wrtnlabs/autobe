import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteSectionEvent,
  AutoBeAnalyzeWriteUnitEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";
import YAML from "yaml";

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
    mechanicalViolationSummary?: string;
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
            const attrKeys = extractYamlAttributeKeys(section.content);
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

        ${
          props.mechanicalViolationSummary
            ? `
        ## Mechanical Validation Results (Already Addressed Separately)

        The following mechanical issues have been detected and will be patched separately.
        You do NOT need to flag these — focus only on semantic/logical consistency:

        ${props.mechanicalViolationSummary}
        `
            : ""
        }

        ## Cross-File Semantic Consistency Criteria

        Focus ONLY on issues requiring human-like judgment:
        1. Are there logical contradictions between files?
        2. Is terminology aligned (same concepts = same terms)?
        3. Are authentication/authorization models compatible across files?
        4. Are there features described in one file that conflict with another?
        5. Do any files invent features not in the scenario?
      `,
      },
    ],
    userMessage:
      "Review ALL files' section metadata for cross-file consistency and provide per-file approved/rejected verdicts.",
  };
};

// ─── Internal helpers ───

const YAML_CODE_BLOCK_REGEX = /```yaml\n([\s\S]*?)```/g;
const BACKTICK_ENTITY_FIELD_REGEX = /`(\w+\.\w+)`/g;

/**
 * Extract Entity.attribute keys from YAML spec blocks and backtick references.
 *
 * Returns a compact comma-separated string of attribute keys (e.g.,
 * "User.status, User.email, Todo.title") for lightweight cross-file
 * visibility.
 */
const extractYamlAttributeKeys = (content: string): string => {
  const keys: Set<string> = new Set();

  // Extract from YAML spec blocks
  const yamlMatches = content.matchAll(YAML_CODE_BLOCK_REGEX);
  for (const match of yamlMatches) {
    const yamlContent = match[1] ?? "";
    try {
      const parsed = YAML.parse(yamlContent);
      if (
        parsed &&
        typeof parsed === "object" &&
        typeof parsed.entity === "string" &&
        Array.isArray(parsed.attributes)
      ) {
        for (const attr of parsed.attributes) {
          if (attr && typeof attr.name === "string") {
            keys.add(`${parsed.entity}.${attr.name}`);
          }
        }
      }
    } catch {
      // skip parse errors
    }
  }

  // Extract from backtick `Entity.field` references
  const backtickMatches = content.matchAll(BACKTICK_ENTITY_FIELD_REGEX);
  for (const match of backtickMatches) {
    keys.add(match[1]!);
  }

  return [...keys].join(", ");
};
