import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  /**
   * @ignore
   * @internal
   */
  @Get()
  public get(): string {
    return "OK";
  }
}
