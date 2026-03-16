import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Box, Paper, Typography } from "@mui/material";

import type { PipelineData, PipelinePhaseName } from "../../types/benchmark";
import { PIPELINE_PHASES, PIPELINE_PHASE_DISPLAY } from "../../types/benchmark";

const PHASE_COLORS: Record<PipelinePhaseName, string> = {
  analyze: "#60a5fa",
  database: "#34d399",
  interface: "#fbbf24",
  test: "#f87171",
  realize: "#a78bfa",
};

interface PipelineTokenChartProps {
  pipeline: PipelineData;
}

export function PipelineTokenChart({ pipeline }: PipelineTokenChartProps) {
  const chartData = useMemo(() => {
    return PIPELINE_PHASES.map((phase) => ({
      name: PIPELINE_PHASE_DISPLAY[phase].label,
      phase,
      input: Math.round(pipeline.phases[phase].inputTokens / 1000),
      output: Math.round(pipeline.phases[phase].outputTokens / 1000),
      cached: Math.round(pipeline.phases[phase].cachedTokens / 1000),
    }));
  }, [pipeline]);

  const hasData = chartData.some((d) => d.input > 0 || d.output > 0);
  if (!hasData) return null;

  return (
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: "divider" }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Token Usage by Phase (K tokens)
      </Typography>
      <Box sx={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value.toLocaleString()}K`,
                name,
              ]}
            />
            <Legend />
            <Bar dataKey="input" name="Input" stackId="a">
              {chartData.map((entry) => (
                <Cell
                  key={entry.phase}
                  fill={PHASE_COLORS[entry.phase]}
                  opacity={0.8}
                />
              ))}
            </Bar>
            <Bar dataKey="output" name="Output" stackId="a">
              {chartData.map((entry) => (
                <Cell
                  key={entry.phase}
                  fill={PHASE_COLORS[entry.phase]}
                  opacity={0.5}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
