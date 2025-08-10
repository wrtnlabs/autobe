import { orchestrateInterfaceAuthorization } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceAuthorization";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeAnalyzeRole, AutoBeOpenApi } from "@autobe/interface";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestHistory } from "../../../internal/TestHistory";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_authorizations = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.API_KEY === undefined) return false;

  const { agent } = await prepare_agent_interface(factory, project);
  const model: string = TestGlobal.getVendorModel();

  const roles: AutoBeAnalyzeRole[] =
    agent.getContext().state().analyze?.roles ?? [];

  const authorizations: AutoBeOpenApi.IOperation[] =
    await orchestrateInterfaceAuthorization(agent.getContext());

  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${model}/${project}/interface/authorizations`,
    files: {
      ...(await agent.getFiles()),
      "logs/authorizations.json": JSON.stringify(authorizations),
    },
  });
  if (process.argv.includes("--archive"))
    await TestHistory.save({
      [`${project}.interface.authorizations.json`]:
        JSON.stringify(authorizations),
    });

  if (roles.length > 0 && authorizations.length === 0)
    throw new Error("No authorization operations generated.");
};
