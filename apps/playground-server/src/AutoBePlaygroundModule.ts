import { Module } from "@nestjs/common";

import { AutoBePlaygroundConfigController } from "./controllers/AutoBePlaygroundConfigController";
import { AutoBePlaygroundExampleController } from "./controllers/AutoBePlaygroundExampleController";
import { AutoBePlaygroundSessionController } from "./controllers/AutoBePlaygroundSessionController";
import { AutoBePlaygroundSessionSocketController } from "./controllers/AutoBePlaygroundSessionSocketController";
import { AutoBePlaygroundVendorController } from "./controllers/AutoBePlaygroundVendorController";
import { AutoBePlaygroundVendorModelController } from "./controllers/AutoBePlaygroundVendorModelController";
import { HealthController } from "./controllers/HealthController";

@Module({
  controllers: [
    AutoBePlaygroundConfigController,
    AutoBePlaygroundVendorController,
    AutoBePlaygroundVendorModelController,
    AutoBePlaygroundSessionController,
    AutoBePlaygroundSessionSocketController,
    AutoBePlaygroundExampleController,
    HealthController,
  ],
})
export class AutoBePlaygroundModule {}
