import { IAutoBePlaygroundReplay } from "@autobe/interface";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, formatElapsed, formatTokens } from "@/utils";

const PHASES = ["analyze", "database", "interface", "test", "realize"] as const;
type PhaseName = (typeof PHASES)[number];

export function AutoBePlaygroundExamplePhaseRow(
  props: AutoBePlaygroundExamplePhaseRow.IProps,
) {
  const { phaseName, phase } = props;
  const label = phaseName.charAt(0).toUpperCase() + phaseName.slice(1);

  if (!phase) {
    return (
      <tr className="border-b border-border">
        <td className="py-2 pr-1 w-4">
          <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
        </td>
        <td className="py-2">
          <span className="text-sm text-muted-foreground">{label}</span>
        </td>
        <td className="py-2">
          <span className="text-sm text-muted-foreground">-</span>
        </td>
        <td className="py-2 text-right">
          <span className="text-sm text-muted-foreground">-</span>
        </td>
      </tr>
    );
  }

  const detail = phase.commodity
    ? Object.entries(phase.commodity)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ")
    : "-";

  const statusColor = phase.success
    ? "bg-success"
    : Object.keys(phase.commodity).length !== 0
      ? "bg-warning"
      : "bg-destructive";

  const textColor = phase.success
    ? "text-foreground"
    : Object.keys(phase.commodity).length !== 0
      ? "text-warning"
      : "text-destructive";

  const successRate =
    phase.aggregates?.total?.metric?.attempt > 0
      ? (
          (phase.aggregates.total.metric.success /
            phase.aggregates.total.metric.attempt) *
          100
        ).toFixed(1)
      : "0.0";

  const tooltipContent = phase.aggregates?.total ? (
    <div className="p-1 space-y-1">
      <p className="font-semibold text-xs">{label} Phase</p>
      <p className="text-xs">
        Tokens: {formatTokens(phase.aggregates.total.tokenUsage.total)}
      </p>
      <p className="text-xs text-muted-foreground ml-2">
        in: {formatTokens(phase.aggregates.total.tokenUsage.input.total)} / out:{" "}
        {formatTokens(phase.aggregates.total.tokenUsage.output.total)}
      </p>
      <p className="text-xs mt-1">
        Function Calls: {phase.aggregates.total.metric.success} /{" "}
        {phase.aggregates.total.metric.attempt}{" "}
        <span className="text-success">({successRate}%)</span>
      </p>
    </div>
  ) : null;

  const row = (
    <tr className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors">
      <td className="py-2 pr-1 w-4">
        <div className={cn("h-2.5 w-2.5 rounded-full", statusColor)} />
      </td>
      <td className="py-2 w-20">
        <span className={cn("text-sm", textColor)}>{label}</span>
      </td>
      <td className="py-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {detail}
        </span>
      </td>
      <td className="py-2 text-right w-[70px]">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {phase.elapsed ? formatElapsed(phase.elapsed) : "-"}
        </span>
      </td>
    </tr>
  );

  if (!tooltipContent) return row;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{row}</TooltipTrigger>
        <TooltipContent side="right">{tooltipContent}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
export namespace AutoBePlaygroundExamplePhaseRow {
  export interface IProps {
    phaseName: PhaseName;
    phase: IAutoBePlaygroundReplay.IPhaseState | null;
  }
}
