import * as fs from "fs";
import * as path from "path";

import type { EvaluationContext, Issue, PhaseResult } from "../../types";
import { PHASE_WEIGHTS, createIssue } from "../../types";
import { BaseEvaluator } from "../base";

/** Controller-to-provider mapping result */
interface ControllerProviderMapping {
  mapped: number;
  unmapped: number;
  ratio: number;
}

/** Counts used for requirements score computation */
interface RequirementsCounts {
  controllerCount: number;
  providerCount: number;
  structureCount: number;
  hasRequirementsDocs: boolean;
  mappingRatio: number;
}

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
      weightedScore: score * PHASE_WEIGHTS.requirementsCoverage,
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
  ): ControllerProviderMapping {
    if (controllers.length === 0) return { mapped: 0, unmapped: 0, ratio: 0 };

    // Extract and clean provider names — strip HTTP method prefixes and path
    // parameter segments (e.g. "patchShoppingMallCustomerRefundRequestsRefundRequestIdSnapshots"
    // → "shoppingmallcustomerrefundrequestssnapshots")
    const providerDomains = this.extractProviderDomains(providers);

    let mapped = 0;
    const unmappedNames: string[] = [];

    for (const ctrl of controllers) {
      const ctrlName = path
        .basename(ctrl, ".ts")
        .toLowerCase()
        .replace("controller", "");

      const ctrlNorm = this.normalizeName(ctrlName);
      const ctrlDomain = this.extractDomain(ctrlNorm);
      const hasProvider = providerDomains.some((pDomains) => {
        // Match against any of the provider's domain variants
        for (const pNorm of pDomains) {
          // Exact normalized match
          if (ctrlNorm === pNorm) return true;
          // Domain-based match
          const pDomain = this.extractDomain(pNorm);
          if (ctrlDomain && pDomain && ctrlDomain === pDomain) return true;
          // Containment: controller domain is a prefix/suffix of provider domain or vice versa
          if (
            ctrlNorm.length >= 3 &&
            pNorm.length >= 3 &&
            (pNorm.includes(ctrlNorm) || ctrlNorm.includes(pNorm))
          )
            return true;
        }
        return false;
      });

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

  /**
   * Extract cleaned domain names from provider file paths. AutoBE providers
   * follow the pattern: {httpMethod}{FullPath}Provider e.g.
   * "patchShoppingMallCustomerRefundRequestsRefundRequestIdSnapshots"
   *
   * Returns an array of domain variant arrays — each provider produces multiple
   * normalized forms to maximize matching success.
   */
  private extractProviderDomains(providers: string[]): string[][] {
    return providers.map((f) => {
      const raw = path.basename(f, ".ts").replace(/Provider$/i, "");

      // Strip HTTP method prefix (get/post/patch/put/delete)
      const withoutMethod = raw.replace(/^(get|post|patch|put|delete)/i, "");

      // Strip path parameter segments — camelCase words ending in "Id"
      // e.g. "RefundRequestId" or "ProductId" or "SnapshotId"
      const withoutIds = withoutMethod.replace(/[A-Z][a-z]*Id(?=[A-Z]|$)/g, "");

      const variants: string[] = [];
      // Full form without method (normalized)
      variants.push(this.normalizeName(withoutMethod.toLowerCase()));
      // Form without method + without ID params
      if (withoutIds !== withoutMethod) {
        variants.push(this.normalizeName(withoutIds.toLowerCase()));
      }
      // Original raw form (for traditional providers like "ShoppingMallProductsProvider")
      variants.push(this.normalizeName(raw.toLowerCase()));

      return variants;
    });
  }

  /**
   * Extract domain keyword from a filename. Returns empty string if the
   * remaining domain is too short (< 3 chars) to prevent overly aggressive
   * matching (e.g. "get" → "" instead of matching everything).
   */
  private extractDomain(name: string): string {
    const domain = name
      .replace(/^(get|post|patch|put|delete|create|update|remove)/i, "")
      .replace(/(controller|provider|service|module)$/i, "")
      .trim();
    // Require minimum length to avoid matching on empty/trivial strings
    return domain.length >= 3 ? domain : "";
  }

  /**
   * Normalize a name for matching: strip underscores, hyphens, and lowercase.
   * This ensures "admin_actions" and "adminactions" match each other.
   */
  private normalizeName(name: string): string {
    return name.replace(/[_\-]/g, "").toLowerCase();
  }

  private computeRequirementsScore(
    counts: RequirementsCounts,
    issues: Issue[],
  ): number {
    let score = 0;

    // Controllers exist (max 10, reduced from 20)
    if (counts.controllerCount > 0) {
      score += 10;
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

    // Providers exist (max 10, reduced from 20)
    if (counts.providerCount > 0) {
      score += 10;
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

    // Controller-Provider mapping (max 45, increased from 25 — primary discriminator)
    score += Math.round(counts.mappingRatio * 45);

    // Structures exist (max 10, reduced from 15)
    if (counts.structureCount > 0) {
      score += 10;
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

    // Requirements docs exist (max 5, reduced from 10)
    if (counts.hasRequirementsDocs) {
      score += 5;
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

    // Mapping quality tiers with graduated penalties
    if (counts.controllerCount > 0) {
      if (counts.mappingRatio < 0.3) {
        // Very low mapping: severe penalty
        const penalty = Math.round(((0.3 - counts.mappingRatio) / 0.3) * 30);
        score = Math.max(0, score - penalty);
        issues.push(
          createIssue({
            severity: "critical",
            category: "requirements",
            code: "REQ006",
            message: `Very low controller-provider mapping: ${Math.round(counts.mappingRatio * 100)}% — most API endpoints have no matching business logic`,
          }),
        );
      } else if (counts.mappingRatio < 0.6) {
        // Low mapping: moderate penalty
        const penalty = Math.round(((0.6 - counts.mappingRatio) / 0.3) * 15);
        score = Math.max(0, score - penalty);
        issues.push(
          createIssue({
            severity: "warning",
            category: "requirements",
            code: "REQ006",
            message: `Low controller-provider mapping: ${Math.round(counts.mappingRatio * 100)}% — many API endpoints may lack business logic`,
          }),
        );
      }
    }

    // Bonus for high mapping (>80%)
    if (counts.mappingRatio >= 0.8) {
      score += 10;
    }

    return Math.min(100, score);
  }
}
