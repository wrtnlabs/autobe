import { orchestrateTestScenario } from "@autobe/agent/src/orchestrate/test/orchestrateTestScenario";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEventOfSerializable,
  AutoBeOpenApi,
  AutoBeTestScenario,
} from "@autobe/interface";
import { AutoBeEndpointComparator } from "@autobe/utils";
import { HashMap, Pair } from "tstl";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestHistory } from "../../../internal/TestHistory";
import { TestLogger } from "../../../internal/TestLogger";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_test } from "./prepare_agent_test";

export const validate_agent_test_scenario = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  // PREPARE ASSETS
  const { agent } = await prepare_agent_test(factory, project);

  const start: Date = new Date();
  for (const type of typia.misc.literals<AutoBeEventOfSerializable.Type>())
    agent.on(type, (event) => TestLogger.event(start, event));

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
      AutoBeEndpointComparator.hashCode,
      AutoBeEndpointComparator.equals,
    );
  for (const group of result) {
    endpoints.get(group.endpoint);
    for (const scenario of group.dependencies) endpoints.get(scenario.endpoint);
  }

  // REPORT RESULT
  const model: string = TestGlobal.vendorModel;
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${model}/${project}/test/scenario`,
    files: {
      ...(await agent.getFiles()),
      "logs/scenarios.json": JSON.stringify(result),
    },
  });
  if (TestGlobal.archive)
    await TestHistory.save({
      [`${project}.test.scenarios.json`]: JSON.stringify(result),
    });
};
