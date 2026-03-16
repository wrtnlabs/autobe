import {
  Box,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import AutorenewIcon from "@mui/icons-material/Autorenew";

import type { PhaseStatus } from "../../types/monitoring";

interface PipelineProgressProps {
  phaseStatuses: PhaseStatus[];
}

const PHASE_LABELS: Record<string, string> = {
  analyze: "Analyze",
  database: "Database",
  interface: "Interface",
  test: "Test",
  realize: "Realize",
};

function formatElapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const min = Math.floor(ms / 60_000);
  const sec = Math.round((ms % 60_000) / 1000);
  return `${min}m ${sec}s`;
}

function PhaseCard({ phase }: { phase: PhaseStatus }) {
  const isActive = phase.status === "active";
  const isCompleted = phase.status === "completed";

  return (
    <Card
      elevation={0}
      sx={{
        border: 1,
        borderColor: isActive
          ? "primary.main"
          : isCompleted
            ? "success.main"
            : "divider",
        opacity: phase.status === "pending" ? 0.5 : 1,
        transition: "all 0.3s",
      }}
    >
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {isCompleted ? (
              <CheckCircleIcon
                fontSize="small"
                sx={{ color: "success.main" }}
              />
            ) : isActive ? (
              <AutorenewIcon
                fontSize="small"
                sx={{
                  color: "primary.main",
                  animation: "spin 1.5s linear infinite",
                  "@keyframes spin": {
                    from: { transform: "rotate(0deg)" },
                    to: { transform: "rotate(360deg)" },
                  },
                }}
              />
            ) : (
              <RadioButtonUncheckedIcon
                fontSize="small"
                sx={{ color: "text.disabled" }}
              />
            )}
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {PHASE_LABELS[phase.phase]}
            </Typography>
          </Box>
          {phase.elapsed !== undefined && (
            <Typography variant="caption" color="text.secondary">
              {formatElapsed(phase.elapsed)}
            </Typography>
          )}
        </Box>
        {isActive && (
          <LinearProgress
            sx={{ mt: 1, borderRadius: 2, height: 4 }}
          />
        )}
      </CardContent>
    </Card>
  );
}

export function PipelineProgress({ phaseStatuses }: PipelineProgressProps) {
  const completed = phaseStatuses.filter((p) => p.status === "completed").length;
  const total = phaseStatuses.length;
  const progressPercent = (completed / total) * 100;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.5,
        }}
      >
        <Typography variant="h6">Pipeline Progress</Typography>
        <Typography variant="body2" color="text.secondary">
          {completed}/{total} phases
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progressPercent}
        sx={{
          height: 8,
          borderRadius: 4,
          mb: 2,
          bgcolor: "action.hover",
          "& .MuiLinearProgress-bar": { borderRadius: 4 },
        }}
      />
      <Grid container spacing={1.5}>
        {phaseStatuses.map((phase) => (
          <Grid key={phase.phase} size={{ xs: 12, sm: 6, md: 2.4 }}>
            <PhaseCard phase={phase} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
