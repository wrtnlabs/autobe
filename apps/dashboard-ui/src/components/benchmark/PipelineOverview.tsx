import { Box, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import type { PipelineData, PipelinePhaseName } from "../../types/benchmark";
import { PIPELINE_PHASES, PIPELINE_PHASE_DISPLAY } from "../../types/benchmark";

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const min = Math.floor(ms / 60_000);
  const sec = Math.round((ms % 60_000) / 1000);
  return `${min}m ${sec}s`;
}

function formatTokens(tokens: number): string {
  if (tokens === 0) return "0";
  if (tokens < 1000) return `${tokens}`;
  if (tokens < 1_000_000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1_000_000).toFixed(1)}M`;
}

interface PipelineOverviewProps {
  pipeline: PipelineData;
}

function PhaseNode({
  name,
  pipeline,
}: {
  name: PipelinePhaseName;
  pipeline: PipelineData;
}) {
  const phase = pipeline.phases[name];
  const display = PIPELINE_PHASE_DISPLAY[name];
  const completed = phase.completed === true;
  const noData = phase.completed === undefined;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.5,
        minWidth: 100,
        flex: 1,
      }}
    >
      {noData ? (
        <HelpOutlineIcon sx={{ color: "text.disabled", fontSize: 28 }} />
      ) : completed ? (
        <CheckCircleIcon sx={{ color: "success.main", fontSize: 28 }} />
      ) : (
        <CancelIcon sx={{ color: "error.main", fontSize: 28 }} />
      )}
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 600, textAlign: "center" }}
      >
        {display.label}
      </Typography>
      {phase.tokens > 0 && (
        <Typography variant="caption" color="text.secondary">
          {formatTokens(phase.tokens)} tokens
        </Typography>
      )}
      {phase.durationMs != null && phase.durationMs > 0 && (
        <Typography variant="caption" color="text.disabled">
          {formatDuration(phase.durationMs)}
        </Typography>
      )}
    </Box>
  );
}

export function PipelineOverview({ pipeline }: PipelineOverviewProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        p: 2,
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        overflowX: "auto",
      }}
    >
      {PIPELINE_PHASES.map((phase, i) => (
        <Box
          key={phase}
          sx={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <PhaseNode name={phase} pipeline={pipeline} />
          {i < PIPELINE_PHASES.length - 1 && (
            <ArrowForwardIcon
              sx={{ color: "text.disabled", mx: 1, flexShrink: 0 }}
            />
          )}
        </Box>
      ))}
    </Box>
  );
}
