import { orchestrateTestScenario } from "@autobe/agent/src/orchestrate/test/orchestrateTestScenario";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeOpenApi, AutoBeTestScenarioEvent } from "@autobe/interface";
import { AutoBeEndpointComparator } from "@autobe/utils";
import fs from "fs";
import { HashMap, Pair } from "tstl";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_test } from "./prepare_agent_test";

export const validate_agent_test_scenario = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  // PREPARE ASSETS
  const { agent } = await prepare_agent_test(factory, project);

  // GENERATE TEST SCENARIOS
  const result: AutoBeTestScenarioEvent = await orchestrateTestScenario(
    agent.getContext(),
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
  for (const group of result.scenarios) {
    endpoints.get(group.endpoint);
    for (const scenario of group.dependencies) endpoints.get(scenario.endpoint);
  }

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${project}/test/scenario`,
    files: {
      ...(await agent.getFiles()),
      "logs/scenarios.json": JSON.stringify(result.scenarios, null, 2),
    },
  });
  if (process.argv.includes("--archive"))
    await fs.promises.writeFile(
      `${TestGlobal.ROOT}/assets/histories/${project}.test.scenarios.json`,
      JSON.stringify(result.scenarios, null, 2),
    );
};
