import {
  AutoBePhase,
  IAutoBePlaygroundBenchmark,
  IAutoBePlaygroundReplay,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";

import { TestHistory } from "../../internal/TestHistory";
import { TestProject } from "../../structures/TestProject";

export namespace AutoBePlaygroundReplayDocumentation {
  export const readme = (experiments: IAutoBePlaygroundBenchmark[]): string => {
    return StringUtil.trim`
        # AutoBe Generated Examples
    
        ## Benchmark
    
        AI Model | Score | Status 
        :--------|------:|:------:
        ${experiments
          .map((e) =>
            [
              `[\`${TestHistory.slugModel(
                e.vendor,
                false,
              )}\`](#${TestHistory.slugModel(e.vendor, true)})`,
              e.score.aggregate,
              e.emoji,
            ].join(" | "),
          )
          .join("\n")}

        ${experiments.map(vendor).join("\n\n\n")}
      `;
  };

  const vendor = (exp: IAutoBePlaygroundBenchmark): string => {
    const row = (project: TestProject): string => {
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

      ![](https://autobe.dev/images/demonstrate/replay-${TestHistory.slugModel(
        exp.vendor,
        true,
      )}.png)

      ${exp.replays.map((r) =>
        project({
          replay: r,
          score: (exp.score as any)[r.project],
        }),
      )}
    `;
  };

  const project = (props: {
    replay: IAutoBePlaygroundReplay.ISummary;
    score: number;
  }): string => {
    const phase = (key: AutoBePhase): string => {
      const title: string = key.charAt(0).toUpperCase() + key.slice(1);
      if (props.replay[key] === null)
        return [`⚪ ${title}`, "", "", "", ""].join(" | ");
      return [
        `${props.replay[key].success === true ? "🟢" : "🔴"} title`,
        Object.entries(props.replay[key].commodity)
          .map(([key, value]) => `\`${key}\`: ${value}`)
          .join(", "),
        props.replay[key].aggregates.total.tokenUsage.total,
        formatElapsedTime(props.replay[key].elapsed),
      ].join(" | ");
    };
    const records: string[] = Object.entries(props.replay.aggregates)
      .filter(([a]) => a !== "all")
      .map(([k, { metric }]) =>
        [
          k,
          metric.attempt,
          metric.success,
          metric.consent,
          metric.validationFailure,
          metric.invalidJson,
        ].join(" | "),
      );
    return StringUtil.trim`
      ### \`${props.replay.vendor} - ${props.replay.project}\`

      - Github Repository: ${`[\`${props.replay}.project}\`](./${props.replay.vendor}/${props.replay.project}/)`}
      - Score: ${props.score}

      #### Phase Performance

      Phase | Generated | Token Consumption | Elapsed Time
      :-----|:----------|:------------------:|:-----------:
      ${(["analyze", "prisma", "interface", "test", "realize"] as const)
        .map((key) => phase(key))
        .join("\n")}
      
      #### Function Calling Performance

      Event | Attempt | Success | Consent | Validation Failure | Invalid JSON
      :-----|--------:|:-------:|:-------:|:------------------:|:-------------:
      ${records.join("\n")}
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
