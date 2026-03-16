import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { useBenchmarkData } from "../hooks/useBenchmarkData";
import { ProjectScoreCard } from "../components/benchmark/ProjectScoreCard";
import { PhaseBreakdownChart } from "../components/benchmark/PhaseBreakdownChart";
import { PenaltySummaryTable } from "../components/benchmark/PenaltySummaryTable";
import { GateDetailPanel } from "../components/benchmark/GateDetailPanel";
import { PhaseDetailPanel } from "../components/benchmark/PhaseDetailPanel";
import { GradeBadge } from "../components/benchmark/GradeBadge";
import type { BenchmarkEntry, Grade } from "../types/benchmark";
import { SCORING_PHASES } from "../types/benchmark";

function scoreToGrade(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function BenchmarkModelDetailPage() {
  const { model } = useParams<{ model: string }>();
  const navigate = useNavigate();
  const { data, loading, error } = useBenchmarkData();

  const modelEntries = useMemo(() => {
    if (!data || !model) return [];
    return data.entries.filter((e) => e.model === decodeURIComponent(model));
  }, [data, model]);

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

  if (modelEntries.length === 0) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/benchmark")}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Alert severity="warning">
          No benchmark data found for model: {model}
        </Alert>
      </Box>
    );
  }

  const validEntries = modelEntries.filter((e) => e.totalScore > 0);
  const avgScore =
    validEntries.length > 0
      ? Math.round(
          validEntries.reduce((s, e) => s + e.totalScore, 0) /
            validEntries.length,
        )
      : 0;

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/benchmark")}
        sx={{ mb: 2 }}
      >
        Back to Dashboard
      </Button>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 4,
        }}
      >
        <Typography variant="h4">{decodeURIComponent(model!)}</Typography>
        {avgScore > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h5" color="text.secondary">
              Avg: {avgScore}
            </Typography>
            <GradeBadge grade={scoreToGrade(avgScore)} size="medium" />
          </Box>
        )}
      </Box>

      {/* Project cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {modelEntries.map((entry) => (
          <Grid key={entry.project} size={{ xs: 12, sm: 6, lg: 4 }}>
            <ProjectScoreCard entry={entry} />
          </Grid>
        ))}
      </Grid>

      {/* Phase breakdown chart */}
      <Box sx={{ mb: 4 }}>
        <PhaseBreakdownChart entries={modelEntries} />
      </Box>

      {/* Phase detail drill-down */}
      <PhaseDetailDrillDown entries={modelEntries} />

      {/* Penalties */}
      <Box sx={{ mt: 4 }}>
        <PenaltySummaryTable entries={modelEntries} />
      </Box>
    </Box>
  );
}

function PhaseDetailDrillDown({ entries }: { entries: BenchmarkEntry[] }) {
  const [selectedProject, setSelectedProject] = useState<string | null>(
    entries.length > 0 ? entries[0].project : null,
  );

  const entry = entries.find((e) => e.project === selectedProject);

  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h6">Phase Details</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
          —
        </Typography>
        {entries.map((e) => (
          <Chip
            key={e.project}
            label={e.project}
            variant={selectedProject === e.project ? "filled" : "outlined"}
            color={selectedProject === e.project ? "primary" : "default"}
            onClick={() => setSelectedProject(e.project)}
            size="small"
            sx={{ textTransform: "capitalize" }}
          />
        ))}
      </Box>

      {entry && (
        <Grid container spacing={2}>
          {/* Gate */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <GateDetailPanel gate={entry.phases.gate} projectName={entry.project} />
          </Grid>

          {/* Scoring phases */}
          {SCORING_PHASES.map((phase) => (
            <Grid key={phase} size={{ xs: 12, lg: 6 }}>
              <PhaseDetailPanel
                phase={entry.phases[phase]}
                phaseName={phase}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
