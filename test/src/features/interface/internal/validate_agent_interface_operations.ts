import { orchestrateInterfaceOperations } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceOperations";
import { CompressUtil, FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEvent,
  AutoBeEventSnapshot,
  AutoBeOpenApi,
} from "@autobe/interface";
import fs from "fs";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestHistory } from "../../../internal/TestHistory";
import { TestLogger } from "../../../internal/TestLogger";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_operations = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.API_KEY === undefined) return false;

  // PREPARE ASSETS
  const { agent } = await prepare_agent_interface(factory, project);
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
    if (type.startsWith("interface")) agent.on(type, listen);

  const model: string = TestGlobal.getVendorModel();
  const endpoints: AutoBeOpenApi.IEndpoint[] = JSON.parse(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${TestGlobal.ROOT}/assets/histories/${model}/${project}.interface.endpoints.json.gz`,
      ),
    ),
  );
  typia.assert(endpoints);

  // GENERATE OPERATIONS
  const operations: AutoBeOpenApi.IOperation[] =
    await orchestrateInterfaceOperations(agent.getContext(), endpoints);
  typia.assert(operations);

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${model}/${project}/interface/operations`,
    files: {
      ...(await agent.getFiles()),
      "logs/endpoints.json": JSON.stringify(
        operations.map((op) => ({
          path: op.path,
          method: op.method,
        })),
        null,
        2,
      ),
      "logs/paths.json": JSON.stringify(
        Array.from(new Set(operations.map((op) => op.path))),
        null,
        2,
      ),
      "logs/operations.json": JSON.stringify(operations),
    },
  });
  if (TestGlobal.archive)
    await TestHistory.save({
      [`${project}.interface.operations.json`]: JSON.stringify(operations),
    });
};
