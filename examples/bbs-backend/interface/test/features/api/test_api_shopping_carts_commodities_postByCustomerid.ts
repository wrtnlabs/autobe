import api from "@ORGANIZATION/PROJECT-api";
import typia, { tags } from "typia";

;
import { IShoppingCartCommodity } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingCartCommodity";

;
export async function test_api_shopping_carts_commodities_postByCustomerid(connection: api.IConnection) {
    const output: IShoppingCartCommodity = await api.functional.shopping.carts.commodities.postByCustomerid(connection, typia.random<string & tags.Format<"uuid">>(), typia.random<IShoppingCartCommodity.ICreate>());
    typia.assert(output);
}
