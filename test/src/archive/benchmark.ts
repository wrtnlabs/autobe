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
       * Example: --vendor openai/gpt-4.1-mini
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
