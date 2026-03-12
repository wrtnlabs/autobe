import {
  Box,
  Chip,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoIcon from "@mui/icons-material/Info";

import type { BenchmarkPhaseScore } from "../../types/benchmark";
import { PHASE_DISPLAY_NAMES, PHASE_WEIGHTS } from "../../types/benchmark";

interface PhaseDetailPanelProps {
  phase: BenchmarkPhaseScore;
  phaseName: string;
}

const SEVERITY_ICON: Record<string, typeof ErrorIcon> = {
  critical: ErrorIcon,
  warning: WarningAmberIcon,
  suggestion: InfoIcon,
};

const METRIC_LABELS: Record<string, string> = {
  // Document Quality
  hasDocsFolder: "Docs Folder",
  hasReadme: "README",
  docFileCount: "Doc Files",
  totalDocLength: "Total Doc Length",
  // Requirements Coverage
  controllerCount: "Controllers",
  providerCount: "Providers",
  structureCount: "Structures",
  requirementsDocCount: "Req. Docs",
  mappedControllers: "Mapped Controllers",
  unmappedControllers: "Unmapped Controllers",
  mappingRatio: "Mapping Ratio",
  // Test Coverage
  testCount: "Test Files",
  totalRoutes: "Total Routes",
  coveredRoutes: "Covered Routes",
  routeCoveragePercent: "Route Coverage %",
  definedMethods: "Defined Methods",
  testedMethods: "Tested Methods",
  // Logic Completeness
  totalIncomplete: "Incomplete Items",
  todoCount: "TODOs",
  fixmeCount: "FIXMEs",
  emptyMethods: "Empty Methods",
  emptyCatch: "Empty Catch",
  // API Completeness
  totalEndpoints: "Total Endpoints",
  implementedEndpoints: "Implemented",
  stubEndpoints: "Stub Endpoints",
  completionRate: "Completion Rate",
  implementationRate: "Implementation Rate",
};

function formatMetricValue(key: string, value: number | string | boolean): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (key === "mappingRatio" || key === "completionRate" || key === "implementationRate") {
    return typeof value === "number" ? `${Math.round(value as number)}%` : String(value);
  }
  if (key === "totalDocLength" && typeof value === "number") {
    return value > 1000 ? `${(value / 1000).toFixed(0)}K chars` : `${value} chars`;
  }
  return String(value);
}

export function PhaseDetailPanel({ phase, phaseName }: PhaseDetailPanelProps) {
  const displayName = PHASE_DISPLAY_NAMES[phaseName] || phaseName;
  const weight = PHASE_WEIGHTS[phaseName];

  const metrics = phase.metrics || {};
  const metricEntries = Object.entries(metrics).filter(
    ([key]) => !["criticalCount", "warningCount", "hasRequirementsDocs", "routeAnalysis"].includes(key),
  );

  const explanation = phase.explanation;

  return (
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: "divider" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.5,
        }}
      >
        <Typography variant="h6">{displayName}</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Chip
            label={`${phase.score}/100`}
            color={phase.score >= 80 ? "success" : phase.score >= 60 ? "warning" : "error"}
            size="small"
          />
          {weight !== undefined && (
            <Chip
              label={`Weight: ${Math.round(weight * 100)}%`}
              variant="outlined"
              size="small"
            />
          )}
        </Box>
      </Box>

      {/* Metrics table */}
      {metricEntries.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Metrics
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableBody>
                {metricEntries.map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell sx={{ py: 0.5, border: 0 }}>
                      <Typography variant="body2" color="text.secondary">
                        {METRIC_LABELS[key] || key}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 0.5, border: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatMetricValue(key, value)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Explanation */}
      {explanation && (
        <>
          {/* Issue summaries */}
          {explanation.issueSummaries.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Divider sx={{ mb: 1.5 }} />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Issues Found
              </Typography>
              {explanation.issueSummaries.map((issue, i) => {
                const Icon = SEVERITY_ICON[issue.severity] || InfoIcon;
                return (
                  <Box
                    key={i}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      mb: 0.75,
                    }}
                  >
                    <Icon
                      fontSize="small"
                      color={
                        issue.severity === "critical"
                          ? "error"
                          : issue.severity === "warning"
                            ? "warning"
                            : "disabled"
                      }
                      sx={{ mt: 0.25, flexShrink: 0 }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2">
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{ fontFamily: "monospace", fontWeight: 600 }}
                        >
                          {issue.code}
                        </Typography>
                        {" "}
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                        >
                          ×{issue.count}
                        </Typography>
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 500,
                        }}
                      >
                        {issue.message}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Reasons */}
          {explanation.reasons.length > 0 && (
            <Box sx={{ mb: 1.5 }}>
              <Divider sx={{ mb: 1.5 }} />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Score Reasons
              </Typography>
              {explanation.reasons.map((reason, i) => (
                <Typography key={i} variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
                  - {reason}
                </Typography>
              ))}
            </Box>
          )}

          {/* Suggestions */}
          {explanation.suggestions.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Suggestions
              </Typography>
              {explanation.suggestions.map((suggestion, i) => (
                <Typography key={i} variant="body2" color="primary.main" sx={{ mb: 0.25 }}>
                  → {suggestion}
                </Typography>
              ))}
            </Box>
          )}
        </>
      )}

      {/* No issues */}
      {!explanation && metricEntries.length === 0 && (
        <Typography variant="body2" color="text.disabled">
          No detailed data available.
        </Typography>
      )}
    </Paper>
  );
}
