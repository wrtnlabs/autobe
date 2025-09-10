import {
  IAutoBeHackathon,
  IAutoBeHackathonParticipant,
} from "@autobe/interface";
import { TypedBody, TypedParam, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

import { AutoBeHackathonProvider } from "../../providers/AutoBeHackathonProvider";
import { AutoBeHackathonParticipantProvider } from "../../providers/actors/AutoBeHackathonParticipantProvider";

@Controller("autobe/hackathon/:hackathonCode/participants/authenticate")
export class AutoBeHackathonParticipantAuthenticateController {
  /** @assignHeaders setHeaders */
  @TypedRoute.Post("login")
  public async login(
    @TypedParam("hackathonCode") hackathonCode: string,
    @TypedBody() body: IAutoBeHackathonParticipant.ILogin,
  ): Promise<IAutoBeHackathonParticipant.IAuthorized> {
    const hackathon: IAutoBeHackathon =
      await AutoBeHackathonProvider.get(hackathonCode);
    return await AutoBeHackathonParticipantProvider.login({
      hackathon,
      body,
    });
  }

  /** @assignHeaders setHeaders */
  @TypedRoute.Patch("refresh")
  public async refresh(
    @TypedParam("hackathonCode") hackathonCode: string,
    @TypedBody() body: IAutoBeHackathonParticipant.IRefresh,
  ): Promise<IAutoBeHackathonParticipant.IAuthorized> {
    const hackathon: IAutoBeHackathon =
      await AutoBeHackathonProvider.get(hackathonCode);
    return await AutoBeHackathonParticipantProvider.refresh({
      hackathon,
      body,
    });
  }
}
