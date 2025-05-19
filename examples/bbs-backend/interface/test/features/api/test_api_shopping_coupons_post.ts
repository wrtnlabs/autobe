import api from "@ORGANIZATION/PROJECT-api";
import typia from "typia";

;
import { IShoppingCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingCoupon";

;
export async function test_api_shopping_coupons_post(connection: api.IConnection) {
    const output: IShoppingCoupon = await api.functional.shopping.coupons.post(connection, typia.random<IShoppingCoupon.ICreate>());
    typia.assert(output);
}
