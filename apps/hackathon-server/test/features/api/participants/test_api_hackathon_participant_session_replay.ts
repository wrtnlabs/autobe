import HackathonApi from "@autobe/hackathon-api";
import { IAutoBeHackathonSession, IPage } from "@autobe/interface";

import { TestGlobal } from "../../../TestGlobal";
import { validate_api_hackathon_session_replay } from "../internal/validate_api_hackathon_session_replay";
import { test_api_hackathon_participant_login } from "./test_api_hackathon_participant_login";

export const test_api_hackathon_participant_session_replay = async (
  connection: HackathonApi.IConnection,
): Promise<void> => {
  // FIND SESSION
  const session: IAutoBeHackathonSession = await findSession(connection);

  // VALIDATE REPLAY
  await validate_api_hackathon_session_replay(session, (listener) =>
    HackathonApi.functional.autobe.hackathon.participants.sessions.replay(
      connection,
      TestGlobal.CODE,
      session.id,
      listener,
    ),
  );
};

const findSession = async (
  connection: HackathonApi.IConnection,
): Promise<IAutoBeHackathonSession> => {
  for (const account of ["samchon", "kakasoo", "michael", "sunrabbit"]) {
    await test_api_hackathon_participant_login(
      connection,
      `${account}@wrtn.io`,
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
