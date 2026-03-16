import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useNavigate } from "react-router-dom";

import { useLangfuseTrace } from "../../hooks/useLangfuseTrace";
import type { LangfuseObservation } from "../../types/langfuse";
import { loadLangfuseConfig } from "../../types/langfuse";

interface LangfuseTracePanelProps {
  model: string;
  project: string;
}

function formatCost(cost: number): string {
  if (cost === 0) return "$0";
  if (cost < 0.001) return `$${cost.toFixed(6)}`;
  if (cost < 1) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

function formatLatency(seconds: number): string {
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}m ${sec}s`;
}

function formatTokens(n: number | undefined): string {
  if (!n) return "-";
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}K`;
  return `${(n / 1_000_000).toFixed(2)}M`;
}

const TYPE_COLORS: Record<string, string> = {
  GENERATION: "#3b82f6",
  SPAN: "#a855f7",
  EVENT: "#6b7280",
};

function ObservationRow({ obs }: { obs: LangfuseObservation }) {
  const [expanded, setExpanded] = useState(false);
  const isGeneration = obs.type === "GENERATION";
  const inputTokens = obs.usageDetails?.input ?? obs.usageDetails?.inputTokens;
  const outputTokens =
    obs.usageDetails?.output ?? obs.usageDetails?.outputTokens;
  const totalCost = obs.costDetails?.total;

  return (
    <>
      <TableRow
        hover
        sx={{ cursor: isGeneration ? "pointer" : "default" }}
        onClick={() => isGeneration && setExpanded(!expanded)}
      >
        <TableCell sx={{ py: 0.75 }}>
          <Chip
            label={obs.type}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: "0.6rem",
              bgcolor: TYPE_COLORS[obs.type] ?? "#6b7280",
              color: "white",
              minWidth: 80,
            }}
          />
        </TableCell>
        <TableCell sx={{ py: 0.75 }}>
          <Typography
            variant="body2"
            sx={{
              fontFamily: "monospace",
              fontSize: "0.75rem",
              maxWidth: 200,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {obs.name ?? "-"}
          </Typography>
        </TableCell>
        <TableCell sx={{ py: 0.75 }}>
          <Typography variant="caption" color="text.secondary">
            {obs.model ?? "-"}
          </Typography>
        </TableCell>
        <TableCell align="right" sx={{ py: 0.75 }}>
          {obs.latency != null ? formatLatency(obs.latency) : "-"}
        </TableCell>
        <TableCell align="right" sx={{ py: 0.75 }}>
          {formatTokens(inputTokens)}
        </TableCell>
        <TableCell align="right" sx={{ py: 0.75 }}>
          {formatTokens(outputTokens)}
        </TableCell>
        <TableCell align="right" sx={{ py: 0.75 }}>
          {totalCost != null ? formatCost(totalCost) : "-"}
        </TableCell>
        <TableCell sx={{ py: 0.75, width: 36 }}>
          {isGeneration && (
            <IconButton size="small">
              {expanded ? (
                <ExpandLessIcon fontSize="small" />
              ) : (
                <ExpandMoreIcon fontSize="small" />
              )}
            </IconButton>
          )}
        </TableCell>
      </TableRow>

      {/* Expandable prompt/response */}
      {isGeneration && (
        <TableRow>
          <TableCell colSpan={8} sx={{ py: 0, px: 0 }}>
            <Collapse in={expanded}>
              <Box sx={{ p: 2, bgcolor: "action.hover" }}>
                {obs.input != null && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 700, display: "block", mb: 0.5 }}
                    >
                      Input
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1,
                        maxHeight: 200,
                        overflow: "auto",
                        bgcolor: "background.paper",
                      }}
                    >
                      <Typography
                        variant="caption"
                        component="pre"
                        sx={{
                          fontFamily: "monospace",
                          fontSize: "0.7rem",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          m: 0,
                        }}
                      >
                        {typeof obs.input === "string"
                          ? obs.input
                          : JSON.stringify(obs.input, null, 2)}
                      </Typography>
                    </Paper>
                  </Box>
                )}
                {obs.output != null && (
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 700, display: "block", mb: 0.5 }}
                    >
                      Output
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1,
                        maxHeight: 200,
                        overflow: "auto",
                        bgcolor: "background.paper",
                      }}
                    >
                      <Typography
                        variant="caption"
                        component="pre"
                        sx={{
                          fontFamily: "monospace",
                          fontSize: "0.7rem",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          m: 0,
                        }}
                      >
                        {typeof obs.output === "string"
                          ? obs.output
                          : JSON.stringify(obs.output, null, 2)}
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function LangfuseTracePanel({
  model,
  project,
}: LangfuseTracePanelProps) {
  const { trace, observations, loading, error, configured, reload } =
    useLangfuseTrace(model, project);
  const navigate = useNavigate();
  const config = loadLangfuseConfig();

  if (!configured) {
    return (
      <Alert
        severity="info"
        sx={{ mb: 3 }}
        action={
          <Button size="small" onClick={() => navigate("/settings")}>
            Settings
          </Button>
        }
      >
        Langfuse not configured. Set up your Langfuse connection in Settings to
        view LLM call details.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 3,
          p: 2,
        }}
      >
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          Loading Langfuse trace...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        Langfuse error: {error}
      </Alert>
    );
  }

  if (!trace) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        No Langfuse trace found for estimate/{model}/{project}
      </Alert>
    );
  }

  // Sort: SPANs first, then GENERATIONs, by startTime
  const sorted = [...observations].sort((a, b) => {
    if (a.type !== b.type) {
      if (a.type === "SPAN") return -1;
      if (b.type === "SPAN") return 1;
    }
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

  const generations = observations.filter((o) => o.type === "GENERATION");
  const totalInputTokens = generations.reduce(
    (s, o) =>
      s + (o.usageDetails?.input ?? o.usageDetails?.inputTokens ?? 0),
    0,
  );
  const totalOutputTokens = generations.reduce(
    (s, o) =>
      s + (o.usageDetails?.output ?? o.usageDetails?.outputTokens ?? 0),
    0,
  );

  const langfuseUrl = config
    ? `${config.host}${trace.htmlPath}`
    : trace.htmlPath;

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: "divider", mb: 3 }}>
      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6" sx={{ fontSize: "1rem" }}>
              Langfuse Trace
            </Typography>
            <Link
              href={langfuseUrl}
              target="_blank"
              rel="noopener"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <OpenInNewIcon sx={{ fontSize: 16 }} />
            </Link>
          </Box>
          <IconButton size="small" onClick={reload} title="Reload">
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Summary chips */}
        <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
          <Chip
            label={formatCost(trace.totalCost)}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
          <Chip
            label={`Latency: ${formatLatency(trace.latency)}`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`${observations.length} observations`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`${generations.length} LLM calls`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`In: ${formatTokens(totalInputTokens)}`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`Out: ${formatTokens(totalOutputTokens)}`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={new Date(trace.timestamp).toLocaleString()}
            size="small"
            variant="outlined"
            sx={{ fontSize: "0.7rem" }}
          />
        </Box>

        {/* Observations table */}
        {sorted.length > 0 && (
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Model</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Latency
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Input
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Output
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Cost
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {sorted.map((obs) => (
                  <ObservationRow key={obs.id} obs={obs} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Paper>
  );
}
