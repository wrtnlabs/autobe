import { Module } from "@nestjs/common";

import { AutoBeHackathonParticipantAuthenticateController } from "./AutoBeHackathonParticipantAuthenticateController";
import { AutoBeHackathonParticipantSessionController } from "./AutoBeHackathonParticipantSessionController";
import { AutoBeHackathonParticipantSessionSocketController } from "./AutoBeHackathonParticipantSessionSocketController";

@Module({
  controllers: [
    AutoBeHackathonParticipantAuthenticateController,
    AutoBeHackathonParticipantSessionController,
    AutoBeHackathonParticipantSessionSocketController,
  ],
})
export class AutoBeHackathonParticipantModule {}
