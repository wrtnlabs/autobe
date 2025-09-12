import { AutoBeAgent, AutoBeTokenUsage } from "@autobe/agent";
import { AutoBeState } from "@autobe/agent/src/context/AutoBeState";
import { AutoBeCompiler } from "@autobe/compiler";
import { IAutoBeCompilerListener } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import fs from "fs";
import OpenAI from "openai";
import typia from "typia";

import { TestFactory } from "../TestFactory";
import { TestGlobal } from "../TestGlobal";
import { TestProject } from "../structures/TestProject";

type Step = keyof AutoBeState;
interface ITestFunction {
  name: string;
  step: Step;
  project: TestProject;
  execute: (factory: TestFactory) => Promise<void>;
}

const PROJECT_INDEXES: Record<TestProject, number> = {
  todo: 0,
  bbs: 1,
  reddit: 2,
  shopping: 3,
};

const STEP_INDEXES: Record<Step, number> = {
  analyze: 0,
  prisma: 1,
  interface: 2,
  test: 3,
  realize: 4,
};

const collect = async (): Promise<ITestFunction[]> => {
  const container: ITestFunction[] = [];
  const iterate = async (directory: string): Promise<void> => {
    for (const file of await fs.promises.readdir(directory)) {
      const next: string = `${directory}/${file}`;
      if (
        file.startsWith("archive_") === false ||
        file.endsWith(".ts") === false
      )
        continue;
      const modulo: any = await import(next);
      for (const [key, value] of Object.entries(modulo)) {
        if (key.startsWith("archive_") === false || typeof value !== "function")
          continue;
        const step: string = key.split("archive_")?.[1] ?? "";
        if (typia.is<Step>(step) === false) continue;
        typia.misc.literals<TestProject>().forEach((project) => {
          container.push({
            name: key,
            execute: (factory: TestFactory) => value(factory, project),
            project,
            step,
          });
        });
      }
    }
  };
  await iterate(`${TestGlobal.ROOT}/src/archive/features`);
  container.sort((a, b) => {
    const x: number = PROJECT_INDEXES[a.project] * 100 + STEP_INDEXES[a.step];
    const y: number = PROJECT_INDEXES[b.project] * 100 + STEP_INDEXES[b.step];
    return x - y;
  });

  const projects: string[] =
    TestGlobal.getArguments("project") ?? typia.misc.literals<TestProject>();
  const from: string = TestGlobal.getArguments("from")?.[0] ?? "analyze";
  const to: string = TestGlobal.getArguments("to")?.[0] ?? "realize";
  return container.filter(
    (func) =>
      projects.some((v) => v.includes(func.project)) &&
      STEP_INDEXES[func.step] >= (STEP_INDEXES[from as "analyze"] ?? 0) &&
      STEP_INDEXES[func.step] <= (STEP_INDEXES[to as "realize"] ?? 4),
  );
};

const main = async (): Promise<void> => {
  //----
  // PRELIMINARIES
  //----
  // CONFIGURATION
  const vendorModel: string =
    TestGlobal.getArguments("vendor")?.[0] ??
    TestGlobal.env.VENDOR_MODEL ??
    "gpt-4.1";
  const semaphore: number = Number(
    TestGlobal.env.SEMAPHORE ??
      TestGlobal.getArguments("semaphore")?.[0] ??
      "16",
  );

  // AGENT
  const tokenUsage: AutoBeTokenUsage = new AutoBeTokenUsage();
  const factory: TestFactory = {
    getTokenUsage: () => tokenUsage,
    createAgent: (histories) =>
      new AutoBeAgent({
        model: TestGlobal.env.SCHEMA_MODEL ?? "chatgpt",
        vendor: {
          api: new OpenAI({
            apiKey: TestGlobal.env.API_KEY,
            baseURL: TestGlobal.env.BASE_URL,
          }),
          model: vendorModel,
          semaphore,
        },
        config: {
          locale: "en-US",
        },
        compiler: (listener) => new AutoBeCompiler(listener),
        histories,
        tokenUsage,
      }),
    createCompiler: (
      listener: IAutoBeCompilerListener = {
        realize: {
          test: {
            onOperation: async () => {},
            onReset: async () => {},
          },
        },
      },
    ) => new AutoBeCompiler(listener),
  };

  //----
  // LIST UP TEST FUNCTIONS TO ARCHIVE
  //----
  const testFunctions: ITestFunction[] = await collect();
  console.log(StringUtil.trim`
    -----------------------------------------------------------
      ARCHIVE PROGRAM
    -----------------------------------------------------------
    Configurations
    
    - Vendor Model: ${vendorModel}
    - Schema Model: ${TestGlobal.env.SCHEMA_MODEL ?? "chatgpt"}
    - Semaphore: ${semaphore}

    List of functions to archive
  `);
  console.log("");
  for (const tf of testFunctions) console.log(`- (${tf.project}, ${tf.step})`);
  console.log("");

  //----
  // DO ARCHIVE
  //----
  TestGlobal.archive = true;
  console.log("Start archiving...");
  console.log("");
  for (const tf of testFunctions) {
    console.log(StringUtil.trim`
      -----------------------------------------------------------
        ${tf.project}, ${tf.step}
      -----------------------------------------------------------
    `);
    const start: Date = new Date();
    try {
      await tf.execute(factory);
      console.log(
        `- Success: ${(Date.now() - start.getTime()).toLocaleString()} ms`,
      );
    } catch (error) {
      console.log("  - Error");
      throw error;
    }
  }

  console.log("Token Usage");
  console.table({
    Total: tokenUsage.aggregate.total.toLocaleString("en-US"),
    Input: tokenUsage.aggregate.input.total.toLocaleString("en-US"),
    Output: tokenUsage.aggregate.output.total.toLocaleString("en-US"),
    Facade: tokenUsage.facade.total.toLocaleString("en-US"),
    Analyze: tokenUsage.analyze.total.toLocaleString("en-US"),
    Prisma: tokenUsage.prisma.total.toLocaleString("en-US"),
    Interface: tokenUsage.interface.total.toLocaleString("en-US"),
    Test: tokenUsage.test.total.toLocaleString("en-US"),
    Realize: tokenUsage.realize.total.toLocaleString("en-US"),
  });
};

global.process.on("uncaughtException", (error) =>
  console.log("uncaughtException", error),
);
global.process.on("unhandledRejection", (error) =>
  console.log("unhandledRejection", error),
);
main().catch((error) => {
  console.log(error);
  process.exit(-1);
});
