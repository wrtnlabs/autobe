import { IAutoBePlaygroundReplay } from "@autobe/interface";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  Stack,
  Table,
  TableBody,
  Typography,
  useTheme,
} from "@mui/material";

import { AutoBePlaygroundExamplePhaseRow } from "./AutoBePlaygroundExamplePhaseRow";

const PHASES = ["analyze", "database", "interface", "test", "realize"] as const;

export function AutoBePlaygroundExampleProjectCard(
  props: AutoBePlaygroundExampleProjectCard.IProps,
) {
  const { replay } = props;
  const theme = useTheme();

  const title =
    replay.project.charAt(0).toUpperCase() + replay.project.slice(1);

  const tokenUsage = replay.aggregates.total.tokenUsage;
  const successRate = (
    (replay.aggregates.total.metric.success /
      replay.aggregates.total.metric.attempt) *
    100
  ).toFixed(2);

  const replayUrl = `/replay/get?vendor=${encodeURIComponent(replay.vendor)}&project=${encodeURIComponent(replay.project)}`;

  return (
    <Card
      variant="outlined"
      sx={{
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: theme.palette.primary.main,
          boxShadow: `0 4px 20px ${theme.palette.primary.main}15`,
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardActionArea
        component="a"
        href={replayUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <CardContent sx={{ pb: 2 }}>
          {/* Header */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            <Chip
              label={replay.vendor}
              size="small"
              variant="outlined"
              sx={{ fontSize: "0.7rem" }}
            />
          </Stack>

          {/* Phase table */}
          <Table size="small" sx={{ mb: 2 }}>
            <TableBody>
              {PHASES.map((phaseName) => (
                <AutoBePlaygroundExamplePhaseRow
                  key={phaseName}
                  phaseName={phaseName}
                  phase={replay[phaseName]}
                />
              ))}
            </TableBody>
          </Table>

          <Divider sx={{ mb: 1.5 }} />

          {/* Stats */}
          <Stack spacing={0.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                Function Calling Success Rate
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: "success.main" }}
              >
                {successRate}%
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                Elapsed Time
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: "primary.main" }}
              >
                {formatElapsed(replay.elapsed)}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                Total Tokens
              </Typography>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {formatTokens(tokenUsage.total)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "text.secondary",
                    fontSize: "0.65rem",
                  }}
                >
                  in: {formatTokens(tokenUsage.input.total)} (
                  {formatTokens(tokenUsage.input.cached)} cached) / out:{" "}
                  {formatTokens(tokenUsage.output.total)}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
export namespace AutoBePlaygroundExampleProjectCard {
  export interface IProps {
    replay: IAutoBePlaygroundReplay.ISummary;
  }
}

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatTokens(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}
