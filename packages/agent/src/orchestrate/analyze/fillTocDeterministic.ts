import {
  AutoBeAnalyzeFileScenario,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteSectionEvent,
  AutoBeAnalyzeWriteUnitEvent,
} from "@autobe/interface";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import {
  FixedAnalyzeTemplateFileTemplate,
  buildFixedAnalyzeCanonicalSourceContent,
  buildFixedAnalyzeDocumentMapContent,
} from "./structures/FixedAnalyzeTemplate";

/**
 * Per-file state (mirrors IFileState from orchestrateAnalyze.ts).
 *
 * Only the fields needed by the TOC fill are required here.
 */
interface ITocFileState {
  file: AutoBeAnalyzeFileScenario;
  moduleResult: AutoBeAnalyzeWriteModuleEvent | null;
  unitResults: AutoBeAnalyzeWriteUnitEvent[] | null;
  sectionResults: AutoBeAnalyzeWriteSectionEvent[][] | null;
}

// ─── Helpers ───

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N} -]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Zero-cost metric/token stubs ───

const ZERO_TOKEN_USAGE = {
  total: 0,
  input: { total: 0, cached: 0 },
  output: {
    total: 0,
    reasoning: 0,
    accepted_prediction: 0,
    rejected_prediction: 0,
  },
} as const;

const ZERO_METRIC = {
  attempt: 0,
  success: 0,
  consent: 0,
  validationFailure: 0,
  invalidJson: 0,
} as const;

const EMPTY_ACQUISITION = { previousAnalysisSections: [] as number[] };

// ─── Main ───

/**
 * Fill the TOC file (00-toc.md) deterministically — no LLM calls.
 *
 * Must be called AFTER all other files (01-05) have completed Stage 2/3 so that
 * their module/unit/section titles are available for navigation.
 *
 * Returns the final markdown content directly (no module/unit hierarchy). Also
 * sets minimal `unitResults` and `sectionResults` so that
 * `convertToSectionEntries()` for preloading still works.
 */
export function fillTocDeterministic(
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    tocFileState: ITocFileState;
    otherFileStates: ITocFileState[];
    expandedTemplate: FixedAnalyzeTemplateFileTemplate[];
  },
): string {
  const { scenario, tocFileState, otherFileStates, expandedTemplate } = props;
  const step = (ctx.state().analyze?.step ?? -1) + 1;

  // Build flat markdown content — no # / ## / ### hierarchy
  const content = buildTocContent(scenario, expandedTemplate, otherFileStates);

  // Minimal unit/section events for convertToSectionEntries() preloading
  const unitEvent: AutoBeAnalyzeWriteUnitEvent = {
    type: "analyzeWriteUnit",
    id: v7(),
    moduleIndex: 0,
    unitSections: [
      {
        title: "Table of Contents",
        purpose:
          "Project summary, document navigation, glossary, and assumptions.",
        content:
          "Project summary, document navigation, glossary, and assumptions.",
        keywords: ["project-summary", "document-map", "glossary", "navigation"],
      },
    ],
    step,
    retry: 0,
    total: 1,
    completed: 1,
    tokenUsage: { ...ZERO_TOKEN_USAGE },
    metric: { ...ZERO_METRIC },
    acquisition: { ...EMPTY_ACQUISITION },
    created_at: new Date().toISOString(),
  };

  const sectionEvent: AutoBeAnalyzeWriteSectionEvent = {
    type: "analyzeWriteSection",
    id: v7(),
    moduleIndex: 0,
    unitIndex: 0,
    sectionSections: [{ title: "Table of Contents", content }],
    step,
    retry: 0,
    total: 1,
    completed: 1,
    tokenUsage: { ...ZERO_TOKEN_USAGE },
    metric: { ...ZERO_METRIC },
    acquisition: { ...EMPTY_ACQUISITION },
    created_at: new Date().toISOString(),
  };

  tocFileState.moduleResult = {
    ...tocFileState.moduleResult!,
    moduleSections: [
      {
        title: "Table of Contents",
        purpose:
          "Project summary, document navigation, glossary, and assumptions.",
        content: "",
      },
    ],
  };
  tocFileState.unitResults = [unitEvent];
  tocFileState.sectionResults = [[sectionEvent]];

  return content;
}

// ─── Content builder ───

