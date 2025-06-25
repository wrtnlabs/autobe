import { BenchmarkSummary } from "./types";
import path from "path";

export class ReportGenerator {
  private logsDir: string;

  constructor(logsDir: string) {
    this.logsDir = logsDir;
  }

  generateReport(summary: BenchmarkSummary): string {
    const report = `# Adversarial Benchmark Report

**Generated:** ${new Date().toISOString()}
**Duration:** ${(summary.totalBenchmarkDuration / 1000).toFixed(1)}s (${(summary.totalBenchmarkDuration / 60000).toFixed(1)} minutes)

## Summary

- **Total Scenarios:** ${summary.totalScenarios}
- **Total Runs:** ${summary.totalRuns}
- **Overall Flow Success Rate:** ${summary.overallSuccessRate.toFixed(1)}%
- **Overall Completeness Score:** ${summary.overallCompleteness.toFixed(1)}%
  - Analysis: ${summary.overallCompletenessBreakdown.analysis.toFixed(1)}%
  - Schema: ${summary.overallCompletenessBreakdown.schema.toFixed(1)}%
  - API: ${summary.overallCompletenessBreakdown.api.toFixed(1)}%
  - Security: ${summary.overallCompletenessBreakdown.security.toFixed(1)}%
  - Performance: ${summary.overallCompletenessBreakdown.performance.toFixed(1)}%
  - Error Handling: ${summary.overallCompletenessBreakdown.errorHandling.toFixed(1)}%
  - Data Consistency: ${summary.overallCompletenessBreakdown.dataConsistency.toFixed(1)}%
  - User Experience: ${summary.overallCompletenessBreakdown.userExperience.toFixed(1)}%
  - General: ${summary.overallCompletenessBreakdown.general.toFixed(1)}%
- **Overall Stage Timings:**
  - Analysis: ${summary.overallStageTimings.analysis.toFixed(0)}ms (${(summary.overallStageTimings.analysis / 60000).toFixed(1)} minutes)
  - Schema: ${summary.overallStageTimings.schema.toFixed(0)}ms (${(summary.overallStageTimings.schema / 60000).toFixed(1)} minutes)
  - API: ${summary.overallStageTimings.api.toFixed(0)}ms (${(summary.overallStageTimings.api / 60000).toFixed(1)} minutes)
- **Start Time:** ${summary.startTime}
- **End Time:** ${summary.endTime}

## Scenario Results

${summary.scenarios.map(scenario => `
### ${scenario.scenarioName}

- **Flow Success Rate:** ${scenario.successRate.toFixed(1)}% (${scenario.successfulRuns}/${scenario.totalRuns} runs)
- **Average Completeness:** ${scenario.averageCompleteness.toFixed(1)}%
  - Analysis: ${scenario.averageCompletenessBreakdown.analysis.toFixed(1)}%
  - Schema: ${scenario.averageCompletenessBreakdown.schema.toFixed(1)}%
  - API: ${scenario.averageCompletenessBreakdown.api.toFixed(1)}%
  - Security: ${scenario.averageCompletenessBreakdown.security.toFixed(1)}%
  - Performance: ${scenario.averageCompletenessBreakdown.performance.toFixed(1)}%
  - Error Handling: ${scenario.averageCompletenessBreakdown.errorHandling.toFixed(1)}%
  - Data Consistency: ${scenario.averageCompletenessBreakdown.dataConsistency.toFixed(1)}%
  - User Experience: ${scenario.averageCompletenessBreakdown.userExperience.toFixed(1)}%
  - General: ${scenario.averageCompletenessBreakdown.general.toFixed(1)}%
- **Average Duration:** ${scenario.averageDuration.toFixed(0)}ms (${(scenario.averageDuration / 60000).toFixed(1)} minutes)
- **Average Stage Timings:**
  - Analysis: ${scenario.averageStageTimings.analysis.toFixed(0)}ms (${(scenario.averageStageTimings.analysis / 60000).toFixed(1)} minutes)
  - Schema: ${scenario.averageStageTimings.schema.toFixed(0)}ms (${(scenario.averageStageTimings.schema / 60000).toFixed(1)} minutes)
  - API: ${scenario.averageStageTimings.api.toFixed(0)}ms (${(scenario.averageStageTimings.api / 60000).toFixed(1)} minutes)
- **Total Scenario Time:** ${(scenario.totalScenarioDuration / 1000).toFixed(1)}s (${(scenario.totalScenarioDuration / 60000).toFixed(1)} minutes)

#### Run Details

${scenario.runs.map((run, index) => `
**Run ${index + 1}** (ID: \`${run.runId}\`)
- Flow Success: ${run.flowSuccess ? '✅ Yes' : '❌ No'}
- Duration: ${run.duration}ms (${(run.duration / 60000).toFixed(1)} minutes)
- Completeness Score: ${run.completenessScore}%
  - Analysis: ${run.completenessBreakdown.analysis.score}% (${run.completenessBreakdown.analysis.validated}/${run.completenessBreakdown.analysis.total})
  - Schema: ${run.completenessBreakdown.schema.score}% (${run.completenessBreakdown.schema.validated}/${run.completenessBreakdown.schema.total})
  - API: ${run.completenessBreakdown.api.score}% (${run.completenessBreakdown.api.validated}/${run.completenessBreakdown.api.total})
  - Security: ${run.completenessBreakdown.security.score}% (${run.completenessBreakdown.security.validated}/${run.completenessBreakdown.security.total})
  - Performance: ${run.completenessBreakdown.performance.score}% (${run.completenessBreakdown.performance.validated}/${run.completenessBreakdown.performance.total})
  - Error Handling: ${run.completenessBreakdown.errorHandling.score}% (${run.completenessBreakdown.errorHandling.validated}/${run.completenessBreakdown.errorHandling.total})
  - Data Consistency: ${run.completenessBreakdown.dataConsistency.score}% (${run.completenessBreakdown.dataConsistency.validated}/${run.completenessBreakdown.dataConsistency.total})
  - User Experience: ${run.completenessBreakdown.userExperience.score}% (${run.completenessBreakdown.userExperience.validated}/${run.completenessBreakdown.userExperience.total})
  - General: ${run.completenessBreakdown.general.score}% (${run.completenessBreakdown.general.validated}/${run.completenessBreakdown.general.total})
- Stages:
  - Analysis: ${run.stages.analyze.success ? '✅' : '❌'} (${run.stages.analyze.duration}ms / ${(run.stages.analyze.duration / 60000).toFixed(1)}min)${run.stages.analyze.errors.length > 0 ? ` - Errors: ${run.stages.analyze.errors.join(', ')}` : ''}
  - Prisma: ${run.stages.prisma.success ? '✅' : '❌'} (${run.stages.prisma.duration}ms / ${(run.stages.prisma.duration / 60000).toFixed(1)}min)${run.stages.prisma.errors.length > 0 ? ` - Errors: ${run.stages.prisma.errors.join(', ')}` : ''}${run.stages.prisma.compilationDetails ? ` - ${run.stages.prisma.compilationDetails}` : ''}
  - Interface: ${run.stages.interface.success ? '✅' : '❌'} (${run.stages.interface.duration}ms / ${(run.stages.interface.duration / 60000).toFixed(1)}min)${run.stages.interface.errors.length > 0 ? ` - Errors: ${run.stages.interface.errors.join(', ')}` : ''}
${run.failureReason ? `- **Failure Reason:** ${run.failureReason}` : ''}
${run.errors.length > 0 ? `- **Detailed Errors:**\n${run.errors.map(error => `  - ${error}`).join('\n')}` : ''}
`).join('')}
`).join('')}

## Analysis

${this.generateAnalysis(summary)}

---

*This report was generated by the AutoBE Adversarial Benchmarking System*
`;

    return report;
  }

