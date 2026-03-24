import { INestiaConfig } from "@nestia/sdk";
import { NestFactory } from "@nestjs/core";

import { AutoBePlaygroundModule } from "./src/AutoBePlaygroundModule";

export const NESTIA_CONFIG: INestiaConfig = {
  input: () => NestFactory.create(AutoBePlaygroundModule),
  output: "../playground-api/src",
  primitive: false,
};
export default NESTIA_CONFIG;
