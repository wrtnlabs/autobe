import { Module } from "@nestjs/common";

import { AutoBeHackathonModeratorAuthenticateController } from "./AutoBeHackathonModeratorAuthenticateController";
import { AutoBeHackathonModeratorParticipantController } from "./AutoBeHackathonModeratorParticipantController";
import { AutoBeHackathonModeratorSessionController } from "./AutoBeHackathonModeratorSessionController";

@Module({
  controllers: [
    AutoBeHackathonModeratorAuthenticateController,
    AutoBeHackathonModeratorParticipantController,
    AutoBeHackathonModeratorSessionController,
  ],
})
export class AutoBeHackathonModeratorModule {}
