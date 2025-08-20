import { orchestrateInterfaceEndpoints } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceEndpoints";
import { CompressUtil, FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEvent,
  AutoBeEventSnapshot,
  AutoBeOpenApi,
} from "@autobe/interface";
import { AutoBeInterfaceGroup } from "@autobe/interface/src/histories/contents/AutoBeInterfaceGroup";
import fs from "fs";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestHistory } from "../../../internal/TestHistory";
import { TestLogger } from "../../../internal/TestLogger";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_endpoints = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.API_KEY === undefined) return false;

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
  const groups: AutoBeInterfaceGroup[] = typia.json.assertParse<
    AutoBeInterfaceGroup[]
  >(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${TestGlobal.ROOT}/assets/histories/${model}/${project}.interface.groups.json.gz`,
      ),
    ),
  );
  const authorizations: AutoBeOpenApi.IOperation[] = typia.json.assertParse<
    AutoBeOpenApi.IOperation[]
  >(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${TestGlobal.ROOT}/assets/histories/${model}/${project}.interface.authorizations.json.gz`,
      ),
    ),
  );

  const endpoints: AutoBeOpenApi.IEndpoint[] =
    await orchestrateInterfaceEndpoints(
      agent.getContext(),
      groups,
      authorizations,
    );
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${model}/${project}/interface/endpoints`,
    files: {
      ...(await agent.getFiles()),
      "logs/endpoints.json": JSON.stringify(endpoints),
    },
  });
  if (TestGlobal.archive)
    await TestHistory.save({
      [`${project}.interface.endpoints.json`]: JSON.stringify(endpoints),
    });
};
