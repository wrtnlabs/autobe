import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AutoBePlaygroundModule } from "./AutoBePlaygroundModule";

export class AutoBePlaygroundServer {
  private application_?: INestApplication;

  public async open(): Promise<void> {
    this.application_ = await NestFactory.create(AutoBePlaygroundModule, {
      logger: false,
    });
    this.application_.enableCors();
    await this.application_.listen(5_890, "0.0.0.0");
  }

  public async close(): Promise<void> {
    if (this.application_ === undefined) return;

    await this.application_.close();
    delete this.application_;
  }
}
