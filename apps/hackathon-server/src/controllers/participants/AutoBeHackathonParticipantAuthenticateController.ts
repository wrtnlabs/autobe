import {
  IAutoBeHackathon,
  IAutobeHackathonParticipant,
} from "@autobe/interface";
import { TypedBody, TypedParam, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

import { AutoBeHackathonParticipantProvider } from "../../providers/AutoBeHackathonParticipantProvider";
import { AutoBeHackathonProvider } from "../../providers/AutoBeHackathonProvider";

@Controller("autobe/hackathon/:hackathonCode/participants/authenticate")
export class AutoBeHackathonParticipantAuthenticateController {
  /** @assignHeaders setHeaders */
  @TypedRoute.Post("login")
  public async login(
    @TypedParam("hackathonCode") hackathonCode: string,
    @TypedBody() body: IAutobeHackathonParticipant.ILogin,
  ): Promise<IAutobeHackathonParticipant.IAuthorized> {
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
    @TypedBody() body: IAutobeHackathonParticipant.IRefresh,
  ): Promise<IAutobeHackathonParticipant.IAuthorized> {
    const hackathon: IAutoBeHackathon =
      await AutoBeHackathonProvider.get(hackathonCode);
    return await AutoBeHackathonParticipantProvider.refresh({
      hackathon,
      body,
    });
  }
}