/**
 * Build the entire TOC content as a single markdown string.
 *
 * Combines project vision, scope, document map, canonical sources, glossary,
 * and assumptions into one flat section.
 */
function buildTocContent(
  scenario: AutoBeAnalyzeScenarioEvent,
  expandedTemplate: FixedAnalyzeTemplateFileTemplate[],
  otherFileStates: ITocFileState[],
): string {
  const lines: string[] = [];

  lines.push("### Table of Contents", "");

  // ── Project Vision ──
  const actors = scenario.actors.map((a) => a.name).join(", ");
  const entities = scenario.entities.map((e) => e.name).join(", ");
  lines.push(
    `**${scenario.prefix}** is a backend service with the following actors and domain entities.`,
    "",
    `**Actors**: ${actors}`,
    `**Entities**: ${entities}`,
  );

  // ── Scope ──
  lines.push("", "---", "", "**Scope**", "");
  for (const e of scenario.entities) {
    const rels =
      e.relationships && e.relationships.length > 0
        ? ` — ${e.relationships.join(", ")}`
        : "";
    lines.push(`- **${e.name}**${rels}`);
  }
  lines.push("");
  for (const a of scenario.actors) {
    lines.push(`- **${a.name}** (${a.kind})`);
  }

  // ── Document Map ──
  lines.push("", "---", "", "**Document Map**", "");
  lines.push(buildFixedAnalyzeDocumentMapContent(expandedTemplate));

  // ── Section Navigation ──
  lines.push("", "**Section Navigation**");
  lines.push(
    "",
    '<!-- Load sections by ID: `process({ request: { type: "getAnalysisSections", sectionIds: [ID, ...] } })` -->',
  );

  // TOC itself occupies section ID 0, so remaining files start from ID 1
  let sectionId = 1;

  for (const state of otherFileStates) {
    if (!state.moduleResult || !state.unitResults) continue;
    const filename = state.file.filename;
    lines.push("", `**[${filename}](./${filename})**`);

    // Per-file anchor counter for GFM duplicate heading resolution
    const anchorCounts = new Map<string, number>();
    const resolveAnchor = (title: string): string => {
      const base = slugify(title);
      const count = anchorCounts.get(base) ?? 0;
      anchorCounts.set(base, count + 1);
      return count === 0 ? base : `${base}-${count}`;
    };

    // Same traversal order as assembleModule / convertToSectionEntries:
    // moduleIndex ascending, then unitIndex ascending
    for (
      let moduleIndex = 0;
      moduleIndex < state.moduleResult.moduleSections.length;
      moduleIndex++
    ) {
      const moduleSection = state.moduleResult.moduleSections[moduleIndex];
      const unitEvent = state.unitResults[moduleIndex];
      if (!moduleSection || !unitEvent) continue;

      lines.push(
        `- [${moduleSection.title}](./${filename}#${resolveAnchor(moduleSection.title)})`,
      );

      for (const unitSection of unitEvent.unitSections) {
        const purpose = unitSection.purpose ? ` — ${unitSection.purpose}` : "";
        lines.push(
          `  - [${sectionId}] [${unitSection.title}](./${filename}#${resolveAnchor(unitSection.title)})${purpose}`,
        );
        sectionId++;
      }
    }
  }

  // ── Canonical Sources ──
  lines.push("", "---", "", "**Canonical Sources**", "");
  lines.push(buildFixedAnalyzeCanonicalSourceContent());

  // ── Glossary ──
  lines.push("", "---", "", "**Glossary**", "");
  for (const e of scenario.entities) {
    const rels =
      e.relationships && e.relationships.length > 0
        ? ` — ${e.relationships.join(", ")}`
        : "";
    lines.push(`- **${e.name}**${rels}`);
  }

  // ── Constraints & Features ──
  const constraintLines: string[] = [];
  for (const file of scenario.files) {
    if (file.constraints && file.constraints.length > 0) {
      for (const c of file.constraints) {
        constraintLines.push(`- ${c}`);
      }
    }
  }
  if (constraintLines.length > 0) {
    lines.push("", "---", "", "**Constraints**", "");
    lines.push(...constraintLines);
  }

  const features =
    scenario.features.length > 0
      ? scenario.features.map((f) => `- ${f.id}`).join("\n")
      : null;
  if (features) {
    lines.push("", "**Active Features**", "", features);
  }

  return lines.join("\n");
}
