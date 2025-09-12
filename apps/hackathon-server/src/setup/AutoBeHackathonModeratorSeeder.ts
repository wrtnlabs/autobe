import {
  IAutoBeHackathon,
  IAutoBeHackathonModerator,
  IAutoBeHackathonParticipant,
} from "@autobe/interface";
import { ArrayUtil } from "@nestia/e2e";

import { AutoBeHackathonModeratorProvider } from "../providers/actors/AutoBeHackathonModeratorProvider";

export namespace AutoBeHackathonModeratorSeeder {
  export const seed = async (
    hackathon: IAutoBeHackathon,
    participants: IAutoBeHackathonParticipant[],
  ): Promise<IAutoBeHackathonModerator[]> => {
    return await ArrayUtil.asyncMap(participants, (p) =>
      AutoBeHackathonModeratorProvider.join({
        hackathon,
        participant: p,
      }),
    );
  };
}
