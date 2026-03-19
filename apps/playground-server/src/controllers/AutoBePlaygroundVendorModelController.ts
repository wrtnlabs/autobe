import { IAutoBePlaygroundVendorModel } from "@autobe/interface";
import { TypedParam, TypedRoute } from "@nestia/core";
import { Controller, Get } from "@nestjs/common";
import { tags } from "typia";

import { AutoBePlaygroundVendorModelProvider } from "../providers/vendors/AutoBePlaygroundVendorModelProvider";

@Controller("autobe/playground/vendors/:vendorId/models")
export class AutoBePlaygroundVendorModelController {
  /**
   * List models registered under a vendor.
   *
   * Returns all model entries for the specified vendor, sorted by creation date
   * in descending order. Model entries are automatically created when a session
   * is created with a new model for this vendor.
   *
   * @author Samchon
   * @param vendorId Target vendor's {@link IAutoBePlaygroundVendor.id}
   * @returns List of vendor model entries
   * @tag Vendor
   */
  @Get()
  public async index(
    @TypedParam("vendorId") vendorId: string & tags.Format<"uuid">,
  ): Promise<IAutoBePlaygroundVendorModel[]> {
    return AutoBePlaygroundVendorModelProvider.index({ vendorId });
  }

  /**
   * Remove a model from a vendor's model list.
   *
   * Permanently deletes the model entry. Sessions that used this model are not
   * affected.
   *
   * @author Samchon
   * @param vendorId Target vendor's {@link IAutoBePlaygroundVendor.id}
   * @param id Target model entry's {@link IAutoBePlaygroundVendorModel.id}
   * @tag Vendor
   */
  @TypedRoute.Delete(":id")
  public async erase(
    @TypedParam("vendorId") vendorId: string & tags.Format<"uuid">,
    @TypedParam("id") id: string & tags.Format<"uuid">,
  ): Promise<void> {
    await AutoBePlaygroundVendorModelProvider.erase({ vendorId, id });
  }
}
