import { AutoBeAgent } from "@autobe/agent";
import { AutoBeContext } from "@autobe/agent/src/context/AutoBeContext";
import { compileRealizeFiles } from "@autobe/agent/src/orchestrate/realize/internal/compileRealizeFiles";
import { orchestrateRealizeCorrectCasting } from "@autobe/agent/src/orchestrate/realize/orchestRateRealizeCorrectCasting";
import { IAutoBeRealizeScenarioResult } from "@autobe/agent/src/orchestrate/realize/structures/IAutoBeRealizeScenarioResult";
import { generateRealizeScenario } from "@autobe/agent/src/orchestrate/realize/utils/generateRealizeScenario";
import { AutoBeCompiler } from "@autobe/compiler";
import {
  AutoBeEventOfSerializable,
  AutoBeHistory,
  AutoBeOpenApi,
  AutoBeRealizeFunction,
  AutoBeRealizeHistory,
} from "@autobe/interface";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";
import { TestHistory } from "../internal/TestHistory";
import { TestLogger } from "../internal/TestLogger";
import { TestProject } from "../structures/TestProject";

const correct = async (props: {
  vendor: string;
  project: TestProject;
}): Promise<void> => {
  TestGlobal.vendorModel = props.vendor;

  const histories: AutoBeHistory[] = await TestHistory.getHistories(
    props.project,
    "realize",
  );
  const agent: AutoBeAgent<"chatgpt"> = new AutoBeAgent({
    model: "chatgpt",
    vendor: TestGlobal.getVendorConfig(),
    config: {
      locale: "en-US",
      timeout: null,
    },
    compiler: (listener) => new AutoBeCompiler(listener),
    histories,
  });
  const start: Date = new Date();
  for (const type of typia.misc.literals<AutoBeEventOfSerializable.Type>())
    agent.on(type, (e) => TestLogger.event(start, e));

  const ctx: AutoBeContext<"chatgpt"> = agent.getContext();
  const document: AutoBeOpenApi.IDocument = ctx.state().interface!.document;
  const realize: AutoBeRealizeHistory = ctx.state().realize!;
  const scenarios: IAutoBeRealizeScenarioResult[] = document.operations.map(
    (operation) =>
      generateRealizeScenario(ctx, operation, realize.authorizations),
  );
  const corrected: AutoBeRealizeFunction[] =
    await orchestrateRealizeCorrectCasting(
      ctx,
      scenarios,
      realize.authorizations,
      realize.functions,
      {
        completed: 0,
        total: realize.functions.length,
      },
    );
  const { result } = await compileRealizeFiles(ctx, {
    authorizations: realize.authorizations,
    functions: corrected,
  });
  if (result.type === "failure") {
    console.log(result.diagnostics);
    console.log(
      Object.fromEntries(
        Array.from(new Set(result.diagnostics.map((d) => d.file))).map(
          (file) => [file, corrected.find((f) => f.location === file)?.content],
        ),
      ),
    );
  }
};

const main = async (): Promise<void> => {
  await correct({
    vendor: "openai/gpt-4.1-mini",
    project: "shopping",
  });
};
main().catch(console.error);
