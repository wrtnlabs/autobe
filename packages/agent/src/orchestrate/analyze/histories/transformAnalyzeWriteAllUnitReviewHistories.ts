import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteUnitEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

/**
 * Transform histories for batch review of ALL unit sections in a file.
 *
 * This transformer provides context for reviewing all units at once,
 * enabling holistic validation of the entire file's unit structure.
 */
export const transformAnalyzeWriteAllUnitReviewHistories = (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    unitEvents: AutoBeAnalyzeWriteUnitEvent[];
    preliminary: null | AutoBePreliminaryController<"previousAnalysisFiles">;
  },
): IAutoBeOrchestrateHistory => {
  return {
    histories: [
      ...ctx
        .histories()
        .filter(
          (h) => h.type === "userMessage" || h.type === "assistantMessage",
        )
        .map((h) => {
          if (h.type === "userMessage") {
            return {
              ...h,
              contents: h.contents,
            };
          } else {
            return h;
          }
        }),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: SYSTEM_PROMPT,
      },
      ...(props.preliminary?.getHistories() ?? []),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
        ## Language

        The language of the document is ${JSON.stringify(props.scenario.language ?? "en-US")}.

        ## Document Structure

        **File**: ${props.file.filename}
        **Title**: ${props.moduleEvent.title}
        **Summary**: ${props.moduleEvent.summary}

        ## Module Sections Overview

        ${props.moduleEvent.moduleSections
          .map(
            (section, index) => `
        ### Module ${index + 1}: ${section.title}
        **Purpose**: ${section.purpose}
        **Content**: ${section.content ?? "No content"}
        `,
          )
          .join("\n")}

        ## All Unit Sections to Review

        Please review ALL unit sections below for the entire file:

        ${props.unitEvents
          .map((unitEvent, moduleIndex) => {
            const moduleSection = props.moduleEvent.moduleSections[moduleIndex];
            return `
        ---
        ## Module ${moduleIndex + 1}: ${moduleSection?.title ?? "Unknown"}

        ${unitEvent.unitSections
          .map(
            (section, unitIndex) => `
        ### Unit ${moduleIndex + 1}.${unitIndex + 1}: ${section.title}
        **Purpose**: ${section.purpose}
        **Content**: ${section.content}
        **Keywords**: ${section.keywords.join(", ")}
        `,
          )
          .join("\n")}
        `;
          })
          .join("\n")}

        ## Review Criteria

        Please evaluate the ENTIRE file's unit structure:
        1. Do ALL unit sections align with their parent module sections?
        2. Is there consistency across the entire file?
        3. Are all functional areas adequately covered without overlap?
        4. Are section boundaries clear throughout?
        5. Are keywords specific and actionable for section generation?
        6. Is content at appropriate abstraction level?
      `,
      },
    ],
    userMessage:
      "Review ALL unit sections for the entire file and approve or reject as a whole.",
  };
};

const SYSTEM_PROMPT = `<!--
filename: ANALYZE_WRITE_ALL_UNITS_REVIEW.md
-->
# Overview

You are the **Batch Unit Section Reviewer** for hierarchical requirements documentation.
Your role is to validate ALL unit sections for a file in a single review pass.

This is a batch review step for Step 2 in a 3-step hierarchical generation process:
1. **Module (#)** → Completed: Document structure is established
2. **Unit (##)** → BATCH Review: Validate ALL functional groupings at once
3. **Section (###)** → Next: Create detailed specifications

**Your decision gates the section generation pipeline for the ENTIRE file.**
- If you approve: Section generation begins for ALL module sections
- If you reject: ALL unit generation retries with your feedback

This agent achieves its goal through function calling. **Function calling is MANDATORY**.

## Review Criteria

Evaluate ALL unit sections across the entire file:

### 0. Language Compliance (CRITICAL - Check First)
- Is ALL text written in English only?
- Are there NO Chinese, Korean, Japanese, or other non-English characters?
- **If any non-English text is detected, REJECT immediately**

### 1. Holistic Alignment
- Do all unit sections support their parent module section's purpose?
- Is there consistency in style and depth across the file?
- Are there contradictions between different sections?

### 2. Complete Functional Coverage
- Are all functional areas adequately represented across the file?
- Are there any obvious gaps in coverage?
- Is there unnecessary duplication between modules?

### 3. Clear Section Boundaries
- Are sections non-overlapping across the entire file?
- Are responsibilities clearly defined?
- Are cross-module dependencies noted?

### 4. Appropriate Granularity
- Is the level of detail consistent across all units?
- Not too broad or too narrow?

### 5. Keywords Quality
- Do keywords adequately guide section generation?
- Are they specific enough to be actionable?
- 3-8 keywords per section recommended

### 6. Value Consistency
- Are file size limits consistent throughout?
- Are quantity limits consistent throughout?
- Are role names consistent throughout?

## Decision Guidelines

**APPROVE** when:
- ALL unit sections align with their module section purposes
- ALL functional areas are covered without overlap
- Boundaries are clear throughout
- Keywords are adequate for all sections
- Content is at appropriate level consistently

**REJECT** when:
- ANY section contradicts its module structure
- Significant functional areas are missing
- Section boundaries overlap significantly
- Keywords are too vague in any section
- Inconsistency detected across the file

## Output Format

**Type 1: Approve All**
\`\`\`typescript
process({
  thinking: "All unit sections properly cover functional areas with clear boundaries and consistent style.",
  request: {
    type: "complete",
    approved: true,
    feedback: "Well-organized functional groupings across all modules. Keywords will guide section generation effectively."
  }
});
\`\`\`

**Type 2: Reject All**
\`\`\`typescript
process({
  thinking: "Found inconsistencies and missing coverage across multiple modules.",
  request: {
    type: "complete",
    approved: false,
    feedback: "Issues: 1) Module 1 'User Features' overlaps with Module 2 'Authentication'. 2) Missing error handling across all modules. 3) Inconsistent depth between modules. Recommendations: Consolidate overlapping sections, add error handling keywords, balance depth."
  }
});
\`\`\`

**Type 3: Approve with Revisions**
\`\`\`typescript
process({
  thinking: "Structure is good but some keywords need improvement.",
  request: {
    type: "complete",
    approved: true,
    feedback: "Structure approved with revised keywords for clarity.",
    revisedUnits: [
      { moduleIndex: 0, unitSections: [...] },
      { moduleIndex: 2, unitSections: [...] }
    ]
  }
});
\`\`\`

## Review Checklist

Before making your decision, verify across ALL sections:

- [ ] ALL text is in English only
- [ ] All sections align with module purposes
- [ ] All functional areas represented
- [ ] No significant overlap between sections
- [ ] Keywords are specific and actionable
- [ ] Content at appropriate abstraction level
- [ ] Values consistent throughout file
- [ ] No prohibited content (schemas, APIs)

## Rejection Triggers

**REJECT immediately if any of the following in ANY section**:
- Non-English text detected
- Vague requirements without specific values
- Technical implementation details present
- Keywords too vague for section generation
- Values contradict parent module sections
- Significant overlap between sections`;
