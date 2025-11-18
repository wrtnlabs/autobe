import {
  AutoBeExampleProject,
  AutoBePhase,
  IAutoBePlaygroundBenchmark,
  IAutoBePlaygroundReplay,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";

import { AutoBeExampleStorage } from "../example/AutoBeExampleStorage";

export namespace AutoBeReplayDocumentation {
  export const readme = (experiments: IAutoBePlaygroundBenchmark[]): string => {
    return StringUtil.trim`
      # AutoBe Generated Examples
  
      ## Benchmark
  
      AI Model | Success | Score | FCSR | Status 
      :--------|---------|------:|-----:|:------:
      ${experiments
        .map((e) =>
          [
            `[\`${AutoBeExampleStorage.slugModel(
              e.vendor,
              false,
            )}\`](#${AutoBeExampleStorage.slugModel(e.vendor, false)
              .replaceAll("/", "")
              .replaceAll(".", "")})`,
            e.replays.filter((r) => r.realize?.success === true).length,
            e.score.aggregate,
            (() => {
              const [x, y] = e.replays
                .map((r) => r.aggregates.total.metric)
                .map((m) => [m.success, m.attempt])
                .reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]);
              return y === 0 ? "0%" : Math.floor((x / y) * 100) + "%";
            })(),
            e.emoji,
          ].join(" | "),
        )
        .join("\n")}

      - FCSR: Function Calling Success Rate
      - Status:
        - 🟢: All projects completed successfully
        - 🟡: Some projects failed
        - ❌: All projects failed or not executed

      ${experiments.map(vendor).join("\n\n\n")}
    `;
  };

  const vendor = (exp: IAutoBePlaygroundBenchmark): string => {
    const row = (project: AutoBeExampleProject): string => {
      const found = exp.replays.find((r) => r.project === project);
      if (found === undefined)
        return `\`${project}\` | 0 | ❌ | ❌ | ❌ | ❌ | ❌`;
      const phase = (
        state: IAutoBePlaygroundReplay.IPhaseState | null,
      ): string => {
        if (state === null) return "❌";
        else if (state.success === false) return "🟡";
        else return "🟢";
      };
      return [
        `[\`${found.project}\`](./${exp.vendor}/${found.project}/)`,
        (exp.score as any)[project],
        phase(found.analyze),
        phase(found.prisma),
        phase(found.interface),
        phase(found.test),
        phase(found.realize),
      ].join(" | ");
    };
    return StringUtil.trim`
      ## \`${exp.vendor}\`
      
      Project | Score | Analyze | Prisma | Interface | Test | Realize
      :-------|------:|:-------:|:------:|:----------|:----:|:-------:
      ${row("todo")}
      ${row("bbs")}
      ${row("reddit")}
      ${row("shopping")}

      ${exp.replays
        .map((r) =>
          project({
            replay: r,
            score: (exp.score as any)[r.project],
          }),
        )
        .join("\n\n\n")}
    `;
  };

  const project = (props: {
    replay: IAutoBePlaygroundReplay.ISummary;
    score: number;
  }): string => {
    const phase = (key: AutoBePhase): string => {
      const title: string = key.charAt(0).toUpperCase() + key.slice(1);
      const state: IAutoBePlaygroundReplay.IPhaseState | null =
        props.replay[key];
      if (state === null) return [`⚪ ${title}`, "", "", "", ""].join(" | ");
      return [
        `${state.success === true ? "🟢" : "🔴"} ${title}`,
        Object.entries(state.commodity)
          .map(([key, value]) => `\`${key}\`: ${value}`)
          .join(", "),
        formatTokens(state.aggregates.total.tokenUsage.total),
        formatElapsedTime(state.elapsed),
        Math.floor(
          (state.aggregates.total.metric.success /
            state.aggregates.total.metric.attempt) *
            100,
        ) + "%",
      ].join(" | ");
    };
    return StringUtil.trim`
      ### \`${props.replay.vendor}\` - \`${props.replay.project}\`

      - Source Code: ${`[\`${AutoBeExampleStorage.slugModel(
        props.replay.vendor,
        false,
      )}/${props.replay.project}\`](./${AutoBeExampleStorage.slugModel(
        props.replay.vendor,
        false,
      )}/${props.replay.project}/)`}
      - Score: ${props.score}
      - Elapsed Time: ${formatElapsedTime(props.replay.elapsed)}
      - Token Usage: ${formatTokens(
        props.replay.aggregates.total.tokenUsage.total,
      )}
      - Function Calling Success Rate: ${(
        (props.replay.aggregates.total.metric.success /
          props.replay.aggregates.total.metric.attempt) *
        100
      ).toFixed(2)}%

      Phase | Generated | Token Usage | Elapsed Time | FCSR
      :-----|:----------|------------:|-------------:|------:
      ${(["analyze", "prisma", "interface", "test", "realize"] as const)
        .map((key) => phase(key))
        .join("\n")}
    `;
  };
}

function formatElapsedTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const s = seconds % 60;
  const m = minutes % 60;
  const h = hours;

  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  } else if (m > 0) {
    return `${m}m ${s}s`;
  } else {
    return `${s}s`;
  }
}

function formatTokens(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
