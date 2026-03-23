import { IAutoBePlaygroundReplay } from "@autobe/interface";
import {
  Box,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";

const PHASES = ["analyze", "database", "interface", "test", "realize"] as const;
type PhaseName = (typeof PHASES)[number];

export function AutoBePlaygroundExamplePhaseRow(
  props: AutoBePlaygroundExamplePhaseRow.IProps,
) {
  const { phaseName, phase } = props;
  const theme = useTheme();
  const label = phaseName.charAt(0).toUpperCase() + phaseName.slice(1);

  if (!phase) {
    return (
      <TableRow>
        <TableCell sx={{ py: 0.75, pr: 1, width: 16, borderBottom: "1px solid", borderColor: "divider" }}>
          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "grey.600" }} />
        </TableCell>
        <TableCell sx={{ py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="body2" sx={{ color: "text.disabled", fontSize: "0.8rem" }}>
            {label}
          </Typography>
        </TableCell>
        <TableCell sx={{ py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="body2" sx={{ color: "text.disabled", fontSize: "0.8rem" }}>
            -
          </Typography>
        </TableCell>
        <TableCell align="right" sx={{ py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="body2" sx={{ color: "text.disabled", fontSize: "0.8rem" }}>
            -
          </Typography>
        </TableCell>
      </TableRow>
    );
  }

  const detail = phase.commodity
    ? Object.entries(phase.commodity)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ")
    : "-";

  const statusColor = phase.success
    ? theme.palette.success.main
    : Object.keys(phase.commodity).length !== 0
      ? theme.palette.warning.main
      : theme.palette.error.main;

  const textColor = phase.success
    ? "text.primary"
    : Object.keys(phase.commodity).length !== 0
      ? "warning.main"
      : "error.main";

  const successRate =
    phase.aggregates?.total?.metric?.attempt > 0
      ? (
          (phase.aggregates.total.metric.success /
            phase.aggregates.total.metric.attempt) *
          100
        ).toFixed(1)
      : "0.0";

  const tooltipContent = phase.aggregates?.total ? (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>
        {label} Phase
      </Typography>
      <Typography variant="caption" sx={{ display: "block" }}>
        Tokens: {formatTokens(phase.aggregates.total.tokenUsage.total)}
      </Typography>
      <Typography variant="caption" sx={{ color: "grey.400", display: "block", ml: 1, fontSize: "0.65rem" }}>
        in: {formatTokens(phase.aggregates.total.tokenUsage.input.total)} / out:{" "}
        {formatTokens(phase.aggregates.total.tokenUsage.output.total)}
      </Typography>
      <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
        Function Calls: {phase.aggregates.total.metric.success} /{" "}
        {phase.aggregates.total.metric.attempt}{" "}
        <span style={{ color: theme.palette.success.main }}>({successRate}%)</span>
      </Typography>
    </Box>
  ) : "";

  return (
    <Tooltip title={tooltipContent} placement="right" arrow>
      <TableRow sx={{ "&:hover": { bgcolor: "action.hover" }, cursor: "pointer" }}>
        <TableCell sx={{ py: 0.75, pr: 1, width: 16, borderBottom: "1px solid", borderColor: "divider" }}>
          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: statusColor }} />
        </TableCell>
        <TableCell sx={{ py: 0.75, width: 80, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="body2" sx={{ color: textColor, fontSize: "0.8rem" }}>
            {label}
          </Typography>
        </TableCell>
        <TableCell sx={{ py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
            {detail}
          </Typography>
        </TableCell>
        <TableCell align="right" sx={{ py: 0.75, width: 70, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
            {phase.elapsed ? formatElapsed(phase.elapsed) : "-"}
          </Typography>
        </TableCell>
      </TableRow>
    </Tooltip>
  );
}
export namespace AutoBePlaygroundExamplePhaseRow {
  export interface IProps {
    phaseName: PhaseName;
    phase: IAutoBePlaygroundReplay.IPhaseState | null;
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
