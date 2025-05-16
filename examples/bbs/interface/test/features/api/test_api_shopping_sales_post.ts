import api from "@ORGANIZATION/PROJECT-api";
import typia from "typia";

;
import { IShoppingSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingSale";

;
export async function test_api_shopping_sales_post(connection: api.IConnection) {
    const output: IShoppingSale = await api.functional.shopping.sales.post(connection, typia.random<IShoppingSale.ICreate>());
    typia.assert(output);
}
