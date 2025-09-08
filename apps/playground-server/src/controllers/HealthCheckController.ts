import { TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("health-check")
export class HealthCheckController {
  @TypedRoute.Get()
  public async start(): Promise<{ status: number; message: string }> {
    return {
      status: 200,
      message: "OK",
    };
  }
}
