import HackathonApi from "@autobe/hackathon-api";
import { IAutoBeHackathonParticipant } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { TestGlobal } from "../../../TestGlobal";

export const test_api_hackathon_participant_login = async (
  connection: HackathonApi.IConnection,
  email: string = "samchon@wrtn.io",
): Promise<void> => {
  const participant: IAutoBeHackathonParticipant.IAuthorized =
    await HackathonApi.functional.autobe.hackathon.participants.authenticate.login(
      connection,
      TestGlobal.CODE,
      {
        email: email,
        password: "1234",
      },
    );
  TestValidator.equals("email", participant.email, email);
};
