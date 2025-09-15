import HackathonApi from "@autobe/hackathon-api";
import {
  AutoBeHackathonModel,
  AutoBePhase,
  IAutoBeHackathonSession,
  IAutoBeRpcListener,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import { IPointer } from "tstl";
import typia from "typia";

import { StringUtil } from "../../../../../../packages/utils/src";
import { TestGlobal } from "../../../TestGlobal";
import { test_api_hackathon_participant_join } from "./test_api_hackathon_participant_join";

export const test_api_hackathon_participant_session_simulate = async (
  connection: HackathonApi.IConnection,
): Promise<void> => {
  await test_api_hackathon_participant_join(connection);

  const session: IAutoBeHackathonSession =
    await HackathonApi.functional.autobe.hackathon.participants.sessions.create(
      connection,
      TestGlobal.CODE,
      {
        model: typia.random<AutoBeHackathonModel>(),
        timezone: "Asia/Seoul",
      },
    );

  const enabled: IPointer<boolean | null> = {
    value: null,
  };
  const listener: IAutoBeRpcListener = {
    enable: async (v) => {
      enabled.value = v;
    },
    assistantMessage: async () => {},
  };
  const { connector, driver: service } =
    await HackathonApi.functional.autobe.hackathon.participants.sessions.simulate(
      connection,
      TestGlobal.CODE,
      session.id,
      listener,
    );
  try {
    await service.conversate(StringUtil.trim`
      I want to create a political/economic discussion board.

      Since I'm not familiar with programming, please write a \
      requirements analysis report as you see fit.
    `);
    await service.conversate("Design DB");
    await service.conversate("Design API");
    await service.conversate("Make e2e test functions");
    await service.conversate("Implement API functions");

    const phase: AutoBePhase | null = await service.getPhase();
    TestValidator.equals("phase", phase, "realize");
  } catch (exp) {
    throw exp;
  } finally {
    await connector.close();
  }
};
