import { IAutoBePlaygroundVendor } from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { TestValidator } from "@nestia/e2e";

import { TestVendor } from "../../../internal/TestVendor";

export const test_api_playground_vendor_create = async (
  connection: pApi.IConnection,
): Promise<void> => {
  const vendor: IAutoBePlaygroundVendor = await TestVendor.get(connection);

  TestValidator.predicate("id exists", () => vendor.id.length > 0);
  TestValidator.equals("name", vendor.name, "Test Vendor");
  TestValidator.equals("semaphore", vendor.semaphore, 16);

  const read: IAutoBePlaygroundVendor =
    await pApi.functional.autobe.playground.vendors.at(connection, vendor.id);
  TestValidator.equals("read.id", read.id, vendor.id);
};
