import { INestiaConfig } from "@nestia/sdk";
import { NestFactory } from "@nestjs/core";

import { AutoBeHackathonModule } from "./src/AutoBeHackathonModule";

export const NESTIA_CONFIG: INestiaConfig = {
  input: () => NestFactory.create(AutoBeHackathonModule),
  output: "../hackathon-api/src",
};
export default NESTIA_CONFIG;