  private generateAnalysis(summary: BenchmarkSummary): string {
    const benchmarkTotalRuns = summary.totalRuns;
    const successfulRuns = summary.scenarios.reduce((sum, s) => sum + s.successfulRuns, 0);
    const failedRuns = benchmarkTotalRuns - successfulRuns;

    let analysis = `### Key Insights

- **Success Rate:** ${((successfulRuns / benchmarkTotalRuns) * 100).toFixed(1)}% of runs completed successfully
- **Failure Rate:** ${((failedRuns / benchmarkTotalRuns) * 100).toFixed(1)}% of runs failed
- **Average Completeness:** ${summary.overallCompleteness.toFixed(1)}% across all scenarios
  - Analysis Questions: ${summary.overallCompletenessBreakdown.analysis.toFixed(1)}%
  - Schema Questions: ${summary.overallCompletenessBreakdown.schema.toFixed(1)}%
  - API Questions: ${summary.overallCompletenessBreakdown.api.toFixed(1)}%
  - Security Questions: ${summary.overallCompletenessBreakdown.security.toFixed(1)}%
  - Performance Questions: ${summary.overallCompletenessBreakdown.performance.toFixed(1)}%
  - Error Handling Questions: ${summary.overallCompletenessBreakdown.errorHandling.toFixed(1)}%
  - Data Consistency Questions: ${summary.overallCompletenessBreakdown.dataConsistency.toFixed(1)}%
  - User Experience Questions: ${summary.overallCompletenessBreakdown.userExperience.toFixed(1)}%
  - General Questions: ${summary.overallCompletenessBreakdown.general.toFixed(1)}%

### Performance Analysis

`;

    // Analyze stage performance from summary data
    let stageAnalysis = "";
    
    stageAnalysis += `**Stage Performance Overview:**\n`;
    stageAnalysis += `- **Analysis Stage:** ${summary.overallStageTimings.analysis.toFixed(0)}ms (${(summary.overallStageTimings.analysis / 60000).toFixed(1)} minutes) average duration\n`;
    stageAnalysis += `- **Schema Stage:** ${summary.overallStageTimings.schema.toFixed(0)}ms (${(summary.overallStageTimings.schema / 60000).toFixed(1)} minutes) average duration\n`;
    stageAnalysis += `- **API Stage:** ${summary.overallStageTimings.api.toFixed(0)}ms (${(summary.overallStageTimings.api / 60000).toFixed(1)} minutes) average duration\n\n`;
    
    // Additional detailed stage analysis
    const analysisStageStats = this.calculateStageStats(summary);
    stageAnalysis += `**Stage Success Rates:**\n`;
    Object.entries(analysisStageStats).forEach(([stageName, stats]) => {
      const successRate = stats.total > 0 ? (stats.success / stats.total * 100).toFixed(1) : '0.0';
      stageAnalysis += `- **${stageName.charAt(0).toUpperCase() + stageName.slice(1)} Stage:** ${successRate}% success rate (${stats.success}/${stats.total} runs)\n`;
    });

    analysis += stageAnalysis;

    // Failure Analysis
    if (summary.overallSuccessRate < 100) {
      analysis += `\n### Failure Analysis

`;
      const failedRuns = summary.scenarios.flatMap(s => s.runs.filter(r => !r.flowSuccess));
      
      if (failedRuns.length > 0) {
        // Group failures by reason
        const failureReasons = new Map<string, number>();
        const stageFailures = { analyze: 0, prisma: 0, interface: 0 };
        
        failedRuns.forEach(run => {
          if (run.failureReason) {
            failureReasons.set(run.failureReason, (failureReasons.get(run.failureReason) || 0) + 1);
          }
          
          if (!run.stages.analyze.success) stageFailures.analyze++;
          if (!run.stages.prisma.success) stageFailures.prisma++;
          if (!run.stages.interface.success) stageFailures.interface++;
        });

        analysis += `**Common Failure Reasons:**\n`;
        Array.from(failureReasons.entries())
          .sort((a, b) => b[1] - a[1])
          .forEach(([reason, count]) => {
            analysis += `- ${reason}: ${count} occurrence(s)\n`;
          });

        analysis += `\n**Stage Failure Breakdown:**\n`;
        analysis += `- Analysis Stage Failures: ${stageFailures.analyze}\n`;
        analysis += `- Prisma Stage Failures: ${stageFailures.prisma}\n`;
        analysis += `- Interface Stage Failures: ${stageFailures.interface}\n`;

        // Most problematic errors
        const allErrors = failedRuns.flatMap(run => run.errors);
        const errorCounts = new Map<string, number>();
        allErrors.forEach(error => {
          errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
        });

        if (errorCounts.size > 0) {
          analysis += `\n**Most Common Errors:**\n`;
          Array.from(errorCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([error, count]) => {
              analysis += `- ${error}: ${count} occurrence(s)\n`;
            });
        }
      }
    }

    // Recommendations
    analysis += `\n### Recommendations

`;

    if (summary.overallSuccessRate < 50) {
      analysis += `- **Critical:** Flow success rate is below 50%. Investigate stage failures and improve error handling.\n`;
    }

    if (summary.overallCompleteness < 70) {
      analysis += `- **Improvement Needed:** Completeness score is below 70%. Enhance response quality for adversarial questions.\n`;
    }

    if (summary.totalBenchmarkDuration > 30 * 60 * 1000) { // 30 minutes
      analysis += `- **Performance:** Benchmark took over 30 minutes. Consider optimizing stage timeouts or agent response times.\n`;
    }

    // Stage-specific recommendations
    const recommendationStageStats = this.calculateStageStats(summary);
    
    if (recommendationStageStats.analyze.total > 0 && (recommendationStageStats.analyze.success / recommendationStageStats.analyze.total) < 0.8) {
      analysis += `- **Analysis Stage:** ${((recommendationStageStats.analyze.success / recommendationStageStats.analyze.total) * 100).toFixed(1)}% success rate. Consider improving requirements analysis prompts.\n`;
    }
    
    if (recommendationStageStats.prisma.total > 0 && (recommendationStageStats.prisma.success / recommendationStageStats.prisma.total) < 0.8) {
      analysis += `- **Prisma Stage:** ${((recommendationStageStats.prisma.success / recommendationStageStats.prisma.total) * 100).toFixed(1)}% success rate. Consider improving schema generation prompts or fallback validation.\n`;
    }
    
    if (recommendationStageStats.interface.total > 0 && (recommendationStageStats.interface.success / recommendationStageStats.interface.total) < 0.8) {
      analysis += `- **Interface Stage:** ${((recommendationStageStats.interface.success / recommendationStageStats.interface.total) * 100).toFixed(1)}% success rate. Consider improving API specification prompts.\n`;
    }

    return analysis;
  }

  private calculateStageStats(summary: BenchmarkSummary) {
    const stageStats = {
      analyze: { success: 0, total: 0, totalDuration: 0 },
      prisma: { success: 0, total: 0, totalDuration: 0 },
      interface: { success: 0, total: 0, totalDuration: 0 }
    };

    summary.scenarios.forEach(scenario => {
      scenario.runs.forEach(run => {
        Object.entries(run.stages).forEach(([stageName, stage]) => {
          if (stageName in stageStats) {
            const stageKey = stageName as keyof typeof stageStats;
            stageStats[stageKey].total++;
            stageStats[stageKey].totalDuration += stage.duration;
            if (stage.success) stageStats[stageKey].success++;
          }
        });
      });
    });

    return stageStats;
  }

  getReportPath(): string {
    return path.join(this.logsDir, 'benchmark-report.md');
  }
}