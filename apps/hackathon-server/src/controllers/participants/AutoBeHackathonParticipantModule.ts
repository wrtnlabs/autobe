import { Module } from "@nestjs/common";

import { AutoBeHackathonParticipantAuthenticateController } from "./AutoBeHackathonParticipantAuthenticateController";
import { AutoBeHackathonParticipantSessionController } from "./AutoBeHackathonParticipantSessionController";

@Module({
  controllers: [
    AutoBeHackathonParticipantAuthenticateController,
    AutoBeHackathonParticipantSessionController,
  ],
})
export class AutoBeHackathonParticipantModule {}
