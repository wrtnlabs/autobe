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
  const tokenUsage = results
    .map((v) => v.agent.getTokenUsage())
    .reduce((acc, v) => AutoBeTokenUsage.plus(acc, v), new AutoBeTokenUsage());

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
${(
  [
    ["Total", "facade"],
    ["Analyze", "analyze"],
    ["Prisma", "prisma"],
    ["Interface", "interface"],
    ["Test", "test"],
    ["Realize", "realize"],
  ] as const
).map(
  ([name, key]) => `  - ${name}:
    - Sum: ${tokenUsage[key].aggregate.total.toLocaleString("en-US")}
    - Input: ${tokenUsage[key].aggregate.input.total.toLocaleString("en-US")}
    - Output: ${tokenUsage[key].aggregate.output.total.toLocaleString("en-US")}
  `,
)}
`;
}
