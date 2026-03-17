import { Module } from "@nestjs/common";

import { AutoBePlaygroundSessionController } from "./controllers/AutoBePlaygroundSessionController";
import { AutoBePlaygroundSessionSocketController } from "./controllers/AutoBePlaygroundSessionSocketController";
import { AutoBePlaygroundVendorController } from "./controllers/AutoBePlaygroundVendorController";
import { HealthController } from "./controllers/HealthController";

@Module({
  controllers: [
    AutoBePlaygroundVendorController,
    AutoBePlaygroundSessionController,
    AutoBePlaygroundSessionSocketController,
    HealthController,
  ],
})
export class AutoBePlaygroundModule {}
