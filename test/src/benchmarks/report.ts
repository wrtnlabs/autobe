import { AutoBeAgent, AutoBeTokenUsage } from "@autobe/agent";

import { AutobeBenchmarkContext } from "./autobe.context";
import { formatDurationSecondsFromMs } from "./utils/time-utils";

export function generateReport(
  results: {
    success: boolean;
    context: AutobeBenchmarkContext;
    agent: AutoBeAgent<"chatgpt">;
  }[],
  startTime: number,
) {
  const tokenUsage = results.reduce((acc, v) => {
    return AutoBeTokenUsage.plus(acc, v.agent.getTokenUsage());
  }, new AutoBeTokenUsage());

  const successList = results.filter((v) => v.success);
  return `
Benchmark Report

- Success: ${((successList.length / results.length) * 100).toFixed(2)}% (${successList.length} / ${results.length})
- Total time: ${formatDurationSecondsFromMs(Date.now() - startTime)}
- Avg time per run: ${formatDurationSecondsFromMs(
    results
      .map((v) =>
        v.success && v.context.stages.interface.endTime !== undefined
          ? v.context.stages.interface.endTime -
            v.context.stages.analyze.startTime
          : 0,
      )
      .reduce((acc, v) => acc + v, 0) /
      results.filter((v) => v.context.stages.interface.endTime !== undefined)
        .length,
  )}
- Avg time per part
${(["analyze", "prisma", "interface"] as const)
  .map(
    (part) =>
      `  - ${part}: ${formatDurationSecondsFromMs(
        results
          .map((v) =>
            v.success && v.context.stages[part].endTime !== undefined
              ? v.context.stages[part].endTime -
                v.context.stages[part].startTime
              : 0,
          )
          .reduce((acc, v) => acc + v, 0) /
          results.filter(
            (v) => v.success && v.context.stages[part].endTime !== undefined,
          ).length,
      )}`,
  )
  .join("\n")}
- Total Token Usage
  - Aggregate: ${tokenUsage.aggregate.total.toLocaleString("en-US")}
  - Call: ${tokenUsage.call.total.toLocaleString("en-US")}
  - Describe: ${tokenUsage.describe.total.toLocaleString("en-US")}
`;
}
