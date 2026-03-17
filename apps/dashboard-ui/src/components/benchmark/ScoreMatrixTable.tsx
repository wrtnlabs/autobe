import { useNavigate } from "react-router-dom";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
} from "@mui/material";

import type { BenchmarkEntry, Grade } from "../../types/benchmark";
import { getGradeColor } from "../../theme/gradeColors";
import { useThemeMode } from "../../theme/ThemeContext";
import { GradeBadge } from "./GradeBadge";

interface ScoreMatrixTableProps {
  entries: BenchmarkEntry[];
  models: string[];
  projects: string[];
}

function buildMatrix(
  entries: BenchmarkEntry[],
  models: string[],
  projects: string[],
): Map<string, BenchmarkEntry | null> {
  const map = new Map<string, BenchmarkEntry | null>();
  for (const model of models) {
    for (const project of projects) {
      map.set(`${model}::${project}`, null);
    }
  }
  for (const entry of entries) {
    map.set(`${entry.model}::${entry.project}`, entry);
  }
  return map;
}

function getModelAvg(
  entries: BenchmarkEntry[],
  model: string,
): { avg: number; count: number } {
  const modelEntries = entries.filter(
    (e) => e.model === model && e.totalScore > 0,
  );
  if (modelEntries.length === 0) return { avg: 0, count: 0 };
  const sum = modelEntries.reduce((s, e) => s + e.totalScore, 0);
  return { avg: Math.round(sum / modelEntries.length), count: modelEntries.length };
}

function getModelLastUpdated(
  entries: BenchmarkEntry[],
  model: string,
): string | null {
  const modelEntries = entries.filter((e) => e.model === model);
  let latest: string | null = null;
  for (const e of modelEntries) {
    const date = e.meta.reportUpdatedAt ?? e.meta.evaluatedAt;
    if (!latest || date > latest) latest = date;
  }
  return latest;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hours}:${mins}`;
}

function scoreToGrade(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function ScoreMatrixTable({
  entries,
  models,
  projects,
}: ScoreMatrixTableProps) {
  const { mode } = useThemeMode();
  const navigate = useNavigate();
  const matrix = buildMatrix(entries, models, projects);

  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: "divider" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Model</TableCell>
            {projects.map((p) => (
              <TableCell key={p} align="center" sx={{ fontWeight: 600, textTransform: "capitalize" }}>
                {p}
              </TableCell>
            ))}
            <TableCell align="center" sx={{ fontWeight: 700 }}>
              Avg
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {models.map((model) => {
            const { avg, count } = getModelAvg(entries, model);
            return (
              <TableRow
                key={model}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => navigate(`/benchmark/${encodeURIComponent(model)}`)}
              >
                <TableCell sx={{ fontWeight: 500 }}>
                  {model}
                  {(() => {
                    const lastUpdated = getModelLastUpdated(entries, model);
                    return lastUpdated ? (
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                        {formatDate(lastUpdated)}
                      </Typography>
                    ) : null;
                  })()}
                </TableCell>
                {projects.map((project) => {
                  const entry = matrix.get(`${model}::${project}`);
                  if (!entry) {
                    return (
                      <TableCell key={project} align="center">
                        <Typography variant="body2" color="text.disabled">
                          --
                        </Typography>
                      </TableCell>
                    );
                  }
                  const colors = getGradeColor(entry.grade, mode);
                  return (
                    <TableCell
                      key={project}
                      align="center"
                      sx={{
                        bgcolor: colors.bg,
                        transition: "background-color 0.2s",
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
                          sx={{ fontWeight: 700, color: colors.text }}
                        >
                          {entry.totalScore}
                        </Typography>
                        <GradeBadge grade={entry.grade} />
                      </Box>
                    </TableCell>
                  );
                })}
                <TableCell align="center">
                  {count > 0 ? (
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
                    <Typography variant="body2" color="text.disabled">
                      --
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
