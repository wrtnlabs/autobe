import { WebSocketAdaptor } from "@nestia/core";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AutoBeHackathonConfiguration } from "./AutoBeHackathonConfiguration";
import { AutoBeHackathonModule } from "./AutoBeHackathonModule";

export class AutoBeHackathonBackend {
  private application_?: INestApplication;

  public async open(
    port: number = Number(
      AutoBeHackathonConfiguration.env().HACKATHON_API_PORT,
    ),
  ): Promise<void> {
    this.application_ = await NestFactory.create(AutoBeHackathonModule, {
      logger: false,
    });
    this.application_.enableCors();
    await WebSocketAdaptor.upgrade(this.application_);
    await this.application_.listen(port, "0.0.0.0");
  }

  public async close(): Promise<void> {
    if (this.application_ === undefined) return;
    await this.application_.close();
    delete this.application_;
  }
}
