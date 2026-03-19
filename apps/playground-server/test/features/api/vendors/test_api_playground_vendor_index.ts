import { IAutoBePlaygroundVendor, IPage } from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { TestValidator } from "@nestia/e2e";

import { TestVendor } from "../../../internal/TestVendor";

export const test_api_playground_vendor_index = async (
  connection: pApi.IConnection,
): Promise<void> => {
  const vendor: IAutoBePlaygroundVendor = await TestVendor.get(connection);

  const page: IPage<IAutoBePlaygroundVendor> =
    await pApi.functional.autobe.playground.vendors.index(connection, {
      limit: 10,
      page: 1,
    });
  TestValidator.predicate("has data", () => page.data.length > 0);
  TestValidator.predicate("contains created vendor", () =>
    page.data.some((v) => v.id === vendor.id),
  );
};
