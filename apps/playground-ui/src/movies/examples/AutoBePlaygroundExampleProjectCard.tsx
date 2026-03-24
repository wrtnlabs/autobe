import { IAutoBePlaygroundReplay } from "@autobe/interface";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatElapsed, formatTokens } from "@/utils";

import { AutoBePlaygroundExamplePhaseRow } from "./AutoBePlaygroundExamplePhaseRow";

const PHASES = ["analyze", "database", "interface", "test", "realize"] as const;

export function AutoBePlaygroundExampleProjectCard(
  props: AutoBePlaygroundExampleProjectCard.IProps,
) {
  const { replay } = props;

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
    <a
      href={replayUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <Card className="transition-all hover:border-primary hover:-translate-y-0.5 hover:shadow-lg cursor-pointer">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">{title}</h3>
            <Badge variant="outline" className="text-xs">
              {replay.vendor}
            </Badge>
          </div>

          {/* Phase table */}
          <table className="w-full text-sm mb-4">
            <tbody>
              {PHASES.map((phaseName) => (
                <AutoBePlaygroundExamplePhaseRow
                  key={phaseName}
                  phaseName={phaseName}
                  phase={replay[phaseName]}
                />
              ))}
            </tbody>
          </table>

          <Separator className="mb-3" />

          {/* Stats */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">
                Function Calling Success Rate
              </span>
              <span className="text-xs font-bold text-success">
                {successRate}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">
                Elapsed Time
              </span>
              <span className="text-xs font-bold text-primary">
                {formatElapsed(replay.elapsed)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">
                Total Tokens
              </span>
              <div className="text-right">
                <span className="text-xs font-bold">
                  {formatTokens(tokenUsage.total)}
                </span>
                <span className="block text-[0.65rem] text-muted-foreground">
                  in: {formatTokens(tokenUsage.input.total)} (
                  {formatTokens(tokenUsage.input.cached)} cached) / out:{" "}
                  {formatTokens(tokenUsage.output.total)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
export namespace AutoBePlaygroundExampleProjectCard {
  export interface IProps {
    replay: IAutoBePlaygroundReplay.ISummary;
  }
}
