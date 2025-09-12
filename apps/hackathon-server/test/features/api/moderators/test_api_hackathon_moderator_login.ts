import HackathonApi from "@autobe/hackathon-api";
import { IAutoBeHackathonModerator } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { TestGlobal } from "../../../TestGlobal";

export const test_api_hackathon_moderator_login = async (
  connection: HackathonApi.IConnection,
): Promise<void> => {
  const moderator: IAutoBeHackathonModerator.IAuthorized =
    await HackathonApi.functional.autobe.hackathon.moderators.authenticate.login(
      connection,
      TestGlobal.CODE,
      {
        email: "samchon@wrtn.io",
        password: "1234",
      },
    );
  TestValidator.equals("email", moderator.email, "samchon@wrtn.io");
};
