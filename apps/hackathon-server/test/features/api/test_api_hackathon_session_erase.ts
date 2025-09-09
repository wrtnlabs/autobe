import HackathonApi from "@autobe/hackathon-api";
import { IAutoBeHackathonSession, IPage } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { TestGlobal } from "../../TestGlobal";

export const test_api_hackathon_session_erase = async (
  connection: HackathonApi.IConnection,
): Promise<void> => {
  await HackathonApi.functional.autobe.hackathon.participants.authenticate.login(
    connection,
    TestGlobal.CODE,
    {
      email: "samchon@wrtn.io",
      password: "1234",
    },
  );

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
  await HackathonApi.functional.autobe.hackathon.participants.sessions.erase(
    connection,
    TestGlobal.CODE,
    hackathon.id,
  );
  await TestValidator.httpError("erased", 404, () =>
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
  TestValidator.notEquals("page", page.data[0].id, hackathon.id);
};
