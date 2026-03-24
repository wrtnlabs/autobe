import { IAutoBePlaygroundConfig } from "@autobe/interface";
import { TypedBody, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

import { AutoBePlaygroundConfigProvider } from "../providers/config/AutoBePlaygroundConfigProvider";

@Controller("autobe/playground/config")
export class AutoBePlaygroundConfigController {
  /**
   * Get the global playground configuration.
   *
   * Returns the singleton configuration record containing default locale,
   * timezone, and optional default vendor/model for frontend pre-fill.
   *
   * @author Samchon
   * @returns Current global configuration
   * @tag Config
   */
  @TypedRoute.Get()
  public async get(): Promise<IAutoBePlaygroundConfig> {
    return AutoBePlaygroundConfigProvider.get();
  }

  /**
   * Update the global playground configuration.
   *
   * Only provided fields are updated. Omitted fields retain their current
   * values.
   *
   * @author Samchon
   * @param body Fields to update
   * @returns Updated global configuration
   * @tag Config
   */
  @TypedRoute.Put()
  public async update(
    @TypedBody() body: IAutoBePlaygroundConfig.IUpdate,
  ): Promise<IAutoBePlaygroundConfig> {
    return AutoBePlaygroundConfigProvider.update({ body });
  }
}
