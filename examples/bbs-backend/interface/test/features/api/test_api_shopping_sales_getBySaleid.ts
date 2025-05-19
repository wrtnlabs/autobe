import api from "@ORGANIZATION/PROJECT-api";
import typia, { tags } from "typia";

;
import { IShoppingSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingSale";

;
export async function test_api_shopping_sales_getBySaleid(connection: api.IConnection) {
    const output: IShoppingSale = await api.functional.shopping.sales.getBySaleid(connection, typia.random<string & tags.Format<"uuid">>());
    typia.assert(output);
}
