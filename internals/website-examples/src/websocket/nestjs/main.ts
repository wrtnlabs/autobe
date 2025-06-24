import { WebSocketAdaptor } from "@nestia/core";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { ChatModule } from "./chat.module";

const app: INestApplication = await NestFactory.create(ChatModule);
await WebSocketAdaptor.upgrade(app);
await app.listen(3_001, "0.0.0.0");
