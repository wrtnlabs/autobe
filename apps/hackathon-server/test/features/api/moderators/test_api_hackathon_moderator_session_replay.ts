import HackathonApi from "@autobe/hackathon-api";
import { IAutoBeHackathonSession } from "@autobe/interface";

import { AutoBeHackathonGlobal } from "../../../../src/AutoBeHackathonGlobal";
import { AutoBeHackathonSessionProvider } from "../../../../src/providers/sessions/AutoBeHackathonSessionProvider";
import { TestGlobal } from "../../../TestGlobal";
import { validate_api_hackathon_session_replay } from "../internal/validate_api_hackathon_session_replay";
import { test_api_hackathon_moderator_login } from "./test_api_hackathon_moderator_login";

export const test_api_hackathon_moderator_session_replay = async (
  connection: HackathonApi.IConnection,
): Promise<void> => {
  const record =
    await AutoBeHackathonGlobal.prisma.autobe_hackathon_sessions.findFirstOrThrow(
      {
        where: {
          aggregate: {
            phase: "realize",
          },
          participant: {
            email: {
              endsWith: "@wrtn.io",
            },
          },
        },
        ...AutoBeHackathonSessionProvider.json.select(),
      },
    );
  const session: IAutoBeHackathonSession =
    AutoBeHackathonSessionProvider.json.transform(record);

  await test_api_hackathon_moderator_login(connection);
  await validate_api_hackathon_session_replay(
    session,
    async (listener) =>
      await HackathonApi.functional.autobe.hackathon.moderators.sessions.replay(
        connection,
        TestGlobal.CODE,
        session.id,
        listener,
      ),
  );
};
