import { AutoBeAgent } from "@autobe/agent";
import { orchestrateTestScenario } from "@autobe/agent/src/orchestrate/test/orchestrateTestScenario";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeExampleProject, AutoBeTestScenario } from "@autobe/interface";

export const validate_test_scenario = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeTestScenario[]> => {
  const scenarios: AutoBeTestScenario[] = await orchestrateTestScenario(
    props.agent.getContext(),
    "Generate diverse and comprehensive test scenarios.",
  );
  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["test.scenario.json"]: JSON.stringify(scenarios),
    },
  });
  return scenarios;
};
