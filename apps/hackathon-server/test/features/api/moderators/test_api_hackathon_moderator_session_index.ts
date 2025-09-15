import HackathonApi from "@autobe/hackathon-api";
import { IAutoBeHackathonSession, IPage } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { TestGlobal } from "../../../TestGlobal";
import { test_api_hackathon_moderator_login } from "./test_api_hackathon_moderator_login";

export const test_api_hackathon_moderator_session_index = async (
  connection: HackathonApi.IConnection,
): Promise<void> => {
  await test_api_hackathon_moderator_login(connection);

  const page: IPage<IAutoBeHackathonSession.ISummary> =
    await HackathonApi.functional.autobe.hackathon.moderators.sessions.index(
      connection,
      TestGlobal.CODE,
      {
        limit: 1_000,
        page: 1,
      },
    );
  TestValidator.predicate("sessions.index", () =>
    page.data.some((s) => s.phase === "realize"),
  );
};
