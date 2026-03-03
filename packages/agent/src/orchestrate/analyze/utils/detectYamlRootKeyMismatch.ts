import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeWriteSectionEvent,
} from "@autobe/interface";
import YAML from "yaml";

import { FixedAnalyzeTemplate } from "../structures/FixedAnalyzeTemplate";

// ─── Types ───

export interface IYamlRootKeyMismatch {
  file: string;
  sectionTitle: string;
  expectedRootKey: string;
  actualKeys: string[];
}

type FileSectionInput = Array<{
  file: AutoBeAnalyzeFile.Scenario;
  sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
}>;

// ─── Constants ───

const YAML_CODE_BLOCK_REGEX = /```yaml\n([\s\S]*?)```/g;

/**
 * Build a map: filename → expected YAML root keys from the template's
 * yamlSpecs.
 */
function buildExpectedRootKeys(): Map<string, string[]> {
  const map: Map<string, string[]> = new Map();
  for (const fileTemplate of FixedAnalyzeTemplate.TEMPLATE) {
    if (fileTemplate.yamlSpecs && fileTemplate.yamlSpecs.length > 0) {
      map.set(
        fileTemplate.filename,
        fileTemplate.yamlSpecs.map(
          (s: FixedAnalyzeTemplate.IYamlSpecDefinition) => s.rootKey,
        ),
      );
    }
  }
  return map;
}

// ─── Main Detection ───

/**
 * Detect YAML blocks in canonical files where the root key doesn't match the
 * expected key from the template's yamlSpecs.
 *
 * // typos: ignore-next-line Catches typos like `enity:` instead of `entity:`,
 * `error:` instead of `errors:`, etc. Only checks files that have yamlSpecs
 * defined (01, 02, 04).
 */
export const detectYamlRootKeyMismatches = (props: {
  files: FileSectionInput;
}): IYamlRootKeyMismatch[] => {
  const expectedRootKeys = buildExpectedRootKeys();
  const mismatches: IYamlRootKeyMismatch[] = [];

  for (const { file, sectionEvents } of props.files) {
    const expectedKeys = expectedRootKeys.get(file.filename);
    if (!expectedKeys || expectedKeys.length === 0) continue;

    for (const sectionsForModule of sectionEvents) {
      for (const sectionEvent of sectionsForModule) {
        for (const section of sectionEvent.sectionSections) {
          const yamlMatches = section.content.matchAll(YAML_CODE_BLOCK_REGEX);
          for (const match of yamlMatches) {
            const yamlContent = match[1] ?? "";
            try {
              const parsed = YAML.parse(yamlContent);
              if (!parsed || typeof parsed !== "object") continue;

              const actualKeys = Object.keys(parsed);
              const hasExpectedKey = expectedKeys.some((k) =>
                actualKeys.includes(k),
              );

              if (!hasExpectedKey && actualKeys.length > 0) {
                mismatches.push({
                  file: file.filename,
                  sectionTitle: section.title,
                  expectedRootKey: expectedKeys.join(" | "),
                  actualKeys,
                });
              }
            } catch {
              // skip parse errors — handled by other validators
            }
          }
        }
      }
    }
  }

  return mismatches;
};

/** Build a map from filename → list of YAML root key mismatch feedback strings. */
export const buildFileYamlRootKeyMismatchMap = (
  mismatches: IYamlRootKeyMismatch[],
): Map<string, string[]> => {
  const map: Map<string, string[]> = new Map();

  for (const m of mismatches) {
    const feedback =
      `YAML root key mismatch in "${m.sectionTitle}": ` +
      `expected root key "${m.expectedRootKey}" but found [${m.actualKeys.join(", ")}]. ` +
      // typos: ignore-next-line
      `Check for typos (e.g., "enity" instead of "entity"). ` +
      `Fix the YAML root key to match the expected format.`;

    if (!map.has(m.file)) map.set(m.file, []);
    map.get(m.file)!.push(feedback);
  }

  return map;
};
