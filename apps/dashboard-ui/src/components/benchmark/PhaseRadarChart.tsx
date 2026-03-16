import { useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Box, Typography, Paper } from "@mui/material";

import type { BenchmarkEntry, ScoringPhase } from "../../types/benchmark";
import { PHASE_DISPLAY_NAMES, SCORING_PHASES } from "../../types/benchmark";

const MODEL_COLORS = [
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#a78bfa",
  "#fb923c",
  "#2dd4bf",
  "#f472b6",
];

interface PhaseRadarChartProps {
  entries: BenchmarkEntry[];
  models: string[];
}

export function PhaseRadarChart({ entries, models }: PhaseRadarChartProps) {
  const chartData = useMemo(() => {
    return SCORING_PHASES.map((phase) => {
      const row: Record<string, string | number> = {
        phase: PHASE_DISPLAY_NAMES[phase],
      };
      for (const model of models) {
        const modelEntries = entries.filter(
          (e) => e.model === model && e.totalScore > 0,
        );
        if (modelEntries.length === 0) {
          row[model] = 0;
          continue;
        }
        const avg =
          modelEntries.reduce(
            (sum, e) => sum + e.phases[phase as ScoringPhase].score,
            0,
          ) / modelEntries.length;
        row[model] = Math.round(avg);
      }
      return row;
    });
  }, [entries, models]);

  if (models.length === 0) return null;

  return (
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: "divider" }}>
      <Typography variant="h6" gutterBottom>
        Phase Scores by Model
      </Typography>
      <Box sx={{ width: "100%", height: 400 }}>
        <ResponsiveContainer>
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="phase" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
            {models.map((model, i) => (
              <Radar
                key={model}
                name={model}
                dataKey={model}
                stroke={MODEL_COLORS[i % MODEL_COLORS.length]}
                fill={MODEL_COLORS[i % MODEL_COLORS.length]}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            ))}
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
