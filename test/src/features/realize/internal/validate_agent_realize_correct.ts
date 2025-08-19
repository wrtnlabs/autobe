import { compile } from "@autobe/agent/src/orchestrate/realize/internal/compile";
import { orchestrateRealizeCorrect } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeCorrect";
import { IAutoBeRealizeScenarioApplication } from "@autobe/agent/src/orchestrate/realize/structures/IAutoBeRealizeScenarioApplication";
import { CompressUtil, FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEvent,
  AutoBeEventSnapshot,
  AutoBeRealizeAuthorization,
  AutoBeRealizeFunction,
  AutoBeRealizeWriteEvent,
  IAutoBeCompiler,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import fs from "fs";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestLogger } from "../../../internal/TestLogger";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_realize } from "./prepare_agent_realize";

export const validate_agent_realize_correct = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.API_KEY === undefined) return false;

  // PREPARE AGENT
  const { agent } = await prepare_agent_realize(factory, project);
  const start: Date = new Date();
  const snapshots: AutoBeEventSnapshot[] = [];
  const listen = (event: AutoBeEvent) => {
    if (TestGlobal.archive) TestLogger.event(start, event);
    snapshots.push({
      event,
      tokenUsage: agent.getTokenUsage().toJSON(),
    });
  };

  agent.on("assistantMessage", listen);
  for (const type of typia.misc.literals<AutoBeEvent.Type>())
    if (type.startsWith("realize")) agent.on(type, listen);

  const model: string = TestGlobal.getVendorModel();
  const authorizations: AutoBeRealizeAuthorization[] = JSON.parse(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${TestGlobal.ROOT}/assets/histories/${model}/${project}.realize.authorization-correct.json.gz`,
      ),
    ),
  );

  const scenarios: IAutoBeRealizeScenarioApplication.IProps[] = JSON.parse(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${TestGlobal.ROOT}/assets/histories/${model}/${project}.realize.scenarios.json.gz`,
      ),
    ),
  );

  const writeEvents: AutoBeRealizeWriteEvent[] = JSON.parse(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${TestGlobal.ROOT}/assets/histories/${model}/${project}.realize.writes.json.gz`,
      ),
    ),
  );

  const functions: AutoBeRealizeFunction[] = Object.entries(
    Object.fromEntries(
      writeEvents.map((event) => [event.location, event.content]),
    ),
  ).map(([location, content]) => {
    const scenario = scenarios.find((el) => el.location === location)!;
    return {
      location,
      content,
      endpoint: {
        method: scenario.operation.method,
        path: scenario.operation.path,
      },
      name: scenario.functionName,
    };
  });

  const compilation: IAutoBeTypeScriptCompileResult = await compile(
    agent.getContext(),
    {
      authorizations,
      functions,
    },
  );

  if (compilation.type === "exception") {
    throw new Error(
      "Compilation itself is a level of history that is impossible.",
    );
  }

  if (compilation.type === "success") {
    console.debug(
      "All compilation issues have already been resolved from previously archived content!",
    );
    return;
  }

  console.debug(StringUtil.trim`
    -----------------BEFORE CORRECTION-----------------
    Total Functions: ${functions.length}
    Error Functions: ${new Set(compilation.diagnostics.map((el) => el.file)).size}
    Errors: ${compilation.diagnostics.length}
    -----------------BEFORE CORRECTION-----------------
  `);

  const failedFiles: Record<string, string> = Object.fromEntries(
    compilation.type === "failure"
      ? compilation.diagnostics.map((d) => [d.file, d.code])
      : [],
  );

  const reviewProgress = {
    total: writeEvents.length,
    completed: writeEvents.length,
  };

  reviewProgress.total += Object.keys(failedFiles).length;
  const failure: IAutoBeTypeScriptCompileResult.IFailure = compilation;

  await Promise.all(
    Object.entries(failedFiles).map(async ([location, content]) => {
      const diagnostic: IAutoBeTypeScriptCompileResult.IDiagnostic | undefined =
        failure.diagnostics.find((el) => el.file === location);

      const scenario = scenarios.find((el) => el.location === location);
      if (diagnostic && scenario) {
        const correctEvent = await orchestrateRealizeCorrect(
          agent.getContext(),
          {
            authorization: scenario.decoratorEvent ?? null,
            scenario,
            code: content,
            diagnostic,
            progress: reviewProgress,
          },
        );

        const corrected = functions.find(
          (el) => el.location === correctEvent.location,
        );

        if (corrected) {
          corrected.content = correctEvent.content;
        }
      }
    }),
  );

  const compiler: IAutoBeCompiler = await agent.getContext().compiler();
  const controllers: Record<string, string> = await compiler.realize.controller(
    {
      document: agent.getContext().state().interface!.document,
      functions,
      authorizations,
    },
  );

  const templateFiles = await compiler.realize.getTemplate();
  const files = await agent.getFiles();
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${model}/${project}/realize/correct`,
    files: {
      ...files,
      ...Object.fromEntries(
        authorizations.flatMap((authorization) => {
          return [
            [authorization.decorator.location, authorization.decorator.content],
            [authorization.payload.location, authorization.payload.content],
            [authorization.provider.location, authorization.provider.content],
          ];
        }),
      ),
      ...Object.fromEntries(
        functions.map((func) => [func.location, func.content]),
      ),
      ...controllers,
      ...templateFiles,
      "pnpm-workspace.yaml": "",
      "logs/authorizations.json": JSON.stringify(authorizations),
      "logs/scenarios.json": JSON.stringify(scenarios),
    },
  });

  const afterCorrection: IAutoBeTypeScriptCompileResult = await compile(
    agent.getContext(),
    {
      authorizations,
      functions,
    },
  );

  console.debug(
    JSON.stringify(
      afterCorrection.type === "failure" ? afterCorrection.diagnostics : [],
      null,
      2,
    ),
  );

  console.debug(StringUtil.trim`
    ------------------AFTER CORRECTION-----------------
    Total Functions: ${functions.length}
    Error Functions: ${afterCorrection.type === "failure" ? new Set(afterCorrection.diagnostics.map((el) => el.file)).size : 0}
    Errors: ${afterCorrection.type === "failure" ? afterCorrection.diagnostics.length : 0}
    ------------------AFTER CORRECTION-----------------
  `);
};
