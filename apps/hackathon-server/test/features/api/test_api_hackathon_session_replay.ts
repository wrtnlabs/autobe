import HackathonApi from "@autobe/hackathon-api";
import {
  AutoBeEvent,
  IAutoBeHackathonSession,
  IAutoBeRpcListener,
  IPage,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import { IPointer, sleep_for } from "tstl";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";

export const test_api_hackathon_session_replay = async (
  connection: HackathonApi.IConnection,
): Promise<void> => {
  // FIND SESSION
  const session: IAutoBeHackathonSession = await findSession(connection);

  // CONFIGURE LISTENER
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

  // DO REPLAY
  const { connector } =
    await HackathonApi.functional.autobe.hackathon.participants.sessions.replay(
      connection,
      TestGlobal.CODE,
      session.id,
      listener,
    );
  let length: number = 0;
  while (true) {
    await sleep_for(1_000);
    if (eventList.length === length) break;
    length = eventList.length;
  }
  await connector.close();

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
};

const findSession = async (
  connection: HackathonApi.IConnection,
): Promise<IAutoBeHackathonSession> => {
  for (const account of ["samchon", "kakasoo", "michael", "sunrabbit"]) {
    await HackathonApi.functional.autobe.hackathon.participants.authenticate.login(
      connection,
      TestGlobal.CODE,
      {
        email: `${account}@wrtn.io`,
        password: "1234",
      },
    );
    const page: IPage<IAutoBeHackathonSession.ISummary> =
      await HackathonApi.functional.autobe.hackathon.participants.sessions.index(
        connection,
        TestGlobal.CODE,
        {
          limit: 100,
          page: 1,
        },
      );
    const summary: IAutoBeHackathonSession.ISummary | undefined =
      page.data.find((s) => s.phase === "realize");
    if (summary === undefined) continue;

    const session: IAutoBeHackathonSession =
      await HackathonApi.functional.autobe.hackathon.participants.sessions.at(
        connection,
        TestGlobal.CODE,
        summary.id,
      );
    return session;
  }
  throw new Error("No hackathon session found, problem on DB seeder.");
};
