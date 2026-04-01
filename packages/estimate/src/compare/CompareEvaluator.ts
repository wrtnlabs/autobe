import * as fs from "fs";
import * as path from "path";

import { CLIOptions, runCLI } from "../cli";
import type {
  AgentEvaluation,
  AgentScores,
  CompareInput,
  CompareResult,
  EstimateReport,
  ProjectResult,
} from "./types";

export class CompareEvaluator {
  private verbose: boolean;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
  }

  /** Compare projects - either from existing reports or by running evaluations */
  async compare(input: CompareInput): Promise<CompareResult> {
    const results: ProjectResult[] = [];

    for (const project of input.projects) {
      if (this.verbose) {
        console.log(`\n📊 Processing: ${project.name}`);
      }

      // Check if path contains estimate-report.json (existing report)
      const existingReport = path.join(project.path, "estimate-report.json");

      if (fs.existsSync(existingReport)) {
        // Load existing report
        const result = this.loadResult(
          project.name,
          project.path,
          project.path,
        );
        results.push(result);
      } else {
        // Run evaluation
        const reportPath = path.join(
          input.outputPath,
          this.sanitizeName(project.name),
        );
        await this.runEstimate(project.path, reportPath, input);
        const result = this.loadResult(project.name, project.path, reportPath);
        results.push(result);
      }
    }

    return this.generateComparison(results);
  }

  private sanitizeName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, "-");
  }

  private async runEstimate(
    inputPath: string,
    outputPath: string,
    options: CompareInput,
  ): Promise<void> {
    const cliOptions: CLIOptions = {
      input: inputPath,
      output: outputPath,
      verbose: this.verbose,
      continueOnGateFailure: true,
      useAgent: options.useAgent,
      provider: options.provider as CLIOptions["provider"],
      apiKey: options.apiKey,
    };

    try {
      await runCLI(cliOptions);
    } catch (_error) {
      if (this.verbose) {
        console.log(`⚠️ Evaluation completed with issues`);
      }
    }
  }

  private loadResult(
    name: string,
    projectPath: string,
    reportPath: string,
  ): ProjectResult {
    const jsonPath = path.join(reportPath, "estimate-report.json");

    if (!fs.existsSync(jsonPath)) {
      throw new Error(`Report not found: ${jsonPath}`);
    }

    let report: EstimateReport;
    try {
      report = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    } catch (err) {
      throw new Error(
        `Failed to parse report ${jsonPath}: ${err instanceof Error ? err.message : err}`,
      );
    }

    return {
      name,
      path: projectPath,
      totalScore: report.totalScore ?? 0,
      grade: report.grade ?? "F",
      gatePass: report.phases?.gate?.passed ?? false,
      scores: {
        documentQuality: report.phases?.documentQuality?.score ?? 0,
        requirementsCoverage: report.phases?.requirementsCoverage?.score ?? 0,
        testCoverage: report.phases?.testCoverage?.score ?? 0,
        logicCompleteness: report.phases?.logicCompleteness?.score ?? 0,
        apiCompleteness: report.phases?.apiCompleteness?.score ?? 0,
      },
      metrics: {
        files: report.meta?.evaluatedFiles ?? 0,
        controllers:
          report.phases?.requirementsCoverage?.metrics?.controllerCount ?? 0,
        providers:
          report.phases?.requirementsCoverage?.metrics?.providerCount ?? 0,
        structures:
          report.phases?.requirementsCoverage?.metrics?.structureCount ?? 0,
        tests: report.phases?.testCoverage?.metrics?.testCount ?? 0,
      },
      agentScores: this.extractAgentScores(report),
      penalties: this.extractPenalties(report),
      issues: {
        gate: report.phases?.gate?.issues?.length || 0,
        requirements: report.phases?.requirementsCoverage?.issues?.length || 0,
        logic: report.phases?.logicCompleteness?.issues?.length || 0,
      },
    };
  }

  private extractAgentScores(report: EstimateReport): AgentScores | undefined {
    if (!report.agentEvaluations || report.agentEvaluations.length === 0) {
      return undefined;
    }

    const security = report.agentEvaluations.find(
      (a: AgentEvaluation) => a.agent === "SecurityAgent",
    );
    const llm = report.agentEvaluations.find(
      (a: AgentEvaluation) => a.agent === "LLMQualityAgent",
    );
    const hallucination = report.agentEvaluations.find(
      (a: AgentEvaluation) => a.agent === "HallucinationAgent",
    );

    return {
      security: security?.score || 0,
      llmQuality: llm?.score || 0,
      hallucination: hallucination?.score || 0,
    };
  }

  private extractPenalties(
    report: EstimateReport,
  ): ProjectResult["penalties"] | undefined {
    if (!report.penalties) return undefined;

    const warning = report.penalties.warning?.amount || 0;
    const duplication = report.penalties.duplication?.amount || 0;
    const jsdoc = report.penalties.jsdoc?.amount || 0;
    const total = warning + duplication + jsdoc;

    if (total === 0) return undefined;

    return {
      ...(warning > 0 && { warning }),
      ...(duplication > 0 && { duplication }),
      ...(jsdoc > 0 && { jsdoc }),
      total,
    };
  }

  private generateComparison(results: ProjectResult[]): CompareResult {
    if (results.length === 0) {
      return {
        timestamp: new Date().toISOString(),
        projectCount: 0,
        projects: [],
        ranking: [],
        phaseComparison: [],
        metricComparison: [],
        summary: {
          overallWinner: "N/A",
          recommendation: "No projects to compare",
        },
      };
    }

    // Ranking
    const ranking = results
      .map((r) => ({
        rank: 0,
        name: r.name,
        score: r.totalScore,
        grade: r.grade,
      }))
      .sort((a, b) => b.score - a.score)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    // Phase comparison
    const phases = [
      "documentQuality",
      "requirementsCoverage",
      "testCoverage",
      "logicCompleteness",
      "apiCompleteness",
    ] as const;
    const phaseLabels: Record<string, string> = {
      documentQuality: "Document Quality",
      requirementsCoverage: "Requirements Coverage",
      testCoverage: "Test Coverage",
      logicCompleteness: "Logic Completeness",
      apiCompleteness: "API Completeness",
    };

    const phaseComparison = phases.map((phase) => {
      const scores = results.map((r) => ({
        name: r.name,
        score: r.scores[phase],
      }));
      const maxScore = Math.max(...scores.map((s) => s.score));
      const winners = scores.filter((s) => s.score === maxScore);
      return {
        phase: phaseLabels[phase],
        scores,
        winner: winners.length === 1 ? winners[0].name : "TIE",
      };
    });

    // Metric comparison
    const metricDefs = [
      { metric: "Total Files", key: "files" as const, higherBetter: null },
      {
        metric: "Controllers",
        key: "controllers" as const,
        higherBetter: true,
      },
      { metric: "Providers", key: "providers" as const, higherBetter: true },
      { metric: "Structures", key: "structures" as const, higherBetter: null },
      { metric: "Tests", key: "tests" as const, higherBetter: true },
    ];

    const metricComparison = metricDefs.map((m) => {
      const values = results.map((r) => ({
        name: r.name,
        value: r.metrics[m.key],
      }));
      let better = "N/A";

      if (m.higherBetter !== null) {
        const nums = values.map((v) => v.value as number);
        const maxVal = Math.max(...nums);
        const minVal = Math.min(...nums);
        if (maxVal !== minVal) {
          const bestVal = m.higherBetter ? maxVal : minVal;
          const winners = values.filter((v) => v.value === bestVal);
          better = winners.length === 1 ? winners[0].name : "TIE";
        } else {
          better = "TIE";
        }
      }
      return { metric: m.metric, values, better };
    });

    // Penalty comparison (lower is better)
    const penaltyValues = results.map((r) => ({
      name: r.name,
      value: r.penalties?.total || 0,
    }));
    if (penaltyValues.some((v) => (v.value as number) > 0)) {
      const nums = penaltyValues.map((v) => v.value as number);
      const minVal = Math.min(...nums);
      const winners = penaltyValues.filter((v) => v.value === minVal);
      metricComparison.push({
        metric: "Penalties",
        values: penaltyValues,
        better: winners.length === 1 ? winners[0].name : "TIE",
      });
    }

    // Agent comparison
    let agentComparison: CompareResult["agentComparison"];
    if (results.some((r) => r.agentScores)) {
      agentComparison = [
        { agent: "SecurityAgent", key: "security" as const },
        { agent: "LLMQualityAgent", key: "llmQuality" as const },
        { agent: "HallucinationAgent", key: "hallucination" as const },
      ].map((a) => {
        const scores = results.map((r) => ({
          name: r.name,
          score: r.agentScores?.[a.key] || 0,
        }));
        const maxScore = Math.max(...scores.map((s) => s.score));
        const winners = scores.filter((s) => s.score === maxScore);
        return {
          agent: a.agent,
          scores,
          winner: winners.length === 1 ? winners[0].name : "TIE",
        };
      });
    }

    // Summary
    const overallWinner = ranking[0].name;
    let recommendation = `${overallWinner} achieves the highest score (${ranking[0].score}/100).`;

    const maxProviders = Math.max(...results.map((r) => r.metrics.providers));
    const providerWinner = results.find(
      (r) => r.metrics.providers === maxProviders && maxProviders > 0,
    );
    if (providerWinner && providerWinner.name !== overallWinner) {
      recommendation += ` However, ${providerWinner.name} has actual business logic (${maxProviders} providers).`;
    }

    return {
      timestamp: new Date().toISOString(),
      projectCount: results.length,
      projects: results,
      ranking,
      phaseComparison,
      metricComparison,
      agentComparison,
      summary: { overallWinner, recommendation },
    };
  }
}
