// RAG ON/OFF
import { IAutoBeConfig } from "../structures/IAutoBeConfig";
import { AnalysisContextMode } from "./vectorDB";

/**
 * Predefined RAG mode presets. Each preset defines behavior for RAG enabled
 * (on) vs disabled (off).
 */
export type RagModePreset =
  | "TOPK_FULL" // RAG ON: TOPK retrieval, RAG OFF: use all files
  | "TOPK_NONE"; // RAG ON: TOPK retrieval, RAG OFF: use no files

/** Mode mapping for on/off states. */
interface ModeMapping {
  on: AnalysisContextMode;
  off: AnalysisContextMode;
}

/** Preset to mode mapping. */
const PRESET_MAPPINGS: Record<RagModePreset, ModeMapping> = {
  TOPK_FULL: { on: "TOPK", off: "FULL" },
  TOPK_NONE: { on: "TOPK", off: "NONE" },
};

/**
 * Resolves the analysis context mode based on RAG configuration and preset.
 *
 * Each orchestrator specifies its own preset, and this function resolves the
 * actual mode. RAG is enabled by default (uses "on" mode from preset).
 *
 * @example
 *   ```ts
 *   // In orchestrateTestScenario.ts
 *   const RAG_PRESET: RagModePreset = "TOPK_FULL";
 *   const mode = resolveContextMode(ctx.config, RAG_PRESET);
 *   // Returns "TOPK" (RAG enabled by default)
 *   ```;
 *
 * @param _config - The AutoBE configuration (reserved for future per-agent RAG
 *   settings)
 * @param preset - The RAG mode preset for this orchestrator
 * @returns The resolved AnalysisContextMode (TOPK, FULL, or NONE)
 */
export function resolveContextMode(
  _config: IAutoBeConfig | undefined,
  preset: RagModePreset,
): AnalysisContextMode {
  // RAG is enabled by default; per-agent configuration may be added later
  const ragEnabled = true;
  const mapping = PRESET_MAPPINGS[preset];
  return ragEnabled ? mapping.on : mapping.off;
}

/**
 * Gets the RAG log setting.
 *
 * @param _config - The AutoBE configuration (reserved for future use)
 * @returns Whether RAG logging is enabled (false by default)
 */
export function getRagLogEnabled(_config: IAutoBeConfig | undefined): boolean {
  return false;
}

/**
 * Gets both mode and log settings for convenient use in orchestrators.
 *
 * @example
 *   ```ts
 *   const settings = getContextModeSettings(ctx.config, "TOPK_FULL", "testScenario");
 *   const files = await buildAnalysisContextFiles(
 *     getEmbedder(),
 *     analyzeFiles,
 *     queryText,
 *     settings.mode,
 *     { log: settings.log, logPrefix: settings.logPrefix }
 *   );
 *   ```;
 *
 * @param config - The AutoBE configuration
 * @param preset - The RAG mode preset for this orchestrator
 * @param logPrefix - Prefix for log messages (typically the orchestrator name)
 * @returns Object containing mode and log settings
 */
export function getContextModeSettings(
  config: IAutoBeConfig | undefined,
  preset: RagModePreset,
  logPrefix: string,
): { mode: AnalysisContextMode; log: boolean; logPrefix: string } {
  return {
    mode: resolveContextMode(config, preset),
    log: getRagLogEnabled(config),
    logPrefix,
  };
}
