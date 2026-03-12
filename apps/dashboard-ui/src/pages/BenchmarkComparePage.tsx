import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { useBenchmarkData } from "../hooks/useBenchmarkData";
import { GradeBadge } from "../components/benchmark/GradeBadge";
import { ComparisonRadar } from "../components/benchmark/ComparisonRadar";
import type { Grade } from "../types/benchmark";
import { getGradeColor } from "../theme/gradeColors";
import { useThemeMode } from "../theme/ThemeContext";

function scoreToGrade(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function BenchmarkComparePage() {
  const navigate = useNavigate();
  const { data, loading, error } = useBenchmarkData();
  const { mode } = useThemeMode();
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  const toggleModel = (model: string) => {
    setSelectedModels((prev) =>
      prev.includes(model)
        ? prev.filter((m) => m !== model)
        : prev.length < 4
          ? [...prev, model]
          : prev,
    );
  };

  const comparisonData = useMemo(() => {
    if (!data || selectedModels.length === 0) return null;

    const projects = data.projects;
    const rows = projects.map((project) => {
      const cells = selectedModels.map((model) => {
        const entry = data.entries.find(
          (e) => e.model === model && e.project === project,
        );
        return entry ?? null;
      });
      return { project, cells };
    });

    // Model averages
    const averages = selectedModels.map((model) => {
      const entries = data.entries.filter(
        (e) => e.model === model && e.totalScore > 0,
      );
      if (entries.length === 0) return 0;
      return Math.round(
        entries.reduce((s, e) => s + e.totalScore, 0) / entries.length,
      );
    });

    return { rows, averages };
  }, [data, selectedModels]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return <Alert severity="error">Failed to load data: {error}</Alert>;
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/benchmark")}
        sx={{ mb: 2 }}
      >
        Back to Dashboard
      </Button>

      <Typography variant="h4" gutterBottom>
        Compare Models
      </Typography>

      {/* Model selector */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography variant="body2" color="text.secondary">
          Select up to 4 models:
        </Typography>
        {data.models.map((model) => (
          <Chip
            key={model}
            label={model}
            variant={selectedModels.includes(model) ? "filled" : "outlined"}
            color={selectedModels.includes(model) ? "primary" : "default"}
            onClick={() => toggleModel(model)}
          />
        ))}
      </Box>

      {selectedModels.length === 0 ? (
        <Alert severity="info">Select models to compare.</Alert>
      ) : (
        <Grid container spacing={3}>
          {/* Comparison table */}
          <Grid size={{ xs: 12 }}>
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{ border: 1, borderColor: "divider" }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Project</TableCell>
                    {selectedModels.map((model) => (
                      <TableCell key={model} align="center" sx={{ fontWeight: 600 }}>
                        {model}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comparisonData?.rows.map(({ project, cells }) => {
                    const scores = cells.map((c) => c?.totalScore ?? 0);
                    const maxScore = Math.max(...scores);
                    return (
                      <TableRow key={project}>
                        <TableCell sx={{ fontWeight: 500, textTransform: "capitalize" }}>
                          {project}
                        </TableCell>
                        {cells.map((entry, i) => {
                          if (!entry) {
                            return (
                              <TableCell key={selectedModels[i]} align="center">
                                <Typography variant="body2" color="text.disabled">
                                  --
                                </Typography>
                              </TableCell>
                            );
                          }
                          const isBest = entry.totalScore === maxScore && maxScore > 0;
                          const colors = getGradeColor(entry.grade, mode);
                          return (
                            <TableCell
                              key={selectedModels[i]}
                              align="center"
                              sx={{
                                bgcolor: isBest ? colors.bg : undefined,
                                fontWeight: isBest ? 700 : 400,
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 0.5,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: isBest ? 700 : 400,
                                    color: isBest ? colors.text : undefined,
                                  }}
                                >
                                  {entry.totalScore}
                                </Typography>
                                <GradeBadge grade={entry.grade} />
                              </Box>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                  {/* Average row */}
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Average</TableCell>
                    {comparisonData?.averages.map((avg, i) => (
                      <TableCell key={selectedModels[i]} align="center">
                        {avg > 0 ? (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 0.5,
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {avg}
                            </Typography>
                            <GradeBadge grade={scoreToGrade(avg)} />
                          </Box>
                        ) : (
                          "--"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Radar comparison */}
          <Grid size={{ xs: 12 }}>
            <ComparisonRadar
              entries={data.entries}
              selectedModels={selectedModels}
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
