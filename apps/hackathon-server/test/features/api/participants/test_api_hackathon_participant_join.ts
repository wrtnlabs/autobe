import HackathonApi from "@autobe/hackathon-api";
import {
  IAutoBeHackathon,
  IAutoBeHackathonParticipant,
} from "@autobe/interface";
import { RandomGenerator } from "@nestia/e2e";
import typia, { tags } from "typia";

import { AutoBeHackathonProvider } from "../../../../src/providers/AutoBeHackathonProvider";
import { AutoBeHackathonParticipantProvider } from "../../../../src/providers/actors/AutoBeHackathonParticipantProvider";
import { TestGlobal } from "../../../TestGlobal";

export const test_api_hackathon_participant_join = async (
  connection: HackathonApi.IConnection,
): Promise<IAutoBeHackathonParticipant> => {
  const hackathon: IAutoBeHackathon = await AutoBeHackathonProvider.get(
    TestGlobal.CODE,
  );
  const loginBody: IAutoBeHackathonParticipant.ILogin = {
    email: typia.random<string & tags.Format<"email">>(),
    password: RandomGenerator.alphaNumeric(16),
  };
  await AutoBeHackathonParticipantProvider.join({
    hackathon,
    body: {
      ...loginBody,
      name: RandomGenerator.name(),
    },
  });
  return await HackathonApi.functional.autobe.hackathon.participants.authenticate.login(
    connection,
    TestGlobal.CODE,
    loginBody,
  );
};
