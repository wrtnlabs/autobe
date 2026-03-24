import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("monitors/health")
export class HealthController {
  /**
   * Health check API.
   *
   * @author Samchon
   * @tag Monitor
   */
  @core.TypedRoute.Get()
  public get(): void {}
}
