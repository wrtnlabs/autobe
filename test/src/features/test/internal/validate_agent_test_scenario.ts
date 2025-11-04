import { orchestrateTestScenario } from "@autobe/agent/src/orchestrate/test/orchestrateTestScenario";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEventOfSerializable,
  AutoBeOpenApi,
  AutoBeTestScenario,
} from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { HashMap, Pair } from "tstl";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { ArchiveLogger } from "../../../archive/utils/ArchiveLogger";
import { prepare_agent_test } from "./prepare_agent_test";

export const validate_agent_test_scenario = async (props: {
  factory: TestFactory;
  vendor: string;
  project: AutoBeExampleProject;
}) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  // PREPARE ASSETS
  const { agent } = await prepare_agent_test(props);
  const start: Date = new Date();
  for (const type of typia.misc.literals<AutoBeEventOfSerializable.Type>())
    agent.on(type, (event) => ArchiveLogger.event(start, event));

  // GENERATE TEST SCENARIOS
  const result: AutoBeTestScenario[] = await orchestrateTestScenario(
    agent.getContext(),
    "Generate diverse and comprehensive test scenarios.",
  );
  typia.assert(result);

  const document: AutoBeOpenApi.IDocument = agent.getContext().state()
    .interface!.document;
  const endpoints: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation> =
    new HashMap(
      document.operations.map(
        (op) =>
          new Pair(
            {
              method: op.method,
              path: op.path,
            },
            op,
          ),
      ),
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );
  for (const group of result) {
    endpoints.get(group.endpoint);
    for (const scenario of group.dependencies) endpoints.get(scenario.endpoint);
  }

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/test/scenario`,
    files: {
      ...(await agent.getFiles()),
      "logs/scenarios.json": JSON.stringify(result),
    },
  });
  if (TestGlobal.archive)
    await AutoBeExampleStorage.save({
      vendor: props.vendor,
      project: props.project,
      files: {
        [`test.scenarios.json`]: JSON.stringify(result),
      },
    });
};
