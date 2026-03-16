import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function extractGateMetrics(gate) {
  let typeErrorCount = 0;
  let typeWarningCount = 0;
  let suggestionCount = 0;

  for (const issue of gate.issues) {
    if (issue.severity === "suggestion") suggestionCount++;
    else if (issue.severity === "warning") typeWarningCount++;
    else typeErrorCount++;
  }

  return { typeErrorCount, typeWarningCount, suggestionCount };
}

function extractGateIssuesByCode(gate) {
  const byCode = {};
  for (const issue of gate.issues) {
    const key = issue.code || "unknown";
    if (!byCode[key]) {
      byCode[key] = { code: key, count: 0, severity: issue.severity, message: "" };
    }
    byCode[key].count++;
    if (!byCode[key].message) {
      byCode[key].message = (issue.message || "").slice(0, 120);
    }
  }
  return Object.values(byCode).sort((a, b) => b.count - a.count);
}

function extractPhaseScore(phase) {
  return {
    score: phase.score,
    maxScore: phase.maxScore,
    weightedScore: phase.weightedScore,
    passed: phase.passed,
    durationMs: phase.durationMs,
    metrics: phase.metrics,
  };
}

function extractPhaseDetail(phase) {
  const base = extractPhaseScore(phase);
  const detail = { ...base };

  if (phase.explanation) {
    detail.explanation = {
      reasons: (phase.explanation.reasons || []).slice(0, 5),
      issueSummaries: (phase.explanation.issueSummaries || [])
        .slice(0, 10)
        .map((s) => ({
          code: s.code,
          count: s.count,
          severity: s.severity,
          message: (s.message || "").slice(0, 120),
        })),
      suggestions: (phase.explanation.suggestions || []).slice(0, 5),
    };
  }

  return detail;
}

// Map benchmark model names → test/results vendor/model paths
const MODEL_TO_RESULTS_PATH = {
  "qwen3-80b": "qwen/qwen3-next-80b-a3b-instruct",
  "qwen3-coder": "qwen/qwen3-coder-next",
  "qwen3-30b": "qwen/qwen3-30b-a3b-thinking-2507",
  "gpt-4.1-mini": "openai/gpt-4.1-mini",
  "gpt-4.1": "openai/gpt-4.1",
  "gpt-4.1-mini-v2": "openai/gpt-4.1-mini",
};

const PIPELINE_PHASES = ["analyze", "database", "interface", "test", "realize"];

function extractAgentMetrics(aggregates) {
  if (!aggregates) return null;
  const result = {};
  for (const [key, val] of Object.entries(aggregates)) {
    if (key === "total") continue;
    const m = val.metric;
    if (!m) continue;
    result[key] = {
      attempt: m.attempt ?? 0,
      success: m.success ?? 0,
      failure: (m.validationFailure ?? 0) + (m.invalidJson ?? 0),
    };
  }
  return Object.keys(result).length > 0 ? result : null;
}

function extractAnalyzeDetail(event) {
  if (!event) return null;
  return {
    prefix: event.prefix ?? null,
    actors: (event.actors || []).map((a) => ({
      name: a.name,
      kind: a.kind,
      description: (a.description || "").slice(0, 150),
    })),
    documents: (event.files || []).map((f) => ({
      filename: f.filename,
      documentType: f.documentType,
      outline: f.outline || [],
    })),
    agentMetrics: extractAgentMetrics(event.aggregates),
  };
}

function extractDatabaseDetail(event) {
  if (!event) return null;
  // schemas is a Record<filename, prismaSchemaString>
  const schemaFiles = event.schemas || {};
  const schemas = [];
  for (const [filename, content] of Object.entries(schemaFiles)) {
    // Count models/enums from prisma schema string
    const modelCount = (String(content).match(/^model\s+/gm) || []).length;
    const enumCount = (String(content).match(/^enum\s+/gm) || []).length;
    schemas.push({ filename, models: modelCount, enums: enumCount });
  }
  return {
    schemas,
    totalModels: schemas.reduce((s, f) => s + f.models, 0),
    totalEnums: schemas.reduce((s, f) => s + f.enums, 0),
    compiled: event.compiled?.type === "success",
    agentMetrics: extractAgentMetrics(event.aggregates),
  };
}

