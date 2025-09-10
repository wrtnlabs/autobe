import HackathonApi from "@autobe/hackathon-api";
import { IAutoBeHackathonSession, IPage } from "@autobe/interface";

import { TestGlobal } from "../../../TestGlobal";
import { validate_api_hackathon_session_replay } from "../internal/validate_api_hackathon_session_replay";
import { test_api_hackathon_moderator_login } from "./test_api_hackathon_moderator_login";

export const test_api_hackathon_moderator_session_replay = async (
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
  const summary: IAutoBeHackathonSession.ISummary | undefined = page.data.find(
    (s) => s.phase === "realize",
  );
  if (summary === undefined)
    throw new Error("Cannot find any realized session");

  const session: IAutoBeHackathonSession =
    await HackathonApi.functional.autobe.hackathon.moderators.sessions.at(
      connection,
      TestGlobal.CODE,
      summary.id,
    );
  await validate_api_hackathon_session_replay(session, (listener) =>
    HackathonApi.functional.autobe.hackathon.moderators.sessions.replay(
      connection,
      TestGlobal.CODE,
      session.id,
      listener,
    ),
  );
};
