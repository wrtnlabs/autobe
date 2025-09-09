import HackathonApi from "@autobe/hackathon-api";
import { IAutobeHackathonParticipant } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { TestGlobal } from "../../TestGlobal";

export const test_api_hackathon_participant_login = async (
  connection: HackathonApi.IConnection,
): Promise<void> => {
  const participant: IAutobeHackathonParticipant.IAuthorized =
    await HackathonApi.functional.autobe.hackathon.participants.authenticate.login(
      connection,
      TestGlobal.CODE,
      {
        email: "samchon@wrtn.io",
        password: "1234",
      },
    );
  TestValidator.equals("email", participant.email, "samchon@wrtn.io");
};
