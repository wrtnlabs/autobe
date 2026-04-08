import * as path from "path";

import type { AgentResult } from "../agents";
import { AGENT_WEIGHTS, AGENT_WEIGHT_RATIO, PHASE_NAMES } from "../types";
import type { EvaluationResult, PhaseResult } from "../types";

interface GroupedIssue {
  message: string;
  count: number;
  files: string[];
}

export function printResults(result: EvaluationResult): void {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log(
    `📋 Scoring Phases (${Math.round((1 - AGENT_WEIGHT_RATIO) * 100)}% of total score):`,
  );
  console.log("─────────────────────────────────────────");

  const gateStatus = result.phases.gate.passed ? "✅ Pass" : "❌ Fail";
  console.log(`   Gate:                    ${gateStatus}`);
  if (!result.phases.gate.passed && result.phases.gate.metrics?.reason) {
    const reason = String(result.phases.gate.metrics.reason);
    console.log(`   Reason:                  ${reason}`);
  }

  printPhaseScore("documentQuality", result.phases.documentQuality);
  printPhaseScore("requirementsCoverage", result.phases.requirementsCoverage);
  printPhaseScore("testCoverage", result.phases.testCoverage);
  printPhaseScore("logicCompleteness", result.phases.logicCompleteness);
  printPhaseScore("apiCompleteness", result.phases.apiCompleteness);

  if (result.phases.goldenSet) {
    const gs = result.phases.goldenSet;
    const passed = (gs.metrics?.passedFeatures as number) ?? 0;
    const total = (gs.metrics?.totalFeatures as number) ?? 0;
    console.log(
      `   ${"Golden Set".padEnd(24)} ${gs.score}/100 (${passed}/${total} passed)`,
    );
  }

  console.log("─────────────────────────────────────────\n");

  console.log("📋 Reference Info (no score impact):");
  console.log("─────────────────────────────────────────");
  console.log(
    `   Complexity:    ${result.reference.complexity.complexFunctions} complex functions (max: ${result.reference.complexity.maxComplexity})`,
  );
  console.log(
    `   Duplication:   ${result.reference.duplication.totalBlocks} duplicate blocks`,
  );
  console.log(
    `   Naming:        ${result.reference.naming.totalIssues} issues`,
  );
  console.log(
    `   JSDoc:         ${result.reference.jsdoc.totalMissing} missing`,
  );
  console.log(
    `   Schema Sync:   ${result.reference.schemaSync.emptyTypes}/${result.reference.schemaSync.totalTypes} empty types, ${result.reference.schemaSync.mismatchedProperties} mismatched`,
  );
  console.log("─────────────────────────────────────────\n");

  if (result.performanceMetrics) {
    const pm = result.performanceMetrics;
    console.log("📏 Performance Metrics:");
    console.log("─────────────────────────────────────────");
    console.log(
      `   Code Size:     ${pm.totalSizeKB} KB (${pm.totalLines} lines)`,
    );
    console.log(
      `   Files:         ${pm.totalFiles} (avg ${pm.avgLinesPerFile} lines/file)`,
    );
    console.log(
      `   Largest:       ${pm.largestFile} (${pm.largestFileSizeKB} KB)`,
    );
    console.log(
      `   Breakdown:     ${pm.controllers} ctrl, ${pm.providers} prov, ${pm.structures} struct, ${pm.tests} test`,
    );
    console.log("─────────────────────────────────────────\n");
  }

  if (result.summary.criticalCount > 0) {
    console.log(`❌ Critical Issues: ${result.summary.criticalCount}`);
    console.log("   These must be fixed before production use.\n");
    printGroupedIssues(result.criticalIssues);
  }

  if (result.summary.warningCount > 0) {
    console.log(`⚠️  Warnings: ${result.summary.warningCount}`);
    console.log("   Top issues:\n");
    printGroupedIssues(result.warnings);
  }

  if (result.summary.suggestionCount > 0) {
    console.log(`💡 Suggestions: ${result.summary.suggestionCount}`);
    console.log("   Top issues:\n");
    printGroupedIssues(result.suggestions);
  }
}

export function printAgentResults(agentResults: AgentResult[]): void {
  console.log(
    `\n🤖 AI Agent Evaluations (${Math.round(AGENT_WEIGHT_RATIO * 100)}% of total score):`,
  );
  console.log("─────────────────────────────────────────");

  for (const result of agentResults) {
    const scoreEmoji =
      result.score < 0
        ? "⛔"
        : result.score >= 80
          ? "✅"
          : result.score >= 60
            ? "⚠️"
            : "❌";
    const criticalCount = result.issues.filter(
      (i) => i.severity === "critical",
    ).length;
    const warningCount = result.issues.filter(
      (i) => i.severity === "warning",
    ).length;
    const refTag = result.agent in AGENT_WEIGHTS ? "" : " [ref]";
    console.log(
      `   ${result.agent}: ${result.score}/100 ${scoreEmoji}${refTag}`,
    );
    console.log(
      `      Issues: ${result.issues.length} (${criticalCount} critical, ${warningCount} warning)`,
    );
    if (result.tokensUsed) {
      const t = result.tokensUsed;
      const totalCost = (t.inputCost || 0) + (t.outputCost || 0);
      console.log(
        `      Tokens: ${t.input.toLocaleString()} in / ${t.output.toLocaleString()} out` +
          (totalCost > 0 ? ` ($${totalCost.toFixed(4)})` : ""),
      );
    }
    if (result.deepEvalScores) {
      const d = result.deepEvalScores;
      console.log(
        `      DeepEval: Faith=${d.faithfulness} Rel=${d.relevancy} Prec=${d.contextualPrecision}`,
      );
    }
    const rawSummary = result.summary || "";
    const summaryText =
      rawSummary.length > 120
        ? rawSummary.substring(0, 120) + "..."
        : rawSummary;
    console.log(`      Summary: ${summaryText}`);
    console.log("");
  }

  const totalAgentCost = agentResults.reduce((sum, r) => {
    const c = r.tokensUsed;
    return sum + (c?.inputCost || 0) + (c?.outputCost || 0);
  }, 0);
  if (totalAgentCost > 0) {
    console.log(`   Total Agent Cost: $${totalAgentCost.toFixed(4)}`);
  }
  console.log("─────────────────────────────────────────");
}

