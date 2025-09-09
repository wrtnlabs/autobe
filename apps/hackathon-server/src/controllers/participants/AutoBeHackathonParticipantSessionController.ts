import {
  IAutoBeHackathon,
  IAutoBeHackathonSession,
  IAutobeHackathonParticipant,
  IPage,
} from "@autobe/hackathon-api";
import { TypedBody, TypedParam, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { tags } from "typia";

import { AutoBeHackathonParticipantAuth } from "../../decorators/AutoBeHackathonParticipantAuth";
import { AutoBeHackathonProvider } from "../../providers/AutoBeHackathonProvider";
import { AutoBeHackathonSessionProvider } from "../../providers/AutoBeHackathonSessionProvider";

@Controller("autobe/hackathon/:hackathonCode/participants/sessions")
export class AutoBeHackathonParticipantSessionController {
  /* -----------------------------------------------------------
    Restful API
  ----------------------------------------------------------- */
  @TypedRoute.Patch()
  public async index(
    @AutoBeHackathonParticipantAuth()
    participant: IAutobeHackathonParticipant,
    @TypedParam("hackathonCode") hackathonCode: string,
    @TypedBody() body: IPage.IRequest,
  ): Promise<IPage<IAutoBeHackathonSession.ISummary>> {
    const hackathon: IAutoBeHackathon =
      await AutoBeHackathonProvider.get(hackathonCode);
    return await AutoBeHackathonSessionProvider.index({
      hackathon,
      participant,
      body,
    });
  }

  @TypedRoute.Get(":id")
  public async at(
    @AutoBeHackathonParticipantAuth()
    participant: IAutobeHackathonParticipant,
    @TypedParam("hackathonCode") hackathonCode: string,
    @TypedParam("id") id: string & tags.Format<"uuid">,
  ): Promise<IAutoBeHackathonSession> {
    const hackathon: IAutoBeHackathon =
      await AutoBeHackathonProvider.get(hackathonCode);
    return await AutoBeHackathonSessionProvider.at({
      hackathon,
      participant,
      id,
    });
  }

  @TypedRoute.Post()
  public async create(
    @AutoBeHackathonParticipantAuth()
    participant: IAutobeHackathonParticipant,
    @TypedParam("hackathonCode") hackathonCode: string,
    @TypedBody() body: IAutoBeHackathonSession.ICreate,
  ): Promise<IAutoBeHackathonSession.ISummary> {
    const hackathon: IAutoBeHackathon =
      await AutoBeHackathonProvider.get(hackathonCode);
    return await AutoBeHackathonSessionProvider.create({
      hackathon,
      participant,
      body,
    });
  }

  @TypedRoute.Put(":id")
  public async update(
    @AutoBeHackathonParticipantAuth()
    participant: IAutobeHackathonParticipant,
    @TypedParam("hackathonCode") hackathonCode: string,
    @TypedParam("id") id: string & tags.Format<"uuid">,
    @TypedBody() body: IAutoBeHackathonSession.IUpdate,
  ): Promise<void> {
    const hackathon: IAutoBeHackathon =
      await AutoBeHackathonProvider.get(hackathonCode);
    await AutoBeHackathonSessionProvider.update({
      hackathon,
      participant,
      id,
      body,
    });
  }

  @TypedRoute.Put(":id/review")
  public async review(
    @AutoBeHackathonParticipantAuth()
    participant: IAutobeHackathonParticipant,
    @TypedParam("hackathonCode") hackathonCode: string,
    @TypedParam("id") id: string & tags.Format<"uuid">,
    @TypedBody() body: IAutoBeHackathonSession.IReview,
  ): Promise<void> {
    const hackathon: IAutoBeHackathon =
      await AutoBeHackathonProvider.get(hackathonCode);
    await AutoBeHackathonSessionProvider.review({
      hackathon,
      participant,
      id,
      body,
    });
  }
}
