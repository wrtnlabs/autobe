import HackathonApi from "@autobe/hackathon-api";
import { IAutoBeHackathonParticipant, IPage } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { TestGlobal } from "../../../TestGlobal";
import { test_api_hackathon_moderator_login } from "./test_api_hackathon_moderator_login";

export const test_api_hackathon_moderator_participant_index = async (
  connection: HackathonApi.IConnection,
): Promise<void> => {
  await test_api_hackathon_moderator_login(connection);

  const page: IPage<IAutoBeHackathonParticipant> =
    await HackathonApi.functional.autobe.hackathon.moderators.participants.index(
      connection,
      TestGlobal.CODE,
      {
        limit: 100,
        page: 1,
      },
    );
  TestValidator.predicate("page", () =>
    [
      "samchon@wrtn.io",
      "kakasoo@wrtn.io",
      "michael@wrtn.io",
      "sunrabbit@wrtn.io",
    ].every((email) => page.data.some((p) => p.email === email)),
  );
};
