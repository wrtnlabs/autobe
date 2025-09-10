import HackathonApi from "@autobe/hackathon-api";
import { IAutoBeHackathonSession, IPage } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { TestGlobal } from "../../../TestGlobal";
import { test_api_hackathon_participant_login } from "./test_api_hackathon_participant_login";

export const test_api_hackathon_participant_session_index = async (
  connection: HackathonApi.IConnection,
): Promise<void> => {
  const data: IAutoBeHackathonSession.ISummary[] = await getAll(connection);
  TestValidator.predicate("sessions.index", () =>
    data.some((s) => s.phase === "realize"),
  );
};

const getAll = async (connection: HackathonApi.IConnection) => {
  const data: IAutoBeHackathonSession.ISummary[] = [];
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
    data.push(...page.data);
  }
  return data;
};
