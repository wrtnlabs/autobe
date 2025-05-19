import api from "@ORGANIZATION/PROJECT-api";
import typia from "typia";

;
import { IPageIShoppingSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingSale";
import { IShoppingSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingSale";

;
export async function test_api_shopping_sales_patch(connection: api.IConnection) {
    const output: IPageIShoppingSale.ISummary = await api.functional.shopping.sales.patch(connection, typia.random<IShoppingSale.IRequest>());
    typia.assert(output);
}
