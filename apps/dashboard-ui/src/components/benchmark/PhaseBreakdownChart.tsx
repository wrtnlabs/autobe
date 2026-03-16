import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Box, Paper, Typography } from "@mui/material";

import type { BenchmarkEntry, ScoringPhase } from "../../types/benchmark";
import { PHASE_DISPLAY_NAMES, SCORING_PHASES } from "../../types/benchmark";

const PHASE_COLORS: Record<ScoringPhase, string> = {
  documentQuality: "#60a5fa",
  requirementsCoverage: "#34d399",
  testCoverage: "#fbbf24",
  logicCompleteness: "#f87171",
  apiCompleteness: "#a78bfa",
};

interface PhaseBreakdownChartProps {
  entries: BenchmarkEntry[];
}

export function PhaseBreakdownChart({ entries }: PhaseBreakdownChartProps) {
  const chartData = useMemo(() => {
    return entries.map((entry) => {
      const row: Record<string, string | number> = {
        project: entry.project,
      };
      for (const phase of SCORING_PHASES) {
        row[PHASE_DISPLAY_NAMES[phase]] = entry.phases[phase].score;
      }
      return row;
    });
  }, [entries]);

  return (
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: "divider" }}>
      <Typography variant="h6" gutterBottom>
        Phase Breakdown by Project
      </Typography>
      <Box sx={{ width: "100%", height: 350 }}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="project" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            {SCORING_PHASES.map((phase) => (
              <Bar
                key={phase}
                dataKey={PHASE_DISPLAY_NAMES[phase]}
                fill={PHASE_COLORS[phase]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
