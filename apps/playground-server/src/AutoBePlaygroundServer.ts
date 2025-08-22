import { WebSocketAdaptor } from "@nestia/core";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AutoBePlaygroundModule } from "./AutoBePlaygroundModule";

export class AutoBePlaygroundServer {
  private application_?: INestApplication;

  public async open(
    port: number = AutoBePlaygroundServer.DEFAULT_PORT,
  ): Promise<void> {
    this.application_ = await NestFactory.create(AutoBePlaygroundModule, {
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
export namespace AutoBePlaygroundServer {
  export const DEFAULT_PORT = 5_890;
}
