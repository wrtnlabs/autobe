import { Module } from "@nestjs/common";

import { AutoBeHackathonParticipantModule } from "./participants/AutoBeHackathonParticipantModule";

@Module({
  imports: [AutoBeHackathonParticipantModule],
})
export class AutoBeHackathonModule {}
