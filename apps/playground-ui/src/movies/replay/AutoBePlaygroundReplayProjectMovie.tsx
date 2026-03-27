import {
  AutoBePhase,
  IAutoBePlaygroundSession,
} from "@autobe/interface";
import { ChevronRight, Clock, Coins } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatElapsed, formatTokens } from "@/utils";

export const AutoBePlaygroundReplayProjectMovie = ({
  session,
}: AutoBePlaygroundReplayProjectMovie.IProps) => {
  const phaseColorMap: Record<string, string> = {
    analyze: "bg-info/10 text-info",
    database: "bg-purple-500/10 text-purple-500",
    interface: "bg-primary/10 text-primary",
    test: "bg-warning/10 text-warning",
    realize: "bg-success/10 text-success",
  };

  const vendorColorMap: Record<string, string> = {
    Anthropic: "bg-destructive/10 text-destructive",
    OpenAI: "bg-success/10 text-success",
    Google: "bg-info/10 text-info",
  };

  const phaseClasses = phaseColorMap[session.phase as AutoBePhase] ?? "bg-muted text-muted-foreground";
  const vendorClasses = vendorColorMap[session.vendor.name] ?? "bg-muted text-muted-foreground";

  const tokenUsage = session.token_usage.aggregate;
  const elapsed =
    session.completed_at != null
      ? new Date(session.completed_at).getTime() -
        new Date(session.created_at).getTime()
      : Date.now() - new Date(session.created_at).getTime();

  const title = session.title ?? session.model;

  return (
    <a
      href={`/replay/get?session-id=${session.id}`}
      target="_blank"
      className="block h-full"
    >
      <Card className="h-full transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/50 cursor-pointer">
        <CardContent className="h-full flex flex-col p-4 sm:p-5">
          {/* Header */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg sm:text-xl font-semibold truncate max-w-[60%]">
                {title}
              </h3>
              <div className="flex items-center gap-2">
                <Badge className={vendorClasses}>{session.vendor.name}</Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <Separator className="mt-2" />
          </div>

          {/* Model & Phase */}
          <div className="mb-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Model:</span>
              <span className="text-sm font-medium">{session.model}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Phase:</span>
              {session.phase != null ? (
                <Badge className={phaseClasses} variant="secondary">
                  {session.phase}
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Not started
                </span>
              )}
              {session.completed_at != null && (
                <Badge className="bg-success/10 text-success" variant="secondary">
                  Completed
                </Badge>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Elapsed Time</span>
              </div>
              <p className="text-base sm:text-lg font-semibold text-primary">
                {formatElapsed(elapsed)}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                <Coins className="h-4 w-4" />
                <span className="text-sm">Total Tokens</span>
              </div>
              <div className="flex items-start gap-3">
                <p className="text-base sm:text-lg font-semibold">
                  {formatTokens(tokenUsage.total)}
                </p>
                <div className="mt-0.5">
                  <p className="text-xs text-muted-foreground">
                    in: {formatTokens(tokenUsage.input.total)}
                    {tokenUsage.input.cached > 0
                      ? ` (${formatTokens(tokenUsage.input.cached)} cached)`
                      : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    out: {formatTokens(tokenUsage.output.total)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </a>
  );
};

export namespace AutoBePlaygroundReplayProjectMovie {
  export interface IProps {
    session: IAutoBePlaygroundSession.ISummary;
  }
}
