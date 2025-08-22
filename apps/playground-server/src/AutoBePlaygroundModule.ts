import { Module } from "@nestjs/common";

import { AutoBePlaygroundController } from "./controllers/AutoBePlaygroundController";
import { AutoBePlaygroundReplayController } from "./controllers/AutoBePlaygroundReplayController";

@Module({
  controllers: [AutoBePlaygroundController, AutoBePlaygroundReplayController],
})
export class AutoBePlaygroundModule {}
