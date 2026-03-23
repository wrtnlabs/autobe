import {
  AutoBeEvent,
  IAutoBePlaygroundReplay,
  IAutoBeRpcListener,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

export const test_api_playground_example_replay = async (
  connection: pApi.IConnection,
): Promise<void> => {
  // Find an available example
  const benchmarks =
    await pApi.functional.autobe.playground.examples.index(connection);
  if (benchmarks.length === 0) throw new Error("No benchmark data available.");
  if (benchmarks[0].replays.length === 0)
    throw new Error("No example data available.");

  const example: IAutoBePlaygroundReplay.ISummary = benchmarks[0].replays[0];

  // Set up listener to collect events
  const eventList: AutoBeEvent[] = [];
  const listener: IAutoBeRpcListener = {
    assistantMessage: async (e) => {
      eventList.push(e);
    },
    enable: async () => {},
  };
  for (const key of typia.misc.literals<keyof IAutoBeRpcListener>())
    if (key !== "enable")
      listener[key] = async (e) => {
        eventList.push(e);
      };

  // Connect to example replay
  const { connector, driver } =
    await pApi.functional.autobe.playground.examples.replay(
      connection,
      {
        vendor: example.vendor,
        project: example.project,
        delay: 1,
      },
      listener,
    );
  await driver.conversate("analyze");
  await driver.conversate("database");
  await driver.conversate("interface");
  await driver.conversate("test");
  await driver.conversate("realize");

  try {
    // Replay must have sent events
    TestValidator.predicate("received events", () => eventList.length > 0);

    // Validate that each available phase has a complete event
    const PHASES = [
      "analyze",
      "database",
      "interface",
      "test",
      "realize",
    ] as const;
    for (const phase of PHASES) {
      if (example[phase] === null) continue;
      TestValidator.predicate(`${phase}Complete event`, () =>
        eventList.some((e) => e.type === `${phase}Complete`),
      );
    }
  } finally {
    await connector.close();
  }
};
