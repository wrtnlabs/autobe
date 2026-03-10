import { AutoBeAgent } from "@autobe/agent";
import { AutoBeExampleBenchmark, AutoBeExampleLogger } from "@autobe/benchmark";
import { IAutoBeExampleBenchmarkState } from "@autobe/benchmark/src/structures/IAutoBeExampleBenchmarkState";
import { AutoBeCompiler } from "@autobe/compiler";
import {
  AutoBeExampleProject,
  IAutoBeCompilerListener,
} from "@autobe/interface";
import fs from "fs";
import { Singleton, sleep_for } from "tstl";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";

const printState = (state: IAutoBeExampleBenchmarkState): void => {
  const task = async () => {
    while (true) {
      await sleep_for(2_500);
      try {
        await fs.promises.writeFile(
          `${TestGlobal.ROOT}/benchmark.log.md`,
          AutoBeExampleLogger.markdown(state),
          "utf8",
        );
      } catch {}
      if (
        state.vendors.every((v) =>
          v.projects.every((p) => p.completed_at !== null),
        )
      )
        break;
    }
  };
  task().catch(() => {});
};

const main = async (): Promise<void> => {
  const vendors: string[] | null = TestGlobal.getArguments("vendor");
  if (vendors === null || vendors.length === 0) {
    throw new Error(
      "--vendor is required. Example: --vendor openai/gpt-4.1-mini",
    );
  }

  const compiler = new Singleton(
    (listener: IAutoBeCompilerListener) => new AutoBeCompiler(listener),
  );
  const printer = new Singleton(printState);
  await AutoBeExampleBenchmark.execute(
    {
      createAgent: async (next) =>
        new AutoBeAgent({
          vendor: TestGlobal.getVendorConfig(next.vendor),
          config: {
            locale: "en-US",
            timeout:
              TestGlobal.env.TIMEOUT && TestGlobal.env.TIMEOUT !== "NULL"
                ? Number(TestGlobal.env.TIMEOUT)
                : null,
          },
          compiler: (listener) => compiler.get(listener),
          histories: next.histories,
          tokenUsage: next.tokenUsage,
        }),
    },
    {
      /*
       * --vendor flag is required to prevent accidental
       * execution of all models (which can cost $900+).
       *
       * Available vendors:
       *   Commercial: anthropic/claude-haiku-4.5, anthropic/claude-sonnet-4.5,
       *     openai/gpt-4.1-mini, openai/gpt-4.1, openai/gpt-5.1,
       *     google/gemini-2.5-pro, x-ai/grok-code-fast-1
       *   Open: deepseek/deepseek-v3.1-terminus:exacto, meta-llama/llama-4-maverick,
       *     meta-llama/llama-4-scout, minimax/minimax-m2, mistralai/codestral-2508,
       *     moonshotai/kimi-k2-0905:exacto, qwen/qwen3-next-80b-a3b-instruct,
       *     qwen/qwen3-coder:exacto, z-ai/glm-4.6:exacto
       */
      vendors,
      projects: TestGlobal.getArguments("project")?.filter(
        typia.createIs<AutoBeExampleProject>(),
      ) ?? ["todo", "bbs", "reddit", "shopping"],
      // biome-ignore lint: intended
      phases: (TestGlobal.getArguments("phase") as any) ?? undefined,
      progress: (state) => printer.get(state),
    },
  );
};

global.process.on("uncaughtException", (error) => {
  console.log("uncaughtException", error);
});
global.process.on("unhandledRejection", (error) => {
  console.log("unhandledRejection", error);
});
main().catch(console.error);