function extractInterfaceDetail(event) {
  if (!event) return null;
  const operations = (event.document?.operations || []).map((op) => ({
    name: op.name,
    method: op.method,
    path: op.path,
    description: (op.description || "").slice(0, 120),
    auth: op.authorizationType ?? "none",
  }));
  return {
    operations,
    authorizations: (event.authorizations || []).map((a) => a.name || a),
    missed: event.missed || [],
    agentMetrics: extractAgentMetrics(event.aggregates),
  };
}

function extractTestDetail(event) {
  if (!event) return null;
  const functions = (event.functions || []).map((f) => ({
    name: f.name,
    path: f.path,
    method: f.method,
  }));
  return {
    functions,
    compiled: event.compiled?.type === "success",
    agentMetrics: extractAgentMetrics(event.aggregates),
  };
}

function extractRealizeDetail(event) {
  if (!event) return null;
  const functions = (event.functions || []).map((f) => ({
    name: f.name,
    path: f.path,
    method: f.method,
  }));
  const compiledInfo = event.compiled;
  let compileResult = null;
  if (compiledInfo) {
    if (compiledInfo.type === "success") {
      compileResult = { success: true, errors: [] };
    } else {
      compileResult = {
        success: false,
        errors: (compiledInfo.diagnostics || []).slice(0, 20).map((d) => ({
          file: d.file,
          code: d.code,
          message:
            typeof d.messageText === "string"
              ? d.messageText.slice(0, 150)
              : String(d.messageText || "").slice(0, 150),
        })),
      };
    }
  }
  return {
    functions,
    compileResult,
    agentMetrics: extractAgentMetrics(event.aggregates),
  };
}

function extractPipelineData(testResultsDir, model, project) {
  const resultsPath = MODEL_TO_RESULTS_PATH[model];
  if (!resultsPath) return null;

  const projectDir = path.join(testResultsDir, resultsPath, project);
  if (!fs.existsSync(projectDir)) return null;

  // Get tokenUsage from realize (has aggregate of all phases)
  const realizeTokenPath = path.join(projectDir, "realize", "autobe", "tokenUsage.json");
  let tokenUsage = null;
  if (fs.existsSync(realizeTokenPath)) {
    try {
      tokenUsage = JSON.parse(fs.readFileSync(realizeTokenPath, "utf-8"));
    } catch {}
  }

  // Get histories from realize (has all phase results)
  const realizeHistoriesPath = path.join(projectDir, "realize", "autobe", "histories.json");
  let histories = null;
  if (fs.existsSync(realizeHistoriesPath)) {
    try {
      histories = JSON.parse(fs.readFileSync(realizeHistoriesPath, "utf-8"));
    } catch {}
  }

  const phases = {};
  for (const phase of PIPELINE_PHASES) {
    const phaseData = { tokens: 0, inputTokens: 0, outputTokens: 0, cachedTokens: 0 };

    // Token usage per phase
    if (tokenUsage && tokenUsage[phase]) {
      phaseData.tokens = tokenUsage[phase].total || 0;
      phaseData.inputTokens = tokenUsage[phase].input?.total || 0;
      phaseData.outputTokens = tokenUsage[phase].output?.total || 0;
      phaseData.cachedTokens = tokenUsage[phase].input?.cached || 0;
    }

    // Duration from histories (created_at → completed_at)
    if (histories) {
      const event = histories.find((e) => e.type === phase);
      if (event) {
        if (event.created_at && event.completed_at) {
          phaseData.createdAt = event.created_at;
          phaseData.completedAt = event.completed_at;
          phaseData.durationMs =
            new Date(event.completed_at).getTime() -
            new Date(event.created_at).getTime();
        }
        phaseData.completed = true;

        // Extract detailed phase data
        if (phase === "analyze") {
          phaseData.detail = extractAnalyzeDetail(event);
        } else if (phase === "database") {
          phaseData.detail = extractDatabaseDetail(event);
        } else if (phase === "interface") {
          phaseData.detail = extractInterfaceDetail(event);
        } else if (phase === "test") {
          phaseData.detail = extractTestDetail(event);
        } else if (phase === "realize") {
          phaseData.detail = extractRealizeDetail(event);
        }
      } else {
        phaseData.completed = false;
      }
    }

    phases[phase] = phaseData;
  }

  return {
    totalTokens: tokenUsage?.aggregate?.total || 0,
    totalInputTokens: tokenUsage?.aggregate?.input?.total || 0,
    totalOutputTokens: tokenUsage?.aggregate?.output?.total || 0,
    phases,
  };
}

