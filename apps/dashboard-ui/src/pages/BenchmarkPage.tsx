import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Typography,
  Alert,
} from "@mui/material";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";

import { useBenchmarkData } from "../hooks/useBenchmarkData";
import { useBenchmarkFilters } from "../hooks/useBenchmarkFilters";
import { ScoreMatrixTable } from "../components/benchmark/ScoreMatrixTable";
import { PhaseRadarChart } from "../components/benchmark/PhaseRadarChart";
import { GradeDistributionChart } from "../components/benchmark/GradeDistributionChart";
import type { Grade } from "../types/benchmark";

const ALL_GRADES: Grade[] = ["A", "B", "C", "D", "F"];

export function BenchmarkPage() {
  const { data, loading, error } = useBenchmarkData();
  const navigate = useNavigate();
  const {
    filteredEntries,
    selectedModels,
    selectedProjects,
    selectedGrades,
    setSelectedModels,
    setSelectedProjects,
    setSelectedGrades,
  } = useBenchmarkFilters(data);

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
    return (
      <Alert severity="error">
        Failed to load benchmark data: {error ?? "Unknown error"}
      </Alert>
    );
  }

  if (data.entries.length === 0) {
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 2 }}>Benchmark Dashboard</Typography>
        <Alert severity="info">
          No benchmark data yet. Run the estimate batch to generate results:
          <br />
          <code>cd packages/estimate && node -r ts-node/register run-batch-estimate.js</code>
        </Alert>
      </Box>
    );
  }

  const toggleFilter = <T,>(
    current: T[],
    value: T,
    setter: (v: T[]) => void,
  ) => {
    setter(
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    );
  };

  const activeModels =
    selectedModels.length > 0 ? selectedModels : data.models;
  const activeProjects =
    selectedProjects.length > 0 ? selectedProjects : data.projects;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4">Benchmark Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            {data.entries.length} evaluations across {data.models.length} models
            and {data.projects.length} projects
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<CompareArrowsIcon />}
          onClick={() => navigate("/benchmark/compare")}
        >
          Compare Models
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
            Models:
          </Typography>
          {data.models.map((model) => (
            <Chip
              key={model}
              label={model}
              size="small"
              variant={selectedModels.includes(model) ? "filled" : "outlined"}
              color={selectedModels.includes(model) ? "primary" : "default"}
              onClick={() =>
                toggleFilter(selectedModels, model, setSelectedModels)
              }
            />
          ))}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
            Projects:
          </Typography>
          {data.projects.map((project) => (
            <Chip
              key={project}
              label={project}
              size="small"
              variant={
                selectedProjects.includes(project) ? "filled" : "outlined"
              }
              color={selectedProjects.includes(project) ? "primary" : "default"}
              onClick={() =>
                toggleFilter(selectedProjects, project, setSelectedProjects)
              }
              sx={{ textTransform: "capitalize" }}
            />
          ))}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
            Grades:
          </Typography>
          {ALL_GRADES.map((grade) => (
            <Chip
              key={grade}
              label={grade}
              size="small"
              variant={selectedGrades.includes(grade) ? "filled" : "outlined"}
              color={selectedGrades.includes(grade) ? "primary" : "default"}
              onClick={() =>
                toggleFilter(selectedGrades, grade, setSelectedGrades)
              }
            />
          ))}
        </Box>
      </Box>

      {/* Score Matrix */}
      <Box sx={{ mb: 4 }}>
        <ScoreMatrixTable
          entries={filteredEntries}
          models={activeModels}
          projects={activeProjects}
        />
      </Box>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <PhaseRadarChart entries={filteredEntries} models={activeModels} />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <GradeDistributionChart entries={filteredEntries} />
        </Grid>
      </Grid>

      {/* Footer */}
      <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: "divider" }}>
        <Typography variant="caption" color="text.disabled">
          Last updated: {new Date(data.generatedAt).toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
}
