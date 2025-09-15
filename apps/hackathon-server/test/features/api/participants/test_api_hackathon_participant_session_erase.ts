import HackathonApi from "@autobe/hackathon-api";
import { IAutoBeHackathonSession, IPage } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { TestGlobal } from "../../../TestGlobal";
import { test_api_hackathon_participant_join } from "./test_api_hackathon_participant_join";

export const test_api_hackathon_participant_session_erase = async (
  connection: HackathonApi.IConnection,
): Promise<void> => {
  await test_api_hackathon_participant_join(connection);

  const hackathon: IAutoBeHackathonSession =
    await HackathonApi.functional.autobe.hackathon.participants.sessions.create(
      connection,
      TestGlobal.CODE,
      {
        title: "My First Session",
        model: "qwen/qwen3-next-80b-a3b-instruct",
        timezone: "Asia/Seoul",
      } satisfies IAutoBeHackathonSession.ICreate,
    );
  console.log("created a session");
  await HackathonApi.functional.autobe.hackathon.participants.sessions.erase(
    connection,
    TestGlobal.CODE,
    hackathon.id,
  );
  await TestValidator.error("erased", () =>
    HackathonApi.functional.autobe.hackathon.participants.sessions.at(
      connection,
      TestGlobal.CODE,
      hackathon.id,
    ),
  );

  const page: IPage<IAutoBeHackathonSession.ISummary> =
    await HackathonApi.functional.autobe.hackathon.participants.sessions.index(
      connection,
      TestGlobal.CODE,
      {
        limit: 1,
        page: 1,
      },
    );
  TestValidator.equals("empty", page.data, []);
};
