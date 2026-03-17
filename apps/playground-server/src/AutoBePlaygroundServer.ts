import { WebSocketAdaptor } from "@nestia/core";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AutoBePlaygroundConfiguration } from "./AutoBePlaygroundConfiguration";
import { AutoBePlaygroundModule } from "./AutoBePlaygroundModule";

export class AutoBePlaygroundServer {
  private application_?: INestApplication;

  public async open(
    port: number = AutoBePlaygroundConfiguration.API_PORT(),
  ): Promise<void> {
    this.application_ = await NestFactory.create(AutoBePlaygroundModule, {
      logger: ["error", "warn", "log"],
    });
    this.application_.enableCors();
    this.application_.enableShutdownHooks();
    await WebSocketAdaptor.upgrade(this.application_);
    await this.application_.listen(port, "0.0.0.0");
  }

  public async close(): Promise<void> {
    if (this.application_ === undefined) return;
    await this.application_.close();
    delete this.application_;
  }
}
