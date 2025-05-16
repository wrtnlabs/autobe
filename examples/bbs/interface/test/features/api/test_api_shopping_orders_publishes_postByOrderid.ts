import api from "@ORGANIZATION/PROJECT-api";
import typia, { tags } from "typia";

;
import { IShoppingOrderPublish } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingOrderPublish";

;
export async function test_api_shopping_orders_publishes_postByOrderid(connection: api.IConnection) {
    const output: IShoppingOrderPublish = await api.functional.shopping.orders.publishes.postByOrderid(connection, typia.random<string & tags.Format<"uuid">>(), typia.random<IShoppingOrderPublish.ICreate>());
    typia.assert(output);
}
