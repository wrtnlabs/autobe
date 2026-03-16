import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import type { BenchmarkGateScore } from "../../types/benchmark";

interface GateDetailPanelProps {
  gate: BenchmarkGateScore;
  projectName?: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  warning: "#f59e0b",
  suggestion: "#6b7280",
};

const SEVERITY_CHIP_COLOR: Record<
  string,
  "error" | "warning" | "default"
> = {
  critical: "error",
  warning: "warning",
  suggestion: "default",
};

export function GateDetailPanel({ gate, projectName }: GateDetailPanelProps) {
  const chartData = useMemo(() => {
    return (gate.issuesByCode || []).slice(0, 10).map((item) => ({
      code: item.code,
      count: item.count,
      severity: item.severity,
      fill: SEVERITY_COLORS[item.severity] || "#6b7280",
    }));
  }, [gate.issuesByCode]);

  const totalIssues = gate.typeErrorCount + gate.typeWarningCount + gate.suggestionCount;

  return (
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: "divider" }}>
      <Typography variant="h6" gutterBottom>
        Gate Analysis {projectName ? `— ${projectName}` : ""}
      </Typography>

      {/* Summary chips */}
      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <Chip
          label={`Score: ${gate.score}/100`}
          color={gate.passed ? "success" : "error"}
          size="small"
        />
        <Chip
          label={`${gate.typeErrorCount} errors`}
          color={gate.typeErrorCount > 0 ? "error" : "default"}
          variant="outlined"
          size="small"
        />
        <Chip
          label={`${gate.typeWarningCount} warnings`}
          color={gate.typeWarningCount > 0 ? "warning" : "default"}
          variant="outlined"
          size="small"
        />
        <Chip
          label={`${gate.suggestionCount} suggestions`}
          variant="outlined"
          size="small"
        />
        <Chip
          label={`${totalIssues} total`}
          variant="outlined"
          size="small"
        />
      </Box>

      {/* Top issues bar chart */}
      {chartData.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Top Issues by Code
          </Typography>
          <Box sx={{ width: "100%", height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" />
                <YAxis
                  dataKey="code"
                  type="category"
                  width={80}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      {/* Full issue table */}
      {(gate.issuesByCode || []).length > 0 && (
        <TableContainer sx={{ maxHeight: 300 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Severity</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Count
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Sample Message</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {gate.issuesByCode.map((item) => (
                <TableRow key={item.code} hover>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: "monospace", fontWeight: 600 }}
                    >
                      {item.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.severity}
                      size="small"
                      color={SEVERITY_CHIP_COLOR[item.severity] || "default"}
                      variant="outlined"
                      sx={{ fontSize: "0.7rem" }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {item.count}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "block",
                        maxWidth: 400,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.message}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
