import { Module } from "@nestjs/common";

import { AutoBePlaygroundController } from "./controllers/AutoBePlaygroundController";
import { AutoBePlaygroundReplayController } from "./controllers/AutoBePlaygroundReplayController";
import { HealthCheckController } from "./controllers/HealthCheckController";

@Module({
  controllers: [
    AutoBePlaygroundController,
    AutoBePlaygroundReplayController,
    HealthCheckController,
  ],
})
export class AutoBePlaygroundModule {}
