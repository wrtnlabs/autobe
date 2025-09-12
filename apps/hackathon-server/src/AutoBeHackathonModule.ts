import { Module } from "@nestjs/common";

import { AppController } from "./controllers/AppController";
import { AutoBeHackathonModeratorModule } from "./controllers/moderators/AutoBeHackathonModeratorModule";
import { AutoBeHackathonParticipantModule } from "./controllers/participants/AutoBeHackathonParticipantModule";

@Module({
  imports: [AutoBeHackathonModeratorModule, AutoBeHackathonParticipantModule],
  controllers: [AppController],
})
export class AutoBeHackathonModule {}
