import {
  IAutoBeHackathon,
  IAutoBeHackathonModerator,
  IAutoBeHackathonParticipant,
  IPage,
} from "@autobe/interface";
import { TypedBody, TypedParam, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

import { AutoBeHackathonModeratorAuth } from "../../decorators/AutoBeHackathonModeratorAuth";
import { AutoBeHackathonProvider } from "../../providers/AutoBeHackathonProvider";
import { AutoBeHackathonParticipantProvider } from "../../providers/actors/AutoBeHackathonParticipantProvider";

@Controller("autobe/hackathon/:hackathonCode/moderators/participants")
export class AutoBeHackathonModeratorParticipantController {
  @TypedRoute.Patch()
  public async index(
    @AutoBeHackathonModeratorAuth() _moderator: IAutoBeHackathonModerator,
    @TypedParam("hackathonCode") hackathonCode: string,
    @TypedBody() body: IPage.IRequest,
  ): Promise<IPage<IAutoBeHackathonParticipant.ISummary>> {
    const hackathon: IAutoBeHackathon =
      await AutoBeHackathonProvider.get(hackathonCode);
    return await AutoBeHackathonParticipantProvider.index({
      hackathon,
      body,
    });
  }
}
