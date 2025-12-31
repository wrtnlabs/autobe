import { AutoBeAgent } from "@autobe/agent";
import { AutoBeExampleBenchmark } from "@autobe/benchmark";
import { AutoBeCompiler } from "@autobe/compiler";
import { AutoBePhase } from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";
import { ArchiveLogger } from "./utils/ArchiveLogger";

const PHASES: AutoBePhase[] = [
  "analyze",
  "database",
  "interface",
  "test",
  "realize",
];

const main = async (): Promise<void> => {
  //----
  // PRELIMINARIES
  //----
  // ARGUMENTS
  const vendor: string | null = TestGlobal.getArguments("vendor")?.[0] ?? null;
  const project: string | null =
    TestGlobal.getArguments("project")?.[0] ?? null;

  if (vendor === null) throw new Error("Vendor argument is required.");
  if (project === null) throw new Error("Project argument is required.");
  typia.assertGuard<AutoBeExampleProject>(project);

  const phases: AutoBePhase[] = (() => {
    const from: string | null = TestGlobal.getArguments("from")?.[0] ?? null;
    const to: string | null = TestGlobal.getArguments("to")?.[0] ?? null;
    if (from === null && to === null) return PHASES;
    const fromIndex: number = from ? PHASES.indexOf(from as AutoBePhase) : 0;
    if (fromIndex === -1) throw new Error(`Invalid from phase (from): ${from}`);
    const toIndex: number = to
      ? PHASES.indexOf(to as AutoBePhase)
      : PHASES.length - 1;
    if (toIndex === -1) throw new Error(`Invalid to phase (to): ${to}`);
    return PHASES.slice(fromIndex, toIndex + 1);
  })();

  // CONFIGURATION
  const semaphore: number = Number(
    TestGlobal.env.SEMAPHORE ??
      TestGlobal.getArguments("semaphore")?.[0] ??
      "16",
  );

  //----
  // DO ARCHIVE
  //----
  console.log(StringUtil.trim`
    -----------------------------------------------------------
      ARCHIVE PROGRAM
    -----------------------------------------------------------
    Configurations
    
    - Vendor Model: ${TestGlobal.vendorModel}
    - Semaphore: ${semaphore}

    List of functions to archive
  `);
  console.log("");
  console.log("Start archiving...");
  console.log("");

  const start: Date = new Date();
  try {
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
            compiler: (listener) => new AutoBeCompiler(listener),
            histories: next.histories,
            tokenUsage: next.tokenUsage,
          }),
      },
      {
        vendors: [vendor],
        projects: [project],
        phases,
        progress: () => {},
        on: (event) => ArchiveLogger.event(start, event),
      },
    );
    console.log("completed");
  } catch (error) {
    console.log(error);
  }
};

function setupExitHandlers() {
  const logExit = (reason: string, details: any = {}) => {
    const timestamp = new Date().toISOString();
    const stackTrace = new Error().stack;

    console.log("\n=== 프로그램 종료 감지 ===");
    console.log("시간:", timestamp);
    console.log("원인:", reason);
    console.log("상세 정보:", JSON.stringify(details, null, 2));
    console.log("스택 트레이스:", stackTrace);
    console.log("========================\n");
  };

  process.on("exit", (code) => {
    logExit("exit", { exitCode: code });
  });

  process.on("SIGINT", () => {
    logExit("SIGINT", { signal: "SIGINT (Ctrl+C)" });
    process.exit(130);
  });

  process.on("SIGTERM", () => {
    logExit("SIGTERM", { signal: "SIGTERM (kill)" });
    process.exit(143);
  });

  process.on("uncaughtException", (error) => {
    logExit("uncaughtException", {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    logExit("unhandledRejection", { reason });
    process.exit(1);
  });
}
setupExitHandlers();

main().catch((error) => {
  console.log("---------------------------------------------");
  console.log("                FATAL ERROR                  ");
  console.log("---------------------------------------------");
  console.log(error);
  console.log("---------------------------------------------");
  process.exit(-1);
});
