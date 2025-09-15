import {
  AutoBeEvent,
  IAutoBeHackathonSession,
  IAutoBeRpcListener,
  IAutoBeRpcService,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import { WebSocketConnector } from "tgrid";
import { IPointer, sleep_for } from "tstl";
import typia from "typia";

export const validate_api_hackathon_session_replay = async (
  session: IAutoBeHackathonSession,
  connect: (listener: IAutoBeRpcListener) => Promise<{
    connector: WebSocketConnector<
      unknown,
      IAutoBeRpcListener,
      IAutoBeRpcService
    >;
  }>,
): Promise<void> => {
  const enabled: IPointer<boolean | null> = {
    value: null,
  };
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

  const { connector } = await connect(listener);
  let length: number = 0;
  while (true) {
    await sleep_for(2_000);
    if (eventList.length === length) break;
    length = eventList.length;
  }
  try {
    TestValidator.equals("enabled", enabled.value, false);
    for (const type of [
      "analyze",
      "prisma",
      "interface",
      "test",
      "realize",
    ] as const)
      if (session.histories.some((h) => h.type === type))
        TestValidator.predicate(type, () =>
          eventList.some((e) => e.type === `${type}Complete`),
        );
  } finally {
    await connector.close();
  }
};
