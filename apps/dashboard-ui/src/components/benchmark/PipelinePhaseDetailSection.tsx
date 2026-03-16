import {
  Box,
  Chip,
  Collapse,
  IconButton,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import type {
  PipelinePhaseData,
  PipelinePhaseName,
  AnalyzeDetail,
  DatabaseDetail,
  InterfaceDetail,
  TestDetail,
  RealizeDetail,
  AgentMetricEntry,
  BenchmarkPhaseScore,
} from "../../types/benchmark";
import { PIPELINE_PHASE_DISPLAY } from "../../types/benchmark";

export interface EvaluationResult {
  label: string;
  phase: BenchmarkPhaseScore;
}

const PHASE_COLORS: Record<PipelinePhaseName, string> = {
  analyze: "#60a5fa",
  database: "#34d399",
  interface: "#fbbf24",
  test: "#f87171",
  realize: "#a78bfa",
};

function formatTokens(tokens: number): string {
  if (tokens === 0) return "0";
  if (tokens < 1000) return `${tokens}`;
  if (tokens < 1_000_000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1_000_000).toFixed(2)}M`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const min = Math.floor(ms / 60_000);
  const sec = Math.round((ms % 60_000) / 1000);
  return `${min}m ${sec}s`;
}

const METHOD_COLORS: Record<string, string> = {
  GET: "#22c55e",
  POST: "#3b82f6",
  PUT: "#f59e0b",
  PATCH: "#a855f7",
  DELETE: "#ef4444",
};

// ─── Agent Metrics Sub-section ───
function AgentMetricsTable({
  metrics,
}: {
  metrics: Record<string, AgentMetricEntry>;
}) {
  const entries = Object.entries(metrics);
  if (entries.length === 0) return null;

  const totalAttempt = entries.reduce((s, [, v]) => s + v.attempt, 0);
  const totalSuccess = entries.reduce((s, [, v]) => s + v.success, 0);
  const totalFailure = entries.reduce((s, [, v]) => s + v.failure, 0);

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Agent Call Metrics
      </Typography>
      <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap" }}>
        <Chip
          label={`${totalAttempt} attempts`}
          size="small"
          variant="outlined"
        />
        <Chip
          label={`${totalSuccess} success`}
          size="small"
          color="success"
          variant="outlined"
        />
        {totalFailure > 0 && (
          <Chip
            label={`${totalFailure} failures`}
            size="small"
            color="error"
            variant="outlined"
          />
        )}
        <Chip
          label={`${totalAttempt > 0 ? ((totalSuccess / totalAttempt) * 100).toFixed(0) : 0}% success rate`}
          size="small"
          variant="outlined"
        />
      </Box>
      <TableContainer sx={{ maxHeight: 200 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Agent</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Attempts
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Success
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Failures
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Rate
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map(([name, val]) => (
              <TableRow key={name} hover>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
                  >
                    {name}
                  </Typography>
                </TableCell>
                <TableCell align="right">{val.attempt}</TableCell>
                <TableCell align="right">{val.success}</TableCell>
                <TableCell align="right">
                  {val.failure > 0 ? (
                    <Typography
                      variant="body2"
                      color="error"
                      sx={{ fontWeight: 600 }}
                    >
                      {val.failure}
                    </Typography>
                  ) : (
                    0
                  )}
                </TableCell>
                <TableCell align="right">
                  {val.attempt > 0
                    ? `${((val.success / val.attempt) * 100).toFixed(0)}%`
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ─── Analyze Detail ───
function AnalyzeDetailView({ detail }: { detail: AnalyzeDetail }) {
  return (
    <Box>
      {detail.prefix && (
        <Chip
          label={`Prefix: ${detail.prefix}`}
          size="small"
          variant="outlined"
          sx={{ mb: 1 }}
        />
      )}

      {/* Actors */}
      {detail.actors.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Actors ({detail.actors.length})
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {detail.actors.map((a) => (
              <Chip
                key={a.name}
                label={`${a.name} (${a.kind})`}
                size="small"
                variant="outlined"
                title={a.description}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Documents */}
      {detail.documents.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Requirements Documents ({detail.documents.length})
          </Typography>
          <TableContainer sx={{ maxHeight: 300 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>File</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Outline</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detail.documents.map((doc) => (
                  <TableRow key={doc.filename} hover>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
                      >
                        {doc.filename}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={doc.documentType}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.7rem" }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "block",
                          maxWidth: 400,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {doc.outline.join(" > ")}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {detail.agentMetrics && (
        <AgentMetricsTable metrics={detail.agentMetrics} />
      )}
    </Box>
  );
}

// ─── Database Detail ───
function DatabaseDetailView({ detail }: { detail: DatabaseDetail }) {
  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <Chip
          label={`${detail.totalModels} models`}
          size="small"
          variant="outlined"
        />
        <Chip
          label={`${detail.totalEnums} enums`}
          size="small"
          variant="outlined"
        />
        <Chip
          label={`${detail.schemas.length} schema files`}
          size="small"
          variant="outlined"
        />
        <Chip
          label={detail.compiled ? "Compiled" : "Compile Failed"}
          size="small"
          color={detail.compiled ? "success" : "error"}
          variant="outlined"
        />
      </Box>

      {detail.schemas.length > 0 && (
        <TableContainer sx={{ maxHeight: 300 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Schema File</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Models
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Enums
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {detail.schemas.map((s) => (
                <TableRow key={s.filename} hover>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: "monospace", fontWeight: 600, fontSize: "0.75rem" }}
                    >
                      {s.filename}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{s.models}</TableCell>
                  <TableCell align="right">{s.enums}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {detail.agentMetrics && (
        <AgentMetricsTable metrics={detail.agentMetrics} />
      )}
    </Box>
  );
}

// ─── Interface Detail ───
function InterfaceDetailView({ detail }: { detail: InterfaceDetail }) {
  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <Chip
          label={`${detail.operations.length} operations`}
          size="small"
          variant="outlined"
        />
        {detail.authorizations.length > 0 && (
          <Chip
            label={`${detail.authorizations.length} auth types`}
            size="small"
            variant="outlined"
          />
        )}
        {detail.missed.length > 0 && (
          <Chip
            label={`${detail.missed.length} missed`}
            size="small"
            color="warning"
            variant="outlined"
          />
        )}
      </Box>

      {detail.operations.length > 0 && (
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Path</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Auth</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {detail.operations.map((op, i) => (
                <TableRow key={i} hover>
                  <TableCell>
                    <Chip
                      label={op.method}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.65rem",
                        bgcolor:
                          METHOD_COLORS[op.method?.toUpperCase()] || "#6b7280",
                        color: "white",
                        minWidth: 52,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "monospace",
                        fontSize: "0.75rem",
                        maxWidth: 300,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {op.path}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: "0.75rem" }}
                      title={op.description}
                    >
                      {op.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.7rem" }}
                    >
                      {op.auth}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {detail.agentMetrics && (
        <AgentMetricsTable metrics={detail.agentMetrics} />
      )}
    </Box>
  );
}

// ─── Test Detail ───
function TestDetailView({ detail }: { detail: TestDetail }) {
  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <Chip
          label={`${detail.functions.length} test functions`}
          size="small"
          variant="outlined"
        />
        <Chip
          label={detail.compiled ? "Compiled" : "Compile Failed"}
          size="small"
          color={detail.compiled ? "success" : "error"}
          variant="outlined"
        />
      </Box>

      {detail.functions.length > 0 && (
        <TableContainer sx={{ maxHeight: 300 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Path</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Function</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {detail.functions.map((f, i) => (
                <TableRow key={i} hover>
                  <TableCell>
                    <Chip
                      label={f.method}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.65rem",
                        bgcolor:
                          METHOD_COLORS[f.method?.toUpperCase()] || "#6b7280",
                        color: "white",
                        minWidth: 52,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
                    >
                      {f.path}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
                    >
                      {f.name}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {detail.agentMetrics && (
        <AgentMetricsTable metrics={detail.agentMetrics} />
      )}
    </Box>
  );
}

// ─── Realize Detail ───
function RealizeDetailView({ detail }: { detail: RealizeDetail }) {
  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <Chip
          label={`${detail.functions.length} implementations`}
          size="small"
          variant="outlined"
        />
        {detail.compileResult && (
          <Chip
            label={
              detail.compileResult.success
                ? "Compiled Successfully"
                : `${detail.compileResult.errors.length} compile errors`
            }
            size="small"
            color={detail.compileResult.success ? "success" : "error"}
            icon={
              detail.compileResult.success ? (
                <CheckCircleIcon />
              ) : (
                <CancelIcon />
              )
            }
            variant="outlined"
          />
        )}
      </Box>

      {/* Compile errors */}
      {detail.compileResult &&
        !detail.compileResult.success &&
        detail.compileResult.errors.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              color="error"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <WarningAmberIcon sx={{ fontSize: 16 }} />
              Compilation Errors
            </Typography>
            <TableContainer sx={{ maxHeight: 250 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>File</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Error</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detail.compileResult.errors.map((err, i) => (
                    <TableRow key={i} hover>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: "monospace",
                            fontSize: "0.7rem",
                            maxWidth: 200,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {err.file}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`TS${err.code}`}
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ fontSize: "0.65rem" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            maxWidth: 400,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {err.message}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

      {/* Functions */}
      {detail.functions.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Implemented Functions ({detail.functions.length})
          </Typography>
          <TableContainer sx={{ maxHeight: 300 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Path</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Function</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detail.functions.map((f, i) => (
                  <TableRow key={i} hover>
                    <TableCell>
                      <Chip
                        label={f.method}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.65rem",
                          bgcolor:
                            METHOD_COLORS[f.method?.toUpperCase()] || "#6b7280",
                          color: "white",
                          minWidth: 52,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
                      >
                        {f.path}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
                      >
                        {f.name}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {detail.agentMetrics && (
        <AgentMetricsTable metrics={detail.agentMetrics} />
      )}
    </Box>
  );
}

// ─── Evaluation Results Inline ───
function EvaluationResultsView({
  results,
}: {
  results: EvaluationResult[];
}) {
  return (
    <Box
      sx={{
        mt: 2,
        pt: 2,
        borderTop: 2,
        borderColor: "primary.main",
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{ mb: 1.5, fontWeight: 700 }}
      >
        Evaluation Results
      </Typography>
      {results.map((r) => (
        <Box
          key={r.label}
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 1,
            bgcolor: "action.hover",
          }}
        >
          {/* Score header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 1,
            }}
          >
            <Typography variant="subtitle2">{r.label}</Typography>
            <Chip
              label={`${r.phase.score}/${r.phase.maxScore}`}
              size="small"
              color={r.phase.passed ? "success" : "error"}
              sx={{ fontWeight: 700 }}
            />
            {r.phase.passed ? (
              <CheckCircleIcon
                sx={{ color: "success.main", fontSize: 16 }}
              />
            ) : (
              <CancelIcon sx={{ color: "error.main", fontSize: 16 }} />
            )}
          </Box>

          {/* Explanation - reasons */}
          {r.phase.explanation?.reasons &&
            r.phase.explanation.reasons.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
                >
                  Reasons
                </Typography>
                {r.phase.explanation.reasons.map((reason, i) => (
                  <Typography
                    key={i}
                    variant="caption"
                    sx={{
                      display: "block",
                      pl: 1,
                      mb: 0.25,
                      "&::before": { content: '"• "' },
                    }}
                  >
                    {reason}
                  </Typography>
                ))}
              </Box>
            )}

          {/* Explanation - issues */}
          {r.phase.explanation?.issueSummaries &&
            r.phase.explanation.issueSummaries.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
                >
                  Issues ({r.phase.explanation.issueSummaries.length})
                </Typography>
                <TableContainer sx={{ maxHeight: 200 }}>
                  <Table size="small">
                    <TableBody>
                      {r.phase.explanation.issueSummaries.map((issue, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ py: 0.25, px: 0.5 }}>
                            <Chip
                              label={issue.severity}
                              size="small"
                              color={
                                issue.severity === "critical"
                                  ? "error"
                                  : issue.severity === "warning"
                                    ? "warning"
                                    : "default"
                              }
                              variant="outlined"
                              sx={{ fontSize: "0.6rem" }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 0.25, px: 0.5 }}>
                            <Typography
                              variant="caption"
                              sx={{ fontFamily: "monospace" }}
                            >
                              {issue.code}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 0.25, px: 0.5 }}>
                            <Typography variant="caption">
                              {issue.message}
                            </Typography>
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ py: 0.25, px: 0.5 }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 600 }}
                            >
                              x{issue.count}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

          {/* Explanation - suggestions */}
          {r.phase.explanation?.suggestions &&
            r.phase.explanation.suggestions.length > 0 && (
              <Box>
                <Typography
                  variant="caption"
                  color="info.main"
                  sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
                >
                  Suggestions
                </Typography>
                {r.phase.explanation.suggestions.map((s, i) => (
                  <Typography
                    key={i}
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "block",
                      pl: 1,
                      mb: 0.25,
                      "&::before": { content: '"→ "' },
                    }}
                  >
                    {s}
                  </Typography>
                ))}
              </Box>
            )}
        </Box>
      ))}
    </Box>
  );
}

// ─── Main Component ───
interface PipelinePhaseDetailSectionProps {
  phaseName: PipelinePhaseName;
  phaseData: PipelinePhaseData;
  totalTokens: number;
  evaluationResults?: EvaluationResult[];
}

export function PipelinePhaseDetailSection({
  phaseName,
  phaseData,
  totalTokens,
  evaluationResults,
}: PipelinePhaseDetailSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const display = PIPELINE_PHASE_DISPLAY[phaseName];
  const color = PHASE_COLORS[phaseName];
  const tokenPct =
    totalTokens > 0 ? (phaseData.tokens / totalTokens) * 100 : 0;
  const hasExpandableContent =
    phaseData.detail ||
    (evaluationResults && evaluationResults.length > 0);

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: "divider" }}>
      {/* Header - always visible */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 2,
          cursor: hasExpandableContent ? "pointer" : "default",
          "&:hover": hasExpandableContent
            ? { bgcolor: "action.hover" }
            : undefined,
        }}
        onClick={() => hasExpandableContent && setExpanded(!expanded)}
      >
        <Box
          sx={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            bgcolor: color,
            flexShrink: 0,
          }}
        />
        <Typography variant="h6" sx={{ fontSize: "1rem", flexGrow: 1 }}>
          {display.label}
        </Typography>

        {/* Summary chips */}
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {phaseData.completed != null && (
            <Chip
              label={phaseData.completed ? "Done" : "Failed"}
              size="small"
              color={phaseData.completed ? "success" : "error"}
              variant="outlined"
              sx={{ fontSize: "0.7rem" }}
            />
          )}
          {phaseData.tokens > 0 && (
            <Chip
              label={`${formatTokens(phaseData.tokens)} (${tokenPct.toFixed(0)}%)`}
              size="small"
              variant="outlined"
              sx={{ fontSize: "0.7rem" }}
            />
          )}
          {phaseData.durationMs != null && phaseData.durationMs > 0 && (
            <Chip
              label={formatDuration(phaseData.durationMs)}
              size="small"
              variant="outlined"
              sx={{ fontSize: "0.7rem" }}
            />
          )}
        </Box>

        {/* Token bar */}
        {phaseData.tokens > 0 && (
          <Box sx={{ width: 80, flexShrink: 0 }}>
            <LinearProgress
              variant="determinate"
              value={Math.min(tokenPct, 100)}
              sx={{
                height: 4,
                borderRadius: 2,
                bgcolor: "action.hover",
                "& .MuiLinearProgress-bar": {
                  bgcolor: color,
                  borderRadius: 2,
                },
              }}
            />
          </Box>
        )}

        {hasExpandableContent && (
          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </Box>

      {/* Expandable detail */}
      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 2, pt: 0 }}>
          {phaseName === "analyze" && phaseData.detail && (
            <AnalyzeDetailView detail={phaseData.detail as AnalyzeDetail} />
          )}
          {phaseName === "database" && phaseData.detail && (
            <DatabaseDetailView detail={phaseData.detail as DatabaseDetail} />
          )}
          {phaseName === "interface" && phaseData.detail && (
            <InterfaceDetailView detail={phaseData.detail as InterfaceDetail} />
          )}
          {phaseName === "test" && phaseData.detail && (
            <TestDetailView detail={phaseData.detail as TestDetail} />
          )}
          {phaseName === "realize" && phaseData.detail && (
            <RealizeDetailView detail={phaseData.detail as RealizeDetail} />
          )}

          {/* Evaluation results for this phase */}
          {evaluationResults && evaluationResults.length > 0 && (
            <EvaluationResultsView results={evaluationResults} />
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}
