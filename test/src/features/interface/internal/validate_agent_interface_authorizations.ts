import { orchestrateInterfaceAuthorizations } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceAuthorizations";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeAnalyzeActor,
  AutoBeInterfaceAuthorization,
} from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_authorizations = async (props: {
  factory: TestFactory;
  vendor: string;
  project: AutoBeExampleProject;
}) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  const { agent } = await prepare_agent_interface(props);
  const actors: AutoBeAnalyzeActor[] =
    agent.getContext().state().analyze?.actors ?? [];
  const authorizations: AutoBeInterfaceAuthorization[] =
    await orchestrateInterfaceAuthorizations(
      agent.getContext(),
      "Design API specs carefully considering the security.",
    );
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/interface/authorizations`,
    files: {
      ...(await agent.getFiles()),
      "logs/authorizations.json": JSON.stringify(authorizations),
    },
  });
  if (TestGlobal.archive)
    await AutoBeExampleStorage.save({
      vendor: props.vendor,
      project: props.project,
      files: {
        [`interface.authorizations.json`]: JSON.stringify(authorizations),
      },
    });

  if (actors.length > 0 && authorizations.length === 0)
    throw new Error("No authorization operations generated.");
};
