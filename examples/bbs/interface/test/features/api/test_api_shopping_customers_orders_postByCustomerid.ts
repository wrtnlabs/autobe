import api from "@ORGANIZATION/PROJECT-api";
import typia, { tags } from "typia";

;
import { IShoppingOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingOrder";

;
export async function test_api_shopping_customers_orders_postByCustomerid(connection: api.IConnection) {
    const output: IShoppingOrder = await api.functional.shopping.customers.orders.postByCustomerid(connection, typia.random<string & tags.Format<"uuid">>(), typia.random<IShoppingOrder.ICreate>());
    typia.assert(output);
}
