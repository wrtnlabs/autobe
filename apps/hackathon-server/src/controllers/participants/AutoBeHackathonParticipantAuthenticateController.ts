import {
  IAutobeHackathon,
  IAutobeHackathonParticipant,
} from "@autobe/hackathon-api";
import { TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

import { AutoBeHackathonParticipantProvider } from "../../providers/AutoBeHackathonParticipantProvider";
import { AutoBeHackathonProvider } from "../../providers/AutoBeHackathonProvider";

@Controller("autobe/hackathon/:hackathonCode/participants/authenticate")
export class AutoBeHackathonParticipantAuthenticateController {
  @TypedRoute.Post("login")
  public async login(
    hackathonCode: string,
    body: IAutobeHackathonParticipant.ILogin,
  ): Promise<IAutobeHackathonParticipant.IAuthorized> {
    const hackathon: IAutobeHackathon =
      await AutoBeHackathonProvider.get(hackathonCode);
    return await AutoBeHackathonParticipantProvider.login({
      hackathon,
      body,
    });
  }

  @TypedRoute.Patch("refresh")
  public async refresh(
    hackathonCode: string,
    body: IAutobeHackathonParticipant.IRefresh,
  ): Promise<IAutobeHackathonParticipant.IAuthorized> {
    const hackathon: IAutobeHackathon =
      await AutoBeHackathonProvider.get(hackathonCode);
    return await AutoBeHackathonParticipantProvider.refresh({
      hackathon,
      body,
    });
  }
}
