import * as path from 'path';
import type { EvaluationResult, PhaseResult } from '../types';
import type { AgentResult } from '../agents';
import { PHASE_NAMES } from '../types';

interface ExtendedResult extends EvaluationResult {
  agentEvaluations?: AgentResult[];
}

export function generateMarkdownReport(result: ExtendedResult): string {
  const lines: string[] = [];

  // Header
  lines.push('# AutoBE Code Evaluation Report');
  lines.push('');
  lines.push(`**Generated:** ${result.meta.evaluatedAt}`);
  lines.push(`**Target:** ${result.targetPath}`);
  lines.push(`**Files Evaluated:** ${result.meta.evaluatedFiles}`);
  lines.push(`**Duration:** ${result.meta.totalDurationMs}ms`);
  lines.push('');

  // Overall Score
  lines.push('## Overall Score');
  lines.push('');
  lines.push(`| Grade | Score |`);
  lines.push(`|-------|-------|`);
  lines.push(`| **${result.grade}** | **${result.totalScore}/100** |`);
  lines.push('');

  // Scoring Phase Summary
  lines.push('## Scoring Phases (affects total score)');
  lines.push('');
  lines.push('| Phase | Score | Weight | Status |');
  lines.push('|-------|-------|--------|--------|');

  const gateStatus = result.phases.gate.passed ? '✅ Pass' : '❌ Fail';
  lines.push(`| Gate | - | - | ${gateStatus} |`);

  const scoringPhases: (keyof typeof result.phases)[] = [
    'documentQuality',
    'requirementsCoverage', 
    'testCoverage',
    'logicCompleteness',
    'apiCompleteness'
  ];
  
  const weights: Record<string, string> = {
    documentQuality: '20%',
    requirementsCoverage: '25%',
    testCoverage: '20%',
    logicCompleteness: '20%',
    apiCompleteness: '15%',
  };

  for (const phase of scoringPhases) {
    const phaseResult = result.phases[phase];
    const phaseName = PHASE_NAMES[phase];
    const weight = weights[phase];
    const status = getStatusEmoji(phaseResult.score, phaseResult.metrics?.skipped as boolean);
    lines.push(`| ${phaseName} | ${phaseResult.score}/100 | ${weight} | ${status} |`);
  }
  lines.push('');

  // Detailed Scoring Phase Results
  lines.push('## Detailed Results');
  lines.push('');

  // Gate
  lines.push('### Gate');
  lines.push('');
  if (result.phases.gate.passed) {
    lines.push('✅ All basic validations passed.');
  } else {
    lines.push('❌ Gate validation failed.');
    if (result.phases.gate.issues.length > 0) {
      lines.push('');
      lines.push('**Issues:**');
      for (const issue of result.phases.gate.issues) {
        lines.push(`- [${issue.code}] ${issue.message}`);
      }
    }
  }
  lines.push('');

  // Scoring phase details
  for (const phase of scoringPhases) {
    const phaseResult = result.phases[phase];
    const phaseName = PHASE_NAMES[phase];

    lines.push(`### ${phaseName}`);
    lines.push('');
    lines.push(`**Score:** ${phaseResult.score}/100`);
    lines.push('');

    if (phaseResult.metrics && Object.keys(phaseResult.metrics).length > 0) {
      lines.push('**Metrics:**');
      for (const [key, value] of Object.entries(phaseResult.metrics)) {
        if (key !== 'skipped' && key !== 'reason') {
          lines.push(`- ${formatMetricName(key)}: ${value}`);
        }
      }
      lines.push('');
    }

    if (phaseResult.explanation && phaseResult.score < 80) {
      lines.push('**Why this score:**');
      for (const reason of phaseResult.explanation.reasons) {
        lines.push(`- ${reason}`);
      }
      lines.push('');

      if (phaseResult.explanation.suggestions.length > 0) {
        lines.push('**Suggestions:**');
        for (const suggestion of phaseResult.explanation.suggestions) {
          lines.push(`- ${suggestion}`);
        }
        lines.push('');
      }
    }

    if (phaseResult.issues.length > 0) {
      lines.push('**Issues:**');
      lines.push('');
      lines.push('| Severity | Code | Message | Location |');
      lines.push('|----------|------|---------|----------|');

      const sortedIssues = [...phaseResult.issues].sort((a, b) => {
        const order = { critical: 0, warning: 1, suggestion: 2 };
        return order[a.severity] - order[b.severity];
      });

      for (const issue of sortedIssues) {
        const severity = getSeverityEmoji(issue.severity);
        const location = issue.location
          ? `${path.basename(issue.location.file)}:${issue.location.line || '?'}`
          : '-';
        lines.push(`| ${severity} | ${issue.code} | ${issue.message} | ${location} |`);
      }
      lines.push('');
    } else if (!phaseResult.metrics?.skipped) {
      lines.push('✅ No issues found.');
      lines.push('');
    }
  }

  // Reference Info Section
  lines.push('## Reference Info (no score impact)');
  lines.push('');
  lines.push('These metrics are for reference only and do not affect the score.');
  lines.push('');

  lines.push('### Complexity');
  lines.push('');
  lines.push(`- Total functions analyzed: ${result.reference.complexity.totalFunctions}`);
  lines.push(`- Complex functions (>20): ${result.reference.complexity.complexFunctions}`);
  lines.push(`- Max complexity: ${result.reference.complexity.maxComplexity}`);
  lines.push('');

  if (result.reference.complexity.issues.length > 0) {
    lines.push('| Severity | Code | Message | Location |');
    lines.push('|----------|------|---------|----------|');
    for (const issue of result.reference.complexity.issues.slice(0, 20)) {
      const severity = getSeverityEmoji(issue.severity);
      const location = issue.location
        ? `${path.basename(issue.location.file)}:${issue.location.line || '?'}`
        : '-';
      lines.push(`| ${severity} | ${issue.code} | ${issue.message} | ${location} |`);
    }
    if (result.reference.complexity.issues.length > 20) {
      lines.push(`| ... | ... | *${result.reference.complexity.issues.length - 20} more* | ... |`);
    }
    lines.push('');
  }

  lines.push('### Duplication');
  lines.push('');
  lines.push(`- Duplicate blocks: ${result.reference.duplication.totalBlocks}`);
  lines.push('');

  lines.push('### Naming');
  lines.push('');
  lines.push(`- Naming issues: ${result.reference.naming.totalIssues}`);
  lines.push('');

  lines.push('### JSDoc');
  lines.push('');
  lines.push(`- Missing JSDoc: ${result.reference.jsdoc.totalMissing}`);
  lines.push('');

  lines.push('### Security');
  lines.push('');
  lines.push(`- Security issues: ${result.reference.security.totalIssues}`);
  lines.push('');

  if (result.reference.security.issues.length > 0) {
    lines.push('| Severity | Code | Message | Location |');
    lines.push('|----------|------|---------|----------|');
    for (const issue of result.reference.security.issues) {
      const severity = getSeverityEmoji(issue.severity);
      const location = issue.location
        ? `${path.basename(issue.location.file)}:${issue.location.line || '?'}`
        : '-';
      lines.push(`| ${severity} | ${issue.code} | ${issue.message} | ${location} |`);
    }
    lines.push('');
  }

  // AI Agent Evaluations Section
  if (result.agentEvaluations && result.agentEvaluations.length > 0) {
    lines.push('## AI Agent Evaluations (reference only)');
    lines.push('');
    lines.push('These evaluations are performed by AI and do not affect the score.');
    lines.push('');

    for (const agent of result.agentEvaluations) {
      const scoreEmoji = agent.score >= 80 ? '✅' : agent.score >= 60 ? '⚠️' : '❌';
      
      lines.push(`### ${agent.agent}`);
      lines.push('');
      lines.push(`**Score:** ${agent.score}/100 ${scoreEmoji}`);
      lines.push('');
      lines.push(`| Property | Value |`);
      lines.push(`|----------|-------|`);
      lines.push(`| Provider | ${agent.provider} |`);
      lines.push(`| Model | ${agent.model} |`);
      lines.push(`| Duration | ${agent.durationMs}ms |`);
      if (agent.tokensUsed) {
        lines.push(`| Tokens (in/out) | ${agent.tokensUsed.input} / ${agent.tokensUsed.output} |`);
      }
      lines.push('');
      
      lines.push(`**Summary:** ${agent.summary}`);
      lines.push('');

      if (agent.issues && agent.issues.length > 0) {
        lines.push('**Issues Found:**');
        lines.push('');
        lines.push('| Severity | Type | Description | File |');
        lines.push('|----------|------|-------------|------|');
        
        for (const issue of agent.issues.slice(0, 10)) {
          const severity = getSeverityEmoji(issue.severity);
          const file = issue.file ? path.basename(issue.file) : '-';
          const desc = issue.description.length > 60 
            ? issue.description.substring(0, 60) + '...' 
            : issue.description;
          lines.push(`| ${severity} | ${issue.type} | ${desc} | ${file} |`);
        }
        
        if (agent.issues.length > 10) {
          lines.push(`| ... | ... | *${agent.issues.length - 10} more issues* | ... |`);
        }
        lines.push('');
      } else {
        lines.push('✅ No issues found.');
        lines.push('');
      }
    }
  }

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push('| Category | Count |');
  lines.push('|----------|-------|');
  lines.push(`| Total Issues (scoring) | ${result.summary.totalIssues} |`);
  lines.push(`| Critical | ${result.summary.criticalCount} |`);
  lines.push(`| Warnings | ${result.summary.warningCount} |`);
  lines.push(`| Suggestions | ${result.summary.suggestionCount} |`);
  lines.push('');

  // Footer
  lines.push('---');
  lines.push(`*Generated by @autobe/estimate v${result.meta.estimateVersion}*`);

  return lines.join('\n');
}

function getStatusEmoji(score: number, skipped?: boolean): string {
  if (skipped) return '⏭️ Skipped';
  if (score >= 90) return '✅ Excellent';
  if (score >= 80) return '👍 Good';
  if (score >= 70) return '📊 Average';
  if (score >= 50) return '⚠️ Below Average';
  return '❌ Poor';
}

function getSeverityEmoji(severity: string): string {
  switch (severity) {
    case 'critical': return '🔴 Critical';
    case 'warning': return '🟡 Warning';
    case 'suggestion': return '🔵 Suggestion';
    default: return severity;
  }
}

function formatMetricName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}
