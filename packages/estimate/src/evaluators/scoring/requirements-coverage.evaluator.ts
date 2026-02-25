import * as fs from "fs";
import * as path from "path";

import type { EvaluationContext, Issue, PhaseResult } from "../../types";
import { createIssue } from "../../types";
import { BaseEvaluator } from "../base";

export class RequirementsCoverageEvaluator extends BaseEvaluator {
  readonly name = "RequirementsCoverageEvaluator";
  readonly phase = "requirementsCoverage" as const;
  readonly description = "Evaluates requirements to implementation coverage";

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const issues: Issue[] = [];
    const startTime = performance.now();

    const controllerCount = context.files.controllers.length;
    const providerCount = context.files.providers.length;
    const structureCount = context.files.structures.length;

    // Check controller-to-provider mapping
    const mapping = this.checkControllerProviderMapping(
      context.files.controllers,
      context.files.providers,
      issues,
    );

    // Check if docs/analysis exists and has content
    const docsPath = path.join(context.project.rootPath, "docs", "analysis");
    let hasRequirementsDocs = false;
    let requirementsDocCount = 0;

    if (fs.existsSync(docsPath)) {
      try {
        const files = fs.readdirSync(docsPath);
        requirementsDocCount = files.filter(
          (f) => f.endsWith(".md") || f.endsWith(".json"),
        ).length;
        hasRequirementsDocs = requirementsDocCount > 0;
      } catch {
        // Skip
      }
    }

    const score = this.computeRequirementsScore(
      {
        controllerCount,
        providerCount,
        structureCount,
        hasRequirementsDocs,
        mappingRatio: mapping.ratio,
      },
      issues,
    );

    return {
      phase: "requirementsCoverage",
      passed: true,
      score,
      maxScore: 100,
      weightedScore: score * 0.25,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: {
        controllerCount,
        providerCount,
        structureCount,
        requirementsDocCount,
        hasRequirementsDocs,
        mappedControllers: mapping.mapped,
        unmappedControllers: mapping.unmapped,
        mappingRatio: mapping.ratio,
      },
    };
  }

  /** Check how many controllers have matching providers */
  private checkControllerProviderMapping(
    controllers: string[],
    providers: string[],
    issues: Issue[],
  ): { mapped: number; unmapped: number; ratio: number } {
    if (controllers.length === 0) return { mapped: 0, unmapped: 0, ratio: 0 };

    const providerNames = providers.map((f) =>
      path.basename(f, ".ts").toLowerCase().replace("provider", ""),
    );

    let mapped = 0;
    const unmappedNames: string[] = [];

    for (const ctrl of controllers) {
      const ctrlName = path
        .basename(ctrl, ".ts")
        .toLowerCase()
        .replace("controller", "");

      // Check if any provider matches this controller's domain
      const hasProvider = providerNames.some(
        (p) =>
          p.includes(ctrlName) ||
          ctrlName.includes(p) ||
          this.extractDomain(ctrlName) === this.extractDomain(p),
      );

      if (hasProvider) {
        mapped++;
      } else {
        unmappedNames.push(path.basename(ctrl, ".ts"));
      }
    }

    const unmapped = controllers.length - mapped;

    if (unmapped > 0) {
      const shown = unmappedNames.slice(0, 5).join(", ");
      const extra =
        unmappedNames.length > 5
          ? ` ... and ${unmappedNames.length - 5} more`
          : "";
      issues.push(
        createIssue({
          severity: "warning",
          category: "requirements",
          code: "REQ005",
          message: `${unmapped} controller(s) have no matching provider: ${shown}${extra}`,
        }),
      );
    }

    return {
      mapped,
      unmapped,
      ratio: mapped / controllers.length,
    };
  }

  /** Extract domain keyword from a filename */
  private extractDomain(name: string): string {
    // Remove common prefixes/suffixes and get the core domain
    return name
      .replace(/^(get|post|patch|put|delete|create|update|remove)/i, "")
      .replace(/(controller|provider|service|module)$/i, "")
      .trim();
  }

  private computeRequirementsScore(
    counts: {
      controllerCount: number;
      providerCount: number;
      structureCount: number;
      hasRequirementsDocs: boolean;
      mappingRatio: number;
    },
    issues: Issue[],
  ): number {
    let score = 0;

    // Controllers exist (max 20)
    if (counts.controllerCount > 0) {
      score += 20;
    } else {
      issues.push(
        createIssue({
          severity: "critical",
          category: "requirements",
          code: "REQ001",
          message: "No controllers found - API endpoints not implemented",
        }),
      );
    }

    // Providers exist (max 20)
    if (counts.providerCount > 0) {
      score += 20;
    } else {
      issues.push(
        createIssue({
          severity: "critical",
          category: "requirements",
          code: "REQ002",
          message: "No providers found - business logic not implemented",
        }),
      );
    }

    // Controller-Provider mapping (max 25)
    score += Math.round(counts.mappingRatio * 25);

    // Structures exist (max 15)
    if (counts.structureCount > 0) {
      score += 15;
    } else {
      issues.push(
        createIssue({
          severity: "warning",
          category: "requirements",
          code: "REQ003",
          message: "No structures/DTOs found",
        }),
      );
    }

    // Provider depth — multiple providers per controller (max 10)
    if (counts.controllerCount > 0) {
      const ratio = counts.providerCount / counts.controllerCount;
      if (ratio >= 2) score += 10;
      else if (ratio >= 1.5) score += 7;
      else if (ratio >= 1) score += 5;
    }

    // Requirements docs exist (max 10)
    if (counts.hasRequirementsDocs) {
      score += 10;
    } else {
      issues.push(
        createIssue({
          severity: "warning",
          category: "requirements",
          code: "REQ004",
          message: "No requirements documents found in docs/analysis/",
        }),
      );
    }

    return Math.min(100, score);
  }
}
