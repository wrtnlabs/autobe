import {
  IAutoBeHackathon,
  IAutobeHackathonParticipant,
} from "@autobe/hackathon-api";
import { ArrayUtil } from "@nestia/e2e";
import fs from "fs";

import { AutoBeHackathonConfiguration } from "../AutoBeHackathonConfiguration";
import { AutoBeHackathonParticipantProvider } from "../providers/AutoBeHackathonParticipantProvider";
import { CsvUtil } from "../utils/CsvUtil";

export namespace AutoBeHackathonParticipantSeeder {
  export const seed = async (
    hackathon: IAutoBeHackathon,
  ): Promise<IAutobeHackathonParticipant[]> => {
    const input = await CsvUtil.parse(
      "email",
      "name",
      "password",
    )(
      await fs.promises.readFile(
        `${AutoBeHackathonConfiguration.ROOT}/assets/participants.csv`,
        "utf8",
      ),
    );
    return await ArrayUtil.asyncMap(
      input,
      async (elem) =>
        await AutoBeHackathonParticipantProvider.join({
          hackathon,
          body: {
            email: elem.email,
            name: elem.name,
            password: elem.password,
          },
        }),
    );
  };
}
