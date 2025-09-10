import { IAutoBeHackathon, IAutoBeHackathonModerator } from "@autobe/interface";
import { TypedBody, TypedParam, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

import { AutoBeHackathonProvider } from "../../providers/AutoBeHackathonProvider";
import { AutoBeHackathonModeratorProvider } from "../../providers/actors/AutoBeHackathonModeratorProvider";

@Controller("autobe/hackathon/:hackathonCode/moderators/authenticate")
export class AutoBeHackathonModeratorAuthenticateController {
  /** @assignHeaders setHeaders */
  @TypedRoute.Post("login")
  public async login(
    @TypedParam("hackathonCode") hackathonCode: string,
    @TypedBody() body: IAutoBeHackathonModerator.ILogin,
  ): Promise<IAutoBeHackathonModerator.IAuthorized> {
    const hackathon: IAutoBeHackathon =
      await AutoBeHackathonProvider.get(hackathonCode);
    return await AutoBeHackathonModeratorProvider.login({
      hackathon,
      body,
    });
  }

  /** @assignHeaders setHeaders */
  @TypedRoute.Patch("refresh")
  public async refresh(
    @TypedParam("hackathonCode") hackathonCode: string,
    @TypedBody() body: IAutoBeHackathonModerator.IRefresh,
  ): Promise<IAutoBeHackathonModerator.IAuthorized> {
    const hackathon: IAutoBeHackathon =
      await AutoBeHackathonProvider.get(hackathonCode);
    return await AutoBeHackathonModeratorProvider.refresh({
      hackathon,
      body,
    });
  }
}
