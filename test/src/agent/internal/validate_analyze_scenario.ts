import { AutoBeAgent } from "@autobe/agent";
import { orchestrateAnalyzeScenario } from "@autobe/agent/src/orchestrate/analyze/orchestrateAnalyzeScenario";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeAnalyzeScenarioEvent,
  AutoBeAssistantMessageEvent,
  AutoBeExampleProject,
} from "@autobe/interface";
import { v7 } from "uuid";

export const validate_analyze_scenario = async (props: {
  agent: AutoBeAgent;
  vendor: string;
  project: AutoBeExampleProject;
}): Promise<AutoBeAnalyzeScenarioEvent> => {
  const go = async (input?: string) => {
    if (input !== undefined)
      props.agent.getHistories().push({
        type: "userMessage",
        id: v7(),
        contents: [
          {
            type: "text",
            text: input,
          },
        ],
        created_at: new Date().toISOString(),
      });
    const event: AutoBeAssistantMessageEvent | AutoBeAnalyzeScenarioEvent =
      await orchestrateAnalyzeScenario(props.agent.getContext());
    return event.type === "analyzeScenario" ? event : null;
  };
  const event: AutoBeAnalyzeScenarioEvent | null =
    (await go()) ??
    (await go(
      "I'm not familiar with the analyze feature. Please determine everything by yourself, and just show me the analysis report.",
    )) ??
    (await go(
      "I already told you to publish the analysis report. Never ask me anything, and just do it right now.",
    ));
  if (event === null) throw new Error("Failed to make analyze scenario.");

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["analyze.scenario.json"]: JSON.stringify(event),
    },
  });
  return event;
};
