import api from "@ORGANIZATION/PROJECT-api";
import typia, { tags } from "typia";

;
import { IShoppingCouponTicket } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingCouponTicket";

;
export async function test_api_shopping_customers_coupon_tickets_postByCustomerid(connection: api.IConnection) {
    const output: IShoppingCouponTicket = await api.functional.shopping.customers.coupon_tickets.postByCustomerid(connection, typia.random<string & tags.Format<"uuid">>(), typia.random<IShoppingCouponTicket.ICreate>());
    typia.assert(output);
}
