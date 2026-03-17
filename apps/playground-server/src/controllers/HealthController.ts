import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("monitors/health")
export class HealthController {
  /**
   * Health check API.
   *
   * @tag Monitor
   *
   * @author Samchon
   */
  @core.TypedRoute.Get()
  public get(): void {}
}