function main() {
  const reportsDir = path.resolve(
    __dirname,
    "../../../packages/estimate/reports/benchmark",
  );
  const testResultsDir = path.resolve(__dirname, "../../../test/results");
  const outputPath = path.resolve(
    __dirname,
    "../public/benchmark-summary.json",
  );

  if (!fs.existsSync(reportsDir)) {
    console.error(`Reports directory not found: ${reportsDir}`);
    process.exit(1);
  }

  const entries = [];
  const models = new Set();
  const projects = new Set();

  const modelDirs = fs.readdirSync(reportsDir).filter((name) => {
    const fullPath = path.join(reportsDir, name);
    return fs.statSync(fullPath).isDirectory();
  });

  for (const model of modelDirs) {
    const modelPath = path.join(reportsDir, model);
    const projectDirs = fs.readdirSync(modelPath).filter((name) => {
      const fullPath = path.join(modelPath, name);
      return fs.statSync(fullPath).isDirectory();
    });

    for (const project of projectDirs) {
      const reportPath = path.join(
        modelPath,
        project,
        "estimate-report.json",
      );
      if (!fs.existsSync(reportPath)) continue;

      try {
        const raw = fs.readFileSync(reportPath, "utf-8");
        const report = JSON.parse(raw);

        const gateMetrics = extractGateMetrics(report.phases.gate);

        const gateIssuesByCode = extractGateIssuesByCode(report.phases.gate);

        const pipeline = extractPipelineData(testResultsDir, model, project);

        entries.push({
          model,
          project,
          totalScore: report.totalScore,
          grade: report.grade,
          pipeline,
          phases: {
            gate: {
              ...extractPhaseScore(report.phases.gate),
              ...gateMetrics,
              issuesByCode: gateIssuesByCode,
            },
            documentQuality: extractPhaseDetail(report.phases.documentQuality),
            requirementsCoverage: extractPhaseDetail(
              report.phases.requirementsCoverage,
            ),
            testCoverage: extractPhaseDetail(report.phases.testCoverage),
            logicCompleteness: extractPhaseDetail(
              report.phases.logicCompleteness,
            ),
            apiCompleteness: extractPhaseDetail(report.phases.apiCompleteness),
          },
          penalties: report.penalties ?? null,
          summary: report.summary,
          meta: {
            evaluatedAt: report.meta.evaluatedAt,
            totalDurationMs: report.meta.totalDurationMs,
            evaluatedFiles: report.meta.evaluatedFiles,
          },
          reference: {
            complexity: {
              totalFunctions: report.reference?.complexity?.totalFunctions ?? 0,
              complexFunctions:
                report.reference?.complexity?.complexFunctions ?? 0,
              maxComplexity: report.reference?.complexity?.maxComplexity ?? 0,
            },
            duplication: {
              totalBlocks: report.reference?.duplication?.totalBlocks ?? 0,
            },
            naming: {
              totalIssues: report.reference?.naming?.totalIssues ?? 0,
            },
            jsdoc: {
              totalMissing: report.reference?.jsdoc?.totalMissing ?? 0,
            },
            schemaSync: {
              totalTypes: report.reference?.schemaSync?.totalTypes ?? 0,
              emptyTypes: report.reference?.schemaSync?.emptyTypes ?? 0,
              mismatchedProperties:
                report.reference?.schemaSync?.mismatchedProperties ?? 0,
            },
          },
        });

        models.add(model);
        projects.add(project);

        console.log(
          `  [OK] ${model}/${project}: ${report.totalScore} (${report.grade})`,
        );
      } catch (err) {
        console.error(`  [FAIL] ${model}/${project}: ${err}`);
      }
    }
  }

  const output = {
    entries,
    models: Array.from(models).sort(),
    projects: Array.from(projects).sort(),
    generatedAt: new Date().toISOString(),
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(
    `\nAggregated ${entries.length} entries (${models.size} models x ${projects.size} projects)`,
  );
  console.log(`Output: ${outputPath}`);
}

export { main as aggregate };

// Run directly if executed as script
const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);
if (isDirectRun) {
  main();
}
