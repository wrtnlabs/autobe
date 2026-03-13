import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { useBenchmarkData } from "../hooks/useBenchmarkData";
import { GradeBadge } from "../components/benchmark/GradeBadge";
import { PipelineOverview } from "../components/benchmark/PipelineOverview";
import { PipelineTokenChart } from "../components/benchmark/PipelineTokenChart";
import { PipelinePhaseDetailSection } from "../components/benchmark/PipelinePhaseDetailSection";
import { GateDetailPanel } from "../components/benchmark/GateDetailPanel";
import { PhaseDetailPanel } from "../components/benchmark/PhaseDetailPanel";
import { LangfuseTracePanel } from "../components/benchmark/LangfuseTracePanel";
import type {
  Grade,
  BenchmarkPhaseScore,
  BenchmarkGateScore,
  PipelinePhaseName,
} from "../types/benchmark";
import { SCORING_PHASES, PIPELINE_PHASES } from "../types/benchmark";

// Map pipeline phases → relevant evaluation phases
function getEvaluationForPhase(
  phases: {
    gate: BenchmarkGateScore;
    documentQuality: BenchmarkPhaseScore;
    requirementsCoverage: BenchmarkPhaseScore;
    testCoverage: BenchmarkPhaseScore;
    logicCompleteness: BenchmarkPhaseScore;
    apiCompleteness: BenchmarkPhaseScore;
  },
  phaseName: PipelinePhaseName,
): { label: string; phase: BenchmarkPhaseScore }[] {
  switch (phaseName) {
    case "analyze":
      return [
        { label: "Document Quality", phase: phases.documentQuality },
        { label: "Requirements Coverage", phase: phases.requirementsCoverage },
      ];
    case "database":
      return [{ label: "Gate (Compilation)", phase: phases.gate }];
    case "interface":
      return [{ label: "API Completeness", phase: phases.apiCompleteness }];
    case "test":
      return [{ label: "Test Coverage", phase: phases.testCoverage }];
    case "realize":
      return [
        { label: "Logic Completeness", phase: phases.logicCompleteness },
        { label: "Gate (Compilation)", phase: phases.gate },
      ];
  }
}

function scoreToGrade(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function BenchmarkProjectDetailPage() {
  const { model, project } = useParams<{ model: string; project: string }>();
  const navigate = useNavigate();
  const { data, loading, error } = useBenchmarkData();

  const entry = useMemo(() => {
    if (!data || !model || !project) return null;
    return data.entries.find(
      (e) =>
        e.model === decodeURIComponent(model) &&
        e.project === decodeURIComponent(project),
    );
  }, [data, model, project]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return <Alert severity="error">Failed to load data: {error}</Alert>;
  }

  if (!entry) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Alert severity="warning">
          No data found for {model}/{project}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Navigation */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() =>
          navigate(`/benchmark/${encodeURIComponent(entry.model)}`)
        }
        sx={{ mb: 2 }}
      >
        Back to {entry.model}
      </Button>

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 3,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h4" sx={{ textTransform: "capitalize" }}>
          {entry.project}
        </Typography>
        <Chip label={entry.model} size="small" variant="outlined" />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h5" color="text.secondary">
            {entry.totalScore}
          </Typography>
          <GradeBadge grade={scoreToGrade(entry.totalScore)} size="medium" />
        </Box>
      </Box>

      {/* Pipeline Phases (Analyze → Database → Interface → Test → Realize) */}
      {entry.pipeline ? (
        <>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Pipeline Phases
          </Typography>

          {/* Visual overview */}
          <PipelineOverview pipeline={entry.pipeline} />

          {/* Token usage chart */}
          <Box sx={{ mt: 3, mb: 3 }}>
            <PipelineTokenChart pipeline={entry.pipeline} />
          </Box>

          {/* Detailed phase sections - expandable */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 4 }}>
            {PIPELINE_PHASES.map((phase) => (
              <PipelinePhaseDetailSection
                key={phase}
                phaseName={phase}
                phaseData={entry.pipeline!.phases[phase]}
                totalTokens={entry.pipeline!.totalTokens}
                evaluationResults={getEvaluationForPhase(
                  entry.phases,
                  phase,
                )}
              />
            ))}
          </Box>
        </>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          Pipeline execution data not available for this model/project
          combination.
        </Alert>
      )}

      {/* Langfuse LLM Trace */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        LLM Call Details
      </Typography>
      <LangfuseTracePanel model={entry.model} project={entry.project} />

      {/* Evaluation Results */}
      <Typography variant="h5" sx={{ mb: 2, mt: 2 }}>
        Evaluation Results
      </Typography>

      <Grid container spacing={2}>
        {/* Gate */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <GateDetailPanel gate={entry.phases.gate} />
        </Grid>

        {/* Scoring phases */}
        {SCORING_PHASES.map((phase) => (
          <Grid key={phase} size={{ xs: 12, lg: 6 }}>
            <PhaseDetailPanel phase={entry.phases[phase]} phaseName={phase} />
          </Grid>
        ))}
      </Grid>

      {/* Meta info */}
      <Paper
        elevation={0}
        sx={{ p: 2, mt: 3, border: 1, borderColor: "divider" }}
      >
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Evaluation Meta
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Chip
            label={`Evaluated: ${new Date(entry.meta.evaluatedAt).toLocaleDateString()}`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`Duration: ${(entry.meta.totalDurationMs / 1000).toFixed(1)}s`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`Files: ${entry.meta.evaluatedFiles}`}
            size="small"
            variant="outlined"
          />
          {entry.pipeline && (
            <Chip
              label={`Total Tokens: ${(entry.pipeline.totalTokens / 1_000_000).toFixed(1)}M`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      </Paper>
    </Box>
  );
}
