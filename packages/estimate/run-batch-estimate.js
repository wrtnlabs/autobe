// Load .env from multiple locations
const fs = require('fs');
const path = require('path');
for (const envPath of [
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, '../../.env'),
]) {
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match && !process.env[match[1].trim()]) {
        process.env[match[1].trim()] = match[2].trim();
      }
    }
  }
}

const { EvaluationPipeline } = require('./src/core/pipeline');
const { generateJsonReport, generateMarkdownReport } = require('./src/reporters');
const { SecurityAgent, LLMQualityAgent, HallucinationAgent, SECURITY_MODEL, QUALITY_MODEL, HALLUCINATION_MODEL } = require('./src/agents');
const { AGENT_WEIGHTS, AGENT_WEIGHT_RATIO, scoreToGrade } = require('./src/types');
const { spawn, execSync } = require('child_process');

// ── Configuration ──────────────────────────────────────────
const DEFAULT_EXAMPLES_DIR = path.resolve(__dirname, '../../../autobe-examples');
const examplesDir = process.env.EXAMPLES_DIR || DEFAULT_EXAMPLES_DIR;
const outputBase = path.resolve(__dirname, 'reports/benchmark');
const VALID_PROJECTS = new Set(['todo', 'bbs', 'reddit', 'shopping', 'erp', 'gauzy']);

const USE_AGENT = process.argv.includes('--use-agent');
const NO_DASHBOARD = process.argv.includes('--no-dashboard');
const API_KEY = process.env.OPENROUTER_API_KEY;

if (USE_AGENT && !API_KEY) {
  console.error('OPENROUTER_API_KEY is required when using --use-agent');
  process.exit(1);
}

// ── Discover targets (all models, no exclusions) ───────────
const targets = [];
const vendors = fs.readdirSync(examplesDir).filter(d => {
  const full = path.join(examplesDir, d);
  return fs.statSync(full).isDirectory() && !['raw', '.git', 'node_modules'].includes(d);
});

for (const vendor of vendors) {
  const vendorPath = path.join(examplesDir, vendor);
  const models = fs.readdirSync(vendorPath).filter(d => fs.statSync(path.join(vendorPath, d)).isDirectory());
  for (const model of models) {
    const modelPath = path.join(vendorPath, model);
    const projects = fs.readdirSync(modelPath).filter(d => {
      const full = path.join(modelPath, d);
      return fs.statSync(full).isDirectory() && VALID_PROJECTS.has(d);
    });
    for (const project of projects) {
      targets.push({ model, project, inputPath: path.join(modelPath, project) });
    }
  }
}

console.log(`\n=== Batch Estimate: ${targets.length} targets (agent: ${USE_AGENT ? 'ON' : 'OFF'}) ===\n`);

// ── Live dashboard aggregation ───────────────────────────
const AGGREGATE_SCRIPT = path.resolve(__dirname, '../../apps/dashboard-ui/scripts/aggregate-benchmarks.mjs');
function triggerAggregation() {
  try {
    if (fs.existsSync(AGGREGATE_SCRIPT)) {
      execSync(`node ${AGGREGATE_SCRIPT}`, { stdio: 'pipe' });
    }
  } catch (_) {
    // non-blocking
  }
}

// ── Start dashboard dev server ─────────────────────────────
let dashboardProcess = null;
const dashboardDir = path.resolve(__dirname, '../../apps/dashboard-ui');

function startDashboard() {
  if (NO_DASHBOARD) return;
  if (!fs.existsSync(path.join(dashboardDir, 'package.json'))) {
    console.log('Dashboard UI not found, skipping dev server.');
    return;
  }

  // Check if already running on port 3000
  try {
    execSync('lsof -ti:3000', { stdio: 'pipe' });
    console.log('Dashboard already running on port 3000');
    return;
  } catch (_) {
    // Port not in use, start it
  }

  console.log('Starting dashboard dev server on http://localhost:3000 ...');
  dashboardProcess = spawn('npx', ['vite', '--port', '3000', '--host'], {
    cwd: dashboardDir,
    stdio: 'ignore',
    detached: true,
  });
  dashboardProcess.unref();
  console.log(`Dashboard PID: ${dashboardProcess.pid}\n`);
}

// ── Agent evaluations ──────────────────────────────────────
async function runAgentEvaluations(context) {
  const baseConfig = { provider: 'openrouter', apiKey: API_KEY };
  const securityAgent = new SecurityAgent({ ...baseConfig, model: SECURITY_MODEL });
  const llmQualityAgent = new LLMQualityAgent({ ...baseConfig, model: QUALITY_MODEL });
  const hallucinationAgent = new HallucinationAgent({ ...baseConfig, model: HALLUCINATION_MODEL });

  const [securityResult, llmQualityResult, hallucinationResult] = await Promise.all([
    securityAgent.evaluate(context),
    llmQualityAgent.evaluate(context),
    hallucinationAgent.evaluate(context),
  ]);

  return [securityResult, llmQualityResult, hallucinationResult];
}

