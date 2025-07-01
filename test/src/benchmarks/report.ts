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
    .reduce((acc, v) => {
      return {
        root: AutoBeTokenUsage.plus(acc.root, v.root),
        analyze: AutoBeTokenUsage.plus(acc.analyze, v.analyze),
        prisma: AutoBeTokenUsage.plus(acc.prisma, v.prisma),
        interface: AutoBeTokenUsage.plus(acc.interface, v.interface),
        test: AutoBeTokenUsage.plus(acc.test, v.test),
        realize: AutoBeTokenUsage.plus(acc.realize, v.realize),
      };
    });

  return `
Benchmark Report

- Success: ${((results.filter((v) => v.success).length / results.length) * 100).toFixed(2)}% (${results.filter((v) => v.success).length} / ${results.length})
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
    ["Total", "root"],
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
