import { orchestrateInterfaceAuthorizations } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceAuthorizations";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeAnalyzeRole,
  AutoBeEvent,
  AutoBeEventSnapshot,
  AutoBeOpenApi,
} from "@autobe/interface";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestHistory } from "../../../internal/TestHistory";
import { TestLogger } from "../../../internal/TestLogger";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_authorizations = async (
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

  const roles: AutoBeAnalyzeRole[] =
    agent.getContext().state().analyze?.roles ?? [];

  const authorizations: AutoBeOpenApi.IOperation[] =
    await orchestrateInterfaceAuthorizations(agent.getContext());

  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${model}/${project}/interface/authorizations`,
    files: {
      ...(await agent.getFiles()),
      "logs/authorizations.json": JSON.stringify(authorizations),
    },
  });
  if (TestGlobal.archive)
    await TestHistory.save({
      [`${project}.interface.authorizations.json`]:
        JSON.stringify(authorizations),
    });

  if (roles.length > 0 && authorizations.length === 0)
    throw new Error("No authorization operations generated.");
};
