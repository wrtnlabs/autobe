import {
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

import type { PipelinePhaseData, PipelinePhaseName } from "../../types/benchmark";
import { PIPELINE_PHASE_DISPLAY } from "../../types/benchmark";

interface PipelinePhaseCardProps {
  phaseName: PipelinePhaseName;
  phaseData: PipelinePhaseData;
  totalTokens: number;
}

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

const PHASE_COLORS: Record<PipelinePhaseName, string> = {
  analyze: "#60a5fa",
  database: "#34d399",
  interface: "#fbbf24",
  test: "#f87171",
  realize: "#a78bfa",
};

export function PipelinePhaseCard({
  phaseName,
  phaseData,
  totalTokens,
}: PipelinePhaseCardProps) {
  const display = PIPELINE_PHASE_DISPLAY[phaseName];
  const tokenPct = totalTokens > 0 ? (phaseData.tokens / totalTokens) * 100 : 0;
  const color = PHASE_COLORS[phaseName];

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: "divider", height: "100%" }}>
      <CardContent>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: color,
              }}
            />
            <Typography variant="h6" sx={{ fontSize: "1rem" }}>
              {display.label}
            </Typography>
          </Box>
          {phaseData.completed != null && (
            phaseData.completed ? (
              <CheckCircleOutlineIcon sx={{ color: "success.main", fontSize: 20 }} />
            ) : (
              <ErrorOutlineIcon sx={{ color: "error.main", fontSize: 20 }} />
            )
          )}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
          {display.description}
        </Typography>

        {/* Token usage */}
        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatTokens(phaseData.tokens)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {tokenPct.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(tokenPct, 100)}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: "action.hover",
              "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 },
            }}
          />
        </Box>

        {/* Details */}
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 1 }}>
          {phaseData.inputTokens > 0 && (
            <Chip
              label={`In: ${formatTokens(phaseData.inputTokens)}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: "0.7rem" }}
            />
          )}
          {phaseData.outputTokens > 0 && (
            <Chip
              label={`Out: ${formatTokens(phaseData.outputTokens)}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: "0.7rem" }}
            />
          )}
          {phaseData.cachedTokens > 0 && (
            <Chip
              label={`Cached: ${formatTokens(phaseData.cachedTokens)}`}
              size="small"
              variant="outlined"
              color="info"
              sx={{ fontSize: "0.7rem" }}
            />
          )}
        </Box>

        {/* Duration */}
        {phaseData.durationMs != null && phaseData.durationMs > 0 && (
          <Typography variant="body2" color="text.secondary">
            Duration: {formatDuration(phaseData.durationMs)}
          </Typography>
        )}

        {/* Summary info */}
        {phaseData.summary && (
          <Box sx={{ mt: 1.5, pt: 1, borderTop: 1, borderColor: "divider" }}>
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
              {Object.entries(phaseData.summary).map(([key, value]) => (
                <Chip
                  key={key}
                  label={`${key}: ${value}`}
                  size="small"
                  variant="filled"
                  sx={{
                    fontSize: "0.7rem",
                    textTransform: "capitalize",
                    bgcolor: "action.selected",
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
