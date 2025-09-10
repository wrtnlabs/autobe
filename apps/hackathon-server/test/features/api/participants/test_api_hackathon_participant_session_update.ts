import HackathonApi from "@autobe/hackathon-api";
import { IAutoBeHackathonSession } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { TestGlobal } from "../../../TestGlobal";
import { test_api_hackathon_participant_login } from "./test_api_hackathon_participant_login";

export const test_api_hackathon_participant_session_update = async (
  connection: HackathonApi.IConnection,
): Promise<void> => {
  await test_api_hackathon_participant_login(connection);

  const hackathon: IAutoBeHackathonSession =
    await HackathonApi.functional.autobe.hackathon.participants.sessions.create(
      connection,
      TestGlobal.CODE,
      {
        title: "My First Session",
        model: "openai/gpt-4.1-mini",
        timezone: "Asia/Seoul",
      } satisfies IAutoBeHackathonSession.ICreate,
    );
  await HackathonApi.functional.autobe.hackathon.participants.sessions.update(
    connection,
    TestGlobal.CODE,
    hackathon.id,
    {
      title: "My Updated Session",
    },
  );

  const read: IAutoBeHackathonSession =
    await HackathonApi.functional.autobe.hackathon.participants.sessions.at(
      connection,
      TestGlobal.CODE,
      hackathon.id,
    );
  TestValidator.equals("title", read.title, "My Updated Session");
};