// ── Main ───────────────────────────────────────────────────
async function main() {
  startDashboard();

  const results = [];
  let completed = 0;

  for (const target of targets) {
    completed++;
    const label = `${target.model}/${target.project}`;
    const outputPath = path.join(outputBase, target.model, target.project);
    fs.mkdirSync(outputPath, { recursive: true });

    console.log(`[${completed}/${targets.length}] ${label}...`);

    try {
      const pipeline = new EvaluationPipeline(false);
      const result = await pipeline.evaluate({
        inputPath: target.inputPath,
        outputPath,
        options: {
          continueOnGateFailure: true,
          project: target.project,
        },
      });

      // Agent evaluations
      let agentResults = [];
      let adjustedScore = result.totalScore;
      let agentAvg = 0;

      if (USE_AGENT && result.phases.gate.passed) {
        const context = pipeline.getContext();
        if (context) {
          console.log(`  [agent] Running SecurityAgent + LLMQualityAgent + HallucinationAgent...`);
          try {
            agentResults = await runAgentEvaluations(context);
            const successAgents = agentResults.filter(r => r.agent in AGENT_WEIGHTS && r.score >= 0);
            if (successAgents.length > 0) {
              const weightSum = successAgents.reduce((sum, r) => sum + AGENT_WEIGHTS[r.agent], 0);
              agentAvg = successAgents.reduce((sum, r) => sum + r.score * (AGENT_WEIGHTS[r.agent] / weightSum), 0);

              const phasesPortion = result.totalScore * (1 - AGENT_WEIGHT_RATIO);
              const agentPortion = agentAvg * AGENT_WEIGHT_RATIO;
              adjustedScore = Math.round(phasesPortion + agentPortion);

              // Two-tier agent cap — only apply when enough agent coverage
              const totalAgentWeight = Object.values(AGENT_WEIGHTS).reduce((s, w) => s + w, 0);
              if (weightSum >= totalAgentWeight * 0.5) {
                if (agentAvg < 25) adjustedScore = Math.min(adjustedScore, 40);
                else if (agentAvg < 40) adjustedScore = Math.min(adjustedScore, 55);
              }
            }

            const totalCost = agentResults.reduce((sum, r) => {
              const c = r.tokensUsed;
              return sum + (c?.inputCost || 0) + (c?.outputCost || 0);
            }, 0);
            console.log(`  [agent] Scores: ${agentResults.map(r => `${r.agent}=${r.score}`).join(', ')} | Cost: $${totalCost.toFixed(4)}`);
          } catch (agentErr) {
            console.log(`  [agent] ERROR: ${agentErr.message}`);
          }
        }
      }

      // Build full result with agents
      const fullResult = {
        ...result,
        totalScore: adjustedScore,
        grade: scoreToGrade(adjustedScore),
        agentEvaluations: agentResults,
      };

      // Write reports
      const jsonPath = path.join(outputPath, 'estimate-report.json');
      const mdPath = path.join(outputPath, 'estimate-report.md');
      fs.writeFileSync(jsonPath, generateJsonReport(fullResult));
      fs.writeFileSync(mdPath, generateMarkdownReport(fullResult));

      const agentTag = agentResults.length > 0 ? ` agent=${Math.round(agentAvg)}` : '';
      results.push({
        model: target.model,
        project: target.project,
        score: adjustedScore,
        grade: fullResult.grade,
        gate: result.phases.gate.passed ? 'PASS' : 'FAIL',
        gateScore: result.phases.gate.score,
        doc: result.phases.documentQuality.score,
        req: result.phases.requirementsCoverage.score,
        test: result.phases.testCoverage.score,
        logic: result.phases.logicCompleteness.score,
        api: result.phases.apiCompleteness.score,
        agentAvg: agentResults.length > 0 ? Math.round(agentAvg) : null,
      });

      console.log(`  → ${adjustedScore}/100 (${fullResult.grade}) gate=${result.phases.gate.passed ? 'PASS' : 'FAIL'}${agentTag}`);

      // Live-update dashboard after each target
      triggerAggregation();
    } catch (err) {
      console.log(`  → ERROR: ${err.message}`);
      results.push({
        model: target.model,
        project: target.project,
        score: -1,
        grade: 'ERR',
        gate: 'ERR',
      });
    }
  }

  // Summary table
  const hasAgent = results.some(r => r.agentAvg != null);
  console.log('\n' + '━'.repeat(hasAgent ? 110 : 100));
  console.log('  Batch Results Summary');
  console.log('━'.repeat(hasAgent ? 110 : 100));
  const agentHeader = hasAgent ? ` ${'Agent'.padEnd(6)}` : '';
  console.log(`  ${'Model'.padEnd(35)} ${'Project'.padEnd(10)} ${'Score'.padEnd(8)} ${'Grade'.padEnd(6)} ${'Gate'.padEnd(6)} ${'Doc'.padEnd(5)} ${'Req'.padEnd(5)} ${'Test'.padEnd(5)} ${'Logic'.padEnd(5)} ${'API'.padEnd(5)}${agentHeader}`);
  console.log('  ' + '─'.repeat(hasAgent ? 106 : 96));
  for (const r of results) {
    const scoreStr = r.score < 0 ? 'ERR' : `${r.score}`;
    const agentCol = hasAgent ? ` ${String(r.agentAvg ?? '').padEnd(6)}` : '';
    console.log(`  ${r.model.padEnd(35)} ${r.project.padEnd(10)} ${scoreStr.padEnd(8)} ${r.grade.padEnd(6)} ${(r.gate||'').padEnd(6)} ${String(r.doc||'').padEnd(5)} ${String(r.req||'').padEnd(5)} ${String(r.test||'').padEnd(5)} ${String(r.logic||'').padEnd(5)} ${String(r.api||'').padEnd(5)}${agentCol}`);
  }
  console.log('━'.repeat(hasAgent ? 110 : 100));

  // Save summary
  const summaryPath = path.join(outputBase, 'batch-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
  console.log(`\nSummary saved: ${summaryPath}`);

  // Final aggregation
  triggerAggregation();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
