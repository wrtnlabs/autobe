import { IAutoBeTokenUsageJson } from "@autobe/interface";
import { AutoBeListenerState, useAutoBeAgent } from "@autobe/ui";
import {
  CheckCircle2,
  Circle,
  Clock,
  Coins,
  Database,
  FlaskConical,
  Globe,
  Hammer,
  Package,
  ScrollText,
} from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/utils";

const PROGRESS_STEPS = [
  {
    name: "analyze" as const,
    title: "Analysis",
    icon: ScrollText,
    getResults: (state: AutoBeListenerState) => {
      if (!state.analyze) return null;
      const fileCount = Object.keys(state.analyze.files).length;
      const roleCount = state.analyze.actors.length;
      return `${fileCount} files, ${roleCount} actors`;
    },
  },
  {
    name: "database" as const,
    title: "Database",
    icon: Database,
    getResults: (state: AutoBeListenerState) => {
      if (!state.database) return null;
      const schemaCount = Object.keys(state.database.schemas).length;
      return `${schemaCount} schemas`;
    },
  },
  {
    name: "interface" as const,
    title: "Interface",
    icon: Globe,
    getResults: (state: AutoBeListenerState) => {
      if (!state.interface) return null;
      const operationCount = state.interface.document.operations.length;
      return `${operationCount} endpoints`;
    },
  },
  {
    name: "test" as const,
    title: "Test",
    icon: FlaskConical,
    getResults: (state: AutoBeListenerState) => {
      if (!state.test) return null;
      const testCount = state.test.functions.filter(
        (f) => f.type === "operation",
      ).length;
      return `${testCount} tests`;
    },
  },
  {
    name: "realize" as const,
    title: "Realize",
    icon: Hammer,
    getResults: (state: AutoBeListenerState) => {
      if (!state.realize) return null;
      const functionCount = state.realize.functions.length;
      return `${functionCount} functions`;
    },
  },
];

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  if (m < 60) return `${m}m ${rs}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function formatTokenCount(value: number): string {
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
  if (value >= 1_000) return (value / 1_000).toFixed(1) + "K";
  return value.toString();
}

function TokenRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">
        {label}
        {sub && (
          <span className="text-[0.65rem] text-muted-foreground/60 ml-1">
            {sub}
          </span>
        )}
      </span>
      <span className="font-semibold tabular-nums">
        {formatTokenCount(value)}
      </span>
    </div>
  );
}

function CacheRateBar({ cached, total }: { cached: number; total: number }) {
  const rate = total > 0 ? (cached / total) * 100 : 0;
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Cache</span>
        <span className="font-semibold tabular-nums">{rate.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
    </div>
  );
}

function ComponentCard({
  name,
  component,
}: {
  name: string;
  component: IAutoBeTokenUsageJson.IComponent;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-2.5 space-y-1.5">
      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {name}
      </p>
      <TokenRow label="Total" value={component.total} />
      <TokenRow label="Input" value={component.input.total} />
      <TokenRow label="Output" value={component.output.total} />
      <CacheRateBar cached={component.input.cached} total={component.input.total} />
    </div>
  );
}

export function StatusPanel() {
  const { state, tokenUsage, connectionStatus } = useAutoBeAgent();

  if (connectionStatus !== "connected") return null;

  return (
    <aside className="w-72 shrink-0 border-l bg-background overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Progress */}
        <section className="space-y-2.5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Progress
          </p>
          <div className="space-y-1.5">
            {PROGRESS_STEPS.map((step) => {
              const phaseName = step.name as "analyze" | "database" | "interface" | "test" | "realize";
              const event = state?.[phaseName] ?? null;
              const completed = event !== null;
              const results = state ? step.getResults(state) : null;
              const elapsed = completed ? event.elapsed : null;
              const tokens = tokenUsage?.[phaseName];
              const Icon = step.icon;
              return (
                <div
                  key={step.name}
                  className={cn(
                    "flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    completed
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "bg-muted/40 text-muted-foreground",
                  )}
                >
                  {completed ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 mt-0.5 shrink-0 opacity-40" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      <span className="font-medium text-xs">{step.title}</span>
                    </div>
                    {results && (
                      <p className="flex items-center gap-0.5 text-[0.6rem] mt-0.5 opacity-65">
                        <Package className="h-2.5 w-2.5" />
                        {results}
                      </p>
                    )}
                    {completed && elapsed != null && (
                      <p className="flex items-center gap-0.5 text-[0.6rem] mt-0.5 opacity-65">
                        <Clock className="h-2.5 w-2.5" />
                        {formatElapsed(elapsed)}
                      </p>
                    )}
                    {completed && tokens && tokens.total > 0 && (
                      <p className="flex items-center gap-0.5 text-[0.6rem] mt-0.5 opacity-65">
                        <Coins className="h-2.5 w-2.5" />
                        {formatTokenCount(tokens.total)}
                      </p>
                    )}
                  </div>
                  {completed && (
                    <span className="text-[0.6rem] font-medium bg-emerald-500/15 px-1.5 py-0.5 rounded-full shrink-0">
                      Done
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Token Usage */}
        {tokenUsage && (
          <>
            <Separator />
            <section className="space-y-2.5">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Token Usage
              </p>
              <ComponentCard name="Total" component={tokenUsage.aggregate} />
            </section>
          </>
        )}
      </div>
    </aside>
  );
}
