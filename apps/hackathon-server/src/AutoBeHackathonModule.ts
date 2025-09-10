import { Module } from "@nestjs/common";

import { AutoBeHackathonModeratorModule } from "./controllers/moderators/AutoBeHackathonModeratorModule";
import { AutoBeHackathonParticipantModule } from "./controllers/participants/AutoBeHackathonParticipantModule";

@Module({
  imports: [AutoBeHackathonModeratorModule, AutoBeHackathonParticipantModule],
})
export class AutoBeHackathonModule {}
