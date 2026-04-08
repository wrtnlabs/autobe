import * as p from "@clack/prompts";
import * as fs from "fs";
import * as path from "path";

import {
  AgentConfig,
  AgentResult,
  HALLUCINATION_MODEL,
  HallucinationAgent,
  LLMProvider,
  LLMQualityAgent,
  QUALITY_MODEL,
  SECURITY_MODEL,
  SecurityAgent,
} from "../../agents";
import { generateFixAdvisory } from "../../core/fix-advisor";
import { EvaluationPipeline } from "../../core/pipeline";
import { generateJsonReport, generateMarkdownReport } from "../../reporters";
import {
  flushLangfuse,
  getActiveTrace,
  recordAgentResults,
} from "../../telemetry";
import type {
  EvaluationContext,
  EvaluationInput,
  ScoreBreakdown,
} from "../../types";
import { AGENT_WEIGHTS, AGENT_WEIGHT_RATIO, scoreToGrade } from "../../types";
import { printAgentResults, printFinalScore, printResults } from "../output";
import type { CLIOptions } from "../types";

export async function runCLI(options: CLIOptions): Promise<void> {
  if (!options.apiKey) {
    options.apiKey = process.env.OPENROUTER_API_KEY;
  }

  if (!options.input) {
    p.log.error("--input is required");
    process.exit(1);
  }

  if (!options.output) {
    p.log.error("--output is required");
    process.exit(1);
  }

  if (options.useAgent && !options.apiKey) {
    p.log.error("--api-key is required when using --use-agent");
    p.log.info("Or set OPENROUTER_API_KEY environment variable");
    process.exit(1);
  }

  const inputPath = path.resolve(options.input);
  const outputPath = path.resolve(options.output);

  if (!fs.existsSync(inputPath)) {
    p.log.error(`Input path does not exist: ${inputPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  p.intro("🔍 AutoBE Code Evaluation");

  p.log.info(`Input: ${inputPath}`);
  p.log.info(`Output: ${outputPath}`);
  if (options.useAgent) {
    p.log.info(`Agent: ${options.provider} (AI evaluation enabled)`);
  }

  const spinner = p.spinner();
  spinner.start("Building evaluation context...");

  const input: EvaluationInput = {
    inputPath,
    outputPath,
    options: {
      continueOnGateFailure: options.continueOnGateFailure,
      runTests: options.runTests,
      golden: options.golden,
      project: options.project,
    },
  };

  const pipeline = new EvaluationPipeline(options.verbose);
  const result = await pipeline.evaluate(input);

  spinner.stop("Evaluation complete");

  // Auto-fix
  const allFixableIssues = [...result.criticalIssues, ...result.warnings];
  if (options.autoFix && allFixableIssues.length > 0) {
    const { AutoFixer } = await import("../../fixers");
    const fixer = new AutoFixer(options.verbose);

    const fixable = allFixableIssues.filter((i) =>
      ["TS1161", "TS7006"].includes(i.code),
    );

    if (fixable.length > 0) {
      p.log.info(`Found ${fixable.length} auto-fixable issue(s):`);
      for (const issue of fixable.slice(0, 5)) {
        const loc = issue.location
          ? `${path.basename(issue.location.file)}:${issue.location.line}`
          : "unknown";
        p.log.message(`  • [${issue.code}] ${issue.message} (${loc})`);
      }
      if (fixable.length > 5) {
        p.log.message(`  ... and ${fixable.length - 5} more`);
      }

      const confirm = await p.confirm({
        message: `Apply ${fixable.length} auto-fix(es) and re-evaluate?`,
      });

      if (p.isCancel(confirm) || !confirm) {
        p.log.info("Skipped auto-fix.");
      } else {
        const fixedPath = path.join(outputPath, "fixed");
        if (!fs.existsSync(fixedPath)) {
          fs.cpSync(inputPath, fixedPath, { recursive: true });
        }

        for (const issue of allFixableIssues) {
          if (issue.location?.file) {
            issue.location.file = issue.location.file.replace(
              inputPath,
              fixedPath,
            );
          }
        }

        p.log.info("Running auto-fix on copy...");
        const fixResults = await fixer.fix(allFixableIssues);
        const fixed = fixResults.filter((r) => r.fixed).length;

        if (fixed > 0) {
          p.log.success(`Auto-fixed ${fixed} issues in ${fixedPath}`);
          p.log.info("Re-running evaluation on fixed copy...");
          const fixedInput: EvaluationInput = {
            ...input,
            inputPath: fixedPath,
          };
          const reResult = await pipeline.evaluate(fixedInput);
          Object.assign(result, reResult);
        } else {
          p.log.info("No issues were actually fixed.");
        }

        p.log.info(`Original files untouched: ${inputPath}`);
      }
    } else {
      p.log.info("No auto-fixable issues found.");
    }
  }

  // Agent evaluations
  let agentResults: AgentResult[] = [];
  if (options.useAgent && options.apiKey) {
    const agentSpinner = p.spinner();
    agentSpinner.start("Running AI Agent Evaluations...");

    agentResults = await runAgentEvaluations(
      pipeline.getContext()!,
      {
        provider: options.provider as LLMProvider,
        apiKey: options.apiKey,
      },
      options.verbose,
    );

    agentSpinner.stop("AI Agent Evaluations complete");

    // Record agent results to Langfuse trace
    const trace = getActiveTrace();
    if (trace && agentResults.length > 0) {
      const knownForTrace = agentResults.filter(
        (r) => r.agent in AGENT_WEIGHTS,
      );
      const totalWeight = Object.values(AGENT_WEIGHTS).reduce(
        (s, w) => s + w,
        0,
      );
      const agentAvgForTrace = knownForTrace.reduce(
        (sum, r) =>
          sum + Math.max(0, r.score) * (AGENT_WEIGHTS[r.agent] / totalWeight),
        0,
      );
      const phasesPortion = result.totalScore * (1 - AGENT_WEIGHT_RATIO);
      const agentPortion = agentAvgForTrace * AGENT_WEIGHT_RATIO;
      recordAgentResults(
        trace,
        agentResults,
        Math.round(phasesPortion + agentPortion),
      );
    }
  }

  // Reports
  const jsonPath = path.join(outputPath, "estimate-report.json");
  const mdPath = path.join(outputPath, "estimate-report.md");

  let adjustedScore = result.totalScore;
  let agentAvg = 0;
  if (agentResults.length > 0 && result.phases.gate.passed) {
    const knownAgents = agentResults.filter((r) => r.agent in AGENT_WEIGHTS);
    const totalWeight = Object.values(AGENT_WEIGHTS).reduce((s, w) => s + w, 0);
    if (knownAgents.length > 0 && totalWeight > 0) {
      agentAvg = knownAgents.reduce(
        (sum, r) =>
          sum + Math.max(0, r.score) * (AGENT_WEIGHTS[r.agent] / totalWeight),
        0,
      );

      const phasesPortion = result.totalScore * (1 - AGENT_WEIGHT_RATIO);
      const agentPortion = agentAvg * AGENT_WEIGHT_RATIO;
      adjustedScore = Math.round(phasesPortion + agentPortion);

      const successWeight = knownAgents
        .filter((r) => r.score >= 0)
        .reduce((sum, r) => sum + AGENT_WEIGHTS[r.agent], 0);
      if (successWeight >= totalWeight * 0.5) {
        if (agentAvg < 25) {
          const drag = Math.round((25 - agentAvg) * 0.5);
          adjustedScore = Math.max(
            Math.min(adjustedScore, 40),
            adjustedScore - drag,
          );
        } else if (agentAvg < 40) {
          const drag = Math.round((40 - agentAvg) * 0.3);
          adjustedScore = Math.max(
            Math.min(adjustedScore, 55),
            adjustedScore - drag,
          );
        }
      }
    }
  }

  const knownAgentCount = agentResults.filter(
    (r) => r.agent in AGENT_WEIGHTS,
  ).length;
  const agentsBlended = knownAgentCount > 0 && result.phases.gate.passed;
  const scoreBreakdown: ScoreBreakdown = {
    phaseScore: result.totalScore,
    phaseWeight: agentsBlended ? 1 - AGENT_WEIGHT_RATIO : 1.0,
    phaseContribution: agentsBlended
      ? Math.round(result.totalScore * (1 - AGENT_WEIGHT_RATIO))
      : result.totalScore,
    agentScore: agentsBlended ? Math.round(agentAvg) : null,
    agentWeight: agentsBlended ? AGENT_WEIGHT_RATIO : 0,
    agentContribution: agentsBlended
      ? Math.round(agentAvg * AGENT_WEIGHT_RATIO)
      : 0,
  };

  const fixAdvisory = generateFixAdvisory(result, inputPath);

  const fullResult = {
    ...result,
    totalScore: adjustedScore,
    grade: scoreToGrade(adjustedScore),
    agentEvaluations: agentResults,
    scoreBreakdown,
    fixAdvisory,
  };

  fs.writeFileSync(jsonPath, generateJsonReport(fullResult));
  fs.writeFileSync(mdPath, generateMarkdownReport(fullResult));

  printResults(fullResult);

  if (agentResults.length > 0) {
    printAgentResults(agentResults);
  }

  printFinalScore(
    fullResult,
    result.totalScore,
    agentAvg,
    agentResults.length > 0,
  );

  p.log.success("Reports generated:");
  p.log.info(`  • ${mdPath}`);
  p.log.info(`  • ${jsonPath}`);

  await flushLangfuse();

  p.outro(
    `Final Score: ${fullResult.totalScore}/100 (Grade: ${fullResult.grade})`,
  );
}

async function runAgentEvaluations(
  context: EvaluationContext,
  baseConfig: Omit<AgentConfig, "model">,
  _verbose?: boolean,
): Promise<AgentResult[]> {
  const securityAgent = new SecurityAgent({
    ...baseConfig,
    model: SECURITY_MODEL,
  });
  const llmQualityAgent = new LLMQualityAgent({
    ...baseConfig,
    model: QUALITY_MODEL,
  });
  const hallucinationAgent = new HallucinationAgent({
    ...baseConfig,
    model: HALLUCINATION_MODEL,
  });

  const [securityResult, llmQualityResult, hallucinationResult] =
    await Promise.all([
      securityAgent.evaluate(context),
      llmQualityAgent.evaluate(context),
      hallucinationAgent.evaluate(context),
    ]);

  return [securityResult, llmQualityResult, hallucinationResult];
}
