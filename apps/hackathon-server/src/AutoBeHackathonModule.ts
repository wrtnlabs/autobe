import { Module } from "@nestjs/common";

import { AutoBeHackathonParticipantModule } from "./controllers/participants/AutoBeHackathonParticipantModule";

@Module({
  imports: [AutoBeHackathonParticipantModule],
})
export class AutoBeHackathonModule {}
