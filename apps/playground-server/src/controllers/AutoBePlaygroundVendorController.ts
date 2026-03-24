import { IAutoBePlaygroundVendor, IPage } from "@autobe/interface";
import { TypedBody, TypedParam, TypedRoute } from "@nestia/core";
import { Controller, Get } from "@nestjs/common";
import { tags } from "typia";

import { AutoBePlaygroundVendorProvider } from "../providers/vendors/AutoBePlaygroundVendorProvider";

@Controller("autobe/playground/vendors")
export class AutoBePlaygroundVendorController {
  /**
   * Register a new AI vendor configuration.
   *
   * Stores the vendor's endpoint and concurrency settings. The API key is
   * encrypted before persistence and never returned in any response.
   *
   * @author Samchon
   * @param body Vendor creation properties
   * @returns Newly created vendor record
   * @tag Vendor
   */
  @TypedRoute.Post()
  public async create(
    @TypedBody() body: IAutoBePlaygroundVendor.ICreate,
  ): Promise<IAutoBePlaygroundVendor> {
    return AutoBePlaygroundVendorProvider.create({ body });
  }

  /**
   * List vendor configurations with pagination.
   *
   * Returns a paginated list of all registered vendor configurations, sorted by
   * creation date in descending order. Soft-deleted vendors are excluded.
   *
   * @author Samchon
   * @param body Pagination request parameters
   * @returns Paginated vendor list
   * @tag Vendor
   */
  @TypedRoute.Patch()
  public async index(
    @TypedBody() body: IPage.IRequest,
  ): Promise<IPage<IAutoBePlaygroundVendor>> {
    return AutoBePlaygroundVendorProvider.index({ body });
  }

  /**
   * Get a vendor configuration by ID.
   *
   * @author Samchon
   * @param id Target vendor's {@link IAutoBePlaygroundVendor.id}
   * @returns Vendor record
   * @tag Vendor
   */
  @Get(":id")
  public async at(
    @TypedParam("id") id: string & tags.Format<"uuid">,
  ): Promise<IAutoBePlaygroundVendor> {
    return AutoBePlaygroundVendorProvider.at({ id });
  }

  /**
   * Update a vendor configuration.
   *
   * Only the provided fields are updated. If a new API key is supplied, it is
   * re-encrypted before storage.
   *
   * @author Samchon
   * @param id Target vendor's {@link IAutoBePlaygroundVendor.id}
   * @param body Fields to update
   * @tag Vendor
   */
  @TypedRoute.Put(":id")
  public async update(
    @TypedParam("id") id: string & tags.Format<"uuid">,
    @TypedBody() body: IAutoBePlaygroundVendor.IUpdate,
  ): Promise<void> {
    await AutoBePlaygroundVendorProvider.update({ id, body });
  }

  /**
   * Soft-delete a vendor configuration.
   *
   * Marks the vendor as deleted without physically removing the record.
   * Sessions that previously used this vendor remain intact.
   *
   * @author Samchon
   * @param id Target vendor's {@link IAutoBePlaygroundVendor.id}
   * @tag Vendor
   */
  @TypedRoute.Delete(":id")
  public async erase(
    @TypedParam("id") id: string & tags.Format<"uuid">,
  ): Promise<void> {
    await AutoBePlaygroundVendorProvider.erase({ id });
  }
}
