import {
  AutoBeEvent,
  IAutoBePlaygroundExample,
  IAutoBeRpcListener,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { TestValidator } from "@nestia/e2e";
import { IPointer, sleep_for } from "tstl";
import typia from "typia";

export const test_api_playground_example_replay = async (
  connection: pApi.IConnection,
): Promise<void> => {
  // Find an available example
  const examples: IAutoBePlaygroundExample[] =
    await pApi.functional.autobe.playground.examples.index(connection);
  if (examples.length === 0) throw new Error("No example data available.");

  const example = examples[0];
  const vendorParts = example.vendor.split("/");
  const provider = vendorParts[0];
  const model = vendorParts.slice(1).join("/");

  // Set up listener to collect events
  const enabled: IPointer<boolean | null> = { value: null };
  const eventList: AutoBeEvent[] = [];
  const listener: IAutoBeRpcListener = {
    assistantMessage: async (e) => {
      eventList.push(e);
    },
    enable: async (v) => {
      enabled.value = v;
    },
  };
  for (const key of typia.misc.literals<keyof IAutoBeRpcListener>())
    if (key !== "enable")
      listener[key] = async (e) => {
        eventList.push(e);
      };

  // Connect to example replay
  const { connector } =
    await pApi.functional.autobe.playground.examples.replay(
      connection,
      provider,
      model,
      example.project,
      listener,
    );

  // Wait for events to stop arriving (convergence)
  let length: number = 0;
  while (true) {
    await sleep_for(2_000);
    if (eventList.length === length) break;
    length = eventList.length;
  }

  try {
    // Replay must have sent events
    TestValidator.predicate(
      "received events",
      () => eventList.length > 0,
    );

    // Replay must send enable(false) — read-only mode
    TestValidator.equals("enabled", enabled.value, false);

    // Validate that each available phase has a complete event
    for (const phase of example.phases)
      TestValidator.predicate(`${phase}Complete event`, () =>
        eventList.some((e) => e.type === `${phase}Complete`),
      );
  } finally {
    await connector.close();
  }
};