export function printFinalScore(
  result: EvaluationResult & { totalScore: number; grade: string },
  phaseScore: number,
  agentAvg: number,
  hasAgents: boolean,
): void {
  const gradeEmoji: Record<string, string> = {
    A: "🏆",
    B: "👍",
    C: "📊",
    D: "⚠️",
    F: "❌",
  };

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(
    `\n${gradeEmoji[result.grade] || "📊"} Final Score: ${result.totalScore}/100 (Grade: ${result.grade})\n`,
  );

  if (!result.phases.gate.passed) {
    console.log(`   ❌ Gate Failed — Score forced to 0`);
    if (hasAgents && agentAvg > 0) {
      const phaseW = 1 - AGENT_WEIGHT_RATIO;
      const wouldBe = Math.round(
        phaseScore * phaseW + agentAvg * AGENT_WEIGHT_RATIO,
      );
      console.log(
        `   (Reference: Phase ${phaseScore}, Agent ${Math.round(agentAvg)} → ~${wouldBe}/100 if gate passed)`,
      );
    }
  } else if (hasAgents) {
    const phaseW = 1 - AGENT_WEIGHT_RATIO;
    const rawTotal = Math.round(
      phaseScore * phaseW + agentAvg * AGENT_WEIGHT_RATIO,
    );
    console.log(
      `   Phase Score:  ${phaseScore}/100 × ${Math.round(phaseW * 100)}% = ${(phaseScore * phaseW).toFixed(1)}`,
    );
    console.log(
      `   Agent Score:  ${Math.round(agentAvg)}/100 × ${Math.round(AGENT_WEIGHT_RATIO * 100)}% = ${(agentAvg * AGENT_WEIGHT_RATIO).toFixed(1)}`,
    );
    if (result.totalScore < rawTotal) {
      console.log(`   ─────────────────────────────`);
      console.log(`   Subtotal:     ${rawTotal}/100`);
      console.log(
        `   ⚠️  Agent Critical Cap: → ${result.totalScore}/100 (${rawTotal - result.totalScore} point cap applied)`,
      );
    }
    console.log(`   ─────────────────────────────`);
    console.log(`   Total:        ${result.totalScore}/100`);
  } else {
    console.log(`   Phase Score:  ${phaseScore}/100`);
    console.log(
      `\n   ⚠️  AI Agent evaluation disabled. Score may be inflated.`,
    );
    console.log(`   Run with --use-agent for more accurate results.`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

function printPhaseScore(phase: string, phaseResult: PhaseResult): void {
  const phaseName = PHASE_NAMES[phase as keyof typeof PHASE_NAMES] || phase;
  const score = phaseResult.score;
  const padded = phaseName.padEnd(24);

  let indicator = "";
  if (phaseResult.metrics?.skipped) {
    indicator = "⏭️  Skipped";
  } else if (score >= 90) {
    indicator = `${score}/100 ✅`;
  } else if (score >= 70) {
    indicator = `${score}/100 📊`;
  } else if (score >= 50) {
    indicator = `${score}/100 ⚠️`;
  } else {
    indicator = `${score}/100 ❌`;
  }

  console.log(`   ${padded} ${indicator}`);
}

function printGroupedIssues(issues: EvaluationResult["criticalIssues"]): void {
  const grouped = new Map<string, GroupedIssue>();

  for (const issue of issues) {
    const existing = grouped.get(issue.code);
    const file = issue.location
      ? path.basename(issue.location.file)
      : "unknown";

    if (existing) {
      existing.count++;
      if (!existing.files.includes(file) && existing.files.length < 3) {
        existing.files.push(file);
      }
    } else {
      grouped.set(issue.code, {
        message: issue.message,
        count: 1,
        files: [file],
      });
    }
  }

  const sorted = [...grouped.entries()].sort((a, b) => b[1].count - a[1].count);

  for (const [code, info] of sorted.slice(0, 5)) {
    const fileHint = info.files.join(", ");
    const more = info.count > info.files.length ? " ..." : "";
    const rawMsg = info.message || "";
    const msg = rawMsg.length > 100 ? rawMsg.substring(0, 100) + "..." : rawMsg;
    console.log(`   • [${code}] ×${info.count} — ${msg}`);
    console.log(`     files: ${fileHint}${more}`);
  }

  if (sorted.length > 5) {
    console.log(`   ... and ${sorted.length - 5} more issue types\n`);
  } else {
    console.log("");
  }
}
