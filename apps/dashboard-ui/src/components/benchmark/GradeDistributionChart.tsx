import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { Box, Paper, Typography } from "@mui/material";

import type { BenchmarkEntry, Grade } from "../../types/benchmark";
import { useThemeMode } from "../../theme/ThemeContext";
import { getGradeColor } from "../../theme/gradeColors";

const GRADES: Grade[] = ["A", "B", "C", "D", "F"];

interface GradeDistributionChartProps {
  entries: BenchmarkEntry[];
}

export function GradeDistributionChart({
  entries,
}: GradeDistributionChartProps) {
  const { mode } = useThemeMode();

  const chartData = useMemo(() => {
    const counts: Record<Grade, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    for (const entry of entries) {
      counts[entry.grade]++;
    }
    return GRADES.map((grade) => ({
      grade,
      count: counts[grade],
      color: getGradeColor(grade, mode).text,
    }));
  }, [entries, mode]);

  return (
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: "divider" }}>
      <Typography variant="h6" gutterBottom>
        Grade Distribution
      </Typography>
      <Box sx={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="grade" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.grade} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
