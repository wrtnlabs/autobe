import { compileRealizeFiles } from "@autobe/agent/src/orchestrate/realize/internal/compileRealizeFiles";
import { orchestrateRealizeCorrect } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeCorrect";
import { IAutoBeRealizeScenarioResult } from "@autobe/agent/src/orchestrate/realize/structures/IAutoBeRealizeScenarioResult";
import { CompressUtil, FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEvent,
  AutoBeEventSnapshot,
  AutoBeRealizeAuthorization,
  AutoBeRealizeFunction,
  AutoBeRealizeValidateEvent,
  AutoBeRealizeWriteEvent,
  IAutoBeCompiler,
} from "@autobe/interface";
import fs from "fs";
import typia from "typia";
import { v7 } from "uuid";

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

  const scenarios: IAutoBeRealizeScenarioResult[] = JSON.parse(
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

  const compilation: AutoBeRealizeValidateEvent = await compileRealizeFiles(
    agent.getContext(),
    {
      authorizations,
      functions,
    },
  );

  if (compilation.result.type !== "failure") {
    throw new Error("Cannot test because the compilation was successful.");
  }

  const failedFiles: Record<string, string> = Object.fromEntries(
    compilation.result.type === "failure"
      ? compilation.result.diagnostics.map((d) => [d.file, d.code])
      : [],
  );

  const reviewProgress = {
    id: v7(),
    total: writeEvents.length,
    completed: writeEvents.length,
  };

  reviewProgress.total += Object.keys(failedFiles).length;
  await orchestrateRealizeCorrect(
    agent.getContext(),
    scenarios,
    authorizations,
    functions,
    [],
    reviewProgress,
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
};
